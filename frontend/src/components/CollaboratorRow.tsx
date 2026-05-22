import type { DocumentCollaborator, Permission } from '../types/document'

const PERMISSIONS: Permission[] = ['READ', 'WRITE']

interface Props {
  collaborator: DocumentCollaborator
  onPermissionChange: (userId: string, permission: Permission) => Promise<void>
  onRemove: (userId: string, username: string) => Promise<void>
}

export function CollaboratorRow({ collaborator: collab, onPermissionChange, onRemove }: Props) {
  async function handlePermissionChange(permission: Permission) {
    try {
      await onPermissionChange(collab.userId, permission)
    } catch {
      alert('Failed to update permission')
    }
  }

  async function handleRemove() {
    if (!confirm(`Remove ${collab.username}?`)) return
    try {
      await onRemove(collab.userId, collab.username)
    } catch {
      alert('Failed to remove collaborator')
    }
  }

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm font-medium">{collab.username}</span>
      <div className="flex items-center gap-3">
        <select
          className="text-sm border rounded px-2 py-1"
          value={collab.permission}
          onChange={e => handlePermissionChange(e.target.value as Permission)}
        >
          {PERMISSIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={handleRemove}
          className="text-xs text-red-500 hover:text-red-700">
          Remove
        </button>
      </div>
    </div>
  )
}
