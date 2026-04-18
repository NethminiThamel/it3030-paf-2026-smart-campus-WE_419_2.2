package backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "facilities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Facility {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(name = "resource_type", nullable = false)
	private FacilityType resourceType;

	@Column(nullable = false)
	private Integer capacity;

	@Column(nullable = false, length = 512)
	private String location;

	@Column(name = "availability_window")
	private String availabilityWindow;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private FacilityStatus status;

	@Column(columnDefinition = "TEXT")
	private String description;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Builder.Default
	@jakarta.persistence.OneToMany(mappedBy = "facility", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
	private java.util.List<FacilityImage> images = new java.util.ArrayList<>();

	@Builder.Default
	@jakarta.persistence.OneToMany(mappedBy = "facility", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
	private java.util.List<Booking> bookings = new java.util.ArrayList<>();
}
