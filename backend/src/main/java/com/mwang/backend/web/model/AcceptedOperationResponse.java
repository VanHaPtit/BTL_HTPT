package com.mwang.backend.web.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.mwang.backend.domain.DocumentOperationType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AcceptedOperationResponse(
        UUID operationId,
        UUID documentId,
        long serverVersion,
        DocumentOperationType operationType,
        JsonNode transformedPayload,
        UUID actorUserId,
        String clientSessionId,
        Instant acceptedAt,
        long lamportTime,
        Map<String, Long> vectorClock
) {
    public AcceptedOperationResponse(
            UUID operationId,
            UUID documentId,
            long serverVersion,
            DocumentOperationType operationType,
            JsonNode transformedPayload,
            UUID actorUserId,
            String clientSessionId,
            Instant acceptedAt) {
        this(operationId, documentId, serverVersion, operationType, transformedPayload, actorUserId,
                clientSessionId, acceptedAt, 0L, Map.of());
    }

    public AcceptedOperationResponse {
        vectorClock = vectorClock == null ? Map.of() : Map.copyOf(vectorClock);
    }
}
