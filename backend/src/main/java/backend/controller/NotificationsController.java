package backend.controller;

import backend.domain.AppUser;
import backend.domain.Notification;
import backend.dto.NotificationDto;
import backend.exception.ApiException;
import backend.repository.NotificationRepository;
import backend.service.CurrentUserService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationsController {

	private final NotificationRepository notificationRepository;
	private final CurrentUserService currentUserService;

	@GetMapping
	public List<NotificationDto> list(Authentication authentication) {
		AppUser user = currentUserService.requireUser(authentication);
		return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
				.map(this::toDto)
				.toList();
	}

	@GetMapping("/unread-count")
	public Map<String, Long> getUnreadCount(Authentication authentication) {
		AppUser user = currentUserService.requireUser(authentication);
		return Map.of("count", notificationRepository.countByUserIdAndIsReadFalse(user.getId()));
	}

	@PostMapping("/{id}/read")
	@Transactional
	public void markAsRead(Authentication authentication, @PathVariable Long id) {
		AppUser user = currentUserService.requireUser(authentication);
		Notification n =
				notificationRepository
						.findById(id)
						.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));
		if (!n.getUser().getId().equals(user.getId())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
		}
		n.setRead(true);
	}

	@PostMapping("/mark-all-read")
	@Transactional
	public void markAllAsRead(Authentication authentication) {
		AppUser user = currentUserService.requireUser(authentication);
		notificationRepository.markAllAsRead(user.getId());
	}

	@DeleteMapping("/{id}")
	@Transactional
	public void delete(Authentication authentication, @PathVariable Long id) {
		AppUser user = currentUserService.requireUser(authentication);
		Notification n = notificationRepository.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not found"));
		if (!n.getUser().getId().equals(user.getId())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
		}
		notificationRepository.delete(n);
	}

	@DeleteMapping("/clear-all")
	@Transactional
	public void clearAll(Authentication authentication) {
		AppUser user = currentUserService.requireUser(authentication);
		notificationRepository.deleteByUserIdAndIsReadTrue(user.getId());
	}




	private NotificationDto toDto(Notification n) {
		return new NotificationDto(
				n.getId(),
				n.getType(),
				n.getTitle(),
				n.getMessage(),
				n.getCategory(),
				n.getEntityId(),
				n.isRead(),
				n.getCreatedAt());
	}
}

