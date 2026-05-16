package com.mwang.backend.collaboration;

import com.mwang.backend.service.CollaborationBroadcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class AcceptedOperationCommittedListener {

    private final CollaborationBroadcastService collaborationBroadcastService;
    private final AcceptedOperationOutboxService acceptedOperationOutboxService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAcceptedOperationCommitted(AcceptedOperationCommittedEvent event) {
        collaborationBroadcastService.broadcastAcceptedOperation(
                event.response().documentId(), event.response());
        acceptedOperationOutboxService.publishPendingNow(event.outboxId());
    }
}
