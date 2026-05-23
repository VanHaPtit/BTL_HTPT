import { Link, useNavigate } from 'react-router-dom';

export interface SidebarProps {
  onCreateNew?: () => void;
  
  // Context
  isDashboard?: boolean;
  activeScope?: 'owned' | 'shared' | 'public';
  onTabChange?: (tab: 'owned' | 'shared' | 'public') => void;
  
  documentId?: string;
  isOwner?: boolean;
  onHistoryClick?: () => void;
  activeEditorTab?: 'editor' | 'versioning' | 'comments' | 'analytics' | 'settings';
}

export function Sidebar({
  onCreateNew,
  isDashboard = false,
  activeScope = 'owned',
  onTabChange,
  documentId,
  isOwner = false,
  onHistoryClick,
  activeEditorTab = 'editor'
}: SidebarProps) {
  const navigate = useNavigate();

  const handleNavigateDashboard = (tab: 'owned' | 'shared' | 'public') => {
    if (isDashboard && onTabChange) {
      onTabChange(tab);
    } else {
      // If we are in the editor and click a dashboard tab, we should navigate back to dashboard.
      // Assuming Dashboard handles the scope via URL or defaults to 'owned'
      navigate('/');
    }
  };

  return (
    <aside className="flex w-[260px] flex-col border-r border-slate-200 bg-white shrink-0 z-10 hidden md:flex h-screen">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <div>
          <div className="font-bold text-slate-900 leading-tight">HANDocs</div>
          <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Document Management</div>
        </div>
      </div>

      {/* Create New Button */}
      <div className="px-5 py-2">
        <button 
          onClick={onCreateNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-600 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create New
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {/* Universal Dashboard Tabs */}
        <button
          onClick={() => handleNavigateDashboard('owned')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isDashboard && activeScope === 'owned'
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
          My Documents
        </button>
        <button
          onClick={() => handleNavigateDashboard('shared')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isDashboard && activeScope === 'shared'
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          Shared with me
        </button>
        <button
          onClick={() => handleNavigateDashboard('public')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isDashboard && activeScope === 'public'
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
          Public
        </button>

        {/* Editor Specific Section */}
        {documentId && (
          <div className="pt-4 mt-4 border-t border-slate-100">
            <div className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Editor Details
            </div>
            
            <Link to={`/documents/${documentId}`} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium border ${
              activeEditorTab === 'editor' 
                ? 'bg-indigo-50 text-indigo-600 border-indigo-100/50' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
            }`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Editor
            </Link>
            
            <button onClick={onHistoryClick} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Versioning
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
}
