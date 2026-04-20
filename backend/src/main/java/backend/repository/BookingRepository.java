package backend.repository;

import backend.domain.Booking;
import backend.domain.BookingStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long> {

	@Query(
			"select b from Booking b join fetch b.user join fetch b.facility where b.user.id = :userId order by b.startTime desc")
	List<Booking> findByUserIdOrderByStartTimeDesc(@Param("userId") Long userId);

	@Query(
			"select distinct b from Booking b join fetch b.user join fetch b.facility order by b.startTime desc")
	List<Booking> findAllWithDetails();

	@Query(
			value = """
			SELECT COUNT(*) FROM bookings b
			WHERE b.facility_id = :facilityId
			AND b.status IN ('PENDING', 'APPROVED')
			AND b.start_time < :end
			AND b.end_time > :start
			AND (:excludeId IS NULL OR b.id <> :excludeId)
			""",
			nativeQuery = true)
	long countOverlapping(
			@Param("facilityId") Long facilityId,
			@Param("start") Instant start,
			@Param("end") Instant end,
			@Param("excludeId") Long excludeId);

	@Query("select b from Booking b join fetch b.user join fetch b.facility where b.id = :id")
	Optional<Booking> findByIdWithDetails(@Param("id") Long id);

	Optional<Booking> findByQrToken(String qrToken);

	long countByStatus(BookingStatus status);

	@Query("select count(b) from Booking b where b.user.id = :userId")
	long countByUserId(@Param("userId") Long userId);

	@Query(
			value =
					"""
					SELECT COUNT(*) FROM bookings b
					WHERE b.facility_id = :facilityId
					AND b.status IN ('PENDING', 'APPROVED')
					AND b.start_time < :now
					AND b.end_time > :now
					""",
			nativeQuery = true)
	long countOccupyingNow(@Param("facilityId") Long facilityId, @Param("now") java.time.Instant now);

	@Query(
			"""
			select f.id, f.name, count(b) from Booking b join b.facility f
			where b.status = backend.domain.BookingStatus.APPROVED
			group by f.id, f.name
			order by count(b) desc
			""")
	List<Object[]> topFacilitiesByApprovedBookings(Pageable pageable);

	@Query(value = """
			SELECT HOUR(start_time) as h, COUNT(*) as c
			FROM bookings
			WHERE status = 'APPROVED'
			GROUP BY h
			ORDER BY c DESC
			""", nativeQuery = true)
	List<Object[]> peakBookingHours();

	@Query(value = """
			SELECT DAYNAME(start_time) as d, COUNT(*) as c
			FROM bookings
			WHERE status = 'APPROVED'
			GROUP BY d
			ORDER BY c DESC
			""", nativeQuery = true)
	List<Object[]> peakBookingDays();

	@Query(value = """
			SELECT DATE(start_time) as d, COUNT(*) as c
			FROM bookings
			WHERE status IN ('APPROVED', 'PENDING')
			AND start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
			GROUP BY d
			ORDER BY d ASC
			""", nativeQuery = true)
	List<Object[]> bookingTrendLast7Days();
}

