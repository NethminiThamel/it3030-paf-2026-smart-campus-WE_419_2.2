package backend.repository;

import backend.domain.Ticket;
import backend.domain.TicketStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

	long countByStatus(TicketStatus status);

	List<Ticket> findByAssignedTechnicianIdOrderByUpdatedAtDesc(Long technicianId);

	long countByAssignedTechnicianId(Long technicianId);

	List<Ticket> findByReporterIdOrderByUpdatedAtDesc(Long reporterId);
}

