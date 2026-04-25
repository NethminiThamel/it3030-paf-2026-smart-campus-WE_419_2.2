package backend.repository;

import backend.domain.Facility;
import backend.domain.FacilityStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface FacilityRepository extends JpaRepository<Facility, Long>, JpaSpecificationExecutor<Facility> {

	long countByStatus(FacilityStatus status);

	@org.springframework.data.jpa.repository.Modifying
	@org.springframework.data.jpa.repository.Query("UPDATE Facility f SET f.deleted = true WHERE f.id = :id")
	void softDelete(Long id);
}