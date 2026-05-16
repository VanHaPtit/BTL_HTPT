package com.mwang.backend.collaboration;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mwang.backend.domain.CollaborationEventOutbox;
import com.mwang.backend.domain.CollaborationEventOutboxType;
import com.mwang.backend.repositories.CollaborationEventOutboxRepository;
import com.mwang.backend.web.model.AcceptedOperationResponse;
import io.micrometer.core.instrument.Counter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AcceptedOperationOutboxService {

    private final CollaborationEventOutboxRepository outboxRepository;
    private final RedisCollaborationEventPublisher redisCollaborationEventPublisher;
    private final ObjectMapper objectMapper;
    private final int batchSize;
    private final int maxAttempts;
    private final Counter outboxPendingCounter;
    private final Counter outboxPoisonCounter;
    private final Counter redisCircuitOpenCounter;

    public AcceptedOperationOutboxService(
            CollaborationEventOutboxRepository outboxRepository,
            RedisCollaborationEventPublisher redisCollaborationEventPublisher,
            ObjectMapper objectMapper,
            io.micrometer.core.instrument.MeterRegistry meterRegistry,
            @Value("${collaboration.outbox.batch-size:25}") int batchSize,
            @Value("${collaboration.outbox.max-attempts:10}") int maxAttempts) {
        this.outboxRepository = outboxRepository;
        this.redisCollaborationEventPublisher = redisCollaborationEventPublisher;
        this.objectMapper = objectMapper;
        this.batchSize = batchSize;
        this.maxAttempts = maxAttempts;
        this.outboxPendingCounter = meterRegistry.counter("outbox.pending");
        this.outboxPoisonCounter = meterRegistry.counter("outbox.poison");
        this.redisCircuitOpenCounter = meterRegistry.counter("redis.circuit_open");
    }

    @Transactional
    public UUID enqueueAcceptedOperation(AcceptedOperationResponse response) {
        CollaborationEventOutbox record = CollaborationEventOutbox.builder()
                .eventType(CollaborationEventOutboxType.ACCEPTED_OPERATION)
                .documentId(response.documentId())
                .payload(serialize(response))
                .availableAt(Instant.now())
                .attempts(0)
                .build();
        outboxRepository.save(record);
        outboxPendingCounter.increment();
        return record.getId();
    }

    @Transactional
    public void publishPendingNow(UUID outboxId) {
        outboxRepository.findByIdAndPublishedAtIsNull(outboxId)
                .ifPresent(this::publishRecord);
    }

    @Scheduled(fixedDelayString = "${collaboration.outbox.fixed-delay-ms:1000}")
    @Transactional
    public void publishPendingBatch() {
        List<CollaborationEventOutbox> records = outboxRepository.lockNextPendingBatch(
                Instant.now(), maxAttempts, batchSize);
        records.forEach(this::publishRecord);
    }

    private void publishRecord(CollaborationEventOutbox record) {
        try {
            AcceptedOperationResponse response = objectMapper.readValue(
                    record.getPayload(), AcceptedOperationResponse.class);
            redisCollaborationEventPublisher.publishAcceptedOperation(record.getDocumentId(), response);
            record.setPublishedAt(Instant.now());
            record.setLastError(null);
        } catch (Exception exception) {
            record.setAttempts(record.getAttempts() + 1);
            record.setAvailableAt(Instant.now().plusSeconds(Math.min(record.getAttempts() * 2L, 30L)));
            record.setLastError(truncate(exception.getMessage()));
            redisCircuitOpenCounter.increment();
            if (record.getAttempts() >= maxAttempts) {
                outboxPoisonCounter.increment();
            }
        }
    }

    private String serialize(AcceptedOperationResponse response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize accepted operation for outbox", exception);
        }
    }

    private String truncate(String message) {
        if (message == null || message.length() <= 1000) {
            return message;
        }
        return message.substring(0, 1000);
    }
}
