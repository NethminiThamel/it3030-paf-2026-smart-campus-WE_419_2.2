package backend.dto;

import backend.domain.TicketPriority;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateTicketRequest(
		Long facilityId,
		@NotBlank String category,
		@NotBlank String description,
		@NotNull TicketPriority priority,
		@NotBlank @Email String contactEmail) {}

