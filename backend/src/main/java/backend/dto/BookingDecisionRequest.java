package backend.dto;

import backend.domain.BookingStatus;
import jakarta.validation.constraints.NotNull;

public record BookingDecisionRequest(@NotNull BookingStatus decision, String reason) {}
