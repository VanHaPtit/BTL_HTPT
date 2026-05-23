package com.mwang.backend.web.model;

import com.mwang.backend.domain.UserStatus;

import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String username,
        String email,
        String firstName,
        String lastName,
        UserStatus status
) {
}
