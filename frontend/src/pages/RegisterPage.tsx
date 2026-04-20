import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, setToken } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { ArrowRight } from 'lucide-react'
import clsx from 'clsx'


export function RegisterPage() {
  const { user, loading, refresh } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)

  if (!loading && user) return <Navigate to="/app" replace />

  async function handleRegister() {
    setError(null)
    setBusy(true)
    try {
      const { data } = await api.post<{ accessToken: string }>('/api/v1/auth/register', {
        email: email.trim(),
        fullName: fullName.trim(),
        password,
      })
      setToken(data.accessToken)
      const { ok, detail } = await refresh()
      if (ok) navigate('/app', { replace: true })
      else setError(detail ?? 'Could not load your profile after sign-up.')
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setError(msg ?? 'Sign-up failed. Is the email already registered?')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1f1f] flex items-center justify-center px-4 py-10 relative overflow-hidden font-sans">

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
            <span className="text-[10px] text-[#2d6a5a]">Join the Network</span>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-[32px] font-black text-[#e0f2ee] leading-[1.1] tracking-tight mb-1.5 font-syne">
          Get<br />Started.
        </h2>
        <p className="text-[13px] text-[#3a6a60] font-light mb-8">
          Create your university account below
        </p>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-950/30 border border-red-800/30 rounded-xl px-4 py-3 mb-4">
            <span className="w-[5px] h-[5px] rounded-full bg-red-400 shrink-0 mt-1" />
            <p className="text-[12px] font-medium text-red-400">{error}</p>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-medium tracking-[0.13em] uppercase text-[#2d6a5a] mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              className="w-full bg-[#0d1a1a] border border-[#1a3030] rounded-xl px-3.5 py-3 text-[13px] text-[#c8e8e0] placeholder-[#1e3a35] outline-none focus:border-[#1a9e80] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium tracking-[0.13em] uppercase text-[#2d6a5a] mb-1.5">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@university.edu"
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              className="w-full bg-[#0d1a1a] border border-[#1a3030] rounded-xl px-3.5 py-3 text-[13px] text-[#c8e8e0] placeholder-[#1e3a35] outline-none focus:border-[#1a9e80] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium tracking-[0.13em] uppercase text-[#2d6a5a] mb-1.5">Secure Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
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
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          disabled={busy || !email.trim() || !fullName.trim() || password.length < 8}
          onClick={handleRegister}
          className={clsx(
            'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[13px] font-bold tracking-wide transition-all mt-8 font-syne',
            busy || !email.trim() || !fullName.trim() || password.length < 8
              ? 'bg-[#0e3030] text-[#2d5a50] cursor-not-allowed'
              : 'bg-[#1a9e80] text-white hover:bg-[#158a6e] active:scale-[0.98]'
          )}
        >
          {busy ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Sign up for access
              <ArrowRight size={14} />
            </>
          )}
        </button>

        {/* Bottom actions */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#132828]">
          <p className="text-[11px] text-[#2d5a50]">
            Already have an account?{' '}
            <Link to="/" className="text-[#1a9e80] font-medium hover:text-[#22c9a0] transition-colors">Sign in</Link>
          </p>
          <div className="flex items-center gap-2 text-[11px] text-[#253f3a]">
            <Link to="/verify" className="hover:text-[#3a6a60] transition-colors">Verifier</Link>
            <span>·</span>
            <Link to="/guide" className="hover:text-[#3a6a60] transition-colors">Guide</Link>
          </div>
        </div>

      </div>
    </div>
  )
}



