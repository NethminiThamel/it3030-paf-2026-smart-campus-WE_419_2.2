package backend.exception;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ApiException.class)
	public ResponseEntity<Map<String, Object>> handleApiException(ApiException ex) {
		return ResponseEntity.status(ex.getStatus())
				.body(Map.of(
						"status", ex.getStatus().value(),
						"error", ex.getStatus().getReasonPhrase(),
						"message", ex.getMessage()
				));
	}
}
