import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

export function VerifyPage() {
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

  const receiptText = useMemo(() => {
    const r = result as
      | (Record<string, unknown> & {
          valid?: boolean
          bookingId?: unknown
          facilityName?: unknown
          startTime?: unknown
          endTime?: unknown
          requesterEmail?: unknown
        })
      | null
    if (!r) return ''

    const lines: string[] = []
    lines.push('SMARTCAMPUS CHECK-IN')
    lines.push('----------------------')
    lines.push(`Valid: ${String(r.valid ?? false)}`)
    if (r.bookingId != null) lines.push(`Booking ID: ${String(r.bookingId)}`)
    if (r.facilityName != null) lines.push(`Resource: ${String(r.facilityName)}`)
    if (r.startTime != null) lines.push(`Start: ${String(r.startTime)}`)
    if (r.endTime != null) lines.push(`End: ${String(r.endTime)}`)
    if (r.requesterEmail != null) lines.push(`Requester: ${String(r.requesterEmail)}`)
    lines.push('')
    lines.push('Raw payload:')
    lines.push(JSON.stringify(r, null, 2))
    return lines.join('\n')
  }, [result])

  const downloadTxt = () => {
    if (!receiptText) return
    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'smartcampus-checkin.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyTxt = async () => {
    if (!receiptText) return
    try {
      await navigator.clipboard.writeText(receiptText)
    } catch {
      // ignore
    }
  }

  async function verify(p?: string) {
    const realPayload = (p ?? payload).trim()
    setErr(null)
    setResult(null)
    try {
      const { data } = await api.get<Record<string, unknown>>('/api/v1/public/bookings/verify', {
        params: { payload: realPayload },
      })
      setResult(data)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Verification failed'
      setErr(msg)
    }
  }

  useEffect(() => {
    if (urlPayload && !autoTried) {
      setAutoTried(true)
      void verify(urlPayload)
    }
  }, [urlPayload, autoTried])

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="card max-w-xl w-full">
        <h1 className="text-xl font-semibold text-white">Booking QR verification</h1>
        <p className="mt-2 text-sm text-slate-400">
          Paste a check-in payload in the form <code className="text-teal-300">SMARTCAMPUS:bookingId:token</code>. The
          the booking QR opens the public pass URL; use this payload for recorded check-in (API or internal tools).
        </p>
        <textarea className="input mt-4 min-h-[100px]" value={payload} onChange={(e) => setPayload(e.target.value)} />
        <button type="button" className="btn btn-primary mt-3 w-full" onClick={() => void verify()}>
          Verify
        </button>
        {err && (
          <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {err}
          </div>
        )}
        {result && (
          <div className="mt-4 space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-sm font-semibold text-slate-200">Verification result</div>
            <div className="grid gap-2 text-sm text-slate-300">
              <div>
                <span className="font-medium text-slate-200">Valid:</span> {String(result.valid ?? false)}
              </div>
              {'bookingId' in result && (
                <div>
                  <span className="font-medium text-slate-200">Booking ID:</span> {String(result.bookingId)}
                </div>
              )}
              {'facilityName' in result && (
                <div>
                  <span className="font-medium text-slate-200">Resource:</span> {String(result.facilityName)}
                </div>
              )}
              {'startTime' in result && (
                <div>
                  <span className="font-medium text-slate-200">Start:</span> {String(result.startTime)}
                </div>
              )}
              {'endTime' in result && (
                <div>
                  <span className="font-medium text-slate-200">End:</span> {String(result.endTime)}
                </div>
              )}
              {'requesterEmail' in result && (
                <div>
                  <span className="font-medium text-slate-200">Requester:</span> {String(result.requesterEmail)}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadTxt()}>
                Download TXT
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void copyTxt()}>
                Copy
              </button>
            </div>
            <pre className="mt-2 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] text-slate-300">
              {receiptText}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
