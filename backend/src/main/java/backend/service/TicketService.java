package backend.service;

import backend.domain.AppUser;
import backend.domain.Role;
import backend.domain.Ticket;
import backend.domain.TicketAttachment;
import backend.domain.TicketComment;
import backend.domain.TicketHistory;
import backend.domain.TicketPriority;
import backend.domain.TicketStatus;
import backend.dto.CreateCommentRequest;
import backend.dto.CreateTicketRequest;
import backend.dto.TicketCommentDto;
import backend.dto.TicketDto;
import backend.dto.TicketDto.TicketAttachmentDto;
import backend.dto.TicketUpdateRequest;
import backend.exception.ApiException;
import backend.repository.AppUserRepository;
import backend.repository.FacilityRepository;
import backend.repository.TicketAttachmentRepository;
import backend.repository.TicketCommentRepository;
import backend.repository.TicketHistoryRepository;
import backend.repository.TicketRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class TicketService {

	private final TicketRepository ticketRepository;
	private final FacilityRepository facilityRepository;
	private final AppUserRepository appUserRepository;
	private final TicketAttachmentRepository ticketAttachmentRepository;
	private final TicketCommentRepository ticketCommentRepository;
	private final TicketHistoryRepository ticketHistoryRepository;
	private final FileStorageService fileStorageService;
	private final NotificationService notificationService;

	@Transactional
	public TicketDto create(AppUser reporter, CreateTicketRequest req, List<MultipartFile> files) {
		if (files != null && files.size() > 3) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Maximum 3 attachments");
		}
		var builder =
				Ticket.builder()
						.reporter(reporter)
						.category(req.category())
						.description(req.description())
						.priority(req.priority())
						.contactEmail(req.contactEmail())
						.status(TicketStatus.OPEN)
						.createdAt(Instant.now())
						.updatedAt(Instant.now());
		if (req.facilityId() != null) {
			var fac =
					facilityRepository
							.findById(req.facilityId())
							.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Facility not found"));
			builder.facility(fac);
		}
		Ticket t = ticketRepository.save(builder.build());
		addHistory(t, reporter, "CREATED", "Ticket opened");
		if (files != null) {
			for (MultipartFile f : files) {
				if (f == null || f.isEmpty()) {
					continue;
				}
				try {
					String stored = fileStorageService.store(f);
					TicketAttachment att =
							TicketAttachment.builder()
									.ticket(t)
									.storedFilename(stored)
									.originalFilename(
											f.getOriginalFilename() != null
													? f.getOriginalFilename()
													: "file")
									.contentType(
											f.getContentType() != null
													? f.getContentType()
													: "application/octet-stream")
									.createdAt(Instant.now())
									.build();
					ticketAttachmentRepository.save(att);
				} catch (Exception e) {
					throw new ApiException(HttpStatus.BAD_REQUEST, "Failed to store attachment");
				}
			}
		}
		return loadDto(t.getId());
	}

	@Transactional(readOnly = true)
	public List<TicketDto> listForActor(AppUser actor, TicketStatus status) {
		if (actor.getRole() == Role.ADMIN) {
			return ticketRepository.findAll().stream()
					.filter(x -> status == null || x.getStatus() == status)
					.sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
					.map(t -> loadDto(t.getId()))
					.toList();
		}
		if (actor.getRole() == Role.TECHNICIAN) {
			return ticketRepository.findByAssignedTechnicianIdOrderByUpdatedAtDesc(actor.getId()).stream()
					.filter(x -> status == null || x.getStatus() == status)
					.map(t -> loadDto(t.getId()))
					.toList();
		}
		return ticketRepository.findByReporterIdOrderByUpdatedAtDesc(actor.getId()).stream()
				.filter(x -> status == null || x.getStatus() == status)
				.map(t -> loadDto(t.getId()))
				.toList();
	}

	@Transactional(readOnly = true)
	public TicketDto get(AppUser actor, Long id) {
		Ticket t = getEntity(id);
		authorizeView(actor, t);
		return loadDto(id);
	}

	@Transactional
	public TicketDto update(AppUser actor, Long id, TicketUpdateRequest req) {
		Ticket t = getEntity(id);
		if (actor.getRole() == Role.ADMIN) {
			if (req.assignedTechnicianId() != null) {
				AppUser tech =
						appUserRepository
								.findById(req.assignedTechnicianId())
								.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Technician not found"));
				if (tech.getRole() != Role.TECHNICIAN && tech.getRole() != Role.ADMIN) {
					throw new ApiException(HttpStatus.BAD_REQUEST, "User is not a technician");
				}
				t.setAssignedTechnician(tech);
				notificationService.notifyUser(
						tech,
						"TICKET_ASSIGNED",
						"Ticket assigned",
						"Ticket #" + t.getId() + " was assigned to you.",
						"TICKET",
						t.getId());
				addHistory(t, actor, "ASSIGNED", "Assigned to " + tech.getEmail());
				if (t.getStatus() == TicketStatus.OPEN && req.status() == null) {
					t.setStatus(TicketStatus.IN_PROGRESS);
					addHistory(t, actor, "STATUS", "IN_PROGRESS");
					notifyReporter(t, "TICKET_UPDATE", "Ticket in progress", "A technician was assigned.");
				}
			}
			if (req.status() != null) {
				applyStatusTransition(t, req.status(), req.rejectReason(), actor);
			}
		} else if (actor.getRole() == Role.TECHNICIAN) {
			if (t.getAssignedTechnician() == null
					|| !t.getAssignedTechnician().getId().equals(actor.getId())) {
				throw new ApiException(HttpStatus.FORBIDDEN, "Not assigned to you");
			}
			if (req.status() != null) {
				technicianStatusUpdate(t, req.status(), req.resolutionNote(), actor);
			}
		} else {
			throw new ApiException(HttpStatus.FORBIDDEN, "Insufficient permissions");
		}
		t.setUpdatedAt(Instant.now());
		return loadDto(id);
	}

	private void technicianStatusUpdate(
			Ticket t, TicketStatus newStatus, String note, AppUser actor) {
		if (newStatus == TicketStatus.REJECTED) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Technicians cannot reject");
		}
		if (newStatus == TicketStatus.IN_PROGRESS
				|| newStatus == TicketStatus.RESOLVED
				|| newStatus == TicketStatus.CLOSED) {
			t.setStatus(newStatus);
			addHistory(t, actor, "STATUS", newStatus.name() + (note != null ? (": " + note) : ""));
			notifyReporter(t, "TICKET_UPDATE", "Ticket updated", "Status: " + newStatus.name());
		}
	}

	private void applyStatusTransition(
			Ticket t, TicketStatus newStatus, String rejectReason, AppUser admin) {
		if (newStatus == TicketStatus.REJECTED) {
			t.setStatus(TicketStatus.REJECTED);
			t.setRejectReason(rejectReason);
			addHistory(t, admin, "REJECTED", rejectReason);
			notifyReporter(t, "TICKET_REJECTED", "Ticket rejected", rejectReason != null ? rejectReason : "");
		} else {
			t.setStatus(newStatus);
			// If admin previously rejected and later moves the ticket forward, clear the old reason.
			t.setRejectReason(null);
			addHistory(t, admin, "STATUS", newStatus.name());
			notifyReporter(t, "TICKET_UPDATE", "Ticket updated", "Status: " + newStatus.name());
		}
		if (t.getAssignedTechnician() != null) {
			notificationService.notifyUser(
					t.getAssignedTechnician(),
					"TICKET_UPDATE",
					"Ticket status changed",
					"Ticket #" + t.getId() + " is now " + newStatus,
					"TICKET",
					t.getId());
		}
	}

	private void notifyReporter(Ticket t, String type, String title, String msg) {
		notificationService.notifyUser(t.getReporter(), type, title, msg, "TICKET", t.getId());
	}

	@Transactional
	public TicketCommentDto addComment(AppUser actor, Long ticketId, CreateCommentRequest req) {
		Ticket t = getEntity(ticketId);
		authorizeComment(actor, t);
		TicketComment c =
				TicketComment.builder()
						.ticket(t)
						.user(actor)
						.body(req.body())
						.createdAt(Instant.now())
						.build();
		c = ticketCommentRepository.save(c);
		addHistory(t, actor, "COMMENT", "Comment added");
		for (var u : List.of(t.getReporter(), t.getAssignedTechnician())) {
			if (u != null && !u.getId().equals(actor.getId())) {
				notificationService.notifyUser(
						u,
						"TICKET_COMMENT",
						"New comment on ticket #" + t.getId(),
						req.body().length() > 120 ? req.body().substring(0, 120) + "…" : req.body(),
						"TICKET",
						t.getId());
			}
		}
		return toCommentDto(c);
	}

	@Transactional(readOnly = true)
	public List<TicketCommentDto> listComments(AppUser actor, Long ticketId) {
		Ticket t = getEntity(ticketId);
		authorizeView(actor, t);
		return ticketCommentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
				.map(this::toCommentDto)
				.toList();
	}

	@Transactional
	public TicketCommentDto editComment(AppUser actor, Long ticketId, Long commentId, CreateCommentRequest req) {
		Ticket t = getEntity(ticketId);
		authorizeView(actor, t);
		TicketComment c =
				ticketCommentRepository
						.findById(commentId)
						.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comment not found"));
		if (!c.getTicket().getId().equals(ticketId)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Comment mismatch");
		}
		if (!c.getUser().getId().equals(actor.getId()) && actor.getRole() != Role.ADMIN) {
			throw new ApiException(HttpStatus.FORBIDDEN, "Can only edit own comments");
		}
		c.setBody(req.body());
		c.setEditedAt(Instant.now());
		return toCommentDto(c);
	}

	@Transactional
	public void deleteComment(AppUser actor, Long ticketId, Long commentId) {
		Ticket t = getEntity(ticketId);
		authorizeView(actor, t);
		TicketComment c =
				ticketCommentRepository
						.findById(commentId)
						.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comment not found"));
		if (!c.getTicket().getId().equals(ticketId)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Comment mismatch");
		}
		if (!c.getUser().getId().equals(actor.getId()) && actor.getRole() != Role.ADMIN) {
			throw new ApiException(HttpStatus.FORBIDDEN, "Can only delete own comments");
		}
		ticketCommentRepository.delete(c);
	}

	private void authorizeComment(AppUser actor, Ticket t) {
		if (actor.getRole() == Role.ADMIN || actor.getRole() == Role.TECHNICIAN) {
			if (actor.getRole() == Role.TECHNICIAN
					&& (t.getAssignedTechnician() == null
							|| !t.getAssignedTechnician().getId().equals(actor.getId()))) {
				throw new ApiException(HttpStatus.FORBIDDEN, "Not assigned to this ticket");
			}
			return;
		}
		if (!t.getReporter().getId().equals(actor.getId())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
		}
	}

	private void authorizeView(AppUser actor, Ticket t) {
		if (actor.getRole() == Role.ADMIN) {
			return;
		}
		if (actor.getRole() == Role.TECHNICIAN
				&& t.getAssignedTechnician() != null
				&& t.getAssignedTechnician().getId().equals(actor.getId())) {
			return;
		}
		if (t.getReporter().getId().equals(actor.getId())) {
			return;
		}
		throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
	}

	private void addHistory(Ticket t, AppUser actor, String action, String detail) {
		TicketHistory h =
				TicketHistory.builder()
						.ticket(t)
						.actor(actor)
						.action(action)
						.detail(detail)
						.createdAt(Instant.now())
						.build();
		ticketHistoryRepository.save(h);
	}

	private Ticket getEntity(Long id) {
		return ticketRepository
				.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
	}

	private TicketDto loadDto(Long id) {
		Ticket t = getEntity(id);
		var atts =
				ticketAttachmentRepository.findByTicketId(id).stream()
						.map(
								a ->
										new TicketAttachmentDto(
												a.getId(),
												a.getStoredFilename(),
												a.getOriginalFilename(),
												a.getContentType()))
						.toList();
		long cc = ticketCommentRepository.findByTicketIdOrderByCreatedAtAsc(id).size();
		return new TicketDto(
				t.getId(),
				t.getReporter().getId(),
				t.getReporter().getEmail(),
				t.getFacility() != null ? t.getFacility().getId() : null,
				t.getFacility() != null ? t.getFacility().getName() : null,
				t.getCategory(),
				t.getDescription(),
				t.getPriority(),
				t.getContactEmail(),
				t.getStatus(),
				t.getAssignedTechnician() != null ? t.getAssignedTechnician().getId() : null,
				t.getAssignedTechnician() != null ? t.getAssignedTechnician().getEmail() : null,
				t.getRejectReason(),
				t.getCreatedAt(),
				t.getUpdatedAt(),
				atts,
				(int) cc);
	}

	private TicketCommentDto toCommentDto(TicketComment c) {
		return new TicketCommentDto(
				c.getId(),
				c.getUser().getId(),
				c.getUser().getEmail(),
				c.getBody(),
				c.getCreatedAt(),
				c.getEditedAt());
	}
}

