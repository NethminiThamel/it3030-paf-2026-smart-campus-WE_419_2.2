import { GoogleLogin } from '@react-oauth/google'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, setToken } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { isGoogleClientConfigured } from '../config/oauth'
import clsx from 'clsx'

export function LoginPage() {
  const { user, loading, refresh } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)

  if (!loading && user) return <Navigate to="/app" replace />

  const handleLogin = async () => {
    setError(null)
    setBusy(true)
    try {
      const { data } = await api.post<{ accessToken: string }>('/api/v1/auth/login', {
        email: email.trim(),
        password,
      })
      setToken(data.accessToken)
      const { ok, detail } = await refresh()
      if (ok) navigate('/app', { replace: true })
      else setError(detail ?? 'Unable to connect to the server.')
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1f1f] flex items-center justify-center px-4 py-10 relative overflow-hidden font-inter">

      {/* Background orbs */}
      <div className="absolute w-80 h-80 -top-20 -right-16 bg-[#0e6655] opacity-20 rounded-full blur-[70px] pointer-events-none" />
      <div className="absolute w-48 h-48 -bottom-12 left-5 bg-[#1a9e80] opacity-10 rounded-full blur-[50px] pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-[400px] bg-[#111e1e] border border-[#1a3030] rounded-2xl px-9 py-10 z-10">

        {/* Top accent bar */}
        <div className="absolute top-0 left-10 right-10 h-[2px] bg-[#1a9e80] rounded-b-sm opacity-80" />

        {/* Header row */}
        <div className="flex items-center justify-between mb-9">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a9e80] flex items-center justify-center overflow-hidden shrink-0">
               <img src="/logo.png" alt="CF" className="w-full h-full object-cover opacity-90" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#e0f2ee] tracking-tight font-syne">CampusFlow</p>
              <p className="text-[9px] font-medium tracking-[0.15em] uppercase text-[#2d6a5a] mt-0.5">Operations Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-[5px] h-[5px] rounded-full bg-[#1a9e80]" />
            <span className="text-[10px] text-[#2d6a5a]">All systems live</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-[32px] font-black text-[#e0f2ee] leading-[1.1] tracking-tight mb-1.5 font-syne">
          Welcome<br />back.
        </h1>

        <p className="text-[13px] text-[#3a6a60] font-light mb-8">
          Sign in to your account to continue
        </p>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-950/30 border border-red-800/30 rounded-xl px-4 py-3 mb-4">
            <span className="w-[5px] h-[5px] rounded-full bg-red-400 shrink-0 mt-1" />
            <p className="text-[12px] font-medium text-red-400">{error}</p>
          </div>
        )}

        {/* Email */}
        <label className="block text-[10px] font-medium tracking-[0.13em] uppercase text-[#2d6a5a] mb-1.5">
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="name@university.edu"
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="w-full bg-[#0d1a1a] border border-[#1a3030] rounded-xl px-3.5 py-3 text-[13px] text-[#c8e8e0] placeholder-[#1e3a35] outline-none focus:border-[#1a9e80] transition-colors mb-3.5"
        />

        {/* Password */}
        <label className="block text-[10px] font-medium tracking-[0.13em] uppercase text-[#2d6a5a] mb-1.5">
          Password
        </label>
        <div className="relative mb-6">
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full bg-[#0d1a1a] border border-[#1a3030] rounded-xl px-3.5 py-3 pr-14 text-[13px] text-[#c8e8e0] placeholder-[#1e3a35] outline-none focus:border-[#1a9e80] transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-medium tracking-widest uppercase text-[#2d6a5a] hover:text-[#1a9e80] transition-colors"
          >
            {showPass ? 'Hide' : 'Show'}
          </button>
        </div>


        

        {/* Submit */}
        <button
          type="button"
          disabled={busy || !email.trim() || !password}
          onClick={handleLogin}
          className={clsx(
            'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[13px] font-bold tracking-wide transition-all',
            busy || !email.trim() || !password
              ? 'bg-[#0e3030] text-[#2d5a50] cursor-not-allowed'
              : 'bg-[#1a9e80] text-white hover:bg-[#158a6e] active:scale-[0.98]'
          )}
        >
          {busy ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Sign in to Console
              <ArrowRight size={14} />
            </>
          )}
        </button>

        {/* Register */}
        <p className="text-center text-[11px] text-[#2d5a50] mt-5">
          New here?{' '}
          <Link to="/register" className="text-[#1a9e80] font-medium hover:text-[#22c9a0] transition-colors">
            Create an account
          </Link>
        </p>

        {/* Google SSO */}
        {isGoogleClientConfigured() && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#1a2e2e]" />
              <span className="text-[10px] text-[#253f3a] tracking-[0.12em] uppercase">or continue with</span>
              <div className="flex-1 h-px bg-[#1a2e2e]" />
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={async (cred) => {
                  setError(null)
                  if (!cred.credential) return
                  setBusy(true)
                  setToken(cred.credential)
                  const { ok, detail } = await refresh()
                  setBusy(false)
                  if (ok) navigate('/app', { replace: true })
                  else setError(detail ?? 'Google authentication failed.')
                }}
                onError={() => setError('SSO window could not be opened.')}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                width={328}
              />
            </div>
          </>
        )}

        {/* Footer links */}
        <div className="flex items-center justify-between mt-7 pt-5 border-t border-[#132828]">
          <p className="text-[11px] text-[#2d5a50]">
            New here?{' '}
            <Link to="/register" className="text-[#1a9e80] font-medium hover:text-[#22c9a0]">
              Create an account
            </Link>
          </p>
          <p className="text-[11px] text-[#253f3a]">
            <Link to="/verify" className="hover:text-[#3a6a60] transition-colors">Verifier</Link>
            {' · '}
            <Link to="/guide" className="hover:text-[#3a6a60] transition-colors">Guide</Link>
          </p>
        </div>
      </div>
    </div>
  )
}