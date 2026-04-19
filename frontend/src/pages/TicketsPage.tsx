import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Facility, Ticket, TicketPriority } from '../types'
import clsx from 'clsx'

export function TicketsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [facilityId, setFacilityId] = useState<number | ''>('')
  const [category, setCategory] = useState('AV / IT')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM')
  const [contactEmail, setContactEmail] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function mergeFiles(incoming: FileList | File[] | null) {
    if (!incoming || incoming.length === 0) return
    const add = Array.from(incoming)
    setFiles((prev) => {
      const out = [...prev]
      for (const f of add) {
        if (out.length >= 3) break
        const dup = out.some((x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified)
        if (!dup) out.push(f)
      }
      return out
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const tickets = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => (await api.get<Ticket[]>('/api/v1/tickets')).data,
  })

  const facilities = useQuery({
    queryKey: ['facilities-all'],
    queryFn: async () => (await api.get<Facility[]>('/api/v1/facilities')).data,
  })

  const create = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      if (facilityId !== '') fd.append('facilityId', String(facilityId))
      fd.append('category', category)
      fd.append('description', description)
      fd.append('priority', priority)
      fd.append('contactEmail', contactEmail)
      for (const f of files.slice(0, 3)) {
        fd.append('files', f, f.name)
      }
      return (await api.post<Ticket>('/api/v1/tickets', fd)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      setOpen(false)
      setDescription('')
      setFiles([])
      setFileInputKey((k) => k + 1)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance & incidents</h1>
          <p className="text-sm font-medium text-slate-500">Create tickets, attach evidence, track resolution</p>
          {(user?.role === 'ADMIN' || user?.role === 'TECHNICIAN') && (
            <p className="mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="text-slate-500">Workflow:</span> open a ticket by its{' '}
              <span className="text-teal-600">#ID</span> link — there you can assign technicians (admin), set
              status to Resolved or Closed,
              and add comments.
            </p>
          )}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4" /> New ticket
        </button>
      </div>
      {open && (
        <div className="card border-slate-100">
          <h2 className="mb-4 text-sm font-bold text-slate-800">Create ticket</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">Facility (optional)</label>
              <select
                className="input"
                value={facilityId === '' ? '' : String(facilityId)}
                onChange={(e) => setFacilityId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Not linked</option>
                {facilities.data?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
              >
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TicketPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea className="input min-h-[110px]" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Contact email</label>
              <input className="input" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Attachments (max 3 images)</label>
              <p className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-tight">
                Hold <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono text-[10px] text-slate-600">Ctrl</kbd> or <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono text-[10px] text-slate-600">⌘</kbd> to select multiple several at once.
              </p>
              <input
                key={fileInputKey}
                ref={fileInputRef}
                className="input"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => mergeFiles(e.target.files)}
              />
              {files.length > 0 && (
                <ul className="mt-4 space-y-1 text-xs">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${f.size}-${f.lastModified}-${i}`} className="flex items-center gap-2">
                      <span className="truncate font-bold text-slate-700">{f.name}</span>
                      <button
                        type="button"
                        className="shrink-0 font-black text-rose-500 hover:underline"
                        onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="md:col-span-2">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!description || !contactEmail || create.isPending}
                onClick={() => create.mutate()}
              >
                Submit ticket
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="card overflow-x-auto border-slate-100">
        <table className="w-full min-w-[1020px] text-left text-sm">
          <thead className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th className="pb-4">ID</th>
              <th className="pb-4">Category</th>
              <th className="pb-4">Priority</th>
              <th className="pb-4">Status</th>
              {user?.role === 'ADMIN' && <th className="pb-4">Assigned</th>}
              <th className="pb-4">Actions</th>
              <th className="pb-4 text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.data?.map((t) => (
              <tr key={t.id} className="text-slate-600">
                <td className="py-4">
                  <Link className="font-black text-teal-600 hover:underline" to={`/app/tickets/${t.id}`}>
                    #{t.id}
                  </Link>
                </td>
                <td className="py-4 font-bold text-slate-900">{t.category}</td>
                <td className="py-4 font-bold text-xs">{t.priority}</td>
                <td className="py-4">
                  <span className={clsx(
                    'rounded-full px-3 py-1 text-[11px] font-bold shadow-sm ring-1',
                    t.status === 'CLOSED' || t.status === 'RESOLVED' ? 'bg-slate-100 text-slate-600 ring-slate-200' :
                    t.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 ring-amber-100' :
                    'bg-teal-50 text-teal-700 ring-teal-100'
                  )}>
                    {t.status}
                  </span>
                </td>
                {user?.role === 'ADMIN' && (
                  <td className="py-4 text-[11px] font-bold text-slate-400">
                    {t.assignedTechnicianEmail ?? '—'}
                  </td>
                )}
                <td className="py-4">
                  <Link
                    className="font-bold text-teal-600 hover:underline text-xs"
                    to={`/app/tickets/${t.id}`}
                  >
                    Open details
                  </Link>
                </td>
                <td className="py-4 text-right text-[11px] font-bold text-slate-400">{format(new Date(t.updatedAt), 'PPp')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
