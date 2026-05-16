package com.mwang.backend.collaboration;

import com.mwang.backend.domain.DocumentOperationType;
import com.mwang.backend.service.CollaborationBroadcastService;
import com.mwang.backend.web.model.AcceptedOperationResponse;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class AcceptedOperationCommittedListenerTest {

    @Test
    void onAcceptedOperationCommitted_broadcastsLocallyAndTriggersOutboxPublish() {
        CollaborationBroadcastService broadcastService = mock(CollaborationBroadcastService.class);
        AcceptedOperationOutboxService outboxService = mock(AcceptedOperationOutboxService.class);
        AcceptedOperationCommittedListener listener =
                new AcceptedOperationCommittedListener(broadcastService, outboxService);

        UUID documentId = UUID.randomUUID();
        UUID outboxId = UUID.randomUUID();
        AcceptedOperationResponse response = new AcceptedOperationResponse(
                UUID.randomUUID(), documentId, 1L,
                DocumentOperationType.INSERT_TEXT, null,
                UUID.randomUUID(), "session-1", Instant.now()
        );

        listener.onAcceptedOperationCommitted(new AcceptedOperationCommittedEvent(outboxId, response));

        verify(broadcastService).broadcastAcceptedOperation(documentId, response);
        verify(outboxService).publishPendingNow(outboxId);
    }
}
