package com.mwang.backend.collaboration;

import com.mwang.backend.web.model.AcceptedOperationResponse;

import java.util.UUID;

public record AcceptedOperationCommittedEvent(
        UUID outboxId,
        AcceptedOperationResponse response) {
}
