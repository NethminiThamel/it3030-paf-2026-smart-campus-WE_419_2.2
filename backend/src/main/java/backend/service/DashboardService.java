package backend.service;

import backend.domain.BookingStatus;
import backend.domain.FacilityStatus;
import backend.domain.Role;
import backend.domain.TicketStatus;
import backend.dto.DashboardStatsDto;
import backend.dto.UserDto;
import backend.repository.AppUserRepository;
import backend.repository.BookingRepository;
import backend.repository.FacilityRepository;
import backend.repository.TicketRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

	private final AppUserRepository appUserRepository;
	private final FacilityRepository facilityRepository;
	private final BookingRepository bookingRepository;
	private final TicketRepository ticketRepository;

	@Transactional(readOnly = true)
	public List<UserDto> technicians() {
		return appUserRepository.findAll().stream()
				.filter(u -> u.getRole() == Role.TECHNICIAN || u.getRole() == Role.ADMIN)
				.map(
						u ->
								new UserDto(
										u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.getProfilePicture()))
				.toList();
	}

	@Transactional(readOnly = true)
	public DashboardStatsDto getDashboardStats() {
		long totalUsers = appUserRepository.count();
		long activeFacilities = facilityRepository.countByStatus(FacilityStatus.ACTIVE);
		long pendingBookings = bookingRepository.countByStatus(BookingStatus.PENDING);
		long openTickets = ticketRepository.countByStatus(TicketStatus.OPEN);

		List<DashboardStatsDto.NamedCount> topFacilities = bookingRepository
				.topFacilitiesByApprovedBookings(PageRequest.of(0, 5)).stream()
				.map(row -> new DashboardStatsDto.NamedCount((String) row[1], (Long) row[2]))
				.toList();

		List<DashboardStatsDto.BookingTrendPoint> bookingTrend = bookingRepository.bookingTrendLast7Days().stream()
				.map(
						row -> new DashboardStatsDto.BookingTrendPoint(
								row[0].toString(), ((Number) row[1]).longValue()))
				.toList();

		List<DashboardStatsDto.NamedCount> peakHours = bookingRepository.peakBookingHours().stream()
				.map(
						row -> new DashboardStatsDto.NamedCount(
								row[0].toString() + ":00", ((Number) row[1]).longValue()))
				.toList();

		List<DashboardStatsDto.NamedCount> peakDays = bookingRepository.peakBookingDays().stream()
				.map(
						row -> new DashboardStatsDto.NamedCount(
								(String) row[0], ((Number) row[1]).longValue()))
				.toList();

		return new DashboardStatsDto(
				pendingBookings,
				openTickets,
				totalUsers,
				activeFacilities,
				topFacilities,
				bookingTrend,
				peakHours,
				peakDays);
	}
}