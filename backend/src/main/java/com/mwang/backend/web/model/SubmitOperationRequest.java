package com.mwang.backend.web.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.mwang.backend.domain.DocumentOperationType;
import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

public record SubmitOperationRequest(
        @NotNull UUID operationId,
        @NotNull Long baseVersion,
        @NotNull DocumentOperationType operationType,
        @NotNull JsonNode payload,
        Long clientLamportTime,
        Map<String, Long> vectorClock
) {
    public SubmitOperationRequest(UUID operationId, Long baseVersion, DocumentOperationType operationType, JsonNode payload) {
        this(operationId, baseVersion, operationType, payload, null, null);
    }

    public SubmitOperationRequest {
        vectorClock = vectorClock == null ? Map.of() : Map.copyOf(vectorClock);
    }
}
