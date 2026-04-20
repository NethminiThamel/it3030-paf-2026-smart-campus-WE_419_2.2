package backend.controller;

import backend.dto.DashboardStatsDto;
import backend.dto.UpdateUserRoleRequest;
import backend.dto.UserDto;
import backend.service.CurrentUserService;
import backend.service.DashboardService;
import backend.service.UserAdminService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

	private final DashboardService dashboardService;
	private final UserAdminService userAdminService;
	private final CurrentUserService currentUserService;

	@GetMapping("/dashboard")
	public DashboardStatsDto dashboard(Authentication authentication) {
		currentUserService.requireUser(authentication);
		return dashboardService.getDashboardStats();
	}


	@GetMapping("/technicians")
	public List<UserDto> technicians(Authentication authentication) {
		currentUserService.requireUser(authentication);
		return dashboardService.technicians();
	}

	@GetMapping("/users")
	public List<UserDto> users(Authentication authentication) {
		currentUserService.requireUser(authentication);
		return userAdminService.listAll();
	}

	@PatchMapping("/users/{id}/role")
	public UserDto updateRole(
			Authentication authentication,
			@PathVariable Long id,
			@Valid @RequestBody UpdateUserRoleRequest req) {
		currentUserService.requireUser(authentication);
		return userAdminService.updateRole(id, req);
	}

	@DeleteMapping("/users/{id}")
	public void deleteUser(Authentication authentication, @PathVariable Long id) {
		currentUserService.requireUser(authentication);
		userAdminService.delete(id);
	}
}

