package backend.repository;

import backend.domain.FacilityImage;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityImageRepository extends JpaRepository<FacilityImage, Long> {

	List<FacilityImage> findByFacilityId(Long facilityId);

	List<FacilityImage> findByFacilityIdIn(Collection<Long> facilityIds);
}

