package backend.service;

import backend.domain.AppUser;
import backend.domain.Role;
import backend.exception.ApiException;
import backend.repository.AppUserRepository;
import java.time.Instant;
import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProvisioningService {

	private final AppUserRepository appUserRepository;
	private final AppUserInsertService appUserInsertService;

	@Value("${app.security.admin-emails:}")
	private String adminEmailsRaw;

	@Transactional
	public AppUser provisionFromGoogleJwt(Jwt jwt) {
		String sub = jwt.getSubject();
		String email = jwt.getClaimAsString("email");
		if (email == null || email.isBlank()) {
			throw new IllegalStateException("Google token missing email claim");
		}
		String name = resolveName(jwt);
		String emailNorm = email.toLowerCase(Locale.ROOT);

		return appUserRepository
				.findByGoogleSub(sub)
				.map(
						existing -> {
							Role desiredRole = resolveInitialRole(emailNorm);
							existing.setEmail(emailNorm);
							existing.setFullName(name);
							if (desiredRole == Role.ADMIN && existing.getRole() != Role.ADMIN) {
								existing.setRole(Role.ADMIN);
							}
							return existing;
						})
				.orElseGet(() -> provisionNewGoogleUser(sub, emailNorm, name));
	}

	private AppUser provisionNewGoogleUser(String sub, String emailNorm, String name) {
		Optional<AppUser> byEmail = appUserRepository.findByEmailIgnoreCase(emailNorm);
		if (byEmail.isPresent()) {
			AppUser u = byEmail.get();
			if (u.getGoogleSub() != null && !u.getGoogleSub().equals(sub)) {
				throw new ApiException(
						HttpStatus.CONFLICT, "This email is already linked to a different Google account");
			}
			u.setGoogleSub(sub);
			u.setFullName(name);
			Role desiredRole = resolveInitialRole(emailNorm);
			if (desiredRole == Role.ADMIN && u.getRole() != Role.ADMIN) {
				u.setRole(Role.ADMIN);
			}
			return appUserRepository.save(u);
		}
		return createUser(sub, emailNorm, name);
	}

	private AppUser createUser(String sub, String email, String name) {
		Role role = resolveInitialRole(email);
		AppUser user =
				AppUser.builder()
						.googleSub(sub)
						.email(email.toLowerCase(Locale.ROOT))
						.fullName(name)
						.role(role)
						.createdAt(Instant.now())
						.build();
		try {
			return appUserInsertService.saveNew(user);
		} catch (DataIntegrityViolationException ex) {
			// Concurrent first sign-in: another request may have committed the same google_sub/email.
			return appUserRepository.findByGoogleSub(sub).orElseThrow(() -> ex);
		}
	}

	private Role resolveInitialRole(String email) {
		Set<String> admins =
				Arrays.stream(adminEmailsRaw.split(","))
						.map(String::trim)
						.filter(s -> !s.isEmpty())
						.map(e -> e.toLowerCase(Locale.ROOT))
						.collect(Collectors.toSet());
		if (admins.contains(email.toLowerCase(Locale.ROOT))) {
			return Role.ADMIN;
		}
		return Role.USER;
	}

	private String resolveName(Jwt jwt) {
		String n = jwt.getClaimAsString("name");
		if (n != null && !n.isBlank()) {
			return n;
		}
		String given = jwt.getClaimAsString("given_name");
		String family = jwt.getClaimAsString("family_name");
		if (given != null || family != null) {
			return ((given != null ? given : "") + " " + (family != null ? family : "")).trim();
		}
		return jwt.getClaimAsString("email");
	}
}
