package backend.controller;

import backend.dto.PublicBookingPassView;
import backend.exception.ApiException;
import backend.service.PublicBookingService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.HtmlUtils;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicController {

	private static final String TXT_FILENAME = "smartcampus-checkin.txt";

	private final PublicBookingService publicBookingService;

	@GetMapping("/bookings/verify")
	public Map<String, Object> verifyBooking(@RequestParam String payload) {
		return publicBookingService.verifyPayload(payload);
	}

	/**
	 * Public booking pass: scan the QR (URL with secret token) to verify venue, time, and status without login.
	 */
	@GetMapping(value = "/booking-pass/{token}", produces = MediaType.TEXT_HTML_VALUE)
	public ResponseEntity<String> bookingPass(@PathVariable String token) {
		try {
			PublicBookingPassView v = publicBookingService.getPublicPass(token);
			return ResponseEntity.ok()
					.contentType(MediaType.parseMediaType("text/html;charset=UTF-8"))
					.body(passHtml(v, token));
		} catch (ApiException ex) {
			return ResponseEntity.status(ex.getStatus())
					.contentType(MediaType.parseMediaType("text/html;charset=UTF-8"))
					.body(errorHtml(ex.getMessage()));
		}
	}

	@GetMapping(value = "/booking-pass/{token}/txt", produces = MediaType.TEXT_PLAIN_VALUE)
	public ResponseEntity<String> bookingPassTxt(@PathVariable String token) {
		try {
			PublicBookingPassView v = publicBookingService.getPublicPass(token);
			return ResponseEntity.ok()
					.contentType(MediaType.parseMediaType("text/plain;charset=UTF-8"))
					.body(passTxt(v));
		} catch (ApiException ex) {
			return ResponseEntity.status(ex.getStatus())
					.contentType(MediaType.parseMediaType("text/plain;charset=UTF-8"))
					.body("ERROR: " + ex.getMessage());
		}
	}

	private static String passHtml(PublicBookingPassView v, String token) {
		String venue = esc(v.facilityName());
		String loc = esc(v.location());
		String start = esc(v.startTime().toString());
		String end = esc(v.endTime().toString());
		String status = esc(v.status().name());
		String purpose = v.purpose() != null && !v.purpose().isBlank() ? esc(v.purpose()) : "—";
		return """
				<!DOCTYPE html>
				<html lang="en">
				<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<title>Booking pass</title>
				<style>
				  body{font-family:ui-monospace,Consolas,monospace;margin:1.25rem;background:#0b1220;color:#e2e8f0;line-height:1.5;max-width:32rem;}
				  h1{font-size:1rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#94a3b8;margin:0 0 1rem;}
				  dl{margin:0;}
				  dt{color:#64748b;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;margin-top:.75rem;}
				  dd{margin:.15rem 0 0 0;word-break:break-word;}
				  footer{margin-top:1.5rem;padding-top:1rem;border-top:1px solid #1e293b;font-size:.75rem;color:#64748b;}
				  .btn{display:inline-block;margin-top:1rem;padding:.5rem 1rem;background:#1e293b;color:#e2e8f0;text-decoration:none;border-radius:.25rem;font-size:.75rem;}
				</style>
				</head>
				<body>
				<h1>Smart Campus — booking pass</h1>
				<dl>
				  <dt>Status</dt><dd>%s</dd>
				  <dt>Venue</dt><dd>%s</dd>
				  <dt>Location</dt><dd>%s</dd>
				  <dt>Start (UTC)</dt><dd>%s</dd>
				  <dt>End (UTC)</dt><dd>%s</dd>
				  <dt>Purpose</dt><dd>%s</dd>
				</dl>
				<a href="/api/v1/public/booking-pass/%s/txt" class="btn">View as text file</a>
				<footer>Verification only — no sign-in required. After check-in, this link may no longer work.</footer>
				</body>
				</html>
				"""
				.formatted(status, venue, loc, start, end, purpose, token);
	}

	private static String errorHtml(String message) {
		String m = esc(message != null ? message : "Something went wrong.");
		return """
				<!DOCTYPE html>
				<html lang="en">
				<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<title>Booking pass</title>
				<style>
				  body{font-family:ui-monospace,Consolas,monospace;margin:1.25rem;background:#0b1220;color:#e2e8f0;line-height:1.5;max-width:32rem;}
				  h1{font-size:1rem;font-weight:600;color:#f87171;margin:0 0 .75rem;}
				  p{color:#94a3b8;font-size:.875rem;margin:0;}
				</style>
				</head>
				<body>
				<h1>Pass not available</h1>
				<p>%s</p>
				</body>
				</html>
				"""
				.formatted(m);
	}

	private static String esc(String s) {
		return HtmlUtils.htmlEscape(s, "UTF-8");
	}

	/**
	 * Scanning the booking QR opens this URL: the phone downloads/opens a plain-text receipt (not a localhost web app).
	 */
	@GetMapping(value = "/bookings/verify-receipt.txt", produces = "text/plain;charset=UTF-8")
	public ResponseEntity<String> verifyReceiptTxt(@RequestParam(required = false) String payload) {
		if (payload == null || payload.isBlank()) {
			return txtReceipt(
					HttpStatus.BAD_REQUEST,
					failureBody("Missing ?payload=… (SMARTCAMPUS:bookingId:token)"));
		}
		try {
			Map<String, Object> r = publicBookingService.verifyPayload(payload);
			return txtReceipt(HttpStatus.OK, successBody(r));
		} catch (ApiException ex) {
			return txtReceipt(ex.getStatus(), failureBody(ex.getMessage()));
		}
	}

	private static ResponseEntity<String> txtReceipt(HttpStatus status, String body) {
		return ResponseEntity.status(status)
				.contentType(MediaType.parseMediaType("text/plain;charset=UTF-8"))
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + TXT_FILENAME + "\"")
				.body(body);
	}

	private static String passTxt(PublicBookingPassView v) {
		StringBuilder sb = new StringBuilder();
		sb.append("SMART CAMPUS - BOOKING PASS\n");
		sb.append("============================\n");
		sb.append("STATUS: ").append(v.status()).append('\n');
		sb.append("VENUE: ").append(v.facilityName()).append('\n');
		sb.append("LOCATION: ").append(v.location()).append('\n');
		sb.append("START (UTC): ").append(v.startTime()).append('\n');
		sb.append("END (UTC): ").append(v.endTime()).append('\n');
		if (v.purpose() != null && !v.purpose().isBlank()) {
			sb.append("PURPOSE: ").append(v.purpose()).append('\n');
		}
		sb.append("BOOKING ID: ").append(v.bookingId()).append('\n');
		sb.append("----------------------------\n");
		sb.append("Verification only - no sign-in required.\n");
		return sb.toString();
	}

	private static String successBody(Map<String, Object> r) {
		StringBuilder sb = new StringBuilder();
		sb.append("SMART CAMPUS HUB — BOOKING CHECK-IN\n");
		sb.append("=====================================\n\n");
		sb.append("Result: VALID — check-in recorded\n\n");
		sb.append("Booking ID: ").append(r.get("bookingId")).append("\n");
		sb.append("Resource / facility: ").append(r.get("facilityName")).append("\n");
		sb.append("Start (UTC): ").append(r.get("startTime")).append("\n");
		sb.append("End (UTC): ").append(r.get("endTime")).append("\n");
		sb.append("Requester: ").append(r.get("requesterEmail")).append("\n");
		sb.append("\n---\n");
		sb.append("Keep this file as proof of check-in.\n");
		return sb.toString();
	}

	private static String failureBody(String message) {
		StringBuilder sb = new StringBuilder();
		sb.append("SMART CAMPUS HUB — BOOKING CHECK-IN\n");
		sb.append("=====================================\n\n");
		sb.append("Result: NOT VALID\n\n");
		sb.append("Reason:\n");
		sb.append(message != null ? message : "Unknown error").append("\n");
		return sb.toString();
	}
}
