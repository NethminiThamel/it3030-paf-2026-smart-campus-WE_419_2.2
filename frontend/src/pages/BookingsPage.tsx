import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useMemo, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/Toast'
import type { Booking, BookingStatus, Facility } from '../types'

import clsx from 'clsx'

type BookingQrResponse = {
  imageBase64: string
  payload: string
  passUrl: string
  qrText: string
}

export function BookingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const qc = useQueryClient()

  const [facilityId, setFacilityId] = useState<number | ''>('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [purpose, setPurpose] = useState('')
  const [attendees, setAttendees] = useState('30')

  const facilities = useQuery({
    queryKey: ['facilities-all'],
    queryFn: async () => (await api.get<Facility[]>('/api/v1/facilities')).data,
  })

  const bookings = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => (await api.get<Booking[]>('/api/v1/bookings')).data,
  })

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post<Booking>('/api/v1/bookings', {
          facilityId,
          startTime: new Date(start).toISOString(),
          endTime: new Date(end).toISOString(),
          purpose,
          expectedAttendees: Number(attendees),
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      toast('Booking request submitted!', 'success')
      setPurpose('')
      setFacilityId('')
    },
  })


  const decide = useMutation({
    mutationFn: async (p: { id: number; decision: BookingStatus; reason?: string }) =>
      (
        await api.patch<Booking>(`/api/v1/bookings/${p.id}/decision`, {
          decision: p.decision,
          reason: p.reason ?? null,
        })
      ).data,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      toast(`Booking ${variables.decision.toLowerCase()}!`, 'info')
    },
  })


  const cancel = useMutation({
    mutationFn: async (id: number) => api.patch(`/api/v1/bookings/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      toast('Booking cancelled.', 'info')
    },
  })


  const [qrFor, setQrFor] = useState<number | null>(null)

  const qrData = useQuery({
    queryKey: ['booking-qr', qrFor, typeof window !== 'undefined' ? window.location.hostname : ''],
    enabled: qrFor != null,
    queryFn: async () => {
      const port = import.meta.env.VITE_BACKEND_PORT ?? '9094'
      const { protocol, hostname } = window.location
      const passBase =
        hostname !== 'localhost' && hostname !== '127.0.0.1'
          ? `${protocol}//${hostname}:${port}`
          : ''
      const qs = passBase ? `?passBase=${encodeURIComponent(passBase)}` : ''
      return (await api.get<BookingQrResponse>(`/api/v1/bookings/${qrFor}/qr${qs}`)).data
    },
  })

  const canCreate = useMemo(
    () => facilityId && start && end && purpose && attendees,
    [facilityId, start, end, purpose, attendees],
  )

  const passUrl = qrData.data?.passUrl ?? ''
  const summaryText = qrData.data?.qrText ?? ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
        <p className="text-sm font-medium text-slate-500">Request, approve, and manage bookings.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card border-slate-100">
          <h2 className="mb-4 text-sm font-bold text-slate-800">New booking request</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Facility</label>
              <select
                className="input"
                value={facilityId === '' ? '' : String(facilityId)}
                onChange={(e) => setFacilityId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Select…</option>
                {facilities.data?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} · {f.location}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Start</label>
                <input className="input" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div>
                <label className="label">End</label>
                <input className="input" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Purpose</label>
              <input className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </div>
            <div>
              <label className="label">Expected attendees</label>
              <input className="input" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
            </div>
            <button
              type="button"
              className="btn btn-primary w-full disabled:opacity-40"
              disabled={!canCreate || create.isPending}
              onClick={() => create.mutate()}
            >
              Submit request
            </button>
            {create.isError && (
              <p className="text-sm text-rose-500 font-bold">
                {(create.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                  'Request failed'}
              </p>
            )}
          </div>
        </div>
        <div className="card border-slate-100">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
            <QrCode className="h-4 w-4 text-teal-600" /> Booking QR
          </h2>
          {qrFor && passUrl ? (
            <div className="flex w-full max-w-md flex-col items-stretch gap-3">
              <div className="flex justify-center p-4 rounded-3xl bg-slate-50 border border-slate-200 shadow-inner">
                <QRCodeSVG
                  value={`${summaryText}\nOfficial Link:\n${passUrl}`}
                  size={240}
                  level="M"
                  bgColor="#f8fafc"
                  fgColor="#101924"
                />
              </div>
              <pre className="max-h-48 overflow-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-left text-[11px] font-bold leading-relaxed text-slate-600 whitespace-pre-wrap break-words">
                {summaryText}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Select “Show QR” on an approved booking.</p>
          )}
        </div>
      </div>
      <div className="card overflow-x-auto border-slate-100">
        <h2 className="mb-4 text-sm font-bold text-slate-800">
          {user?.role === 'ADMIN' ? 'All bookings' : 'Your bookings'}
        </h2>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th className="pb-4">Facility</th>
              <th className="pb-4">When</th>
              <th className="pb-4">Status</th>
              <th className="pb-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.data?.map((b) => (
              <tr key={b.id} className="text-slate-600">
                <td className="py-4">
                  <div className="font-bold text-slate-900">{b.facilityName}</div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{b.purpose}</div>
                </td>
                <td className="py-4 font-medium text-xs">
                  {format(new Date(b.startTime), 'PPp')} → {format(new Date(b.endTime), 'PPp')}
                </td>
                <td className="py-4">
                  <span className={clsx(
                    'rounded-full px-3 py-1 text-[11px] font-bold shadow-sm ring-1',
                    b.status === 'APPROVED' ? 'bg-teal-50 text-teal-700 ring-teal-100' :
                    b.status === 'PENDING' ? 'bg-amber-50 text-amber-700 ring-amber-100' :
                    'bg-slate-100 text-slate-600 ring-slate-200'
                  )}>
                    {b.status}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex flex-wrap gap-2">
                    {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                      <button type="button" className="btn btn-ghost text-[11px] h-8 font-bold" onClick={() => cancel.mutate(b.id)}>
                        Cancel
                      </button>
                    )}
                    {b.status === 'APPROVED' && b.qrToken && (
                      <button type="button" className="btn btn-primary text-[11px] h-8 font-bold" onClick={() => setQrFor(b.id)}>
                        Show QR
                      </button>
                    )}
                    {user?.role === 'ADMIN' && b.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary text-[11px] h-8 font-bold"
                          onClick={() => decide.mutate({ id: b.id, decision: 'APPROVED' })}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost text-[11px] h-8 font-bold"
                          onClick={() => {
                            const reason = window.prompt('Reason to reject?') ?? ''
                            decide.mutate({ id: b.id, decision: 'REJECTED', reason })
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
