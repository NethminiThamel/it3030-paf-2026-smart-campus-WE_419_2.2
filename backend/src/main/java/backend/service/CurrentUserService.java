package backend.service;

import backend.domain.AppUser;
import backend.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

	private final AppUserRepository appUserRepository;

	public AppUser requireUser(Authentication authentication) {
		if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
			throw new IllegalStateException("Not authenticated");
		}
		String email = jwt.getClaimAsString("email");
		if (email == null || email.isBlank()) {
			throw new IllegalStateException("Token missing email");
		}
		return appUserRepository
				.findByEmailIgnoreCase(email)
				.orElseThrow(() -> new IllegalStateException("User not provisioned"));
	}
}
