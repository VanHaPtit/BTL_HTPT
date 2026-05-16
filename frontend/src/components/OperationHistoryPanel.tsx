import { useState } from 'react'
import type { AcceptedOperationResponse } from '../types/collaboration'

interface Props {
  operations: AcceptedOperationResponse[]
  currentUserId: string
}

export function OperationHistoryPanel({ operations, currentUserId }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(value => !value)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800"
      >
        <span>{operations.length} changes</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
          {operations.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">No changes yet.</div>
          ) : (
            operations
              .slice()
              .reverse()
              .map(operation => (
                <div key={operation.operationId} className="border-b px-4 py-3 last:border-b-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-gray-800">
                      {operation.actorUserId === currentUserId ? 'You' : operation.actorUserId.slice(0, 8)}
                    </span>
                    <span className="text-xs text-gray-400">v{operation.serverVersion}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{operation.operationType}</div>
                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(operation.acceptedAt ?? Date.now()).toLocaleString()}
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  )
}
