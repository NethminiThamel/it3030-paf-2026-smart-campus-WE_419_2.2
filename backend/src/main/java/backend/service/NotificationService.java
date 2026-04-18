package backend.service;

import backend.domain.AppUser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NotificationService {

    public void notifyUser(AppUser user, String type, String title, String message, String category, Long entityId) {
        // TODO: Implement actual notification logic (e.g., email, in-app notification)
        log.info("Notifying user {}: {} - {} (category: {}, entityId: {})", user.getEmail(), title, message, category, entityId);
    }
}