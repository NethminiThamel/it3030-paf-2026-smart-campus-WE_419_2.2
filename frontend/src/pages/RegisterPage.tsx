import { Building2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, setToken } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export function RegisterPage() {
  const { user, loading, refresh } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && user) {
    return <Navigate to="/app" replace />
  }

  async function submit() {
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
            Create an account to join the network. If you already used Google with this email, registering here adds a password to the same account.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="flex flex-col items-stretch gap-4">
          <div className="space-y-1.5">
            <label className="label">Full Name</label>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              placeholder="John Doe"
            />
          </div>
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
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>

          <button
            type="button"
            className="btn btn-primary mt-2 h-11"
            disabled={busy || !email.trim() || !fullName.trim() || password.length < 8}
            onClick={() => void submit()}
          >
            {busy ? 'Creating account…' : 'Sign up for access'}
          </button>

          <p className="text-center text-xs font-bold text-slate-500">
            Already have an account?{' '}
            <Link className="text-[#004d61] hover:underline" to="/">
              Sign in
            </Link>
          </p>

          
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

