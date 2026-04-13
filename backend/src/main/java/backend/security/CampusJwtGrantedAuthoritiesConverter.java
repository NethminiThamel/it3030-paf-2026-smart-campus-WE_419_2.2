package backend.security;

import backend.repository.AppUserRepository;
import backend.service.UserProvisioningService;
import java.util.Collection;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CampusJwtGrantedAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

	private final UserProvisioningService userProvisioningService;
	private final AppUserRepository appUserRepository;

	@Override
	public Collection<GrantedAuthority> convert(Jwt jwt) {
		String iss = jwt.getIssuer() != null ? jwt.getIssuer().toString() : "";
		if (LocalJwtService.LOCAL_ISSUER.equals(iss)) {
			String email = jwt.getClaimAsString("email");
			if (email == null || email.isBlank()) {
				throw new IllegalStateException("Token missing email");
			}
			var user =
					appUserRepository
							.findByEmailIgnoreCase(email)
							.orElseThrow(() -> new IllegalStateException("User not found"));
			return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
		}
		var user = userProvisioningService.provisionFromGoogleJwt(jwt);
		return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
	}
}
