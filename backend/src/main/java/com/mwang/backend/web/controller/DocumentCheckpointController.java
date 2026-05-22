package com.mwang.backend.web.controller;

import com.mwang.backend.domain.User;
import com.mwang.backend.service.DocumentCheckpointQueryService;
import com.mwang.backend.web.model.DocumentCheckpointResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentCheckpointController {

    private final DocumentCheckpointQueryService documentCheckpointQueryService;

    @GetMapping("/{id}/checkpoints/latest")
    public ResponseEntity<DocumentCheckpointResponse> latestCheckpoint(
            @PathVariable UUID id,
            @AuthenticationPrincipal User actor) {
        return documentCheckpointQueryService.getLatestCheckpoint(id, actor)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
