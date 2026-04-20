package backend.dto;

import java.time.Instant;

public record NotificationDto(
    Long id,
    String type,
    String title,
    String message,
    String category,
    Long entityId,
    boolean isRead,
    Instant createdAt
) {}
