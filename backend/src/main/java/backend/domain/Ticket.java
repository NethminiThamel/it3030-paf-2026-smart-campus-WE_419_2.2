package backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "reporter_id", nullable = false)
	private AppUser reporter;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "facility_id")
	private Facility facility;

	@Column(nullable = false, length = 128)
	private String category;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String description;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TicketPriority priority;

	@Column(name = "contact_email", nullable = false)
	private String contactEmail;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TicketStatus status;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "assigned_technician_id")
	private AppUser assignedTechnician;

	@Column(name = "reject_reason", length = 1024)
	private String rejectReason;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;
}

