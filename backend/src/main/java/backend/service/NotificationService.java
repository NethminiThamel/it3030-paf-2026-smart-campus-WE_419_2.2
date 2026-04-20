package backend.service;

import backend.domain.AppUser;
import backend.domain.Notification;
import backend.repository.NotificationRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

	private final NotificationRepository notificationRepository;

	@Transactional
	public void notifyUser(AppUser user, String type, String title, String message, String category, Long entityId) {
		Notification n =
				Notification.builder()
						.user(user)
						.type(type)
						.title(title)
						.message(message)
						.category(category)
						.entityId(entityId)
						.createdAt(Instant.now())
						.build();
		notificationRepository.save(n);
		log.info("Notifying user {}: {} - {} (category: {}, entityId: {})", user.getEmail(), title, message, category, entityId);
	}
}