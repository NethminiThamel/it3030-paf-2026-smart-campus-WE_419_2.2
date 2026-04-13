package backend.service;

import backend.domain.AppUser;
import backend.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Isolated inserts so a failed {@code save} (e.g. duplicate key under concurrency) rolls back its own
 * transaction and does not poison the outer persistence context with a half-persisted {@link AppUser}.
 */
@Service
@RequiredArgsConstructor
public class AppUserInsertService {

	private final AppUserRepository appUserRepository;

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public AppUser saveNew(AppUser user) {
		return appUserRepository.save(user);
	}
}
