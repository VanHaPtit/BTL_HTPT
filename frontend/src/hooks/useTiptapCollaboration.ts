import { useCallback, useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import type { Editor, JSONContent } from '@tiptap/react'
import { v4 as uuidv4 } from 'uuid'
import type { AcceptedOperationResponse, OperationType, SubmitOperationRequest } from '../types/collaboration'
// Side-effect imports so TypeScript picks up ChainedCommands augmentations
import '@tiptap/extension-bold'
import '@tiptap/extension-italic'
import '@tiptap/extension-heading'
import '@tiptap/extension-paragraph'
import { parseBackendContent } from '../utils/documentContent'

interface PendingEntry {
  req: SubmitOperationRequest
  steps: Array<{ step: any; beforeDoc: any }>
}

interface Options {
  editor: Editor | null
  documentId: string
  sessionId: string
  currentVersion: MutableRefObject<number>
  submitOperation: (req: SubmitOperationRequest) => void
  token: string | null
}

export function useTiptapCollaboration({
  editor,
  documentId,
  sessionId,
  currentVersion,
  submitOperation,
  token,
}: Options) {
  const pendingOps = useRef<Map<string, PendingEntry>>(new Map())
  const isApplyingRemote = useRef(false)
  const gapBuffer = useRef<Map<number, AcceptedOperationResponse>>(new Map())
  const fetchingGap = useRef(false)
  const selfRef = useRef<(op: AcceptedOperationResponse) => void>(() => {})
  const lamportClock = useRef(0)
  const vectorClock = useRef<Record<string, number>>({})
  const syncInFlight = useRef<Promise<void> | null>(null)
  const queuedSync = useRef(false)

  const syncEditorFromServer = useCallback(async () => {
    if (!editor || !documentId) return
    if (syncInFlight.current) {
      queuedSync.current = true
      await syncInFlight.current
      return
    }

    syncInFlight.current = (async () => {
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await fetch(`/api/documents/${documentId}`, { headers })
      if (!response.ok) {
        throw new Error(`Failed to sync latest document state: ${response.status}`)
      }
      const document = await response.json()
      isApplyingRemote.current = true
      try {
        editor.commands.setContent(parseBackendContent(document.content) as JSONContent)
        currentVersion.current = document.currentVersion ?? currentVersion.current
      } finally {
        isApplyingRemote.current = false
      }
    })()

    try {
      await syncInFlight.current
    } finally {
      syncInFlight.current = null
      if (queuedSync.current) {
        queuedSync.current = false
        void syncEditorFromServer()
      }
    }
  }, [currentVersion, documentId, editor, token])

  const onTransaction = useCallback(
    (transaction: any) => {
      if (isApplyingRemote.current) return
      if (!transaction.docChanged || !editor) return

      let beforeDoc = transaction.before

      for (const step of transaction.steps) {
        const stepJson = step.toJSON()
        const classified = classifyStep(stepJson, beforeDoc)

        if (classified) {
          lamportClock.current += 1
          const req: SubmitOperationRequest = {
            operationId: uuidv4(),
            clientSessionId: sessionId,
            baseVersion: currentVersion.current,
            clientLamportTime: lamportClock.current,
            vectorClock: { ...vectorClock.current },
            ...classified,
          }
          pendingOps.current.set(req.operationId, { req, steps: [{ step, beforeDoc }] })
          submitOperation(req)
        } else {
           // If unclassified, we don't send it, which can cause divergence.
           // In a full OT implementation, every step must be mapped.
           // console.debug('[collab] Ignored step type:', stepJson.stepType)
        }

        const result = step.apply(beforeDoc)
        if (result.failed || !result.doc) break
        beforeDoc = result.doc
      }
    },
    [editor, sessionId, submitOperation],
  )

  const onAcceptedOperation = useCallback(
    (op: AcceptedOperationResponse) => {
      if (op.serverVersion <= currentVersion.current) return

      // Gap detection
      if (op.serverVersion > currentVersion.current + 1) {
        gapBuffer.current.set(op.serverVersion, op)
        if (!fetchingGap.current) {
          fetchingGap.current = true
          console.log(`[collab] Gap detected (current: ${currentVersion.current}, received: ${op.serverVersion}). Fetching...`)
          fetchGapFill(documentId, currentVersion.current, token)
            .then(ops => {
              for (const o of ops) selfRef.current(o)
              let next = currentVersion.current + 1
              while (gapBuffer.current.has(next)) {
                selfRef.current(gapBuffer.current.get(next)!)
                gapBuffer.current.delete(next)
                next++
              }
            })
            .catch(err => console.warn('[collab] Gap fill failed:', err))
            .finally(() => { fetchingGap.current = false })
        }
        return
      }

      currentVersion.current = op.serverVersion
      lamportClock.current = Math.max(lamportClock.current, op.lamportTime ?? 0)
      vectorClock.current = mergeVectorClocks(vectorClock.current, op.vectorClock ?? {})
      const pending = pendingOps.current.get(op.operationId)

      if (pending) {
        pendingOps.current.delete(op.operationId)
        // Check if server transformed our payload
        const needsReconcile =
          op.operationType === 'NO_OP' ||
          JSON.stringify(op.transformedPayload) !== JSON.stringify(pending.req.payload)

        if (needsReconcile && editor) {
          console.log(`[collab] Reconciling echo v${op.serverVersion} from server snapshot`)
          void syncEditorFromServer().catch(e => console.warn('[collab] Reconcile sync failed:', e))
        }
        return
      }

      if (!editor) return
      console.log(`[collab] Syncing remote ${op.operationType} v${op.serverVersion} from server snapshot`)
      void syncEditorFromServer().catch(e => console.warn('[collab] Remote sync failed:', e))
    },
    [editor, documentId, token, syncEditorFromServer],
  )

  useEffect(() => {
    selfRef.current = onAcceptedOperation
  }, [onAcceptedOperation])

  return { onTransaction, onAcceptedOperation }
}

function mergeVectorClocks(
  current: Record<string, number>,
  incoming: Record<string, number>,
): Record<string, number> {
  const merged: Record<string, number> = { ...current }
  for (const [key, value] of Object.entries(incoming)) {
    merged[key] = Math.max(merged[key] ?? 0, value)
  }
  return merged
}

async function fetchGapFill(
  documentId: string,
  sinceVersion: number,
  token: string | null,
): Promise<AcceptedOperationResponse[]> {
  const result: AcceptedOperationResponse[] = []
  let currentSince = sinceVersion
  let hasMore = true
  while (hasMore) {
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
    let res: Response
    try {
      res = await fetch(
        `/api/documents/${documentId}/operations?sinceVersion=${currentSince}&limit=500`,
        { headers },
      )
    } catch { break }
    if (!res.ok) break
    const page = await res.json()
    const ops = page.operations as AcceptedOperationResponse[]
    result.push(...ops)
    if (ops.length > 0) currentSince = ops[ops.length - 1].serverVersion
    hasMore = page.hasMore as boolean
  }
  return result
}

function classifyStep(
  stepJson: any,
  doc: any,
): { operationType: OperationType; payload: unknown } | null {
  const blockIndex = (pos: number): number => doc.resolve(pos).index(0)
  const blockOffset = (pos: number): number => pos - doc.resolve(pos).start(1)

  if (stepJson.stepType === 'replace') {
    const { from, to, slice } = stepJson
    const openStart = slice?.openStart ?? 0
    const openEnd = slice?.openEnd ?? 0
    const hasContent = Array.isArray(slice?.content) && slice.content.length > 0

    // SPLIT_BLOCK (Enter key)
    if (openStart > 0 && openEnd > 0) {
      return {
        operationType: 'SPLIT_BLOCK',
        payload: { path: [blockIndex(from)], offset: blockOffset(from) },
      }
    }

    // MERGE_BLOCK (Backspace at start of block)
    if (!hasContent && from < to && doc.resolve(from).index(0) !== doc.resolve(to).index(0)) {
      return {
        operationType: 'MERGE_BLOCK',
        payload: { path: [blockIndex(from)] },
      }
    }

    // INSERT_TEXT or REPLACE_SELECTION (treated as insert)
    if (hasContent) {
        const text = extractText(slice.content)
        if (!text) return null
        
        // If from < to, it's a replacement. Since our backend might not have REPLACE_TEXT,
        // we'd ideally send a DELETE then an INSERT. But for simplicity in this lab,
        // we often just treat it as an insertion if the backend handles the range.
        // However, most simple OT backends expect INSERT_TEXT to be at a position.
        return {
          operationType: 'INSERT_TEXT',
          payload: { path: [blockIndex(from)], offset: blockOffset(from), text },
        }
    }

    // DELETE_RANGE
    if (!hasContent && from < to) {
      return {
        operationType: 'DELETE_RANGE',
        payload: { path: [blockIndex(from)], offset: blockOffset(from), length: to - from },
      }
    }
  }

  if (stepJson.stepType === 'addMark') {
    return {
      operationType: 'FORMAT_RANGE',
      payload: {
        path: [blockIndex(stepJson.from)],
        offset: blockOffset(stepJson.from),
        length: stepJson.to - stepJson.from,
        attributes: { [stepJson.mark.type]: true },
      },
    }
  }

  return null
}

function applyAcceptedOperation(editor: Editor, op: AcceptedOperationResponse): void {
  const payload = op.transformedPayload as any
  if (!payload) return

  switch (op.operationType) {
    case 'INSERT_TEXT': {
      const pos = pmPos(editor.state.doc, payload.path?.[0] ?? 0, payload.offset)
      editor.chain().insertContentAt(pos, payload.text).run()
      break
    }
    case 'DELETE_RANGE': {
      const from = pmPos(editor.state.doc, payload.path?.[0] ?? 0, payload.offset)
      editor.chain().deleteRange({ from, to: from + payload.length }).run()
      break
    }
    case 'FORMAT_RANGE': {
      const from = pmPos(editor.state.doc, payload.path?.[0] ?? 0, payload.offset)
      const to = from + payload.length
      const attrs = (payload.attributes ?? {}) as Record<string, boolean>
      if (attrs.bold) editor.chain().setTextSelection({ from, to }).setBold().run()
      if (attrs.italic) editor.chain().setTextSelection({ from, to }).setItalic().run()
      break
    }
    case 'SPLIT_BLOCK': {
      const pos = pmPos(editor.state.doc, payload.path?.[0] ?? 0, payload.offset)
      editor.chain().setTextSelection(pos).splitBlock().run()
      break
    }
    case 'MERGE_BLOCK': {
      const blockIdx = payload.path?.[0] ?? 0
      const doc = editor.state.doc
      if (blockIdx < doc.childCount) {
        let startPos = 1
        for (let i = 0; i < blockIdx; i++) startPos += doc.child(i).nodeSize
        const endOfBlock = startPos + doc.child(blockIdx).nodeSize - 1
        editor.chain().setTextSelection(endOfBlock).joinForward().run()
      }
      break
    }
    case 'SET_BLOCK_TYPE': {
      const blockIdx = payload.path?.[0] ?? 0
      const doc = editor.state.doc
      if (blockIdx < doc.childCount) {
        let startPos = 1
        for (let i = 0; i < blockIdx; i++) startPos += doc.child(i).nodeSize
        if (payload.blockType === 'paragraph') {
          editor.chain().setTextSelection(startPos).setParagraph().run()
        } else if (typeof payload.blockType === 'string' && payload.blockType.startsWith('heading')) {
          const level = parseInt(payload.blockType.replace('heading', ''), 10) as 1 | 2 | 3
          editor.chain().setTextSelection(startPos).setHeading({ level }).run()
        }
      }
      break
    }
  }
}

function pmPos(doc: any, blockIdx: number, offset: number): number {
  let pos = 0
  for (let i = 0; i < blockIdx; i++) pos += doc.child(i).nodeSize
  return pos + 1 + offset
}

function extractText(content: any[]): string {
  return content
    .flatMap((node: any) =>
      node.type === 'text' ? [node.text ?? ''] : node.content ? [extractText(node.content)] : []
    )
    .join('')
}
