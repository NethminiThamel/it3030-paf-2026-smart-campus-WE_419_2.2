package backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CreateBookingRequest(
		@NotNull Long facilityId,
		@NotNull Instant startTime,
		@NotNull Instant endTime,
		@NotBlank String purpose,
		@NotNull @Min(1) @Max(5000) Integer expectedAttendees) {}
