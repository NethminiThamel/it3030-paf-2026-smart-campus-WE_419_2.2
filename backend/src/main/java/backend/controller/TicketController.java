package backend.controller;

import backend.domain.TicketHistory;
import backend.domain.TicketPriority;
import backend.domain.TicketStatus;
import backend.dto.CreateCommentRequest;
import backend.dto.CreateTicketRequest;
import backend.dto.TicketCommentDto;
import backend.dto.TicketDto;
import backend.dto.TicketUpdateRequest;
import backend.repository.TicketHistoryRepository;
import backend.service.CurrentUserService;
import backend.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

	private final TicketService ticketService;
	private final CurrentUserService currentUserService;
	private final TicketHistoryRepository ticketHistoryRepository;

	@GetMapping
	public List<TicketDto> list(
			Authentication authentication, @RequestParam(required = false) TicketStatus status) {
		var user = currentUserService.requireUser(authentication);
		return ticketService.listForActor(user, status);
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
	public TicketDto create(
			Authentication authentication,
			@Valid @ModelAttribute CreateTicketRequest req,
			@RequestParam(value = "files", required = false) List<MultipartFile> files) {
		var user = currentUserService.requireUser(authentication);
		return ticketService.create(user, req, files);
	}

	@GetMapping("/{id}")
	public TicketDto get(Authentication authentication, @PathVariable Long id) {
		var user = currentUserService.requireUser(authentication);
		return ticketService.get(user, id);
	}

	@GetMapping("/{id}/history")
	public List<TicketHistoryRecord> history(Authentication authentication, @PathVariable Long id) {
		var user = currentUserService.requireUser(authentication);
		ticketService.get(user, id);
		return ticketHistoryRepository.findByTicketIdOrderByCreatedAtAsc(id).stream()
				.map(TicketHistoryRecord::from)
				.toList();
	}

	public record TicketHistoryRecord(
			Long id, String actorEmail, String action, String detail, java.time.Instant createdAt) {
		static TicketHistoryRecord from(TicketHistory h) {
			return new TicketHistoryRecord(
					h.getId(),
					h.getActor().getEmail(),
					h.getAction(),
					h.getDetail(),
					h.getCreatedAt());
		}
	}

	@PatchMapping("/{id}")
	public TicketDto update(
			Authentication authentication,
			@PathVariable Long id,
			@RequestBody TicketUpdateRequest req) {
		var user = currentUserService.requireUser(authentication);
		return ticketService.update(user, id, req);
	}

	@GetMapping("/{id}/comments")
	public List<TicketCommentDto> comments(Authentication authentication, @PathVariable Long id) {
		var user = currentUserService.requireUser(authentication);
		return ticketService.listComments(user, id);
	}

	@PostMapping("/{id}/comments")
	public TicketCommentDto addComment(
			Authentication authentication,
			@PathVariable Long id,
			@Valid @RequestBody CreateCommentRequest req) {
		var user = currentUserService.requireUser(authentication);
		return ticketService.addComment(user, id, req);
	}

	@PatchMapping("/{id}/comments/{commentId}")
	public TicketCommentDto editComment(
			Authentication authentication,
			@PathVariable Long id,
			@PathVariable Long commentId,
			@Valid @RequestBody CreateCommentRequest req) {
		var user = currentUserService.requireUser(authentication);
		return ticketService.editComment(user, id, commentId, req);
	}

	@DeleteMapping("/{id}/comments/{commentId}")
	public void deleteComment(
			Authentication authentication,
			@PathVariable Long id,
			@PathVariable Long commentId) {
		var user = currentUserService.requireUser(authentication);
		ticketService.deleteComment(user, id, commentId);
	}

	@DeleteMapping("/{id}")
	public void delete(Authentication authentication, @PathVariable Long id) {
		var user = currentUserService.requireUser(authentication);
		ticketService.delete(user, id);
	}
}


