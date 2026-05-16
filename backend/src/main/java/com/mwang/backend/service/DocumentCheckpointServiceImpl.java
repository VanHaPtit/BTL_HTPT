package com.mwang.backend.service;

import com.mwang.backend.domain.Document;
import com.mwang.backend.domain.DocumentCheckpoint;
import com.mwang.backend.repositories.DocumentCheckpointRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DocumentCheckpointServiceImpl implements DocumentCheckpointService {

    private final DocumentCheckpointRepository checkpointRepository;
    private final int checkpointInterval;

    public DocumentCheckpointServiceImpl(
            DocumentCheckpointRepository checkpointRepository,
            @Value("${collaboration.checkpoint.interval:20}") int checkpointInterval) {
        this.checkpointRepository = checkpointRepository;
        this.checkpointInterval = checkpointInterval;
    }

    @Override
    @Transactional
    public void createCheckpointIfNeeded(Document document, long serverVersion) {
        if (checkpointInterval <= 0 || serverVersion <= 0 || serverVersion % checkpointInterval != 0) {
            return;
        }

        checkpointRepository.findTopByDocumentIdOrderByServerVersionDesc(document.getId())
                .filter(existing -> existing.getServerVersion() == serverVersion)
                .ifPresentOrElse(
                        existing -> { },
                        () -> checkpointRepository.save(DocumentCheckpoint.builder()
                                .document(document)
                                .serverVersion(serverVersion)
                                .content(document.getContent())
                                .build()));
    }
}
