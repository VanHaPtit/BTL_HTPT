CREATE TABLE collaboration_event_outbox (
    id VARCHAR(36) PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    document_id VARCHAR(36) NOT NULL,
    payload TEXT NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    available_at TIMESTAMP NOT NULL,
    published_at TIMESTAMP NULL,
    last_error VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NULL
);

CREATE INDEX idx_collab_outbox_pending
    ON collaboration_event_outbox (published_at, available_at, attempts, created_at);

CREATE INDEX idx_collab_outbox_document_id
    ON collaboration_event_outbox (document_id);
