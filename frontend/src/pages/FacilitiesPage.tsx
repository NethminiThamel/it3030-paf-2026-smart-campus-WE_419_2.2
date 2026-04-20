import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Filter, MapPin, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/Toast'
import type { Facility, FacilityStatus, FacilityType } from '../types'

import clsx from 'clsx'

const types: FacilityType[] = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']

const emptyForm = () => ({
  name: '',
  resourceType: 'MEETING_ROOM' as FacilityType,
  capacity: '10',
  location: '',
  availabilityWindow: '',
  status: 'ACTIVE' as FacilityStatus,
  description: '',
})

export function FacilitiesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const qc = useQueryClient()

  const isAdmin = user?.role === 'ADMIN'

  const [type, setType] = useState<FacilityType | ''>('')
  const [minCap, setMinCap] = useState('')
  const [loc, setLoc] = useState('')
  const [status, setStatus] = useState<FacilityStatus | ''>('')
  const [onlyAvail, setOnlyAvail] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFiles, setImageFiles] = useState<FileList | null>(null)
  const [busy, setBusy] = useState(false)

  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (type) p.set('type', type)
    if (minCap) p.set('minCapacity', minCap)
    if (loc) p.set('location', loc)
    if (status) p.set('status', status)
    if (onlyAvail) p.set('onlyAvailableNow', 'true')
    return p.toString()
  }, [type, minCap, loc, status, onlyAvail])

  const q = useQuery({
    queryKey: ['facilities', params],
    queryFn: async () => (await api.get<Facility[]>(`/api/v1/facilities?${params}`)).data,
  })

  const invalidateFacilities = () => {
    void qc.invalidateQueries({ queryKey: ['facilities'] })
    void qc.invalidateQueries({ queryKey: ['facilities-all'] })
  }

  const payloadFromForm = () => ({
    name: form.name.trim(),
    resourceType: form.resourceType,
    capacity: Number(form.capacity),
    location: form.location.trim(),
    availabilityWindow: form.availabilityWindow.trim() || null,
    status: form.status,
    description: form.description.trim() || null,
  })

  const getFacilityImageUrl = (imagePath: string) =>
    imagePath.startsWith('http')
      ? imagePath
      : `${import.meta.env.VITE_API_BASE || ''}${imagePath}`

  const createMut = useMutation({
    mutationFn: async () => (await api.post<Facility>('/api/v1/facilities', payloadFromForm())).data,
  })

  const updateMut = useMutation({
    mutationFn: async (id: number) =>
      (await api.put<Facility>(`/api/v1/facilities/${id}`, payloadFromForm())).data,
  })

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/facilities/${id}`)
    },
    onSuccess: () => {
      invalidateFacilities()
      toast('Resource deleted successfully!', 'info')
    },
  })

  const uploadImages = async (facilityId: number, files: File[]) => {
    if (files.length === 0) return
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    await api.post<Facility>(`/api/v1/facilities/${facilityId}/images`, fd)
  }

  const submitForm = async () => {
    setBusy(true)
    try {
      if (editingId != null) {
        const updated = await updateMut.mutateAsync(editingId)
        const files = imageFiles ? Array.from(imageFiles) : []
        await uploadImages(updated.id, files)
        toast('Resource updated successfully!', 'success')
      } else {
        const created = await createMut.mutateAsync()
        const files = imageFiles ? Array.from(imageFiles) : []
        await uploadImages(created.id, files)
        toast('Resource created successfully!', 'success')
      }

      invalidateFacilities()
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm())
      setImageFiles(null)
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save resource.'
      toast(msg, 'error')
    } finally {
      setBusy(false)
    }

  }

  const startEdit = (f: Facility) => {
    setEditingId(f.id)
    setShowForm(true)
    setImageFiles(null)
    setForm({
      name: f.name,
      resourceType: f.resourceType,
      capacity: String(f.capacity),
      location: f.location,
      availabilityWindow: f.availabilityWindow ?? '',
      status: f.status,
      description: f.description ?? '',
    })
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
    setImageFiles(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facilities catalogue</h1>
          <p className="text-sm text-slate-500 font-medium">Search bookable spaces and equipment</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            className="btn btn-primary inline-flex items-center gap-2"
            onClick={() => {
              setEditingId(null)
              setForm(emptyForm())
              setImageFiles(null)
              setShowForm((v) => !v)
            }}
          >
            <Plus className="h-4 w-4" />
            {showForm ? 'Close form' : 'Add resource'}
          </button>
        )}
      </div>
      {isAdmin && showForm && (
        <div className="card border border-teal-500/25">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            {editingId != null ? 'Edit resource' : 'New resource'}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Seminar Room B2"
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.resourceType}
                onChange={(e) => setForm((f) => ({ ...f, resourceType: e.target.value as FacilityType }))}
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Capacity</label>
              <input
                className="input"
                inputMode="numeric"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value.replace(/[^0-9]/g, '') }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Location</label>
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Building / wing / room"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Availability window (optional)</label>
              <input
                className="input"
                value={form.availabilityWindow}
                onChange={(e) => setForm((f) => ({ ...f, availabilityWindow: e.target.value }))}
                placeholder="e.g. Mon–Fri 08:00–18:00"
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FacilityStatus }))}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Description (optional)</label>
              <textarea
                className="input min-h-[80px]"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Resource images (optional, admin only)</label>
              <input
                type="file"
                className="input"
                accept="image/*"
                multiple
                onChange={(e) => setImageFiles(e.target.files)}
              />
              <p className="mt-1 text-xs text-slate-400">Uploaded images appear on the facilities cards.</p>
            </div>
          </div>
          {(createMut.isError || updateMut.isError) && (
            <p className="mt-3 text-sm text-rose-300">
              Could not save. Check all required fields (name, location, capacity ≥ 1) and try again.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary disabled:opacity-40"
              disabled={
                !form.name.trim() ||
                !form.location.trim() ||
                !form.capacity ||
                Number(form.capacity) < 1 ||
                createMut.isPending ||
                updateMut.isPending ||
                busy
              }
              onClick={() => void submitForm()}
            >
              {busy ? 'Saving…' : editingId != null ? 'Save changes' : 'Create resource'}
            </button>
            <button type="button" className="btn border border-slate-600 bg-transparent" onClick={cancelForm}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="card">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700">
          <Filter className="h-4 w-4 text-teal-400" /> Filters
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="label">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value as FacilityType | '')}>
              <option value="">Any</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Min capacity</label>
            <input
              className="input"
              inputMode="numeric"
              placeholder="e.g. 30"
              value={minCap}
              onChange={(e) => setMinCap(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>
          <div>
            <label className="label">Location contains</label>
            <input className="input" placeholder="Building / wing" value={loc} onChange={(e) => setLoc(e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as FacilityStatus | '')}>
              <option value="">Any</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-slate-300">
            <input type="checkbox" checked={onlyAvail} onChange={(e) => setOnlyAvail(e.target.checked)} />
            Available now
          </label>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {q.isLoading && <p className="text-slate-400">Loading…</p>}
        {q.isError && (
          <p className="text-rose-300 md:col-span-2 xl:col-span-3">Could not load facilities. Is the backend running?</p>
        )}
        {!q.isLoading && !q.isError && q.data?.length === 0 && (
          <p className="text-slate-400 md:col-span-2 xl:col-span-3">
            No facilities match these filters.
            {isAdmin && ' Use “Add resource” to create one.'}
          </p>
        )}
        {q.data?.map((f) => (
          <div key={f.id} className="card border-slate-100 transition-all hover:shadow-xl hover:shadow-black/5">
            {f.images.length > 0 && (
              <img
                src={getFacilityImageUrl(f.images[0])}
                alt={`${f.name} image`}
                className="mb-2 h-32 w-full rounded-md object-cover"
              />
            )}
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="text-lg font-bold text-slate-900">{f.name}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{f.resourceType.replaceAll('_', ' ')}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-teal-200"
                      title="Edit"
                      onClick={() => startEdit(f)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-300"
                      title="Delete"
                      disabled={deleteMut.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete “${f.name}”? Bookings may reference this facility.`)) {
                          deleteMut.mutate(f.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                <span
                  className={clsx(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm',
                    f.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
                  )}
                >
                  {f.status}
                </span>
              </div>
            </div>
            <p className="mb-3 text-sm text-slate-500 line-clamp-3 font-medium">{f.description}</p>
            <div className="space-y-1 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {f.location}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                Capacity {f.capacity}
              </div>
              {f.availabilityWindow && <div>Hours: {f.availabilityWindow}</div>}
              {f.currentlyAvailable != null && (
                <div className="pt-1">
                  <span
                    className={clsx(
                      'rounded-full px-2 py-0.5 text-[11px] font-bold shadow-sm ring-1',
                      f.currentlyAvailable ? 'bg-teal-50 text-teal-700 ring-teal-200' : 'bg-slate-100 text-slate-600 ring-slate-200',
                    )}
                  >
                    {f.currentlyAvailable ? 'Likely free now' : 'Occupied / unavailable'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
