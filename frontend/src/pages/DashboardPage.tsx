import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { documentsApi } from '../api/documents';
import type { Document, DocumentScope } from '../types/document';
import { DocumentCard } from '../components/DocumentCard';
import { CreateDocumentModal } from '../components/CreateDocumentModal';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ProfileModal } from '../components/ProfileModal';
// --- ICONS ---
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
const GearIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
  </svg>
);
const FolderIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);
const PeopleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const GlobeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
  </svg>
);
const DocPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const DocIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);
const HelpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const GridIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);
const ListIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const EllipsisVerticalIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

// --- MAIN PAGE ---

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeScope, setActiveScope] = useState<DocumentScope>('owned');
  const [docs, setDocs] = useState<Document[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Xử lý Debounce tìm kiếm
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await documentsApi.list(activeScope, {
        query: debouncedQuery || undefined,
        page,
        size: viewMode === 'grid' ? 12 : 20, // Load more for list view
      });
      setDocs(result.items);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Lỗi khi tải tài liệu:', err);
    } finally {
      setLoading(false);
    }
  }, [activeScope, debouncedQuery, page, viewMode]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const fetchDocsRef = useRef(fetchDocs);
  useEffect(() => {
    fetchDocsRef.current = fetchDocs;
  }, [fetchDocs]);
  const stableRefetch = useCallback(() => fetchDocsRef.current(), []);

  function handleTabChange(scope: DocumentScope) {
    if (activeScope === scope) return;
    setActiveScope(scope);
    setPage(0);
    setDocs([]);
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <Sidebar 
        isDashboard={true} 
        activeScope={activeScope} 
        onTabChange={handleTabChange} 
        onCreateNew={() => setShowCreate(true)} 
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          {/* Mobile menu toggle (optional placeholder) */}
          <button className="md:hidden p-2 text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Search */}
          <div className="flex-1 flex justify-center md:justify-start">
            <div className="relative w-full max-w-xl">
              <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none placeholder:text-slate-400 transition-all"
                placeholder="Tìm kiếm tài liệu theo tiêu đề..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 ml-4">
            <div className="flex items-center gap-3 pl-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800 leading-none">{user?.username || 'Hale'}</p>
              </div>
              <div 
                onClick={() => setShowProfile(true)}
                className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white cursor-pointer hover:ring-indigo-400 transition-all"
              >
                {user?.username?.charAt(0).toUpperCase() || 'H'}
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-6xl mx-auto">
            {/* Create Card (Top banner) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-10 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 mb-4">
                <DocPlusIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Tạo tài liệu mới</h3>
              <p className="text-slate-500 text-sm mb-6">
                Bắt đầu từ một trang trắng hoặc chọn một mẫu có sẵn.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-indigo-500/20"
              >
                Create New Document
              </button>
            </div>

            {/* View Toggles */}
            <div className="flex justify-end mb-6">

              <div className="flex gap-2">
                <button
                  className={`p-2 rounded-xl transition-all ${
                    viewMode === 'grid'
                      ? 'bg-slate-200 text-slate-800 shadow-sm'
                      : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                  }`}
                  onClick={() => setViewMode('grid')}
                >
                  <GridIcon className="w-5 h-5" />
                </button>
                <button
                  className={`p-2 rounded-xl transition-all ${
                    viewMode === 'list'
                      ? 'bg-slate-200 text-slate-800 shadow-sm'
                      : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                  }`}
                  onClick={() => setViewMode('list')}
                >
                  <ListIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Recent Documents Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Tài liệu gần đây</h3>
              <button className="text-sm font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
                Xem tất cả <span className="text-lg leading-none">&rarr;</span>
              </button>
            </div>

            {/* Documents Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[300px]">
              {loading && docs.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
                  <p className="font-medium">Đang tải tài liệu...</p>
                </div>
              ) : docs.length === 0 ? (
                <div className="p-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <DocIcon className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Trống trải quá nhỉ?</h3>
                  <p className="text-slate-400 max-w-sm mb-6 font-medium">
                    {query
                      ? `Không tìm thấy tài liệu nào khớp với "${query}".`
                      : 'Chưa có tài liệu nào ở đây. Hãy tạo mới ngay!'}
                  </p>
                </div>
              ) : viewMode === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4 rounded-tl-2xl">TÊN TÀI LIỆU</th>
                        <th className="px-6 py-4">NGƯỜI TẠO</th>
                        <th className="px-6 py-4">NGÀY CHỈNH SỬA</th>
                        <th className="px-6 py-4 w-12 rounded-tr-2xl"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {docs.map(doc => (
                        <tr
                          key={doc.id}
                          className="hover:bg-slate-50/80 cursor-pointer group transition-colors"
                          onClick={() => navigate(`/documents/${doc.id}`)}
                        >
                          <td className="px-6 py-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                              <DocIcon className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-700">{doc.title}</span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-500">
                            {doc.owner.username}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-500">
                            {new Date(doc.updatedAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/documents/${doc.id}/settings`);
                              }}
                              className="text-slate-300 hover:text-slate-700 p-2 transition-colors rounded-lg hover:bg-slate-200"
                            >
                              <EllipsisVerticalIcon className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                  {docs.map(doc => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onDeleted={id => setDocs(d => d.filter(x => x.id !== id))}
                      onDeleteFailed={stableRefetch}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center gap-2 bg-white p-1.5 rounded-full border border-slate-200 shadow-sm">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 bg-slate-50 rounded-full disabled:opacity-30 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="px-4 text-sm font-bold text-slate-700">
                    Trang {page + 1} <span className="text-slate-300 mx-1">/</span> {totalPages}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 bg-slate-50 rounded-full disabled:opacity-30 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </div>
        </main>
      </div>

      {showCreate && (
        <CreateDocumentModal
          onCreated={() => {
            setShowCreate(false);
            fetchDocs();
          }}
          onClose={() => setShowCreate(false)}
        />
      )}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}