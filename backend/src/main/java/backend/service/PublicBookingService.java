package backend.service;

import backend.domain.BookingStatus;
import backend.dto.PublicBookingPassView;
import backend.exception.ApiException;
import backend.repository.BookingRepository;
import java.time.Instant;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PublicBookingService {

	private final BookingRepository bookingRepository;

	/**
	 * Resolve a booking from the secret QR token for the public pass page. No login; token is the capability.
	 */
	@Transactional(readOnly = true)
	public PublicBookingPassView getPublicPass(String token) {
		if (token == null || token.isBlank()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid pass link");
		}
		var b =
				bookingRepository
						.findByQrToken(token.trim())
						.orElseThrow(
								() ->
										new ApiException(
												HttpStatus.NOT_FOUND,
												"This pass link is invalid or has already been used for check-in."));
		return new PublicBookingPassView(
				b.getId(),
				b.getFacility().getName(),
				b.getFacility().getLocation(),
				b.getStartTime(),
				b.getEndTime(),
				b.getStatus(),
				b.getPurpose());
	}

	@Transactional
	public Map<String, Object> verifyPayload(String payload) {
		if (payload == null) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid payload");
		}

		payload = payload.trim();
		// If QR scanner returns extra text/URL, extract the payload part.
		int idx = payload.indexOf("SMARTCAMPUS:");
		if (idx >= 0 && idx != 0) {
			payload = payload.substring(idx);
		}

		if (!payload.startsWith("SMARTCAMPUS:")) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid payload");
		}
		String[] parts = payload.split(":");
		if (parts.length < 3) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid payload");
		}
		long id = Long.parseLong(parts[1]);
		String token = parts[2];
		var b =
				bookingRepository
						.findByIdWithDetails(id)
						.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found"));
		if (b.getQrToken() == null || !b.getQrToken().equals(token)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid token");
		}
		if (b.getStatus() != BookingStatus.APPROVED) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Booking is not approved");
		}

		Instant now = Instant.now();
		// Only allow check-in during the approved time range.
		if (now.isBefore(b.getStartTime()) || now.isAfter(b.getEndTime())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Check-in is not within booking time");
		}

		// Consume token to prevent reuse.
		b.setQrToken(null);
		bookingRepository.save(b);

		return Map.of(
				"valid",
				true,
				"bookingId",
				b.getId(),
				"facilityName",
				b.getFacility().getName(),
				"startTime",
				b.getStartTime().toString(),
				"endTime",
				b.getEndTime().toString(),
				"requesterEmail",
				b.getUser().getEmail());
	}
}
