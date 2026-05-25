import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiClient } from '../api/client'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const [forgotError, setForgotError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError('Invalid username or password or connection error')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleForgotPasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setForgotError('')
    setForgotMessage('')
    setIsLoading(true)
    try {
      const { data } = await apiClient.post(`/auth/forgot-password?email=${encodeURIComponent(email)}`)
      setForgotMessage(typeof data === 'string' ? data : 'Mật khẩu mới đã được gửi đến email của bạn.')
    } catch (err: any) {
      setForgotError(err.response?.data || 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-3xl flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl">

        {/* LEFT PANEL — Gradient branding */}
        <div className="flex-1 bg-gradient-to-br from-emerald-400 to-emerald-600 flex flex-col items-center justify-center p-10 text-white">
          {/* Logo / Icon */}
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold mb-3 tracking-tight">Welcome back</h2>
          <p className="text-emerald-100 text-sm text-center max-w-xs leading-relaxed">
            Sign in to continue your journey. We're glad to see you again.
          </p>

          {/* Decorative circles */}
          <div className="mt-10 flex gap-3">
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="w-2 h-2 rounded-full bg-white/80" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
          </div>
        </div>

        {/* RIGHT PANEL — Form */}
        <div className="flex-1 bg-white flex flex-col justify-center px-8 py-10 md:px-10">
          {!isForgotPassword ? (
            <>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Sign in</h1>
              <p className="text-sm text-gray-400 mb-8">Enter your credentials to access your account</p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-2xl mb-5">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Username</label>
                  <div className="flex items-center bg-gray-100 rounded-2xl px-4 gap-3 focus-within:ring-2 focus-within:ring-emerald-400 transition-all">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      className="flex-1 bg-transparent py-3 text-sm text-gray-700 placeholder-gray-400 outline-none"
                      placeholder="Enter your username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Password</label>
                  </div>
                  <div className="flex items-center bg-gray-100 rounded-2xl px-4 gap-3 focus-within:ring-2 focus-within:ring-emerald-400 transition-all">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      type="password"
                      className="flex-1 bg-transparent py-3 text-sm text-gray-700 placeholder-gray-400 outline-none"
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-400 to-emerald-600 text-white py-3 rounded-2xl font-semibold text-sm hover:from-emerald-500 hover:to-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2 shadow-md shadow-emerald-200"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : 'Sign in'}
                </button>
                
                <div className="text-center mt-3">
                  <button type="button" onClick={() => setIsForgotPassword(true)} className="text-sm font-semibold text-emerald-600 hover:underline">
                    Forgot password?
                  </button>
                </div>
              </form>

              <p className="mt-6 text-sm text-center text-gray-400">
                No account yet?{' '}
                <Link to="/register" className="text-emerald-600 font-semibold hover:underline">
                  Create one
                </Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Reset password</h1>
              <p className="text-sm text-gray-400 mb-8">We will send a new password to your email address</p>

              {forgotError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-2xl mb-5">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {forgotError}
                </div>
              )}

              {forgotMessage && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm px-4 py-3 rounded-2xl mb-5">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {forgotMessage}
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                  <div className="flex items-center bg-gray-100 rounded-2xl px-4 gap-3 focus-within:ring-2 focus-within:ring-emerald-400 transition-all">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      className="flex-1 bg-transparent py-3 text-sm text-gray-700 placeholder-gray-400 outline-none"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-400 to-emerald-600 text-white py-3 rounded-2xl font-semibold text-sm hover:from-emerald-500 hover:to-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2 shadow-md shadow-emerald-200"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </span>
                  ) : 'Reset Password'}
                </button>
              </form>

              <p className="mt-6 text-sm text-center text-gray-400">
                Remembered your password?{' '}
                <button onClick={() => { setIsForgotPassword(false); setForgotError(''); setForgotMessage(''); }} className="text-emerald-600 font-semibold hover:underline">
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}