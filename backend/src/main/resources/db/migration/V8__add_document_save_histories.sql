CREATE TABLE document_save_histories (
    id VARCHAR(36) NOT NULL,
    document_id VARCHAR(36) NOT NULL,
    actor_id VARCHAR(36) NOT NULL,
    content LONGTEXT NOT NULL,
    server_version BIGINT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_save_history_document FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
    CONSTRAINT fk_save_history_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE CASCADE
);
