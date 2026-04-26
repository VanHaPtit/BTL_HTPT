import { useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { Client } from '@stomp/stompjs'
import type { StompSubscription } from '@stomp/stompjs'
import type {
  AcceptedOperationResponse,
  PresenceEvent,
  SessionSnapshot,
  SubmitOperationRequest,
} from '../types/collaboration'

interface Options {
  documentId: string
  token: string | null
  sessionId: string
  lastServerVersionRef: MutableRefObject<number>
  onOperation: (op: AcceptedOperationResponse) => void
  onSession: (snapshot: SessionSnapshot) => void
  onPresence: (event: PresenceEvent) => void
  onAccessRevoked: () => void
}

export function useCollaboration({
  documentId,
  token,
  sessionId,
  lastServerVersionRef,
  onOperation,
  onSession,
  onPresence,
  onAccessRevoked,
}: Options) {
  const clientRef = useRef<Client | null>(null)
  const [connected, setConnected] = useState(false)

  const submitOperation = useCallback(
    (req: SubmitOperationRequest) => {
      if (!clientRef.current?.connected) {
        console.warn('[collab] Cannot submit operation: Not connected')
        return
      }
      console.log(`[collab] >>> Submitting ${req.operationType} v${req.baseVersion}`)
      clientRef.current?.publish({
        destination: `/app/documents/${documentId}/operations.submit`,
        body: JSON.stringify(req),
      })
    },
    [documentId],
  )

  const updatePresence = useCallback(
    (data: unknown) => {
      clientRef.current?.publish({
        destination: `/app/documents/${documentId}/presence.update`,
        body: JSON.stringify({ sessionId, type: 'CURSOR', payload: data }),
      })
    },
    [documentId, sessionId],
  )

  useEffect(() => {
    if (!token) return

    const userId = parseUserIdFromToken(token)
    
    // BACKEND ANALYSIS: 
    // WebSocketConfig.java registers endpoint at "/ws" WITHOUT .withSockJS().
    // JwtHandshakeInterceptor.java looks for a query parameter named "token".
    // Therefore, the URL must be EXACTLY "/ws?token=..." without suffixes.
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const brokerURL = `${protocol}//${window.location.host}/ws?token=${token}`

    console.log('[collab] Connecting to Native WebSocket:', brokerURL)

    const client = new Client({
      brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        console.log('[collab] Connected to STOMP broker', frame.headers['server'])
        setConnected(true)
        const subs: StompSubscription[] = []

        // Catchup
        subs.push(
          client.subscribe(`/user/queue/catchup.${documentId}`, msg => {
            const op = JSON.parse(msg.body)
            console.log(`[collab] <<< Catchup op v${op.serverVersion}`)
            onOperation(op)
          }),
        )

        // Session
        subs.push(
          client.subscribe(`/topic/documents/${documentId}/sessions`, msg =>
            onSession(JSON.parse(msg.body)),
          ),
        )

        // Operations
        subs.push(
          client.subscribe(`/topic/documents/${documentId}/operations`, msg => {
            const op = JSON.parse(msg.body)
            console.log(`[collab] <<< Received ${op.operationType} v${op.serverVersion}`)
            onOperation(op)
          }),
        )

        // Presence
        subs.push(
          client.subscribe(`/topic/documents/${documentId}/presence`, msg =>
            onPresence(JSON.parse(msg.body)),
          ),
        )

        if (userId) {
          subs.push(
            client.subscribe(
              `/topic/documents/${documentId}/access/${userId}`,
              () => onAccessRevoked(),
            ),
          )
        }

        // Join session
        client.publish({
          destination: `/app/documents/${documentId}/sessions.join`,
          body: JSON.stringify({ sessionId }),
        })
      },
      onDisconnect: () => {
        console.log('[collab] Disconnected')
        setConnected(false)
      },
      onStompError: (frame) => {
        console.error('[collab] STOMP Error:', frame.headers['message'])
      }
    })

    client.beforeConnect = () => {
      client.connectHeaders = {
        'Authorization': `Bearer ${token}`,
        [`X-Last-Server-Version-${documentId}`]: String(lastServerVersionRef.current),
      }
    }

    clientRef.current = client
    client.activate()

    return () => {
      if (client.connected) {
        client.publish({
          destination: `/app/documents/${documentId}/sessions.leave`,
          body: JSON.stringify({ sessionId }),
        })
      }
      client.deactivate()
      setConnected(false)
      clientRef.current = null
    }
  }, [documentId, token])

  return { connected, submitOperation, updatePresence }
}

function parseUserIdFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return decoded.sub ?? null
  } catch {
    return null
  }
}
