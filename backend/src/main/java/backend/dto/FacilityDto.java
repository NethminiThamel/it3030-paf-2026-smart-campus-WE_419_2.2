package backend.dto;

import backend.domain.FacilityStatus;
import backend.domain.FacilityType;
import java.util.List;

public record FacilityDto(
		Long id,
		String name,
		FacilityType resourceType,
		Integer capacity,
		String location,
		String availabilityWindow,
		FacilityStatus status,
		String description,
		Boolean currentlyAvailable,
		List<String> images) {}
