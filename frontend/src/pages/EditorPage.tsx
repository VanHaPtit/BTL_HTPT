import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { documentsApi } from '../api/documents'
import type { Document } from '../types/document'
import type { AcceptedOperationResponse, SessionSnapshot, SubmitOperationRequest } from '../types/collaboration'
import { useCollaboration } from '../hooks/useCollaboration'
import { useTiptapCollaboration } from '../hooks/useTiptapCollaboration'
import { AccessRevokedOverlay } from '../components/AccessRevokedOverlay'
import { PresenceBar } from '../components/PresenceBar'
import { SessionPanel } from '../components/SessionPanel'

export function EditorPage() {
  const { id: documentId } = useParams<{ id: string }>()
  const { user, logout } = useAuth()
  const { addToast } = useToast()
  const [doc, setDoc] = useState<Document | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sessionSnapshot, setSessionSnapshot] = useState<SessionSnapshot | null>(null)
  const [revoked, setRevoked] = useState(false)
  const sessionId = useRef(uuidv4()).current
  const currentVersion = useRef(0)
  const submitOpRef = useRef<(req: SubmitOperationRequest) => void>(() => {})
  const onOperationRef = useRef<(op: AcceptedOperationResponse) => void>(() => {})
  const onAccessRevokedRef = useRef<() => void>(() => {})
  const hasMounted = useRef(false)

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
          try {
            editor.commands.setContent(JSON.parse(d.content))
          } catch {
            editor.commands.setContent(d.content)
          }
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

  const onPresence = useCallback(() => {}, [])

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

  const { connected, submitOperation } = useCollaboration({
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
    onOperationRef.current = onAcceptedOperation
  }, [onAcceptedOperation])

  useEffect(() => {
    onAccessRevokedRef.current = () => {
      setRevoked(true)
      editor?.setEditable(false)
    }
  }, [editor])

  // Wire Tiptap transaction events to the operation bridge
  useEffect(() => {
    if (!editor) return
    const handler = ({ transaction }: any) => onTransaction(transaction)
    editor.on('transaction', handler)
    return () => {
      editor.off('transaction', handler)
    }
  }, [editor, onTransaction])

  async function handleManualSave() {
    if (!editor || !documentId || !doc) return
    try {
      const content = JSON.stringify(editor.getJSON())
      await documentsApi.update(documentId, {
        title: doc.title,
        visibility: doc.visibility,
        content
      })
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
  const isOwner = doc.currentUserPermission === 'OWNER'

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {revoked && <AccessRevokedOverlay />}

      <header className="border-b px-6 py-3 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-blue-600 hover:underline">
            &lt;- Docs
          </Link>
          <h1 className="text-base font-semibold truncate max-w-xs">{doc.title}</h1>
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`}
            title={connected ? 'Connected' : 'Disconnected'}
          />
        </div>
        <div className="flex items-center gap-4">
          <PresenceBar members={members} currentUserId={user?.userId ?? ''} />
          <SessionPanel members={members} currentUserId={user?.userId ?? ''} />
          {isOwner && (
            <Link
              to={`/documents/${documentId}/settings`}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Settings
            </Link>
          )}
          {doc.currentUserPermission !== 'READ' && (
            <button
              onClick={handleManualSave}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
            >
              Save
            </button>
          )}
          <button onClick={logout} className="text-sm text-red-500 hover:underline">
            Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none focus:outline-none min-h-96"
          />
        </div>
      </div>
    </div>
  )
}
