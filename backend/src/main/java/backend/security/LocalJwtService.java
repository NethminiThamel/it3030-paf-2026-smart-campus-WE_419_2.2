package backend.security;

import backend.domain.AppUser;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LocalJwtService {

	public static final String LOCAL_ISSUER = "https://smartcampus.hub/auth/local";

	private final JwtEncoder jwtEncoder;

	public String createAccessToken(AppUser user) {
		Instant now = Instant.now();
		JwtClaimsSet claims =
				JwtClaimsSet.builder()
						.issuer(LOCAL_ISSUER)
						.issuedAt(now)
						.expiresAt(now.plus(7, ChronoUnit.DAYS))
						.subject(String.valueOf(user.getId()))
						.claim("email", user.getEmail())
						.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
	}
}
