package backend.repository;

import backend.domain.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
	List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
	long countByUserIdAndIsReadFalse(Long userId);

	@org.springframework.data.jpa.repository.Modifying
	@org.springframework.data.jpa.repository.Query("update Notification n set n.isRead = true where n.user.id = :userId")
	void markAllAsRead(Long userId);

	@org.springframework.data.jpa.repository.Modifying
	@org.springframework.data.jpa.repository.Query("delete from Notification n where n.user.id = :userId and n.isRead = true")
	void deleteByUserIdAndIsReadTrue(Long userId);
}


