import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { JSONContent } from '@tiptap/react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { documentsApi } from '../api/documents'
import type { Document } from '../types/document'
import type {
  AcceptedOperationResponse,
  CursorPresencePayload,
  PresenceEvent,
  PresenceType,
  SessionSnapshot,
  SubmitOperationRequest,
} from '../types/collaboration'
import { useCollaboration } from '../hooks/useCollaboration'
import { useTiptapCollaboration } from '../hooks/useTiptapCollaboration'
import { AccessRevokedOverlay } from '../components/AccessRevokedOverlay'
import { OperationHistoryPanel } from '../components/OperationHistoryPanel'
import { PresenceBar } from '../components/PresenceBar'
import { RemoteCursorLayer } from '../components/RemoteCursorLayer'
import { SessionPanel } from '../components/SessionPanel'
import { parseBackendContent, serializeEditorContent } from '../utils/documentContent'

interface RemoteCursorState {
  sessionId: string
  userId: string
  username: string
  occurredAt: string
  anchor: number
  head: number
}

export function EditorPage() {
  const { id: documentId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { addToast } = useToast()
  const [doc, setDoc] = useState<Document | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sessionSnapshot, setSessionSnapshot] = useState<SessionSnapshot | null>(null)
  const [cursorBySession, setCursorBySession] = useState<Record<string, RemoteCursorState>>({})
  const [operationHistory, setOperationHistory] = useState<AcceptedOperationResponse[]>([])
  const [revoked, setRevoked] = useState(false)
  const sessionId = useRef(uuidv4()).current
  const currentVersion = useRef(0)
  const submitOpRef = useRef<(req: SubmitOperationRequest) => void>(() => {})
  const onOperationRef = useRef<(op: AcceptedOperationResponse) => void>(() => {})
  const onAccessRevokedRef = useRef<() => void>(() => {})
  const hasMounted = useRef(false)
  const suppressAutosaveRef = useRef(false)
  const autosaveTimeoutRef = useRef<number | null>(null)
  const editorSurfaceRef = useRef<HTMLDivElement | null>(null)

  const token = user?.token ?? null

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editable: true,
  })

  // Load document and seed editor with stored Tiptap JSON
  useEffect(() => {
    if (!documentId || !editor) return
    let cancelled = false
    documentsApi
      .get(documentId)
      .then(d => {
        if (cancelled) return
        setDoc(d)
        currentVersion.current = d.currentVersion
        
        // Set editable status based on permission
        const canEdit = d.currentUserPermission !== 'READ'
        editor.setEditable(canEdit)

        if (d.content) {
          editor.commands.setContent(parseBackendContent(d.content) as JSONContent)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch document:', err)
        if (!cancelled) {
            const msg = err.response?.data?.message || 'Failed to load document.'
            setError(msg)
        }
      })
    return () => {
      cancelled = true
    }
  }, [documentId, editor])

  useEffect(() => {
    if (!documentId) return
    let cancelled = false
    documentsApi.getOperations(documentId, { sinceVersion: 0, limit: 100 })
      .then(page => {
        if (!cancelled) {
          setOperationHistory(page.operations)
        }
      })
      .catch(err => {
        console.warn('Failed to load operation history:', err)
      })
    return () => {
      cancelled = true
    }
  }, [documentId])

  const syncDocumentFromServer = useCallback(async () => {
    if (!documentId || !editor) return
    const latest = await documentsApi.get(documentId)
    setDoc(latest)
    currentVersion.current = latest.currentVersion
    suppressAutosaveRef.current = true
    try {
      editor.commands.setContent(parseBackendContent(latest.content) as JSONContent)
    } finally {
      window.setTimeout(() => {
        suppressAutosaveRef.current = false
      }, 0)
    }
  }, [documentId, editor])

  const onPresence = useCallback((event: PresenceEvent) => {
    if (event.type === 'CURSOR_POSITION') {
      const payload = event.payload as unknown as CursorPresencePayload | undefined
      const anchor = typeof payload?.anchor === 'number' ? payload.anchor : null
      const head = typeof payload?.head === 'number' ? payload.head : anchor
      if (anchor == null || head == null || event.sessionId === sessionId) {
        return
      }
      setCursorBySession(current => ({
        ...current,
        [event.sessionId]: {
          sessionId: event.sessionId,
          userId: event.userId,
          username: event.username,
          occurredAt: event.occurredAt,
          anchor,
          head,
        },
      }))
      return
    }
    if (event.type === 'DOCUMENT_SYNC' && event.sessionId !== sessionId) {
      void syncDocumentFromServer().catch(error => {
        console.warn('Failed to sync latest document after DOCUMENT_SYNC:', error)
      })
    }
  }, [sessionId, syncDocumentFromServer])

  // Stable callbacks that delegate to refs — prevents useCollaboration from
  // reconnecting when editor-dependent callbacks change identity.
  const stableSubmitOp = useCallback(
    (req: SubmitOperationRequest) => submitOpRef.current(req),
    [],
  )
  const stableOnOperation = useCallback(
    (op: AcceptedOperationResponse) => onOperationRef.current(op),
    [],
  )
  const stableOnAccessRevoked = useCallback(() => onAccessRevokedRef.current(), [])

  const { onTransaction, onAcceptedOperation } = useTiptapCollaboration({
    editor,
    documentId: documentId!,
    sessionId,
    currentVersion,
    submitOperation: stableSubmitOp,
    token,
  })

  const { connected, submitOperation, updatePresence, publishPresence } = useCollaboration({
    documentId: documentId!,
    token,
    sessionId,
    lastServerVersionRef: currentVersion,
    onOperation: stableOnOperation,
    onSession: setSessionSnapshot,
    onPresence,
    onAccessRevoked: stableOnAccessRevoked,
  })

  // Keep refs in sync so stable wrappers always call the latest closures
  useEffect(() => {
    submitOpRef.current = submitOperation
  }, [submitOperation])

  useEffect(() => {
    onOperationRef.current = (op: AcceptedOperationResponse) => {
      setOperationHistory(current => (
        current.some(existing => existing.operationId === op.operationId)
          ? current
          : [...current, op].slice(-200)
      ))
      onAcceptedOperation(op)
    }
  }, [onAcceptedOperation])

  useEffect(() => {
    onAccessRevokedRef.current = () => {
      setRevoked(true)
      editor?.setEditable(false)
      window.setTimeout(() => navigate('/'), 1200)
    }
  }, [editor, navigate])

  // Wire Tiptap transaction events to the operation bridge
  useEffect(() => {
    if (!editor) return
    const handler = ({ transaction }: any) => onTransaction(transaction)
    editor.on('transaction', handler)
    return () => {
      editor.off('transaction', handler)
    }
  }, [editor, onTransaction])

  useEffect(() => {
    setCursorBySession(current => {
      const activeSessionIds = new Set((sessionSnapshot?.sessions ?? []).map(session => session.sessionId))
      return Object.fromEntries(
        Object.entries(current).filter(([sessionId]) => activeSessionIds.has(sessionId)),
      )
    })
  }, [sessionSnapshot])

  useEffect(() => {
    if (!editor || !documentId) return
    let lastPublishedSelection = ''

    const publishCursor = () => {
      const selection = editor.state.selection
      const payload: CursorPresencePayload = {
        anchor: selection.anchor,
        head: selection.head,
      }
      const nextSelectionKey = `${payload.anchor}:${payload.head}`
      if (nextSelectionKey === lastPublishedSelection) {
        return
      }
      lastPublishedSelection = nextSelectionKey
      updatePresence(payload)
    }

    editor.on('selectionUpdate', publishCursor)
    editor.on('focus', publishCursor)
    publishCursor()

    return () => {
      editor.off('selectionUpdate', publishCursor)
      editor.off('focus', publishCursor)
    }
  }, [documentId, editor, updatePresence])

  useEffect(() => {
    if (!editor || !documentId || doc?.currentUserPermission === 'READ') return

    const scheduleAutosave = () => {
      if (suppressAutosaveRef.current) return
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current)
      }
      autosaveTimeoutRef.current = window.setTimeout(async () => {
        if (!doc) return
        try {
          const saved = await documentsApi.update(documentId, {
            title: doc.title,
            visibility: doc.visibility,
            content: serializeEditorContent(editor.getJSON() as JSONContent),
          })
          setDoc(saved)
          currentVersion.current = saved.currentVersion
          publishPresence('DOCUMENT_SYNC' as PresenceType, {
            currentVersion: saved.currentVersion,
            updatedAt: saved.updatedAt,
          })
        } catch (error) {
          console.warn('Autosave failed:', error)
        }
      }, 350)
    }

    editor.on('update', scheduleAutosave)
    return () => {
      editor.off('update', scheduleAutosave)
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current)
        autosaveTimeoutRef.current = null
      }
    }
  }, [doc, documentId, editor, publishPresence])

  async function handleManualSave() {
    if (!editor || !documentId || !doc) return
    try {
      const saved = await documentsApi.update(documentId, {
        title: doc.title,
        visibility: doc.visibility,
        content: serializeEditorContent(editor.getJSON() as JSONContent),
      })
      setDoc(saved)
      addToast('Document saved successfully', 'success')
    } catch (err) {
      console.error('Manual save failed:', err)
      addToast('Failed to save document', 'error')
    }
  }

  // Show connection state toasts
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    if (connected) {
      addToast('Connected', 'success')
    } else {
      addToast('Disconnected - reconnecting...', 'error')
    }
  }, [connected, addToast])

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>
  }

  if (!doc) {
    return <div className="p-8 text-gray-400">Loading...</div>
  }

  const members = sessionSnapshot?.sessions ?? []
  const presenceEvents = Object.values(cursorBySession).filter(cursor =>
    members.some(member => member.sessionId === cursor.sessionId),
  )
  const isOwner = doc.currentUserPermission === 'OWNER'

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f8fafc_32%,_#e2e8f0_100%)]">
      {revoked && <AccessRevokedOverlay />}

      <header className="border-b border-slate-200 bg-slate-50/80 px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="shrink-0 text-sm font-medium text-blue-600 hover:underline">
              &lt;- Docs
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-slate-900 md:text-lg">{doc.title}</h1>
              <p className="text-xs text-slate-500">Version {currentVersion.current}</p>
            </div>
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`}
              title={connected ? 'Connected' : 'Disconnected'}
            />
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <PresenceBar members={members} currentUserId={user?.userId ?? ''} />
              <SessionPanel members={members} currentUserId={user?.userId ?? ''} />
              <OperationHistoryPanel operations={operationHistory} currentUserId={user?.userId ?? ''} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isOwner && (
                <Link
                  to={`/documents/${documentId}/settings`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800"
                >
                  Settings
                </Link>
              )}
              {doc.currentUserPermission !== 'READ' && (
                <button
                  onClick={handleManualSave}
                  className="rounded-full bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  Save
                </button>
              )}
              <button
                onClick={logout}
                className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-500 hover:border-red-300 hover:text-red-600"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
          <div
            ref={editorSurfaceRef}
            className="relative rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)]"
          >
            <RemoteCursorLayer
              editor={editor}
              containerRef={editorSurfaceRef}
              presences={presenceEvents}
              currentSessionId={sessionId}
            />
            <EditorContent
              editor={editor}
              className="prose prose-sm min-h-[32rem] max-w-none px-6 py-8 focus:outline-none md:px-10 md:py-10"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
