import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Ticket, TicketStatus } from '../types'
import clsx from 'clsx'

function ticketAttachmentUrl(storedFilename: string) {
  const base = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''
  const path = `/uploads/ticket-attachments/${encodeURIComponent(storedFilename)}`
  return base ? `${base}${path}` : path
}

export function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ticketId = Number(id)
  const { user } = useAuth()
  const qc = useQueryClient()

  const ticket = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => (await api.get<Ticket>(`/api/v1/tickets/${ticketId}`)).data,
  })

  const history = useQuery({
    queryKey: ['ticket-history', ticketId],
    queryFn: async () =>
      (
        await api.get<
          {
            id: number
            actorEmail: string
            action: string
            detail: string | null
            createdAt: string
          }[]
        >(`/api/v1/tickets/${ticketId}/history`)
      ).data,
  })

  const comments = useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: async () =>
      (
        await api.get<
          {
            id: number
            userEmail: string
            body: string
            createdAt: string
            editedAt: string | null
          }[]
        >(`/api/v1/tickets/${ticketId}/comments`)
      ).data,
  })

  const techs = useQuery({
    queryKey: ['technicians'],
    enabled: user?.role === 'ADMIN',
    queryFn: async () =>
      (await api.get<{ id: number; email: string; fullName: string; role: string }[]>('/api/v1/admin/technicians')).data,
  })

  const [comment, setComment] = useState('')
  const [assign, setAssign] = useState<number | ''>('')
  const [adminStatus, setAdminStatus] = useState<TicketStatus | ''>('')
  const [techStatus, setTechStatus] = useState<TicketStatus>('IN_PROGRESS')
  const [adminRejectReason, setAdminRejectReason] = useState('')
  const [resolutionNote, setResolutionNote] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentBody, setEditingCommentBody] = useState('')

  const assignTechnician = useMutation({
    mutationFn: async () => {
      if (assign === '') throw new Error('Select a technician')
      return (
        await api.patch<Ticket>(`/api/v1/tickets/${ticketId}`, {
          assignedTechnicianId: Number(assign),
        })
      ).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', ticketId] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['ticket-history', ticketId] })
    },
  })

  const updateAdminStatus = useMutation({
    mutationFn: async () => {
      if (adminStatus === '') throw new Error('Select a status')
      return (
        await api.patch<Ticket>(`/api/v1/tickets/${ticketId}`, {
          status: adminStatus,
          rejectReason:
            adminStatus === 'REJECTED' ? adminRejectReason.trim() || null : null,
        })
      ).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', ticketId] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['ticket-history', ticketId] })
      setAdminRejectReason('')
    },
  })

  const updateTechnician = useMutation({
    mutationFn: async () =>
      (
        await api.patch<Ticket>(`/api/v1/tickets/${ticketId}`, {
          status: techStatus,
          resolutionNote: resolutionNote.trim() || null,
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', ticketId] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['ticket-history', ticketId] })
      setResolutionNote('')
    },
  })

  const addComment = useMutation({
    mutationFn: async () => (await api.post(`/api/v1/tickets/${ticketId}/comments`, { body: comment })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket-comments', ticketId] })
      qc.invalidateQueries({ queryKey: ['ticket-history', ticketId] })
      setComment('')
    },
  })

  const editComment = useMutation({
    mutationFn: async (p: { commentId: number; body: string }) =>
      (
        await api.patch(`/api/v1/tickets/${ticketId}/comments/${p.commentId}`, {
          body: p.body,
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket-comments', ticketId] })
      qc.invalidateQueries({ queryKey: ['ticket-history', ticketId] })
      setEditingCommentId(null)
      setEditingCommentBody('')
    },
  })

  const deleteComment = useMutation({
    mutationFn: async (commentId: number) => api.delete(`/api/v1/tickets/${ticketId}/comments/${commentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket-comments', ticketId] })
      qc.invalidateQueries({ queryKey: ['ticket-history', ticketId] })
      if (editingCommentId != null) {
        setEditingCommentId(null)
        setEditingCommentBody('')
      }
    },
  })

  const cancelTicket = useMutation({
    mutationFn: async () =>
      (
        await api.patch<Ticket>(`/api/v1/tickets/${ticketId}`, {
          status: 'CLOSED',
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', ticketId] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
      toast('Ticket cancelled successfully', 'info')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to cancel ticket'
      toast(msg, 'error')
    },
  })

  const deleteTicket = useMutation({
    mutationFn: async () => api.delete(`/api/v1/tickets/${ticketId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      toast('Ticket deleted successfully', 'success')
      navigate('/app/tickets')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to delete ticket'
      toast(msg, 'error')
    },
  })

  useEffect(() => {
    const d = ticket.data
    if (!d) return
    setAssign(d.assignedTechnicianId ?? '')
  }, [ticket.data?.id, ticket.data?.assignedTechnicianId])

  if (!Number.isFinite(ticketId)) return <p className="text-slate-400">Invalid ticket</p>
  if (!ticket.data) return <p className="text-slate-400">Loading…</p>

  const t = ticket.data

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ticket #{t.id}</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.category}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2 border-slate-100">
          <h2 className="mb-4 text-sm font-bold text-slate-800 uppercase tracking-wider">Issue Parameters</h2>
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">{t.description}</p>
          </div>
          <div className="grid gap-3 text-[11px] font-bold sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 w-20">Priority:</span>
              <span className="text-slate-900">{t.priority}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 w-20">Status:</span>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-100">{t.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 w-20">Reporter:</span>
              <span className="text-slate-900">{t.reporterEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 w-20">Contact:</span>
              <span className="text-slate-900">{t.contactEmail}</span>
            </div>
            {t.facilityName && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 w-20">Facility:</span>
                <span className="text-slate-900">{t.facilityName}</span>
              </div>
            )}
            {t.assignedTechnicianEmail && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 w-20">Technician:</span>
                <span className="text-slate-900">{t.assignedTechnicianEmail}</span>
              </div>
            )}
            {t.resolutionNote && (
              <div className="flex flex-col gap-1 mt-2 col-span-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Resolution Note</span>
                <span className="text-sm font-semibold text-slate-800">{t.resolutionNote}</span>
              </div>
            )}
            {t.rejectReason && (
              <div className="flex flex-col gap-1 mt-2 col-span-2 bg-rose-50 p-3 rounded-xl border border-rose-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Rejection Reason</span>
                <span className="text-sm font-semibold text-slate-800">{t.rejectReason}</span>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4">Evidence & Files</div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {t.attachments.map((a) => {
                const href = ticketAttachmentUrl(a.storedFilename)
                const isImg = a.contentType.startsWith('image/')
                return (
                  <li key={a.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 shadow-sm hover:shadow-md transition">
                    {isImg && (
                      <a href={href} target="_blank" rel="noreferrer" className="mb-3 block overflow-hidden rounded-xl border border-slate-200">
                        <img
                          src={href}
                          alt={a.originalFilename}
                          className="max-h-48 w-full object-cover hover:scale-105 transition duration-500"
                          loading="lazy"
                        />
                      </a>
                    )}
                    <a className="text-xs font-bold text-teal-700 hover:text-teal-900 truncate block" href={href} target="_blank" rel="noreferrer">
                      {a.originalFilename}
                    </a>
                  </li>
                )
              })}
              {t.attachments.length === 0 && <li className="text-xs font-bold text-slate-400 italic">No attachments provided.</li>}
            </ul>
          </div>
        </div>
        <div className="card border-slate-100">
          <h2 className="mb-4 text-sm font-bold text-slate-800 uppercase tracking-wider">Management</h2>
          {user?.role === 'ADMIN' && (
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                Workflow: Save assignment first, then update status to closed.
              </p>
              <div>
                <label className="label">Assignment</label>
                <select
                  className="input font-bold text-xs"
                  value={assign === '' ? '' : String(assign)}
                  onChange={(e) => setAssign(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Unassigned</option>
                  {techs.data?.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.fullName} ({x.email})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-primary w-full h-10 font-bold text-xs"
                disabled={assign === '' || assignTechnician.isPending}
                onClick={() => assignTechnician.mutate()}
              >
                Update Assignment
              </button>

              <div className="pt-4 border-t border-slate-100">
                <label className="label">Force Status</label>
                <select
                  className="input font-bold text-xs"
                  value={adminStatus}
                  onChange={(e) => setAdminStatus(e.target.value as TicketStatus | '')}
                >
                  <option value="">Select status…</option>
                  {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'] as TicketStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {adminStatus === 'REJECTED' && (
                <div>
                  <label className="label">Rejection Reason</label>
                  <textarea
                    className="input min-h-[80px]"
                    value={adminRejectReason}
                    onChange={(e) => setAdminRejectReason(e.target.value)}
                    placeholder="Enter reason…"
                  />
                </div>
              )}
              <button
                type="button"
                className="btn btn-ghost w-full font-bold text-xs h-10 border-slate-200"
                disabled={
                  adminStatus === '' ||
                  updateAdminStatus.isPending ||
                  (adminStatus === 'REJECTED' && !adminRejectReason.trim())
                }
                onClick={() => updateAdminStatus.mutate()}
              >
                Apply Transition
              </button>
            </div>
          )}
          {user?.role === 'TECHNICIAN' &&
            (t.assignedTechnicianId != null && user.id === t.assignedTechnicianId ? (
              <div className="space-y-4">
                <p className="text-[11px] font-bold text-slate-400 bg-teal-50 p-3 rounded-xl border border-teal-100">
                  Update progress or close the ticket when resolution is verified.
                </p>
                <div>
                  <label className="label">My Progress</label>
                  <select
                    className="input font-bold text-xs"
                    value={techStatus}
                    onChange={(e) => setTechStatus(e.target.value as TicketStatus)}
                  >
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                <div>
                  <label className="label">Resolution Summary</label>
                  <textarea
                    className="input min-h-[100px]"
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Describe what was fixed…"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary w-full h-11 font-bold shadow-lg shadow-teal-500/30"
                  disabled={updateTechnician.isPending}
                  onClick={() => updateTechnician.mutate()}
                >
                  Confirm Update
                </button>
              </div>
            ) : (
              <p className="text-xs font-bold text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
                Not assigned to you. Admin review is needed.
              </p>
            ))}
          {user?.role === 'USER' && (
            <div className="space-y-4">
              {t.status === 'OPEN' ? (
                <>
                  <p className="text-[11px] font-bold text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    If this issue is no longer relevant, you can cancel your request.
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost w-full h-11 font-bold border-rose-100 text-rose-500 hover:bg-rose-50"
                    disabled={cancelTicket.isPending}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this ticket?')) {
                        cancelTicket.mutate()
                      }
                    }}
                  >
                    {cancelTicket.isPending ? 'Cancelling...' : 'Cancel Ticket'}
                  </button>
                </>
              ) : (
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <p className="text-xs font-bold text-slate-500 mb-1 capitalize">Ticket is {t.status.toLowerCase().replace('_', ' ')}</p>
                  <p className="text-[10px] font-medium text-slate-400 leading-relaxed mb-3">
                    {t.status === 'IN_PROGRESS' 
                      ? 'A technician has been assigned and is currently working on your request. You will be notified of any updates.' 
                      : t.status === 'RESOLVED' 
                        ? 'The issue has been marked as fixed. Please verify the resolution.' 
                        : 'This ticket is now closed. If you have further issues, please open a new ticket.'}
                  </p>
                  <div className="pt-3 border-t border-slate-200/50 space-y-2">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Assigned Technician</p>
                      <p className="text-[10px] font-bold text-slate-700">{t.assignedTechnicianEmail || 'Pending Assignment'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Expected Resolution</p>
                      <p className="text-[10px] font-bold text-slate-700">24–48 Business Hours</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Support Contact</p>
                      <p className="text-[10px] font-bold text-teal-600">ops-support@campusflow.edu</p>
                    </div>
                  </div>
                </div>
              )}
              {(user?.role === 'ADMIN' || (user?.email === t.reporterEmail && t.status === 'OPEN')) && (
                <div className="pt-2">
                  <button
                    type="button"
                    className="btn btn-ghost w-full h-10 font-bold border-rose-100 text-rose-500 hover:bg-rose-50 text-[10px]"
                    disabled={deleteTicket.isPending}
                    onClick={() => {
                      if (window.confirm('PERMANENTLY delete this ticket and all its data?')) {
                        deleteTicket.mutate()
                      }
                    }}
                  >
                    {deleteTicket.isPending ? 'Deleting...' : 'Delete Ticket'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
