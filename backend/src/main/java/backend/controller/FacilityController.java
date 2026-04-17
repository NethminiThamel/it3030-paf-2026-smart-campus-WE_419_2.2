package backend.controller;

import backend.domain.FacilityStatus;
import backend.domain.FacilityType;
import backend.dto.CreateFacilityRequest;
import backend.dto.FacilityDto;
import backend.service.CurrentUserService;
import backend.service.FacilityService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/facilities")
@RequiredArgsConstructor
public class FacilityController {

	private final FacilityService facilityService;
	private final CurrentUserService currentUserService;

	@GetMapping
	public List<FacilityDto> search(
			@RequestParam(required = false) FacilityType type,
			@RequestParam(required = false) Integer minCapacity,
			@RequestParam(required = false) String location,
			@RequestParam(required = false) FacilityStatus status,
			@RequestParam(required = false) Boolean onlyAvailableNow) {
		return facilityService.search(type, minCapacity, location, status, onlyAvailableNow);
	}

	@GetMapping("/{id}")
	public FacilityDto get(@PathVariable Long id) {
		return facilityService.get(id);
	}

	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public FacilityDto create(
			Authentication authentication, @Valid @RequestBody CreateFacilityRequest req) {
		currentUserService.requireUser(authentication);
		return facilityService.create(req);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public FacilityDto update(
			Authentication authentication,
			@PathVariable Long id,
			@Valid @RequestBody CreateFacilityRequest req) {
		currentUserService.requireUser(authentication);
		return facilityService.update(id, req);
	}

	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public void delete(Authentication authentication, @PathVariable Long id) {
		currentUserService.requireUser(authentication);
		facilityService.delete(id);
	}

	@PostMapping("/{id}/images")
	@PreAuthorize("hasRole('ADMIN')")
	public FacilityDto uploadImages(
			Authentication authentication,
			@PathVariable Long id,
			@RequestPart(value = "files", required = false) List<MultipartFile> files) {
		currentUserService.requireUser(authentication);
		// Endpoint uses multipart/form-data (files part).
		return facilityService.uploadImages(id, files);
	}
}
