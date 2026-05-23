package com.mwang.backend.repositories;

import com.mwang.backend.domain.DocumentSaveHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentSaveHistoryRepository extends JpaRepository<DocumentSaveHistory, UUID> {
    List<DocumentSaveHistory> findByDocumentIdOrderByCreatedAtDesc(UUID documentId);
}
