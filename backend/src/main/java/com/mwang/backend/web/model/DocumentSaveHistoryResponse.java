package com.mwang.backend.web.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSaveHistoryResponse {
    private UUID id;
    private UUID documentId;
    private UUID actorId;
    private String actorName;
    private Long serverVersion;
    private String content;
    private Instant createdAt;
}
