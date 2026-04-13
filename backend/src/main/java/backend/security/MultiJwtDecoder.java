package backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

/**
 * Tries the local (HS256) decoder first, then Google ID tokens. Order avoids unnecessary JWK fetches.
 */
@RequiredArgsConstructor
public class MultiJwtDecoder implements JwtDecoder {

	private final JwtDecoder localJwtDecoder;
	private final JwtDecoder googleJwtDecoder;

	@Override
	public Jwt decode(String token) throws JwtException {
		try {
			return localJwtDecoder.decode(token);
		} catch (JwtException ignored) {
			return googleJwtDecoder.decode(token);
		}
	}
}
