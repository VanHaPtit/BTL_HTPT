package com.mwang.backend.repositories;

import com.mwang.backend.domain.CollaborationEventOutbox;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CollaborationEventOutboxRepository extends JpaRepository<CollaborationEventOutbox, UUID> {

    @Query(value = """
            SELECT *
            FROM collaboration_event_outbox
            WHERE published_at IS NULL
              AND attempts < :maxAttempts
              AND available_at <= :now
            ORDER BY created_at ASC
            LIMIT :batchSize
            FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    List<CollaborationEventOutbox> lockNextPendingBatch(
            @Param("now") Instant now,
            @Param("maxAttempts") int maxAttempts,
            @Param("batchSize") int batchSize);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<CollaborationEventOutbox> findByIdAndPublishedAtIsNull(UUID id);
}
