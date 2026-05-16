package com.mwang.backend.service;

import com.mwang.backend.repositories.DocumentCheckpointRepository;
import com.mwang.backend.repositories.DocumentRepository;
import com.mwang.backend.service.exception.DocumentNotFoundException;
import com.mwang.backend.domain.User;
import com.mwang.backend.web.model.DocumentCheckpointResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class DocumentCheckpointQueryServiceImpl implements DocumentCheckpointQueryService {

    private final DocumentCheckpointRepository checkpointRepository;
    private final DocumentRepository documentRepository;
    private final DocumentAuthorizationService authorizationService;

    public DocumentCheckpointQueryServiceImpl(
            DocumentCheckpointRepository checkpointRepository,
            DocumentRepository documentRepository,
            DocumentAuthorizationService authorizationService) {
        this.checkpointRepository = checkpointRepository;
        this.documentRepository = documentRepository;
        this.authorizationService = authorizationService;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DocumentCheckpointResponse> getLatestCheckpoint(UUID documentId, User actor) {
        var document = documentRepository.findDetailedById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException(documentId));
        authorizationService.assertCanRead(document, actor);

        return checkpointRepository.findTopByDocumentIdOrderByServerVersionDesc(documentId)
                .map(checkpoint -> new DocumentCheckpointResponse(
                        checkpoint.getId(),
                        documentId,
                        checkpoint.getServerVersion(),
                        checkpoint.getContent(),
                        checkpoint.getCreatedAt()));
    }
}
