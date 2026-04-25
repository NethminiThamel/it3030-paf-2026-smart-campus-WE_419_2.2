package backend.controller;

import backend.dto.UserDto;
import backend.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import backend.dto.UpdateProfileRequest;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import backend.service.ProfilePictureStorageService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class MeController {

	private final CurrentUserService currentUserService;
	private final ProfilePictureStorageService profilePictureStorageService;

	@GetMapping
	public UserDto me(Authentication authentication) {
		var u = currentUserService.requireUser(authentication);
		return new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.getProfilePicture());
	}

	@PostMapping("/photo")
	@Transactional
	public UserDto uploadPhoto(
			Authentication authentication,
			@RequestPart("file") MultipartFile file) throws IOException {
		var u = currentUserService.requireUser(authentication);
		var stored = profilePictureStorageService.store(file);
		u.setProfilePicture("/uploads/profiles/" + stored.storedFilename());
		return new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.getProfilePicture());
	}

	@PatchMapping
	@Transactional
	public UserDto update(Authentication authentication, @Valid @RequestBody UpdateProfileRequest req) {
		var u = currentUserService.requireUser(authentication);
		u.setFullName(req.fullName());
		return new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.getProfilePicture());
	}

}
