package backend.controller;

import backend.dto.UserDto;
import backend.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class MeController {

	private final CurrentUserService currentUserService;

	@GetMapping
	public UserDto me(Authentication authentication) {
		var u = currentUserService.requireUser(authentication);
		return new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getRole());
	}
}
