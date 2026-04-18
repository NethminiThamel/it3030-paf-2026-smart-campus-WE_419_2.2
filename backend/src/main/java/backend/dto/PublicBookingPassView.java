package backend.dto;

import backend.domain.BookingStatus;
import java.time.Instant;

/** Data shown on the public booking-pass page (no authentication). */
public record PublicBookingPassView(
		long bookingId,
		String facilityName,
		String location,
		Instant startTime,
		Instant endTime,
		BookingStatus status,
		String purpose) {}
