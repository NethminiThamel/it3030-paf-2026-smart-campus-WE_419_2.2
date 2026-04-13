import { GoogleLogin } from '@react-oauth/google'
import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, setToken } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { isGoogleClientConfigured } from '../config/oauth'

export function LoginPage() {
  const { user, loading, refresh } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && user) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="card max-w-lg w-full">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f172a] shadow-xl ring-1 ring-slate-800">
            <img src="/logo.png" alt="CampusFlow" className="h-11 w-11 object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#101924]">CampusFlow</h1>
            <p className="text-sm font-bold text-slate-400">Intelligent Campus Operations</p>
          </div>
        </div>
        <div className="mb-6 space-y-3">
          <p className="text-sm leading-relaxed text-slate-600 font-medium">
            Sign in with <strong className="text-slate-900 font-bold">email and password</strong>, or use{' '}
            <strong className="text-slate-900 font-bold">Google</strong>.
          </p>
        </div>
        
        {loading && !user && (
          <p className="mb-4 text-center text-sm text-slate-500 font-bold italic animate-pulse">Checking session status…</p>
        )}
        
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="flex flex-col items-stretch gap-4">
          <div className="space-y-1.5">
            <label className="label">Work Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="name@university.edu"
            />
          </div>
          <div className="space-y-1.5">
            <label className="label">Secure Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          <button
            type="button"
            className="btn btn-primary mt-2 h-11"
            disabled={busy || !email.trim() || !password}
            onClick={async () => {
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
                  navigate('/app', { replace: true })
                } else {
                  setError(detail ?? 'Unable to connect to the server.')
                }
              } catch (e: unknown) {
                setError('Invalid email or password. Please try again.')
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? 'Authenticating…' : 'Sign in to Console'}
          </button>
          <p className="text-center text-xs font-bold text-slate-500">
            New here?{' '}
            <Link className="text-[#004d61] hover:underline" to="/register">
              Create an account
            </Link>
          </p>
          {isGoogleClientConfigured() && (
            <>
              <div className="relative py-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <span className="relative z-10 bg-white px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">or use secure SSO</span>
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
                    if (ok) {
                      navigate('/app', { replace: true })
                    } else {
                      setError(detail ?? 'Google authentication failed.')
                    }
                  }}
                  onError={() => {
                    setError('SSO window could not be opened.')
                  }}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="circle"
                  width={340}
                />
              </div>
            </>
          )}
          
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs font-medium text-slate-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#004d61]" />
            <span>
              Role-based access is enforced. 
            </span>
          </div>
        </div>
        <p className="mt-8 text-center text-xs font-bold text-slate-400">
          <Link className="hover:text-slate-800 transition-colors" to="/verify">
            Verifier
          </Link>
          {' · '}
          <Link className="hover:text-slate-800 transition-colors" to="/guide">
            Guide
          </Link>
        </p>
      </div>
    </div>
  )
}
