package backend.service;

import backend.domain.Facility;
import backend.domain.FacilityImage;
import backend.domain.FacilityStatus;
import backend.domain.FacilityType;
import backend.dto.CreateFacilityRequest;
import backend.dto.FacilityDto;
import backend.dto.FacilityImageDto;
import backend.exception.ApiException;
import backend.repository.FacilityImageRepository;
import backend.repository.FacilityRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class FacilityService {

	private final FacilityRepository facilityRepository;
	private final FacilityImageRepository facilityImageRepository;
	private final FacilityImageStorageService facilityImageStorageService;

	private Facility getEntity(Long id) {
		return facilityRepository
				.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Facility not found"));
	}

	@Transactional(readOnly = true)
	public List<FacilityDto> search(
			FacilityType type,
			Integer minCapacity,
			String locationContains,
			FacilityStatus status,
			Boolean onlyAvailableNow) {
		Specification<Facility> spec = (root, cq, cb) -> cb.equal(root.get("deleted"), false);
		if (type != null) {
			spec = spec.and((root, q, cb) -> cb.equal(root.get("resourceType"), type));
		}
		if (minCapacity != null) {
			spec = spec.and((root, q, cb) -> cb.ge(root.get("capacity"), minCapacity));
		}
		if (locationContains != null && !locationContains.isBlank()) {
			String like = "%" + locationContains.toLowerCase() + "%";
			spec = spec.and(
					(root, q, cb) -> cb.like(cb.lower(root.get("location")), like));
		}
		if (status != null) {
			spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
		}
		List<Facility> list = facilityRepository.findAll(spec);
		Map<Long, List<FacilityImageDto>> imagesByFacilityId = loadImagesForFacilities(list);
		Instant now = Instant.now();
		List<FacilityDto> out = new ArrayList<>();
		for (Facility f : list) {
			boolean availNow = computeAvailableNow(f, now);
			if (Boolean.TRUE.equals(onlyAvailableNow) && !availNow) {
				continue;
			}
			List<FacilityImageDto> facilityImages = imagesByFacilityId.get(f.getId());
			if (facilityImages == null) {
				facilityImages = new ArrayList<>();
			}
			out.add(toDto(f, availNow, facilityImages));
		}
		return out;
	}

	private boolean computeAvailableNow(Facility f, Instant now) {
		if (f.getStatus() != FacilityStatus.ACTIVE) {
			return false;
		}
		return true;
	}

	private FacilityDto toDto(Facility f, Boolean availNow, List<FacilityImageDto> images) {
		return new FacilityDto(
				f.getId(),
				f.getName(),
				f.getResourceType(),
				f.getCapacity(),
				f.getLocation(),
				f.getAvailabilityWindow(),
				f.getStatus(),
				f.getDescription(),
				availNow,
				images);
	}

	@Transactional(readOnly = true)
	public FacilityDto get(Long id) {
		Facility f = getEntity(id);
		Instant now = Instant.now();
		Map<Long, List<FacilityImageDto>> imagesByFacilityId = loadImagesForFacilities(Collections.singletonList(f));
		List<FacilityImageDto> facilityImages = imagesByFacilityId.get(f.getId());
		if (facilityImages == null) {
			facilityImages = new ArrayList<>();
		}
		return toDto(f, computeAvailableNow(f, now), facilityImages);
	}

	@Transactional
	public FacilityDto create(CreateFacilityRequest req) {
		Facility f = Facility.builder()
				.name(req.name())
				.resourceType(req.resourceType())
				.capacity(req.capacity())
				.location(req.location())
				.availabilityWindow(req.availabilityWindow())
				.status(req.status())
				.description(req.description())
				.createdAt(Instant.now())
				.build();
		f = facilityRepository.save(f);
		return toDto(f, computeAvailableNow(f, Instant.now()), new ArrayList<>());
	}

	@Transactional
	public FacilityDto update(Long id, CreateFacilityRequest req) {
		Facility f = getEntity(id);
		f.setName(req.name());
		f.setResourceType(req.resourceType());
		f.setCapacity(req.capacity());
		f.setLocation(req.location());
		f.setAvailabilityWindow(req.availabilityWindow());
		f.setStatus(req.status());
		f.setDescription(req.description());
		Map<Long, List<FacilityImageDto>> imagesByFacilityId = loadImagesForFacilities(Collections.singletonList(f));
		List<FacilityImageDto> facilityImages = imagesByFacilityId.get(f.getId());
		if (facilityImages == null) {
			facilityImages = new ArrayList<>();
		}
		return toDto(f, computeAvailableNow(f, Instant.now()), facilityImages);
	}

	@Transactional
	public void delete(Long id) {
		if (!facilityRepository.existsById(id)) {
			throw new ApiException(HttpStatus.NOT_FOUND, "Facility not found");
		}
		facilityRepository.softDelete(id);
	}

	@Transactional
	public FacilityDto uploadImages(Long id, List<MultipartFile> files) {
		if (files == null || files.isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "No images provided");
		}
		if (files.size() > 10) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Too many images (max 10)");
		}
		Facility f = getEntity(id);
		for (MultipartFile mf : files) {
			if (mf == null || mf.isEmpty())
				continue;
			try {
				var stored = facilityImageStorageService.store(mf);
				var img = FacilityImage.builder()
						.facility(f)
						.storedFilename(stored.storedFilename())
						.originalFilename(stored.originalFilename())
						.contentType(stored.contentType())
						.createdAt(Instant.now())
						.build();
				facilityImageRepository.save(img);
			} catch (Exception e) {
				throw new ApiException(HttpStatus.BAD_REQUEST, "Failed to store image");
			}
		}
		Map<Long, List<FacilityImageDto>> imagesByFacilityId = loadImagesForFacilities(Collections.singletonList(f));
		List<FacilityImageDto> facilityImages = imagesByFacilityId.get(f.getId());
		if (facilityImages == null) {
			facilityImages = new ArrayList<>();
		}
		return toDto(f, computeAvailableNow(f, Instant.now()), facilityImages);
	}

	@Transactional
	public void deleteImage(Long facilityId, Long imageId) {
		FacilityImage img = facilityImageRepository
				.findById(imageId)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Image not found"));
		if (!img.getFacility().getId().equals(facilityId)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Image does not belong to this facility");
		}
		facilityImageStorageService.delete(img.getStoredFilename());
		facilityImageRepository.delete(img);
	}

	private Map<Long, List<FacilityImageDto>> loadImagesForFacilities(List<Facility> facilities) {
		if (facilities == null || facilities.isEmpty())
			return Map.of();
		Collection<Long> ids = new ArrayList<>();
		for (Facility f : facilities) {
			ids.add(f.getId());
		}
		List<FacilityImage> imgs = facilityImageRepository.findByFacilityIdIn(ids);
		Map<Long, List<FacilityImageDto>> out = new HashMap<>();
		for (FacilityImage img : imgs) {
			if (img.getFacility() == null)
				continue;
			Long fid = img.getFacility().getId();
			if (!out.containsKey(fid)) {
				out.put(fid, new ArrayList<>());
			}
			out.get(fid).add(new FacilityImageDto(img.getId(), "/uploads/facility-images/" + img.getStoredFilename()));
		}
		return out;
	}

}
