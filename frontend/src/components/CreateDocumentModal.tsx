import { useState } from 'react'
import type { FormEvent } from 'react'
import { documentsApi } from '../api/documents'
import type { Visibility } from '../types/document'
import { plainTextToBackendContent } from '../utils/documentContent'

interface Props { onCreated: () => void; onClose: () => void }

export function CreateDocumentModal({ onCreated, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('PRIVATE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await documentsApi.create({
        title,
        visibility,
        content: plainTextToBackendContent(content),
      })
      onCreated()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setError(msg ?? 'Failed to create document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">New Document</h2>
              <p className="text-slate-400 text-sm font-medium mt-1">Start a new project or draft.</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-100 text-red-500 text-xs font-bold px-4 py-3 rounded-2xl animate-fade-in">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Document Title</label>
              <input
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-300"
                placeholder="e.g. Project Roadmap 2024"
                value={title} onChange={e => setTitle(e.target.value)} required maxLength={255}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Initial Content (Optional)</label>
              <textarea
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all min-h-[120px] placeholder:text-slate-300"
                placeholder="Type something to get started..."
                value={content} onChange={e => setContent(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Visibility</label>
              <div className="grid grid-cols-3 gap-3">
                {(['PRIVATE', 'SHARED', 'PUBLIC'] as Visibility[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    className={`py-3 rounded-2xl text-xs font-bold transition-all border-2 ${
                      visibility === v 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-600' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-4 text-sm font-bold text-slate-500 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-[2] px-4 py-4 text-sm font-bold rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all active:scale-95">
                {loading ? 'Creating Document...' : 'Create Document'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
