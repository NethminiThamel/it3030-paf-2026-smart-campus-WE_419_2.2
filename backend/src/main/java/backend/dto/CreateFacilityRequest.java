package backend.dto;

import backend.domain.FacilityStatus;
import backend.domain.FacilityType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateFacilityRequest(
		@NotBlank String name,
		@NotNull FacilityType resourceType,
		@NotNull @Min(1) Integer capacity,
		@NotBlank String location,
		String availabilityWindow,
		@NotNull FacilityStatus status,
		String description) {}