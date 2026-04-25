import { GoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, setToken } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { isGoogleClientConfigured } from '../config/oauth'
import { useToast } from '../components/Toast'

export function LoginPage() {
  const { user, loading, refresh } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Validation Logic ──
  const [touched, setTouched] = useState({ email: false })
  const isEmailValid = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  if (!loading && user) return <Navigate to="/app" replace />

  const handleLogin = async () => {
    if (!email.trim() || !password) return
    setError(null)
    setBusy(true)
    try {
      const { data } = await api.post<{ accessToken: string }>('/api/v1/auth/login', {
        email: email.trim(),
        password,
      })
      setToken(data.accessToken)
      const { ok, detail } = await refresh()
      if (ok) {
        toast('Welcome back to CampusFlow!', 'success')
        navigate('/app', { replace: true })
      } else {
        setError(detail ?? 'Profile data could not be retrieved.')
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Invalid email or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-[#0d1117] px-4 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#14b8a6] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[120px]" />
      </div>

      <div className="flex w-full max-w-[768px] overflow-hidden rounded-[2rem] bg-[#161b22] shadow-2xl shadow-black/50 border border-white/5 relative z-10">

        {/* Left Side: Form */}
        <div className="flex flex-[1.2] flex-col justify-center p-10 sm:p-14 bg-[#161b22]">
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl font-black tracking-tight text-white">Sign In</h1>
            <p className="mt-2 text-sm font-medium text-slate-500 uppercase tracking-widest text-[10px]">Operations Hub Access</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-400 border border-red-500/20">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className={`ml-1 text-[10px] font-black uppercase tracking-widest transition-colors ${touched.email && !isEmailValid ? 'text-red-500' : 'text-[#14b8a6]'}`}>Email Address</label>
              <input
                type="email"
                className={`h-11 w-full rounded-xl border bg-[#0d1117] px-4 text-sm font-bold text-white outline-none transition-all placeholder:text-slate-700 focus:ring-1 ${touched.email && !isEmailValid ? 'border-red-500/50 ring-red-500/20 focus:border-red-500' : 'border-white/5 focus:ring-[#14b8a6]/50 focus:border-[#14b8a6]'}`}
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (!touched.email) setTouched(p => ({ ...p, email: true }))
                }}
                onBlur={() => setTouched(p => ({ ...p, email: true }))}
                onKeyDown={(e) => e.key === 'Enter' && isEmailValid && handleLogin()}
              />
              {touched.email && !isEmailValid && <p className="ml-1 text-[10px] font-bold text-red-400 italic">× Invalid email format</p>}
            </div>

            <div className="space-y-1">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-[#14b8a6]">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="h-11 w-full rounded-xl border border-white/5 bg-[#0d1117] px-4 pr-10 text-sm font-bold text-white outline-none transition-all placeholder:text-slate-700 focus:ring-1 focus:ring-[#14b8a6]/50 focus:border-[#14b8a6]"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && isEmailValid && handleLogin()}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>



            <button
              disabled={busy || !email.trim() || !password || !isEmailValid}
              onClick={handleLogin}
              className={`mt-2 h-12 w-full rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed ${busy || !email.trim() || !password || !isEmailValid ? 'bg-slate-800 text-slate-500 border border-white/5 shadow-none' : 'bg-[#14b8a6] text-white shadow-lg shadow-[#14b8a6]/20 hover:bg-[#0d9488]'}`}
            >
              {busy ? 'Authenticating...' : 'SIGN In'}
            </button>
          </div>

          {isGoogleClientConfigured() && (
            <div className="mt-8 flex flex-col items-center border-t border-white/5 pt-8">
              <div className="mb-6 text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#14b8a6]">Identity Verification</span>
                <p className="text-[11px] font-bold text-slate-400">
                  Already a user? <span className="text-white">Sign In</span>. New here? <span className="text-white">Sign Up</span>.
                </p>
                <p className="text-[9px] font-medium text-slate-600 uppercase tracking-widest mt-1">Workspace Authentication</p>
              </div>
              <div className="w-full max-w-[340px] [&>div]:!w-full [&>div>div]:!w-full [&_iframe]:!w-full">
                <GoogleLogin
                  onSuccess={async (cred) => {
                    if (!cred.credential) return
                    setBusy(true)
                    setToken(cred.credential)
                    const { ok, detail } = await refresh()
                    setBusy(false)
                    if (ok) {
                      toast('Authenticated via Workspace SSO', 'success')
                      navigate('/app', { replace: true })
                    } else {
                      setError(detail ?? 'Google authentication failed.')
                    }
                  }}
                  onError={() => setError('SSO window could not be opened.')}
                  theme="filled_black"
                  shape="pill"
                  width="340"
                  text="continue_with"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Toggle Panel */}
        <div className="hidden flex-1 flex-col items-center justify-center bg-[#0d1117] p-12 text-center text-white sm:flex relative overflow-hidden border-l border-white/5">
          {/* Decorative elements to match screenshot "glow" */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#14b8a6]/10 rounded-full blur-[80px]" />

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl font-black">Hello!</h2>
            <p className="text-sm font-medium leading-relaxed text-slate-400">
              Register with your personal details to use all of site features.
            </p>
            <Link
              to="/register"
              className="inline-flex h-11 items-center rounded-xl border border-white/20 bg-white/5 px-10 text-[11px] font-black uppercase tracking-widest transition-all hover:bg-white hover:text-black"
            >
              Sign Up
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}