package backend.dto;

import backend.domain.Role;

public record UserDto(Long id, String email, String fullName, Role role) {}
