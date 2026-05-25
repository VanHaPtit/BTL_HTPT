import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import type { JSONContent } from '@tiptap/react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { apiClient } from '../api/client'
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
import { Sidebar } from '../components/Sidebar'
import { RemoteCursorLayer } from '../components/RemoteCursorLayer'
import { SaveHistoryModal } from '../components/SaveHistoryModal'
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
  const [showSaveHistory, setShowSaveHistory] = useState(false)
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const token = user?.token ?? null

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: '',
    editable: true,
  })

  // Load document and seed editor with stored Tiptap JSON
  useEffect(() => {
    if (!documentId || !editor) return
    let cancelled = false
    documentsApi
      .get(documentId)
      .then((d: any) => {
        if (cancelled) return
        setDoc(d)
        currentVersion.current = d.currentVersion
        
        // Set editable status based on permission
        const canEdit = d.currentUserPermission !== 'READ'
        editor.setEditable(canEdit)

        // Always set content so even empty docs are initialized with the default paragraph
        editor.commands.setContent(parseBackendContent(d.content) as JSONContent)
      })
      .catch((err: any) => {
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
      .then((page: any) => {
        if (!cancelled) {
          setOperationHistory(page.operations)
        }
      })
      .catch((err: any) => {
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

  // Autosave has been removed. History is only recorded when the user explicitly clicks Save.


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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      // addToast('Uploading image...', 'success') // could add a toast here
      const { data: url } = await apiClient.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      editor.chain().focus().setImage({ src: url }).run()
      addToast('Image uploaded successfully', 'success')
    } catch (err) {
      console.error('Upload failed:', err)
      addToast('Failed to upload image', 'error')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
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
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans">
      {revoked && <AccessRevokedOverlay />}
      {showSaveHistory && <SaveHistoryModal documentId={documentId!} onClose={() => setShowSaveHistory(false)} />}

      {/* Sidebar */}
      <Sidebar
        documentId={documentId}
        isOwner={isOwner}
        onHistoryClick={() => setShowSaveHistory(true)}
        activeEditorTab="editor"
        onCreateNew={() => navigate('/')}
      />

      {/* Main Column */}
      <main className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-400 hover:text-slate-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </Link>
            <div>
              <h1 className="text-[15px] font-semibold text-slate-900 leading-tight">{doc.title}</h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>Version {currentVersion.current}</span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-[#3b82f6] font-medium">
                  <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-[#3b82f6]' : 'bg-slate-300'}`}></span>
                  {connected ? '1 online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 pl-2">
              <div className="flex flex-col items-end">
                <span className="text-[13px] font-semibold text-slate-900 leading-none mb-1">{user?.username || 'Hale'}</span>
                <span className="text-[9px] font-bold text-indigo-600 uppercase leading-none">Free Plan Upgrade</span>
              </div>
              <button onClick={logout} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e293b] text-sm font-semibold text-white">
                {(user?.username || 'H').charAt(0).toUpperCase()}
              </button>
            </div>
          </div>
        </header>

        {/* Editor Area Wrapper */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] relative pb-20">
          
          {/* Floating Toolbar */}
          <div className="sticky top-6 z-20 mx-auto flex w-fit items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-1 pr-3">
              <button 
                onClick={() => editor?.chain().focus().toggleBold().run()} 
                className={`flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 ${editor?.isActive('bold') ? 'bg-slate-100 text-slate-900' : 'text-slate-800'}`}
              >
                <span className="font-bold">B</span>
              </button>
              <button 
                onClick={() => editor?.chain().focus().toggleItalic().run()} 
                className={`flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 italic font-serif ${editor?.isActive('italic') ? 'bg-slate-100 text-slate-900' : 'text-slate-800'}`}
              >
                I
              </button>
              <button 
                className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 text-slate-800 font-semibold underline"
              >
                U
              </button>
            </div>
            
            <div className="h-5 w-px bg-slate-200"></div>
            
            <div className="flex items-center gap-1 px-3">
              <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 text-slate-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="15" y1="12" x2="3" y2="12"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>
              </button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()} className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 text-slate-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 text-slate-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="3" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 text-slate-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              </button>
            </div>

            <div className="h-5 w-px bg-slate-200"></div>
            
            <div className="flex items-center gap-4 pl-3 pr-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6366f1]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                {operationHistory.length} changes
              </div>
              
              {doc.currentUserPermission !== 'READ' && (
                <button
                  onClick={handleManualSave}
                  className="rounded-lg bg-[#1e293b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-900 transition-colors"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>

          {/* Document Surface */}
          <div className="mx-auto mt-8 max-w-[850px] px-4 md:px-0">
            <div ref={editorSurfaceRef} className="relative rounded-xl bg-white px-10 py-16 shadow-[0_2px_10px_rgba(0,0,0,0.02)] min-h-[850px]">
              
              {/* Document Header inside paper */}
              <div className="mb-8 pl-4">
                <h1 className="text-3xl font-bold text-slate-900 mb-6">{doc.title}</h1>
              </div>

              {/* Editor Content */}
              <RemoteCursorLayer
                editor={editor}
                containerRef={editorSurfaceRef}
                presences={presenceEvents}
                currentSessionId={sessionId}
              />
              <div className="pl-4">
                <EditorContent
                  editor={editor}
                  className="prose prose-slate max-w-none focus:outline-none prose-headings:font-bold prose-a:text-indigo-600"
                />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
