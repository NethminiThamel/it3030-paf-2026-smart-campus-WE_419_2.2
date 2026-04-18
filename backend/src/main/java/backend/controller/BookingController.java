package backend.controller;

import backend.domain.BookingStatus;
import backend.dto.BookingDecisionRequest;
import backend.dto.BookingDto;
import backend.dto.CreateBookingRequest;
import backend.service.BookingService;
import backend.service.CurrentUserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

	private final BookingService bookingService;
	private final CurrentUserService currentUserService;

	@GetMapping
	public List<BookingDto> list(
			Authentication authentication, @RequestParam(required = false) BookingStatus status) {
		var user = currentUserService.requireUser(authentication);
		return bookingService.listForActor(user, status);
	}

	@PostMapping
	public BookingDto create(
			Authentication authentication, @Valid @RequestBody CreateBookingRequest req) {
		var user = currentUserService.requireUser(authentication);
		return bookingService.create(user, req);
	}

	@GetMapping("/{id}")
	public BookingDto get(Authentication authentication, @PathVariable Long id) {
		var user = currentUserService.requireUser(authentication);
		return bookingService.get(user, id);
	}

	@PatchMapping("/{id}/cancel")
	public void cancel(Authentication authentication, @PathVariable Long id) {
		var user = currentUserService.requireUser(authentication);
		bookingService.cancel(user, id);
	}

	@PatchMapping("/{id}/decision")
	@PreAuthorize("hasRole('ADMIN')")
	public BookingDto decide(
			Authentication authentication,
			@PathVariable Long id,
			@Valid @RequestBody BookingDecisionRequest req) {
		var admin = currentUserService.requireUser(authentication);
		return bookingService.decide(admin, id, req);
	}

	@GetMapping("/{id}/qr")
	public Map<String, String> qrPng(
			Authentication authentication,
			@PathVariable Long id,
			@RequestParam(required = false) String passBase) {
		var user = currentUserService.requireUser(authentication);
		return bookingService.qrImageBase64(user, id, passBase);
	}
}
