import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { documentsApi } from '../api/documents'
import type { Document, DocumentScope } from '../types/document'
import { DocumentCard } from '../components/DocumentCard'
import { CreateDocumentModal } from '../components/CreateDocumentModal'

const TABS: { label: string; scope: DocumentScope; icon: React.JSX.Element }[] = [
  {
    label: 'Mine',
    scope: 'owned',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: 'Shared',
    scope: 'shared',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: 'Public',
    scope: 'public',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
]

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 bg-slate-100 rounded-xl" />
        <div className="w-6 h-6 bg-slate-100 rounded-lg" />
      </div>
      <div className="h-4 bg-slate-100 rounded-lg mb-2 w-3/4" />
      <div className="h-3 bg-slate-100 rounded-lg mb-4 w-1/2" />
      <div className="h-px bg-slate-100 mb-3" />
      <div className="flex justify-between">
        <div className="h-3 bg-slate-100 rounded w-16" />
        <div className="h-3 bg-slate-100 rounded w-12" />
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user, logout } = useAuth()
  const [activeScope, setActiveScope] = useState<DocumentScope>('owned')
  const [docs, setDocs] = useState<Document[]>([])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [_firstLoad, setFirstLoad] = useState(true)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(0)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const result = await documentsApi.list(activeScope, {
        query: debouncedQuery || undefined,
        page,
        size: 24,
      })
      setDocs(result.items)
      setTotalPages(result.totalPages)
    } finally {
      setLoading(false)
      setFirstLoad(false)
    }
  }, [activeScope, debouncedQuery, page])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  const fetchDocsRef = useRef(fetchDocs)
  useEffect(() => {
    fetchDocsRef.current = fetchDocs
  }, [fetchDocs])
  const stableRefetch = useCallback(() => fetchDocsRef.current(), [])

  function handleTabChange(scope: DocumentScope) {
    setActiveScope(scope)
    setPage(0)
  }

  const hasSearch = query.length > 0

  // Keyboard shortcut: Cmd/Ctrl+K to focus search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-800">WebDocs</span>
          </div>

          {/* Search bar in header (desktop) */}
          <div className="hidden md:flex flex-1 max-w-sm relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 focus:bg-white transition-all"
              placeholder="Search documents…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {hasSearch ? (
              <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-all">
                <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 hidden lg:block">⌘K</kbd>
            )}
          </div>

          {/* Right: user + new doc */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowCreate(true)}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>

            {/* User avatar with dropdown hint */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user?.username}</p>
                <p className="text-[10px] text-slate-400">Free Plan</p>
              </div>
              <div className="relative group">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-sm select-none cursor-default">
                  {user?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
              </div>
              <button
                onClick={logout}
                className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ── WELCOME BANNER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Good to see you, <span className="text-indigo-600">{user?.username}</span>
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {docs.length > 0 && !loading
                ? `${docs.length} document${docs.length !== 1 ? 's' : ''} in this view`
                : 'Create, manage, and collaborate on your documents.'}
            </p>
          </div>

          {/* Mobile: create button inline */}
          <button
            onClick={() => setShowCreate(true)}
            className="sm:hidden self-start flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            New Document
          </button>
        </div>

        {/* ── TABS + MOBILE SEARCH ── */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Mobile search */}
          <div className="md:hidden relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              placeholder="Search documents…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {hasSearch && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Scope tabs */}
          <div className="flex bg-white border border-slate-200 p-1 rounded-2xl gap-1 w-full sm:w-auto self-start">
            {TABS.map(({ label, scope, icon }) => (
              <button
                key={scope}
                onClick={() => handleTabChange(scope)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeScope === scope
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Active search chip */}
          {hasSearch && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Results for</span>
              <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-lg text-xs">
                "{query}"
                <button onClick={() => setQuery('')} className="ml-1 hover:text-indigo-900">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            </div>
          )}
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 px-6">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-5">
              {hasSearch ? (
                <svg className="w-9 h-9 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ) : (
                <svg className="w-9 h-9 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {hasSearch ? `No results for "${query}"` : 'No documents yet'}
            </h3>
            <p className="text-slate-400 text-sm max-w-xs mb-6">
              {hasSearch
                ? 'Try a different keyword or check the spelling.'
                : activeScope === 'owned'
                ? 'Create your first document to get started.'
                : activeScope === 'shared'
                ? 'No one has shared a document with you yet.'
                : 'No public documents are available right now.'}
            </p>
            {hasSearch ? (
              <button
                onClick={() => setQuery('')}
                className="px-6 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
              >
                Clear search
              </button>
            ) : activeScope === 'owned' ? (
              <button
                onClick={() => setShowCreate(true)}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-sm"
              >
                Create your first document
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {docs.map(doc => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDeleted={(id) => setDocs(d => d.filter(x => x.id !== id))}
                onDeleteFailed={stableRefetch}
              />
            ))}
          </div>
        )}

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-all text-xs font-bold text-slate-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>

            {/* Page number pills */}
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    i === page
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                      : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-all text-xs font-bold text-slate-600"
            >
              Next
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </main>

      {/* ── MOBILE FAB ── */}
      <button
        onClick={() => setShowCreate(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-200 flex items-center justify-center active:scale-90 transition-all z-40"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {showCreate && (
        <CreateDocumentModal
          onCreated={() => { setShowCreate(false); fetchDocs() }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}