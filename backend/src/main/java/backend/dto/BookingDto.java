package backend.dto;

import backend.domain.BookingStatus;
import java.time.Instant;

public record BookingDto(
		Long id,
		Long facilityId,
		String facilityName,
		Long userId,
		String userEmail,
		Instant startTime,
		Instant endTime,
		String purpose,
		Integer expectedAttendees,
		BookingStatus status,
		String adminReason,
		String qrToken) {}
