package backend.dto;

import backend.domain.TicketStatus;

public record TicketUpdateRequest(
		TicketStatus status, Long assignedTechnicianId, String rejectReason, String resolutionNote) {}

