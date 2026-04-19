package backend.dto;

import backend.domain.TicketPriority;
import backend.domain.TicketStatus;
import java.time.Instant;
import java.util.List;

public record TicketDto(
		Long id,
		Long reporterId,
		String reporterEmail,
		Long facilityId,
		String facilityName,
		String category,
		String description,
		TicketPriority priority,
		String contactEmail,
		TicketStatus status,
		Long assignedTechnicianId,
		String assignedTechnicianEmail,
		String rejectReason,
		Instant createdAt,
		Instant updatedAt,
		List<TicketAttachmentDto> attachments,
		int commentCount) {

	public record TicketAttachmentDto(
			Long id, String storedFilename, String originalFilename, String contentType) {}
}

