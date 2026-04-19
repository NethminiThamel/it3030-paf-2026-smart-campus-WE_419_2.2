package backend.dto;

import java.time.Instant;

public record TicketCommentDto(
		Long id, Long userId, String userEmail, String body, Instant createdAt, Instant editedAt) {}

