import type { SessionMember } from '../types/collaboration'

const COLORS = [
  'bg-red-400',
  'bg-blue-400',
  'bg-green-400',
  'bg-yellow-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-indigo-400',
  'bg-teal-400',
]

interface Props {
  members: SessionMember[]
  currentUserId: string
}

export function PresenceBar({ members, currentUserId }: Props) {
  const visibleMembers = members.slice(0, 4)
  const overflowCount = members.length - visibleMembers.length

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {visibleMembers.map((m, i) => (
        <div
          key={m.sessionId}
          title={m.username + (m.userId === currentUserId ? ' (you)' : '')}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${COLORS[i % COLORS.length]}${m.userId === currentUserId ? ' ring-2 ring-offset-1 ring-gray-400' : ''}`}
        >
          {(m.username[0] ?? '?').toUpperCase()}
        </div>
      ))}
      {overflowCount > 0 && (
        <div className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 px-2 text-xs font-semibold text-slate-700">
          +{overflowCount}
        </div>
      )}
    </div>
  )
}
