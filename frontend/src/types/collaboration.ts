export type OperationType =
  | 'INSERT_TEXT'
  | 'DELETE_RANGE'
  | 'FORMAT_RANGE'
  | 'SPLIT_BLOCK'
  | 'MERGE_BLOCK'
  | 'SET_BLOCK_TYPE'
  | 'NO_OP'

export type PresenceType =
  | 'CURSOR_POSITION'
  | 'DOCUMENT_SYNC'
  | 'TYPING'
  | 'IDLE'

export interface SubmitOperationRequest {
  operationId: string
  clientSessionId: string
  baseVersion: number
  operationType: OperationType
  payload: unknown
  clientLamportTime?: number
  vectorClock?: Record<string, number>
}

export interface AcceptedOperationResponse {
  operationId: string
  documentId: string
  actorUserId: string
  clientSessionId: string
  serverVersion: number
  operationType: OperationType
  transformedPayload: unknown
  acceptedAt: string
  lamportTime: number
  vectorClock: Record<string, number>
}

export interface SessionMember {
  sessionId: string
  documentId: string
  userId: string
  username: string
  joinedAt: string
  lastSeenAt: string
}

export interface SessionSnapshot {
  documentId: string
  sessions: SessionMember[]
}

export interface PresenceEvent {
  documentId: string
  sessionId: string
  userId: string
  username: string
  type: PresenceType
  payload: Record<string, unknown>
  occurredAt: string
}

export interface CursorPresencePayload {
  anchor: number
  head: number
}

export interface OperationHistoryPage {
  documentId: string
  sinceVersion: number
  operations: AcceptedOperationResponse[]
  hasMore: boolean
}
