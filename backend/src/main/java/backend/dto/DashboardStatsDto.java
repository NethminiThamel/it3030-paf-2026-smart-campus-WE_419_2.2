package backend.dto;

import java.util.List;

public record DashboardStatsDto(
		long pendingBookings,
		long openTickets,
		long totalUsers,
		long activeFacilities,
		List<NamedCount> topFacilities,
		List<BookingTrendPoint> bookingTrend,
		List<NamedCount> peakBookingHours,
		List<NamedCount> peakBookingDays) {

	public record NamedCount(String name, long count) {}

	public record BookingTrendPoint(String period, long count) {}
}
