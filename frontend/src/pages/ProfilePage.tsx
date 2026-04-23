import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/Toast'
import { User, Mail, Shield, Save, LogOut, CheckCircle2, Camera } from 'lucide-react'
import clsx from 'clsx'

const ROLE_CONFIG: Record<string, { label: string; classes: string }> = {
  ADMIN: { label: 'Administrator', classes: 'bg-violet-100 text-violet-700 ring-violet-200' },
  TECHNICIAN: { label: 'Technician', classes: 'bg-blue-100 text-blue-700 ring-blue-200' },
  USER: { label: 'Standard User', classes: 'bg-teal-100 text-teal-700 ring-teal-200' },
}

const AVATAR_GRADIENTS = [
  'from-teal-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-blue-500 to-indigo-500',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-green-500',
]

export function ProfilePage() {
  const { user, logout, refresh } = useAuth()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [fullName, setFullName] = useState(user?.fullName || '')

  const updateProfile = useMutation({
    mutationFn: async (name: string) =>
      (await api.patch('/api/v1/me', { fullName: name })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      refresh()
      toast('Profile updated successfully', 'success')
    },
    onError: () => toast('Failed to update profile', 'error'),
  })

  const uploadPhoto = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return (await api.post('/api/v1/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      refresh()
      toast('Profile photo updated', 'success')
    },
    onError: () => toast('Failed to upload photo', 'error'),
  })


  if (!user) return null

  const initials = (user.fullName || user.email)
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const gradientIndex =
    (user.fullName || user.email).split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) %
    AVATAR_GRADIENTS.length
  const avatarGradient = AVATAR_GRADIENTS[gradientIndex]
  const roleConf = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.USER
  const isDirty = fullName !== user.fullName && fullName.trim().length > 0

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadPhoto.mutate(file)
  }

  const imageUrl = user.profilePicture 
    ? `${import.meta.env.VITE_API_BASE}${user.profilePicture}` 
    : null

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* ── Hero banner ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1117] via-[#0f2027] to-[#0d3040] p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-cyan-500/8 blur-2xl" />

        <div className="relative flex items-center gap-6">
          {/* Big avatar */}
          <div className="group relative flex-shrink-0">
            <div className={clsx(
              'flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl font-black text-white shadow-xl ring-4 ring-white/10 overflow-hidden',
              !imageUrl && avatarGradient,
              imageUrl ? 'bg-white' : ''
            )}>
              {imageUrl ? (
                <img src={imageUrl} alt={user.fullName} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            
            <label className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg ring-4 ring-[#0d1117] transition hover:scale-110 active:scale-95">
              <Camera className="h-4 w-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>

            {uploadPhoto.isPending && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-[2px]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">Account Profile</p>
            <h1 className="text-2xl font-black tracking-tight text-white truncate">{user.fullName}</h1>
            <p className="text-[12px] text-white/50 truncate mt-0.5">{user.email}</p>
          </div>

          <div className="flex-shrink-0">
            <span className={clsx('inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider ring-1', roleConf.classes)}>
              <Shield className="h-3 w-3" />
              {roleConf.label}
            </span>
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* ── Left: account info card ── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Account Info</p>

            <div className="space-y-3">
              <InfoRow label="Full Name" value={user.fullName} icon={<User className="h-3.5 w-3.5" />} />
              <InfoRow label="Email" value={user.email} icon={<Mail className="h-3.5 w-3.5" />} />
              <InfoRow label="Role" value={roleConf.label} icon={<Shield className="h-3.5 w-3.5" />} />
            </div>
          </div>

          {/* Access level card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Access Permissions</p>
            <div className="space-y-2">
              {getPermissions(user.role).map((perm) => (
                <div key={perm} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-teal-500" />
                  <span className="text-[12px] text-slate-600">{perm}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-3 text-[12px] font-bold uppercase tracking-wider text-red-500 transition hover:bg-red-100 active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {/* ── Right: edit form ── */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Personal Information</h2>
                <p className="mt-0.5 text-[12px] text-slate-400">Update your display name below</p>
              </div>
              {isDirty && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 ring-1 ring-amber-200">
                  Unsaved changes
                </span>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(fullName) }}
              className="space-y-5"
            >
              {/* Full name field */}
              <div>
                <label className="mb-1.5 block px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Full Name
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border-none bg-slate-50 py-3.5 pl-11 pr-4 text-[13px] font-semibold text-slate-900 ring-1 ring-slate-200 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email (disabled) */}
              <div className="opacity-55">
                <label className="mb-1.5 block px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full rounded-xl border-none bg-slate-50 py-3.5 pl-11 pr-4 text-[13px] font-semibold text-slate-400 ring-1 ring-slate-200 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1.5 px-1 text-[11px] italic text-slate-400">
                  Email is linked to your university identity and cannot be changed.
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 pt-2" />

              {/* Submit */}
              <button
                type="submit"
                disabled={updateProfile.isPending || !isDirty}
                className={clsx(
                  'flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-[12px] font-bold uppercase tracking-wider text-white transition-all active:scale-[0.98]',
                  isDirty && !updateProfile.isPending
                    ? 'bg-[#0d1117] shadow-md hover:bg-slate-800'
                    : 'cursor-not-allowed bg-slate-200 text-slate-400 shadow-none',
                )}
              >
                {updateProfile.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* ── Session info card ── */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Active Session</p>
            <div className="grid grid-cols-2 gap-3">
              <SessionCard label="Status" value="Active" accent="teal" />
              <SessionCard label="Role" value={user.role} accent="violet" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Helpers ── */

function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
      <div className="mt-0.5 flex-shrink-0 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function SessionCard({ label, value, accent }: { label: string; value: string; accent: 'teal' | 'violet' }) {
  const styles = {
    teal: 'bg-teal-50 text-teal-700',
    violet: 'bg-violet-50 text-violet-700',
  }
  return (
    <div className={clsx('rounded-xl px-4 py-3', styles[accent])}>
      <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">{label}</p>
      <p className="mt-1 text-[13px] font-bold">{value}</p>
    </div>
  )
}

function getPermissions(role: string): string[] {
  if (role === 'TECHNICIAN') {
    return [
      'View assigned tasks',
      'Resolve maintenance tickets',
      'Document resolution activity',
      'Communicate with reporters'
    ]
  }
  if (role === 'ADMIN') {
    return [
      'Full system management',
      'Global dashboard access',
      'Manage all users',
      'Approve/Reject bookings',
      'Oversee campus tickets'
    ]
  }
  return [
    'Browse campus facilities',
    'Create resource bookings',
    'Submit maintenance tickets',
    'Track personal activity'
  ]
}