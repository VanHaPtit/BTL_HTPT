import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiClient } from '../api/client'

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
}

export function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get<UserProfile>('/users/me')
      .then((res: any) => {
        setProfile(res.data)
        setLoading(false)
      })
      .catch((err: any) => {
        console.error('Failed to load profile', err)
        setLoading(false)
      })
  }, [])

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Chưa cập nhật'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f8fafc_32%,_#e2e8f0_100%)] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden">
        
        {/* Decorative background circle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="relative z-10">
          <button 
            onClick={() => navigate('/')}
            className="absolute -top-4 -left-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Quay lại Dashboard"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="w-24 h-24 rounded-full bg-slate-800 text-white font-bold text-4xl flex items-center justify-center mx-auto mb-6 shadow-xl ring-4 ring-white">
            {user?.username?.charAt(0).toUpperCase() || 'H'}
          </div>

          <h1 className="text-3xl font-black text-slate-800 mb-2">{profile?.username || user?.username || 'Hale'}</h1>
          <p className="text-sm text-slate-500 font-medium mb-8">
            User ID: <span className="text-slate-400 font-mono text-[10px] break-all">{profile?.id || user?.userId}</span>
          </p>

          {loading ? (
            <div className="flex justify-center p-4">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-3 mb-8 text-left">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Họ và tên</p>
                <p className="text-sm font-bold text-slate-700">{fullName}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm font-bold text-slate-700">{profile?.email || 'Chưa cập nhật'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</span>
                <span className={`text-xs font-black px-3 py-1 rounded-lg ${profile?.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {profile?.status || 'UNKNOWN'}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
              <span className="text-sm font-bold text-slate-500">Gói tài khoản</span>
              <span className="text-sm font-black text-indigo-600 bg-indigo-100 px-3 py-1 rounded-lg">MIỄN PHÍ</span>
            </div>

            <button 
              onClick={() => { logout(); navigate('/login') }}
              className="w-full py-3.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-2xl font-bold transition-all shadow-sm hover:shadow-red-500/25 active:scale-95 mt-4"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
