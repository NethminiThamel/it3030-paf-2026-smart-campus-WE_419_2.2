package backend.controller;

import backend.dto.AuthTokenResponse;
import backend.dto.LoginRequest;
import backend.dto.RegisterRequest;
import backend.service.LocalAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

	private final LocalAuthService localAuthService;

	@PostMapping("/register")
	public AuthTokenResponse register(@Valid @RequestBody RegisterRequest req) {
		return localAuthService.register(req);
	}

	@PostMapping("/login")
	public AuthTokenResponse login(@Valid @RequestBody LoginRequest req) {
		return localAuthService.login(req);
	}
}
