import { useState, useEffect } from 'react'
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

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isChanging, setIsChanging] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChanging(true)
    try {
      await apiClient.put('/users/me/password', { oldPassword, newPassword })
      alert('Đổi mật khẩu thành công!')
      setIsChangingPassword(false)
      setOldPassword('')
      setNewPassword('')
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data || 'Đổi mật khẩu thất bại')
    } finally {
      setIsChanging(false)
    }
  }

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden animate-fade-in">
        
        {/* Decorative background circle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="relative z-10">
          <button 
            onClick={onClose}
            className="absolute -top-4 -left-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Đóng"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-24 h-24 rounded-full bg-slate-800 text-white font-bold text-4xl flex items-center justify-center mx-auto mb-6 shadow-xl ring-4 ring-white">
            {user?.username?.charAt(0).toUpperCase() || 'H'}
          </div>

          <h1 className="text-3xl font-black text-slate-800 mb-8">{profile?.username || user?.username || 'Hale'}</h1>

          {loading ? (
            <div className="flex justify-center p-4">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-3 mb-8 text-left">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm font-bold text-slate-700">{profile?.email || 'Chưa cập nhật'}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {!isChangingPassword ? (
              <button 
                onClick={() => setIsChangingPassword(true)}
                className="w-full py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl font-bold transition-all shadow-sm active:scale-95 mt-2"
              >
                Đổi mật khẩu
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3 mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <input 
                  type="password" 
                  required 
                  placeholder="Mật khẩu cũ" 
                  value={oldPassword} 
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
                />
                <input 
                  type="password" 
                  required 
                  placeholder="Mật khẩu mới" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
                />
                <div className="flex gap-2 pt-1">
                  <button 
                    type="button" 
                    onClick={() => { setIsChangingPassword(false); setOldPassword(''); setNewPassword(''); }}
                    className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-sm transition-all"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    disabled={isChanging}
                    className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                    {isChanging ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            )}

            <button 
              onClick={() => { logout(); window.location.href = '/login' }}
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
