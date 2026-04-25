package backend.service;

import backend.domain.AppUser;
import backend.dto.UpdateUserRoleRequest;
import backend.dto.UserDto;
import backend.exception.ApiException;
import backend.repository.AppUserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserAdminService {

	private final AppUserRepository appUserRepository;

	@Transactional(readOnly = true)
	public List<UserDto> listAll() {
		return appUserRepository.findByDeletedFalse().stream()
				.map(this::toDto)
				.toList();
	}

	@Transactional
	public UserDto updateRole(Long userId, UpdateUserRoleRequest req) {
		AppUser u =
				appUserRepository
						.findById(userId)
						.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
		u.setRole(req.role());
		return toDto(u);
	}

	@Transactional
	public void delete(Long userId) {
		if (!appUserRepository.existsById(userId)) {
			throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
		}
		appUserRepository.softDelete(userId);
	}

	private UserDto toDto(AppUser u) {
		return new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.getProfilePicture());
	}

}
