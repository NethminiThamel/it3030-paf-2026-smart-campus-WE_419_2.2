package backend.service;

import backend.domain.FacilityStatus;
import backend.domain.Role;
import backend.dto.DashboardStatsDto;
import backend.dto.UserDto;
import backend.repository.AppUserRepository;
import backend.repository.FacilityRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AppUserRepository appUserRepository;
    private final FacilityRepository facilityRepository;

    @Transactional(readOnly = true)
    public List<UserDto> technicians() {
        return appUserRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.TECHNICIAN || u.getRole() == Role.ADMIN)
                .map(u -> new UserDto(
                        u.getId(),
                        u.getEmail(),
                        u.getFullName(),
                        u.getRole()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats() {
        long totalUsers = appUserRepository.count();
        long activeFacilities = facilityRepository.countByStatus(FacilityStatus.ACTIVE);
        // Dummy values for now (no booking/ticket logic)
        long pendingBookings = 0;
        long openTickets = 0;
        List<DashboardStatsDto.NamedCount> topFacilities = List.of();
        List<DashboardStatsDto.BookingTrendPoint> bookingTrend = List.of();
        return new DashboardStatsDto(
            pendingBookings,
            openTickets,
            totalUsers,
            activeFacilities,
            topFacilities,
            bookingTrend
        );
    }
}