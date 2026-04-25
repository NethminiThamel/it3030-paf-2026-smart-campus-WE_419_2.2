package backend.service;

import backend.domain.AppUser;
import backend.domain.Booking;
import backend.domain.BookingStatus;
import backend.domain.Facility;
import backend.domain.FacilityStatus;
import backend.domain.Role;
import backend.dto.BookingDecisionRequest;
import backend.dto.BookingDto;
import backend.dto.CreateBookingRequest;
import backend.exception.ApiException;
import backend.repository.BookingRepository;
import backend.repository.FacilityRepository;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.net.URI;
import java.time.Instant;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookingService {

	private final BookingRepository bookingRepository;
	private final FacilityRepository facilityRepository;
	private final NotificationService notificationService;
	private final QrService qrService;

	/** Base URL for pass links; localhost default is replaced by LAN IP when possible. */
	@Value("${app.public.booking-pass-base-url:http://localhost:9094}")
	private String publicBookingPassBaseUrl;

	@Value("${server.port:9094}")
	private int serverPort;

	@Transactional
	public BookingDto create(AppUser user, CreateBookingRequest req) {
		if (!req.endTime().isAfter(req.startTime())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "End time must be after start time");
		}
		Facility facility =
				facilityRepository
						.findById(req.facilityId())
						.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Facility not found"));
		if (facility.getStatus() != FacilityStatus.ACTIVE) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Facility is not bookable");
		}
		if (req.expectedAttendees() > facility.getCapacity()) {
			throw new ApiException(
					HttpStatus.BAD_REQUEST, "Attendees exceed facility capacity");
		}
		if (bookingRepository.countOverlapping(
						facility.getId(), req.startTime(), req.endTime(), null)
				> 0) {
			throw new ApiException(HttpStatus.CONFLICT, "Time slot conflicts with an existing booking");
		}
		Booking b =
				Booking.builder()
						.user(user)
						.facility(facility)
						.startTime(req.startTime())
						.endTime(req.endTime())
						.purpose(req.purpose())
						.expectedAttendees(req.expectedAttendees())
						.status(BookingStatus.PENDING)
						.createdAt(Instant.now())
						.build();
		b = bookingRepository.save(b);
		return toDto(b);
	}

	@Transactional(readOnly = true)
	public List<BookingDto> listForActor(AppUser actor, BookingStatus status) {
		if (actor.getRole() == Role.ADMIN) {
			var all = bookingRepository.findAllWithDetails();
			if (status != null) {
				all = all.stream().filter(x -> x.getStatus() == status).toList();
			}
			return all.stream().map(this::toDto).toList();
		}
		if (actor.getRole() == Role.TECHNICIAN) {
			return bookingRepository.findAllWithDetails().stream()
					.filter(
							x ->
									x.getStatus() == BookingStatus.APPROVED
											|| x.getStatus() == BookingStatus.PENDING)
					.map(this::toDto)
					.toList();
		}
		return bookingRepository.findByUserIdOrderByStartTimeDesc(actor.getId()).stream()
				.filter(b -> status == null || b.getStatus() == status)
				.map(this::toDto)
				.toList();
	}

	@Transactional(readOnly = true)
	public BookingDto get(AppUser actor, Long id) {
		Booking b = getEntity(id);
		authorizeView(actor, b);
		return toDto(b);
	}

	@Transactional
	public void cancel(AppUser user, Long id) {
		Booking b = getEntity(id);
		if (!b.getUser().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
			throw new ApiException(HttpStatus.FORBIDDEN, "Cannot cancel this booking");
		}
		if (b.getStatus() != BookingStatus.PENDING && b.getStatus() != BookingStatus.APPROVED) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Booking cannot be cancelled");
		}
		b.setStatus(BookingStatus.CANCELLED);
		b.setQrToken(null);
		notificationService.notifyUser(
				b.getUser(),
				"BOOKING_CANCELLED",
				"Booking cancelled",
				"Your booking for " + b.getFacility().getName() + " was cancelled.",
				"BOOKING",
				b.getId());
	}

	@Transactional
	public BookingDto decide(AppUser admin, Long id, BookingDecisionRequest req) {
		if (admin.getRole() != Role.ADMIN) {
			throw new ApiException(HttpStatus.FORBIDDEN, "Admin only");
		}
		Booking b = getEntity(id);
		if (b.getStatus() != BookingStatus.PENDING) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Booking is not pending");
		}
		if (req.decision() == BookingStatus.APPROVED) {
			if (bookingRepository.countOverlapping(
							b.getFacility().getId(), b.getStartTime(), b.getEndTime(), b.getId())
					> 0) {
				throw new ApiException(HttpStatus.CONFLICT, "Conflict detected; cannot approve");
			}
			b.setStatus(BookingStatus.APPROVED);
			b.setAdminReason(null);
			b.setQrToken(UUID.randomUUID().toString().replace("-", ""));
			notificationService.notifyUser(
					b.getUser(),
					"BOOKING_APPROVED",
					"Booking approved",
					"Your booking for " + b.getFacility().getName() + " was approved.",
					"BOOKING",
					b.getId());
		} else if (req.decision() == BookingStatus.REJECTED) {
			b.setStatus(BookingStatus.REJECTED);
			b.setAdminReason(req.reason());
			b.setQrToken(null);
			notificationService.notifyUser(
					b.getUser(),
					"BOOKING_REJECTED",
					"Booking rejected",
					"Your booking was rejected"
							+ (req.reason() != null ? (": " + req.reason()) : "")
							+ ".",
					"BOOKING",
					b.getId());
		} else {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid decision");
		}
		return toDto(b);
	}

	@Transactional(readOnly = true)
	public Map<String, String> qrImageBase64(AppUser actor, Long id, String passBaseOverride) {
		Booking b = getEntity(id);
		authorizeView(actor, b);
		if (b.getQrToken() == null || b.getStatus() != BookingStatus.APPROVED) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "No QR for this booking");
		}
		String verifyLine = "SMARTCAMPUS:" + b.getId() + ":" + b.getQrToken();
		String passUrl = buildPublicBookingPassUrl(b.getQrToken(), passBaseOverride);
		String summaryText = buildPassSummaryPlainText(b);

		// URL must be the first token so iOS Camera recognises the QR as a link and
		// offers a "Open in Safari" action that loads the full pass HTML page. The
		// summary text is appended for offline fallback / Android long-press preview.
		String qrPayload = passUrl + "\n\n" + summaryText;
		
		Map<String, String> out = new LinkedHashMap<>();
		out.put("passUrl", passUrl);
		out.put("qrText", summaryText);
		out.put("payload", verifyLine);
		out.put("imageBase64", qrService.generatePngBase64(qrPayload));
		return out;
	}

	/** Same fields as the public pass page; for the hub UI only — not encoded in the QR. */
	private static String buildPassSummaryPlainText(Booking b) {
		StringBuilder sb = new StringBuilder();
		sb.append("SMART CAMPUS - BOOKING PASS\n");
		sb.append("----------------------------\n");
		sb.append("STATUS: ").append(b.getStatus()).append('\n');
		sb.append("VENUE: ").append(b.getFacility().getName()).append('\n');
		sb.append("LOCATION: ").append(b.getFacility().getLocation()).append('\n');
		sb.append("START (UTC): ").append(b.getStartTime()).append('\n');
		sb.append("END (UTC): ").append(b.getEndTime()).append('\n');
		if (b.getPurpose() != null && !b.getPurpose().isBlank()) {
			sb.append("PURPOSE: ").append(b.getPurpose()).append('\n');
		}
		sb.append("BOOKING ID: ").append(b.getId()).append('\n');
		return sb.toString();
	}

	private String effectiveConfiguredPassBase() {
		String base =
				publicBookingPassBaseUrl == null ? "" : publicBookingPassBaseUrl.trim();
		while (base.endsWith("/")) {
			base = base.substring(0, base.length() - 1);
		}
		if (base.isEmpty()) {
			base = "http://localhost:" + serverPort;
		}
		return base;
	}

	/**
	 * Chooses a base URL phones on the same Wi‑Fi can open: optional {@code passBase} from the browser (LAN hostname),
	 * else non-loopback {@code PUBLIC_PASS_BASE_URL}, else first site-local IPv4 of this machine, else localhost.
	 */
	private String resolvePassBaseForQr(String passBaseOverride) {
		String fromClient = passBaseOverride == null ? "" : passBaseOverride.trim();
		if (!fromClient.isEmpty()) {
			final URI u;
			try {
				u = URI.create(fromClient);
			} catch (IllegalArgumentException ex) {
				throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid passBase URL");
			}
			if (isAllowedClientSuggestedPassBase(u)) {
				return stripTrailingSlash(fromClient);
			}
			throw new ApiException(HttpStatus.BAD_REQUEST, "passBase must use a local/private host");
		}

		String configured = effectiveConfiguredPassBase();
		if (!isLoopbackOnlyBaseUrl(configured)) {
			return configured;
		}

		String lan = discoverSiteLocalIpv4Base();
		if (lan != null) {
			return lan;
		}

		return configured;
	}

	private static String stripTrailingSlash(String s) {
		String x = s;
		while (x.endsWith("/")) {
			x = x.substring(0, x.length() - 1);
		}
		return x;
	}

	private static boolean isAllowedClientSuggestedPassBase(URI u) {
		if (u.getScheme() == null
				|| (!"http".equalsIgnoreCase(u.getScheme())
						&& !"https".equalsIgnoreCase(u.getScheme()))) {
			return false;
		}
		String host = u.getHost();
		if (host == null || host.isBlank()) {
			return false;
		}
		try {
			InetAddress addr = InetAddress.getByName(host);
			// Phones on the same LAN, or emulator loopback — block arbitrary internet hosts
			return addr.isLoopbackAddress()
					|| addr.isSiteLocalAddress()
					|| addr.isLinkLocalAddress();
		} catch (Exception e) {
			return false;
		}
	}

	private static boolean isLoopbackOnlyBaseUrl(String base) {
		try {
			URI u = URI.create(base);
			String host = u.getHost();
			if (host == null) {
				return true;
			}
			if ("localhost".equalsIgnoreCase(host)) {
				return true;
			}
			return InetAddress.getByName(host).isLoopbackAddress();
		} catch (Exception e) {
			return true;
		}
	}

	private String discoverSiteLocalIpv4Base() {
		try {
			List<NetworkInterface> physical = new java.util.ArrayList<>();
			List<NetworkInterface> others = new java.util.ArrayList<>();

			Enumeration<NetworkInterface> ifaces = NetworkInterface.getNetworkInterfaces();
			while (ifaces.hasMoreElements()) {
				NetworkInterface nic = ifaces.nextElement();
				if (!nic.isUp() || nic.isLoopback()) continue;

				String display = nic.getDisplayName().toLowerCase();
				if (display.contains("vmware") || display.contains("virtualbox") || display.contains("vbox")
						|| display.contains("wsl") || display.contains("docker") || display.contains("hyper-v")) {
					continue;
				}

				// Prioritize common physical adapter names
				if (display.contains("wi-fi") || display.contains("wifi") || display.contains("ethernet") || display.contains("wlan")) {
					physical.add(nic);
				} else {
					others.add(nic);
				}
			}

			// Try physical adapters first
			for (NetworkInterface nic : physical) {
				String ip = findFirstSiteLocalIpv4(nic);
				if (ip != null) return ip;
			}
			// Fallback to others
			for (NetworkInterface nic : others) {
				String ip = findFirstSiteLocalIpv4(nic);
				if (ip != null) return ip;
			}
		} catch (Exception ignored) {}
		return null;
	}

	private String findFirstSiteLocalIpv4(NetworkInterface nic) {
		for (InterfaceAddress ia : nic.getInterfaceAddresses()) {
			InetAddress a = ia.getAddress();
			if (a instanceof Inet4Address v4 && !v4.isLoopbackAddress() && v4.isSiteLocalAddress()) {
				return "http://" + v4.getHostAddress() + ":" + serverPort;
			}
		}
		return null;
	}

	private String buildPublicBookingPassUrl(String qrToken, String passBaseOverride) {
		return resolvePassBaseForQr(passBaseOverride) + "/api/v1/public/booking-pass/" + qrToken;
	}

	@Transactional(readOnly = true)
	public String qrPayload(Booking b) {
		if (b.getQrToken() == null) {
			return "";
		}
		return "SMARTCAMPUS:" + b.getId() + ":" + b.getQrToken();
	}

	private void authorizeView(AppUser actor, Booking b) {
		if (actor.getRole() == Role.ADMIN) {
			return;
		}
		if (actor.getRole() == Role.TECHNICIAN) {
			return;
		}
		if (!b.getUser().getId().equals(actor.getId())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
		}
	}

	private Booking getEntity(Long id) {
		return bookingRepository
				.findByIdWithDetails(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found"));
	}

	private BookingDto toDto(Booking b) {
		return new BookingDto(
				b.getId(),
				b.getFacility().getId(),
				b.getFacility().getName(),
				b.getUser().getId(),
				b.getUser().getEmail(),
				b.getStartTime(),
				b.getEndTime(),
				b.getPurpose(),
				b.getExpectedAttendees(),
				b.getStatus(),
				b.getAdminReason(),
				b.getQrToken());
	}
}
