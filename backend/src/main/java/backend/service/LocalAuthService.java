package backend.service;

import backend.domain.AppUser;
import backend.domain.Role;
import backend.dto.AuthTokenResponse;
import backend.dto.LoginRequest;
import backend.dto.RegisterRequest;
import backend.exception.ApiException;
import backend.repository.AppUserRepository;
import backend.security.LocalJwtService;
import java.time.Instant;
import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LocalAuthService {

	private final AppUserRepository appUserRepository;
	private final AppUserInsertService appUserInsertService;
	private final PasswordEncoder passwordEncoder;
	private final LocalJwtService localJwtService;

	@Value("${app.security.admin-emails:}")
	private String adminEmailsRaw;

	@Transactional
	public AuthTokenResponse register(RegisterRequest req) {
		String email = req.email().trim().toLowerCase(Locale.ROOT);
		Optional<AppUser> existingOpt = appUserRepository.findByEmailIgnoreCase(email);
		if (existingOpt.isPresent()) {
			AppUser existing = existingOpt.get();
			if (Boolean.TRUE.equals(existing.getDeleted())) {
				throw new ApiException(HttpStatus.FORBIDDEN, "This account has been deactivated and cannot be re-registered.");
			}
			if (existing.getPasswordHash() != null) {
				throw new ApiException(
						HttpStatus.CONFLICT,
						"An account with this email already exists. Sign in with your password instead.");
			}
			// Same email was created earlier (e.g. Google sign-in) but no password yet — add one so email login works.
			existing.setPasswordHash(passwordEncoder.encode(req.password()));
			existing.setFullName(req.fullName().trim());
			AppUser saved = appUserRepository.save(existing);
			return new AuthTokenResponse(localJwtService.createAccessToken(saved));
		}
		Role role = resolveInitialRole(email);
		// Non-null placeholder so registration works even if the DB was never migrated to nullable google_sub (V4).
		// Replaced with a real Google "sub" when the user links Google on the same email.
		String localSub = "local-" + UUID.randomUUID().toString().replace("-", "");
		AppUser user =
				AppUser.builder()
						.email(email)
						.fullName(req.fullName().trim())
						.googleSub(localSub)
						.passwordHash(passwordEncoder.encode(req.password()))
						.role(role)
						.createdAt(Instant.now())
						.build();
		try {
			user = appUserInsertService.saveNew(user);
		} catch (DataIntegrityViolationException ex) {
			Optional<AppUser> retry = appUserRepository.findByEmailIgnoreCase(email);
			if (retry.isPresent() && retry.get().getPasswordHash() == null) {
				AppUser e = retry.get();
				e.setPasswordHash(passwordEncoder.encode(req.password()));
				e.setFullName(req.fullName().trim());
				return new AuthTokenResponse(localJwtService.createAccessToken(appUserRepository.save(e)));
			}
			throw new ApiException(
					HttpStatus.CONFLICT,
					"This email is already registered. Sign in, or use Register after Google sign-in to add a password.");
		}
		return new AuthTokenResponse(localJwtService.createAccessToken(user));
	}

	@Transactional(readOnly = true)
	public AuthTokenResponse login(LoginRequest req) {
		String email = req.email().trim().toLowerCase(Locale.ROOT);
		AppUser user =
				appUserRepository
						.findByEmailIgnoreCase(email)
						.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
		if (Boolean.TRUE.equals(user.getDeleted())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "Account has been deactivated");
		}
		if (user.getPasswordHash() == null) {
			throw new ApiException(
					HttpStatus.UNAUTHORIZED,
					"No password on file for this email. Use Continue with Google on the login page, or use the same email on Register to set a password.");
		}
		if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
		}
		// Refresh role in case config changed
		Role desiredRole = resolveInitialRole(email);
		if (user.getRole() != desiredRole) {
			user.setRole(desiredRole);
			user = appUserRepository.save(user);
		}
		return new AuthTokenResponse(localJwtService.createAccessToken(user));
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
}
