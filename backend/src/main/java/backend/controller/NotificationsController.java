package backend.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationsController {

    @GetMapping("/unread-count")
    public Map<String, Integer> getUnreadCount() {
        return Map.of("count", 0);
    }
}
