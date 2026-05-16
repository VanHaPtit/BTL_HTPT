import { useEffect, useMemo, useState } from 'react'
import type { RefObject } from 'react'
import type { Editor } from '@tiptap/react'

const COLORS = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#6366f1',
]

interface RemoteCursorPresence {
  sessionId: string
  userId: string
  username: string
  occurredAt: string
  anchor: number
  head: number
}

interface Props {
  editor: Editor | null
  containerRef: RefObject<HTMLDivElement | null>
  presences: RemoteCursorPresence[]
  currentSessionId: string
}

export function RemoteCursorLayer({ editor, containerRef, presences, currentSessionId }: Props) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!editor) return
    const rerender = () => setTick(value => value + 1)
    editor.on('transaction', rerender)
    window.addEventListener('resize', rerender)
    return () => {
      editor.off('transaction', rerender)
      window.removeEventListener('resize', rerender)
    }
  }, [editor])

  const cursors = useMemo(() => {
    if (!editor || !containerRef.current) return []

    const containerRect = containerRef.current.getBoundingClientRect()
    return presences
      .filter(presence => presence.sessionId !== currentSessionId)
      .map((presence, index) => {
        const docSize = editor.state.doc.content.size
        const head = clamp(presence.head ?? presence.anchor ?? 1, 1, Math.max(docSize, 1))
        try {
          const coords = editor.view.coordsAtPos(head)
          return {
            ...presence,
            color: COLORS[index % COLORS.length],
            left: coords.left - containerRect.left,
            top: coords.top - containerRect.top,
          }
        } catch {
          return null
        }
      })
      .filter((cursor): cursor is NonNullable<typeof cursor> => Boolean(cursor))
  }, [containerRef, currentSessionId, editor, presences, tick])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {cursors.map(cursor => (
        <div
          key={`${cursor.sessionId}-${cursor.occurredAt}`}
          className="absolute"
          style={{ left: cursor.left, top: cursor.top }}
        >
          <div className="w-0.5 h-5" style={{ backgroundColor: cursor.color }} />
          <div
            className="mt-1 px-2 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.username}
          </div>
        </div>
      ))}
    </div>
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
