package com.mwang.backend.repositories;

import com.mwang.backend.domain.DocumentCheckpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentCheckpointRepository extends JpaRepository<DocumentCheckpoint, UUID> {
    Optional<DocumentCheckpoint> findTopByDocumentIdOrderByServerVersionDesc(UUID documentId);
}
