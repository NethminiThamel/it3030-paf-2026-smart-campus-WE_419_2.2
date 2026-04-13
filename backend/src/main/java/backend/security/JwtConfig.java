package backend.security;

import java.util.List;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@Configuration
public class JwtConfig {

	@Bean(name = "googleJwtDecoder")
	JwtDecoder googleJwtDecoder(@Value("${GOOGLE_CLIENT_ID}") String clientId) {
		NimbusJwtDecoder decoder =
				NimbusJwtDecoder.withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs").build();
		OAuth2TokenValidator<Jwt> withIssuer =
				JwtValidators.createDefaultWithIssuer("https://accounts.google.com");
		OAuth2TokenValidator<Jwt> audience =
				new JwtClaimValidator<>("aud", aud -> {
					if (aud == null) return false;
					if (aud instanceof String s) return clientId.equals(s);
					if (aud instanceof List<?> list) {
						return list.stream().anyMatch(x -> clientId.equals(String.valueOf(x)));
					}
					return false;
				});
		decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(withIssuer, audience));
		return decoder;
	}

	@Bean(name = "localJwtDecoder")
	JwtDecoder localJwtDecoder(@Value("${JWT_SECRET}") String secret) {
		byte[] keyBytes = secret.getBytes();
		SecretKeySpec key = new SecretKeySpec(keyBytes, "HmacSHA256");
		return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
	}

	@Bean
	JwtEncoder jwtEncoder(@Value("${JWT_SECRET}") String secret) {
		JWKSource<SecurityContext> jwks = new ImmutableSecret<>(secret.getBytes());
		return new NimbusJwtEncoder(jwks);
	}

	@Bean
	@Primary
	JwtDecoder jwtDecoder(
			@Qualifier("localJwtDecoder") JwtDecoder localJwtDecoder,
			@Qualifier("googleJwtDecoder") JwtDecoder googleJwtDecoder) {
		return new MultiJwtDecoder(localJwtDecoder, googleJwtDecoder);
	}
}
