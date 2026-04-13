package backend.service;

import backend.domain.Role;
import backend.dto.UserDto;
import backend.repository.AppUserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AppUserRepository appUserRepository;

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
}