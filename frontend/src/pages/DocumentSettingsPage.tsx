import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { documentsApi } from '../api/documents'
import { collaboratorsApi } from '../api/collaborators'
import type { Document, DocumentCollaborator, Permission, Visibility } from '../types/document'
import { CollaboratorRow } from '../components/CollaboratorRow'
import { UserSearchCombobox } from '../components/UserSearchCombobox'
import type { UserSummary } from '../api/users'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Sidebar } from '../components/Sidebar'

export function DocumentSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { addToast } = useToast()
  const [doc, setDoc] = useState<Document | null>(null)
  const [collaborators, setCollaborators] = useState<DocumentCollaborator[]>([])
  const [title, setTitle] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('PRIVATE')
  const [saving, setSaving] = useState(false)
  const [addPermission, setAddPermission] = useState<Permission>('READ')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchDoc = useCallback(async () => {
    const d = await documentsApi.get(id!)
    setDoc(d)
    setTitle(d.title)
    setVisibility(d.visibility)
    setCollaborators(d.collaborators)
  }, [id])

  useEffect(() => { fetchDoc() }, [fetchDoc])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await documentsApi.update(id!, { title, visibility })
      setDoc(updated)
      setTitle(updated.title)
      setVisibility(updated.visibility)
      setCollaborators(updated.collaborators)
      setSuccess('Settings saved')
    } catch {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddCollaborator(user: UserSummary) {
    setError(null)
    setSuccess(null)
    if (doc?.visibility !== 'SHARED') {
      setError('Switch the document visibility to SHARED and save before inviting collaborators.')
      return
    }
    try {
      await collaboratorsApi.add(id!, user.userId, addPermission)
      await fetchDoc()
      setSuccess(`Added ${user.username}`)
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (code === 'COLLABORATOR_ALREADY_EXISTS') setError(`${user.username} is already a collaborator`)
      else if (code === 'INVALID_COLLABORATION_REQUEST') {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setError(msg ?? 'Collaborators can only be invited when the document is SHARED')
      }
      else setError('Failed to add collaborator')
    }
  }

  async function handleCollaboratorPermissionChange(userId: string, permission: Permission) {
    setError(null)
    setSuccess(null)
    await collaboratorsApi.update(id!, userId, permission)
    setCollaborators(current =>
      current.map(collaborator =>
        collaborator.userId === userId ? { ...collaborator, permission } : collaborator,
      ),
    )
    setSuccess('Collaborator updated')
  }

  async function handleCollaboratorRemove(userId: string, username: string) {
    setError(null)
    setSuccess(null)
    await collaboratorsApi.remove(id!, userId)
    setCollaborators(current => current.filter(collaborator => collaborator.userId !== userId))
    setDoc(current => current
      ? { ...current, collaborators: current.collaborators.filter(collaborator => collaborator.userId !== userId) }
      : current)
    setSuccess(`Removed ${username}`)
  }

  async function handleDeleteDocument() {
    if (!doc) return
    if (!confirm(`Delete "${doc.title}"? This action cannot be undone.`)) return
    setDeleting(true)
    setError(null)
    setSuccess(null)
    try {
      await documentsApi.delete(doc.id)
      addToast('Document deleted', 'success')
      navigate('/')
    } catch {
      setError('Failed to delete document')
    } finally {
      setDeleting(false)
    }
  }

  if (!doc) return <div className="p-8 text-gray-400">Loading…</div>

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans overflow-hidden">
      <Sidebar
        documentId={id}
        isOwner={doc.currentUserPermission === 'OWNER'}
        onCreateNew={() => navigate('/')}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/documents/${id}`)} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
              &larr; Back to Editor
            </button>
            <h1 className="text-lg font-bold text-slate-800 truncate">{doc.title} - Settings</h1>
          </div>
          <button onClick={logout} className="text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
            Sign out
          </button>
        </header>

        <main className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 md:px-6 py-6 md:py-8 space-y-8">
        {doc.currentUserPermission === 'OWNER' && (
          <section>
            <h2 className="text-sm font-semibold uppercase text-gray-500 mb-3">Document</h2>
            <div className="bg-white border rounded-lg p-4 space-y-4">
              {success && <p className="text-xs text-green-600">{success}</p>}
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input className="w-full border rounded px-3 py-2 text-sm"
                  value={title} onChange={e => setTitle(e.target.value)} maxLength={255} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Visibility</label>
                <select className="border rounded px-3 py-2 text-sm"
                  value={visibility} onChange={e => setVisibility(e.target.value as Visibility)}>
                  <option value="PRIVATE">Private</option>
                  <option value="SHARED">Shared</option>
                  <option value="PUBLIC">Public</option>
                </select>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </section>
        )}

        {doc.currentUserPermission === 'OWNER' && doc.visibility !== 'PUBLIC' && (
          <section>
            <h2 className="text-sm font-semibold uppercase text-gray-500 mb-3">Collaborators</h2>
            <div className="bg-white border rounded-lg p-4">
              {success && <p className="text-xs text-green-600 mb-2">{success}</p>}
              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
              {collaborators.length === 0 ? (
                <p className="text-sm text-gray-400 mb-4">No collaborators yet</p>
              ) : (
                <div className="mb-4">
                  {collaborators.map(c => (
                    <CollaboratorRow
                      key={c.userId}
                      collaborator={c}
                      onPermissionChange={handleCollaboratorPermissionChange}
                      onRemove={handleCollaboratorRemove}
                    />
                  ))}
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Add collaborator</p>
                {doc.visibility !== 'SHARED' && (
                  <p className="text-xs text-amber-600 mb-2">
                    Set visibility to <span className="font-semibold">SHARED</span> and save before inviting collaborators.
                  </p>
                )}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <UserSearchCombobox
                      onSelect={handleAddCollaborator}
                      disabled={doc.visibility !== 'SHARED'}
                      placeholder="Search by username or email..." />
                  </div>
                  <select className="border rounded px-2 py-2 text-sm"
                    value={addPermission}
                    disabled={doc.visibility !== 'SHARED'}
                    onChange={e => setAddPermission(e.target.value as Permission)}>
                    <option value="READ">READ</option>
                    <option value="WRITE">WRITE</option>
                  </select>
                </div>
              </div>
            </div>
          </section>
        )}

        {doc.currentUserPermission === 'OWNER' && doc.visibility === 'PUBLIC' && (
          <section>
            <h2 className="text-sm font-semibold uppercase text-gray-500 mb-3">Collaborators</h2>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-500">
                Public documents do not use collaborator invites because any user can access them.
              </p>
            </div>
          </section>
        )}

        {doc.currentUserPermission === 'OWNER' && (
          <section>
            <h2 className="text-sm font-semibold uppercase text-red-500 mb-3">Danger Zone</h2>
            <div className="bg-white border border-red-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-600">
                Delete this document permanently. This action cannot be undone.
              </p>
              <button
                onClick={handleDeleteDocument}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete document'}
              </button>
            </div>
          </section>
        )}

        {doc.currentUserPermission !== 'OWNER' && (
          <p className="text-sm text-gray-500">You do not have permission to manage this document.</p>
        )}
      </main>
      </div>
    </div>
  )
}
