package com.mwang.backend.service;

import com.mwang.backend.domain.User;
import com.mwang.backend.web.model.DocumentCheckpointResponse;

import java.util.Optional;
import java.util.UUID;

public interface DocumentCheckpointQueryService {
    Optional<DocumentCheckpointResponse> getLatestCheckpoint(UUID documentId, User actor);
}
