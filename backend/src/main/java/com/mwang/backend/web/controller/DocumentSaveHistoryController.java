package com.mwang.backend.web.controller;

import com.mwang.backend.domain.Document;
import com.mwang.backend.domain.User;
import com.mwang.backend.repositories.DocumentRepository;
import com.mwang.backend.repositories.DocumentSaveHistoryRepository;
import com.mwang.backend.service.CurrentUserProvider;
import com.mwang.backend.service.DocumentAuthorizationService;
import com.mwang.backend.service.exception.DocumentNotFoundException;
import com.mwang.backend.web.model.DocumentSaveHistoryResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents/{documentId}/save-history")
@RequiredArgsConstructor
public class DocumentSaveHistoryController {

    private final DocumentSaveHistoryRepository saveHistoryRepository;
    private final DocumentRepository documentRepository;
    private final CurrentUserProvider currentUserProvider;
    private final DocumentAuthorizationService documentAuthorizationService;

    @GetMapping
    @Transactional(readOnly = true)
    public List<DocumentSaveHistoryResponse> getSaveHistory(@PathVariable UUID documentId, HttpServletRequest httpRequest) {
        User actor = currentUserProvider.requireCurrentUser(httpRequest);
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException(documentId));
        
        documentAuthorizationService.assertCanRead(document, actor);

        return saveHistoryRepository.findByDocumentIdOrderByCreatedAtDesc(documentId)
                .stream()
                .map(history -> DocumentSaveHistoryResponse.builder()
                        .id(history.getId())
                        .documentId(history.getDocument().getId())
                        .actorId(history.getActor().getId())
                        .actorName(history.getActor().getUsername())
                        .serverVersion(history.getServerVersion())
                        .content(history.getContent())
                        .createdAt(history.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
