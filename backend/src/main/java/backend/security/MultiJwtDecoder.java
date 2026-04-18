package backend.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

/**
 * Tries the local (HS256) decoder first, then Google ID tokens. Order avoids unnecessary JWK fetches.
 * If Google decoder fails (timeout or network error), logs and falls back to local decoder.
 */
@Slf4j
@RequiredArgsConstructor
public class MultiJwtDecoder implements JwtDecoder {

	private final JwtDecoder localJwtDecoder;
	private final JwtDecoder googleJwtDecoder;

	@Override
	public Jwt decode(String token) throws JwtException {
		try {
			return localJwtDecoder.decode(token);
		} catch (JwtException localException) {
			try {
				log.debug("Local JWT decode failed, attempting Google OAuth2 decode");
				return googleJwtDecoder.decode(token);
			} catch (JwtException googleException) {
				log.debug("Both local and Google JWT decoding failed", googleException);
				throw googleException;
			}
		}
	}
}
