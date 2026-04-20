import { GoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, setToken } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { isGoogleClientConfigured } from '../config/oauth'
import { useToast } from '../components/Toast'

export function RegisterPage() {
  const { user, loading, refresh } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Robust Validation Logic ──
  const [touched, setTouched] = useState({ fullName: false, email: false, password: false })
  const isLettersOnly = fullName.length === 0 || /^[A-Za-z\s]+$/.test(fullName)
  const isNameValid = fullName.trim().length >= 2 && isLettersOnly
  const nameError = !isLettersOnly
    ? 'Name must contain letters only'
    : fullName.trim().length < 2 && fullName.length > 0
      ? 'Name must be at least 2 characters'
      : null
  const isEmailValid = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPasswordValid = password.length >= 8 || password.length === 0

  if (!loading && user) return <Navigate to="/app" replace />

  const handleRegister = async () => {
    setTouched({ fullName: true, email: true, password: true })
    if (!isNameValid || !isEmailValid || password.length < 8) {
       setError('Please fix the validation errors above.')
       return
    }
    
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
      if (ok) {
        toast('Account created! Welcome to CampusFlow.', 'success')
        navigate('/app', { replace: true })
      } else {
        setError(detail ?? 'Could not load your profile.')
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Sign-up failed.'
      setError(msg)
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

      <div className="flex w-full max-w-[768px] overflow-hidden rounded-[2rem] bg-[#161b22] shadow-2xl shadow-black/50 border border-white/5 relative z-10 my-10">
        
        {/* Left Side: Toggle Panel */}
        <div className="hidden flex-1 flex-col items-center justify-center bg-[#0d1117] p-12 text-center text-white sm:flex relative overflow-hidden border-r border-white/5">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#14b8a6]/10 rounded-full blur-[80px]" />
           
           <div className="relative z-10 space-y-6">
              <h2 className="text-3xl font-black">Welcome Back!</h2>
              <p className="text-sm font-medium leading-relaxed text-slate-400">
                To keep connected with us please login with your personal info.
              </p>
              <Link
                to="/"
                className="inline-flex h-11 items-center rounded-xl border border-white/20 bg-white/5 px-10 text-[11px] font-black uppercase tracking-widest transition-all hover:bg-white hover:text-black"
              >
                Sign In
              </Link>
           </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex flex-[1.2] flex-col justify-center p-10 sm:p-14 bg-[#161b22]">
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl font-black tracking-tight text-white">Create Account</h1>
            <p className="mt-2 text-sm font-medium text-slate-500 uppercase tracking-widest text-[10px]">Join Operations Hub</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-400 border border-red-500/20">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className={`ml-1 text-[10px] font-black uppercase tracking-widest transition-colors ${touched.fullName && nameError ? 'text-red-500' : 'text-[#14b8a6]'}`}>Full Name</label>
              <input
                type="text"
                className={`h-11 w-full rounded-xl border bg-[#0d1117] px-4 text-sm font-bold text-white outline-none transition-all placeholder:text-slate-700 focus:ring-1 ${touched.fullName && nameError ? 'border-red-500/50 ring-red-500/20 focus:border-red-500' : 'border-white/5 focus:ring-[#14b8a6]/50 focus:border-[#14b8a6]'}`}
                placeholder="e.g. John Smith"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value.replace(/[^A-Za-z\s]/g, ''))
                  if(!touched.fullName) setTouched(p => ({...p, fullName: true}))
                }}
                onBlur={() => setTouched(p => ({ ...p, fullName: true }))}
              />
              {touched.fullName && nameError && <p className="ml-1 text-[10px] font-bold text-red-500 italic">× {nameError}</p>}
            </div>

            <div className="space-y-1">
              <label className={`ml-1 text-[10px] font-black uppercase tracking-widest transition-colors ${touched.email && !isEmailValid ? 'text-red-500' : 'text-[#14b8a6]'}`}>Email Address</label>
              <input
                type="email"
                className={`h-11 w-full rounded-xl border bg-[#0d1117] px-4 text-sm font-bold text-white outline-none transition-all placeholder:text-slate-700 focus:ring-1 ${touched.email && !isEmailValid ? 'border-red-500/50 ring-red-500/20 focus:border-red-500' : 'border-white/5 focus:ring-[#14b8a6]/50 focus:border-[#14b8a6]'}`}
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if(!touched.email) setTouched(p => ({...p, email: true}))
                }}
                onBlur={() => setTouched(p => ({ ...p, email: true }))}
              />
              {touched.email && !isEmailValid && <p className="ml-1 text-[10px] font-bold text-red-500 italic">× Please enter a valid institutional email</p>}
            </div>

            <div className="space-y-1">
              <label className={`ml-1 text-[10px] font-black uppercase tracking-widest transition-colors ${touched.password && !isPasswordValid ? 'text-red-500' : 'text-[#14b8a6]'}`}>Hub Passcode</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`h-11 w-full rounded-xl border bg-[#0d1117] px-4 pr-10 text-sm font-bold text-white outline-none transition-all placeholder:text-slate-700 focus:ring-1 ${touched.password && !isPasswordValid ? 'border-red-500/50 ring-red-500/20 focus:border-red-500' : 'border-white/5 focus:ring-[#14b8a6]/50 focus:border-[#14b8a6]'}`}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if(!touched.password) setTouched(p => ({...p, password: true}))
                  }}
                  onBlur={() => setTouched(p => ({ ...p, password: true }))}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {touched.password && !isPasswordValid && <p className="ml-1 text-[10px] font-bold text-red-500 italic">× Minimum 8 characters required</p>}
            </div>

            <button
              disabled={busy || !fullName.trim() || !email.trim() || password.length < 8 || !isLettersOnly}
              onClick={handleRegister}
              className={`mt-2 h-12 w-full rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed ${busy || !fullName.trim() || !email.trim() || password.length < 8 || !isLettersOnly ? 'bg-slate-800 text-slate-500 border border-white/5 shadow-none' : 'bg-[#14b8a6] text-white shadow-lg shadow-[#14b8a6]/20 hover:bg-[#0d9488]'}`}
            >
              {busy ? 'Creating Hub...' : 'Establish Connection'}
            </button>
          </div>

          {isGoogleClientConfigured() && (
            <div className="mt-8 flex flex-col items-center">
               <span className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Workspace Onboarding</span>
               <div className="w-full max-w-[340px] [&>div]:!w-full [&>div>div]:!w-full [&_iframe]:!w-full">
                 <GoogleLogin
                   onSuccess={async (cred) => {
                     if (!cred.credential) return
                     setBusy(true)
                     setToken(cred.credential)
                     const { ok, detail } = await refresh()
                     setBusy(false)
                     if (ok) {
                        toast('Welcome to CampusFlow!', 'success')
                        navigate('/app', { replace: true })
                     } else {
                        setError(detail ?? 'Google SSO failed.')
                     }
                   }}
                   onError={() => setError('Google sign-in could not be opened.')}
                   theme="filled_black"
                   shape="pill"
                   width="340"
                 />
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
