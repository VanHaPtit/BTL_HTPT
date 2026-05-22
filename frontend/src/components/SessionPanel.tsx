import { useState } from 'react'
import type { SessionMember } from '../types/collaboration'

interface Props {
  members: SessionMember[]
  currentUserId: string
}

export function SessionPanel({ members, currentUserId }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
        <span>{members.length} online</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-xl">
          {members.map(member => (
            <div key={member.sessionId} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-green-400" />
              <span className="truncate">
                {member.username}
                {member.userId === currentUserId && ' (you)'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
