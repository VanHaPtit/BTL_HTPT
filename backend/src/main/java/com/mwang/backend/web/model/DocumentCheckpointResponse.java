package com.mwang.backend.web.model;

import java.time.Instant;
import java.util.UUID;

public record DocumentCheckpointResponse(
        UUID id,
        UUID documentId,
        long serverVersion,
        String content,
        Instant createdAt
) {
}
