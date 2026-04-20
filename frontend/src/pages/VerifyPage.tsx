import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useToast } from '../components/Toast'

export function VerifyPage() {
  const { toast } = useToast()
  const urlPayload = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('payload') ?? ''
    } catch {
      return ''
    }
  }, [])

  const [payload, setPayload] = useState(urlPayload)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [autoTried, setAutoTried] = useState(false)
  const [busy, setBusy] = useState(false)

  async function verify(p?: string) {
    const realPayload = (p ?? payload).trim()
    if (!realPayload) return
    setErr(null)
    setResult(null)
    setBusy(true)
    try {
      const { data } = await api.get<Record<string, unknown>>('/api/v1/public/bookings/verify', {
        params: { payload: realPayload },
      })
      setResult(data)
      if (data.valid) toast('Verified!', 'success')
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? 'Verification failed.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (urlPayload && !autoTried) {
      setAutoTried(true)
      void verify(urlPayload)
    }
  }, [urlPayload, autoTried])

  return (
    <div className="flex h-full items-center justify-center bg-[#0d1117] px-4 font-sans relative overflow-hidden">
      {/* Background accents to match Auth Pages */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#14b8a6]/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-[400px] rounded-[2rem] bg-[#161b22] p-10 shadow-2xl shadow-black/80 border border-white/5">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#14b8a6] transition-colors">
          <ArrowLeft size={14} /> Back to Hub
        </Link>
        
        <h1 className="mb-2 text-2xl font-black text-white tracking-tight">Security Check</h1>
        <p className="mb-8 text-[10px] font-black uppercase tracking-widest text-[#14b8a6]">Operations Hub Verification</p>

        <div className="space-y-6">
          <div className="space-y-1">
             <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-white/40">Access Token / Payload</label>
             <textarea
               className="w-full min-h-[100px] rounded-xl border border-white/5 bg-[#0d1117] p-4 text-sm font-bold text-white outline-none transition-all placeholder:text-slate-700 focus:ring-1 focus:ring-[#14b8a6]/50 focus:border-[#14b8a6] resize-none"
               placeholder="Paste secure payload here..."
               value={payload}
               onChange={(e) => setPayload(e.target.value)}
             />
          </div>

          <button
            disabled={busy || !payload.trim()}
            onClick={() => void verify()}
            className="h-12 w-full rounded-xl bg-[#14b8a6] text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-[#14b8a6]/20 transition-all hover:bg-[#0d9488] active:scale-95 disabled:opacity-50"
          >
            {busy ? 'Validating...' : 'Verify Token'}
          </button>
        </div>

        {err && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-400 border border-red-500/20">
            <AlertCircle size={14} className="shrink-0" />
            {err}
          </div>
        )}

        {result && (
          <div className={`mt-8 p-5 rounded-2xl border ${result.valid ? 'bg-teal-500/5 border-teal-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
            <div className={`flex items-center gap-2 mb-3 font-black text-xs uppercase tracking-tighter ${result.valid ? 'text-[#14b8a6]' : 'text-rose-400'}`}>
              {result.valid ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {result.valid ? 'AUTHORIZED ACCESS' : 'INVALID TOKEN'}
            </div>
            <div className="h-px w-full bg-white/5 mb-3" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Booking Reference</p>
            <p className="mt-1 text-sm font-bold text-white tracking-tight">{String(result.bookingId ?? 'None')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
