import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext'
import { documentsApi } from '../api/documents'
import type { Document, DocumentScope } from '../types/document'
import { DocumentCard } from '../components/DocumentCard'
import { CreateDocumentModal } from '../components/CreateDocumentModal'

// --- CONSTANTS & COMPONENTS ---

const TABS: { label: string; scope: DocumentScope; icon: React.JSX.Element }[] = [
  {
    label: 'Của tôi',
    scope: 'owned',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  },
  {
    label: 'Được chia sẻ',
    scope: 'shared',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  },
  {
    label: 'Công khai',
    scope: 'public',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
  },
]

// Component tạo hiệu ứng loading giả lập (Skeleton)
const DocumentSkeleton = () => (
  <div className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="w-16 h-5 bg-slate-100 rounded-lg" />
      <div className="w-6 h-6 bg-slate-50 rounded-full" />
    </div>
    <div className="w-3/4 h-6 bg-slate-200 rounded-md mb-3" />
    <div className="w-full h-24 bg-slate-50 rounded-xl mb-4" />
    <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
      <div className="w-6 h-6 bg-slate-100 rounded-full" />
      <div className="w-24 h-3 bg-slate-100 rounded" />
    </div>
  </div>
)

// --- MAIN PAGE ---

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

  // Xử lý Debounce tìm kiếm
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(0)
    }, 400) // 400ms là khoảng thời gian lý tưởng
    return () => clearTimeout(t)
  }, [query])

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const result = await documentsApi.list(activeScope, {
        query: debouncedQuery || undefined,
        page,
        size: 12 // Kích thước lưới vừa đủ để tối ưu hiệu năng
      })
      setDocs(result.items)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error("Lỗi khi tải tài liệu:", err)
    } finally {
      setLoading(false)
    }
  }, [activeScope, debouncedQuery, page])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const fetchDocsRef = useRef(fetchDocs)
  useEffect(() => { fetchDocsRef.current = fetchDocs }, [fetchDocs])
  const stableRefetch = useCallback(() => fetchDocsRef.current(), [])

  function handleTabChange(scope: DocumentScope) {
    setActiveScope(scope)
    setPage(0)
    setDocs([])
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-100">

      {/* TIER 1: STICKY NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              WebDocs
            </h1>
          </div>

          <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-tight">{user?.username}</p>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Free Plan</span>
            </div>
            <button
              onClick={logout}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Đăng xuất"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* TIER 2: WELCOME & ACTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
              Chào Hà, <span className="text-indigo-600">mừng bạn trở lại!</span> 👋
            </h2>
            <p className="text-slate-500 font-medium">Bạn có ý tưởng gì mới cho tài liệu hôm nay không?</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="group flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-200 active:scale-95 transition-all w-full md:w-auto justify-center shadow-xl shadow-indigo-100"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            Tạo tài liệu mới
          </button>
        </div>

        {/* TIER 3: FILTER & SEARCH TOOLBAR */}
        <div className="bg-white/60 border border-slate-200/60 p-2.5 rounded-[2rem] flex flex-col md:flex-row gap-4 items-center justify-between mb-10 shadow-sm backdrop-blur-sm">
          <div className="flex bg-slate-100/60 p-1.5 rounded-2xl w-full md:w-auto">
            {TABS.map(({ label, scope, icon }) => (
              <button
                key={scope}
                onClick={() => handleTabChange(scope)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-[1.25rem] text-sm font-bold transition-all duration-300 ${activeScope === scope
                  ? 'bg-white text-indigo-600 shadow-md shadow-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-md group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {loading && query ? (
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            <input
              className="w-full bg-slate-100/60 border-none rounded-2xl pl-12 pr-12 py-3.5 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
              placeholder="Tìm kiếm tài liệu theo tiêu đề..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* --- GRID CONTENT --- */}
        {loading && docs.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <DocumentSkeleton key={i} />)}
          </div>
        ) : docs.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] py-32 flex flex-col items-center justify-center text-center px-6 animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-12 group-hover:rotate-0 transition-transform">
              <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              {query ? 'Không tìm thấy kết quả' : 'Trống trải quá nhỉ?'}
            </h3>
            <p className="text-slate-400 max-w-sm mb-10 font-medium">
              {query
                ? `Chúng tôi không tìm thấy tài liệu nào khớp với từ khóa "${query}". Thử từ khóa khác xem sao!`
                : 'Hãy bắt đầu bằng việc tạo một tài liệu mới để lưu giữ những ý tưởng tuyệt vời của bạn.'}
            </p>
            {!query && (
              <button
                onClick={() => setShowCreate(true)}
                className="px-10 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                Bắt đầu ngay
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-500">
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

        {/* PHÂN TRANG (PAGINATION) */}
        {totalPages > 1 && (
          <div className="mt-20 flex justify-center">
            <nav className="flex items-center gap-2 bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-3 bg-slate-50 border border-slate-100 rounded-2xl disabled:opacity-30 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>

              <div className="px-6 py-2 text-sm font-black text-slate-700 tracking-wider">
                TRANG {page + 1} <span className="text-slate-300 mx-2">/</span> {totalPages}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-3 bg-slate-50 border border-slate-100 rounded-2xl disabled:opacity-30 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </nav>
          </div>
        )}
      </main>

      {/* MOBILE FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="md:hidden fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-400 flex items-center justify-center active:scale-90 transition-all z-50 animate-bounce-subtle"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
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