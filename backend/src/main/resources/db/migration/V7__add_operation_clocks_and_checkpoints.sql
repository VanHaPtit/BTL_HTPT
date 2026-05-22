ALTER TABLE document_operations
    ADD COLUMN lamport_time BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN vector_clock TEXT NULL;

CREATE TABLE document_checkpoints (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    server_version BIGINT NOT NULL,
    content LONGTEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NULL,
    CONSTRAINT fk_document_checkpoints_document
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_document_checkpoints_document_version
    ON document_checkpoints (document_id, server_version);
