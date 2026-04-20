package backend.repository;

import backend.domain.TicketHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {

	List<TicketHistory> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}

