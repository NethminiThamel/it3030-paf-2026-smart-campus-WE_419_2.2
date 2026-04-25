package backend.repository;

import backend.domain.AppUser;
import backend.domain.Role;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

	Optional<AppUser> findByGoogleSub(String googleSub);

	Optional<AppUser> findByEmailIgnoreCase(String email);

	long countByRole(Role role);

	@org.springframework.data.jpa.repository.Modifying
	@org.springframework.data.jpa.repository.Query("UPDATE AppUser u SET u.deleted = true WHERE u.id = :id")
	void softDelete(Long id);

	java.util.List<AppUser> findByDeletedFalse();
}
