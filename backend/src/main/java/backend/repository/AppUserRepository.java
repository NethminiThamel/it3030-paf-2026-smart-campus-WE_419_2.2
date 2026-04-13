package backend.repository;

import backend.domain.AppUser;
import backend.domain.Role;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

	Optional<AppUser> findByGoogleSub(String googleSub);

	Optional<AppUser> findByEmailIgnoreCase(String email);

	long countByRole(Role role);
}
