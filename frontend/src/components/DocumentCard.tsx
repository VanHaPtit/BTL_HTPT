import { useNavigate } from 'react-router-dom'
import type { Document } from '../types/document'
import { documentsApi } from '../api/documents'
import { useToast } from '../contexts/ToastContext'

interface Props {
  document: Document
  onDeleted: (id: string) => void
  onDeleteFailed: () => void
}

const VISIBILITY_COLORS: Record<string, { bg: string, text: string, icon: JSX.Element }> = {
  PRIVATE: { 
    bg: 'bg-slate-100', 
    text: 'text-slate-500',
    icon: <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
  },
  SHARED: { 
    bg: 'bg-indigo-50', 
    text: 'text-indigo-500',
    icon: <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  },
  PUBLIC: { 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-500',
    icon: <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
  },
}

export function DocumentCard({ document: doc, onDeleted, onDeleteFailed }: Props) {
  const navigate = useNavigate()
  const { addToast } = useToast()

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Delete "${doc.title}"?`)) return
    onDeleted(doc.id)
    try {
      await documentsApi.delete(doc.id)
      addToast('Deleted', 'success')
    } catch {
      onDeleteFailed()
      addToast('Error', 'error')
    }
  }

  const visibility = VISIBILITY_COLORS[doc.visibility] || VISIBILITY_COLORS.PRIVATE

  return (
    <div
      className="group p-4 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all duration-200"
      onClick={() => navigate(`/documents/${doc.id}`)}
    >
      {/* ROW 1: BADGE & TITLE */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center justify-center p-1.5 rounded-lg ${visibility.bg} ${visibility.text} shrink-0`}>
          {visibility.icon}
        </span>
        <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
          {doc.title}
        </h3>
      </div>

      {/* ROW 2: AUTHOR & DATE */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500 uppercase shrink-0">
            {doc.owner.username.charAt(0)}
          </div>
          <span className="text-[10px] text-slate-500 font-bold truncate">
            {doc.owner.username}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] text-slate-400 font-bold tracking-tighter">
            {new Date(doc.updatedAt).toLocaleDateString()}
          </span>
          
          {/* ACTIONS (Shown on hover) */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
            {doc.currentUserPermission === 'OWNER' && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/documents/${doc.id}/settings`) }}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition-all"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-all"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
