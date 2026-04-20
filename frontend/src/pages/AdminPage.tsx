import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Role, User } from '../types'
import { Trash2, ShieldAlert, Users, ShieldCheck } from 'lucide-react'
import { useToast } from '../components/Toast'
import clsx from 'clsx'

const ROLE_CONFIG: Record<Role, { selectClasses: string }> = {
  ADMIN: {
    selectClasses: 'bg-violet-50 text-violet-700 ring-violet-200 focus:ring-violet-400',
  },
  TECHNICIAN: {
    selectClasses: 'bg-blue-50 text-blue-700 ring-blue-200 focus:ring-blue-400',
  },
  USER: {
    selectClasses: 'bg-slate-100 text-slate-600 ring-slate-200 focus:ring-teal-400',
  },
}

const AVATAR_PALETTE = [
  'bg-teal-500',
  'bg-violet-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-emerald-500',
]

export function AdminPage() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const users = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get<User[]>('/api/v1/admin/users')).data,
  })

  const updateRole = useMutation({
    mutationFn: async (p: { id: number; role: Role }) =>
      (await api.patch<User>(`/api/v1/admin/users/${p.id}/role`, { role: p.role })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast('User role updated successfully', 'success')
    },
    onError: () => toast('Failed to update user role', 'error'),
  })

  const deleteUser = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/api/v1/admin/users/${id}`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast('User permanently deleted', 'success')
    },
    onError: () => toast('Cannot delete user (might have active bookings or tickets)', 'error'),
  })

  const totalUsers = users.data?.length ?? 0
  const adminCount = users.data?.filter((u) => u.role === 'ADMIN').length ?? 0
  const techCount = users.data?.filter((u) => u.role === 'TECHNICIAN').length ?? 0

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* ── Hero header ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1117] via-[#0f2027] to-[#1a0d3a] p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-teal-500/8 blur-2xl" />
        <div className="relative flex items-center justify-between gap-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/75">
              <ShieldCheck className="h-3 w-3" />
              System Admin
            </div>
            <h1 className="text-2xl font-black tracking-tight">User Management</h1>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-white/50">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              Manage system access and assign administrative roles
            </p>
          </div>
          <div className="flex gap-2.5 flex-shrink-0">
            <HeroStat label="Total" value={totalUsers} />
            <HeroStat label="Admins" value={adminCount} />
            <HeroStat label="Technicians" value={techCount} />
          </div>
        </div>
      </section>

      {/* ── User list ── */}
      <div className="grid gap-3">
        {users.isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-teal-500" />
          </div>
        )}

        {users.data?.map((u, i) => {
          const avatarBg = AVATAR_PALETTE[i % AVATAR_PALETTE.length]
          const roleConf = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.USER
          const initials = u.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

          return (
            <div
              key={u.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              {/* Avatar */}
              <div className={clsx('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white shadow-sm', avatarBg)}>
                {initials}
              </div>

              {/* Name + email */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-slate-900 truncate">{u.fullName}</p>
                <p className="text-[12px] text-slate-400 truncate">{u.email}</p>
              </div>

              {/* Role select — color coded, always visible */}
              <select
                className={clsx(
                  'h-9 flex-shrink-0 rounded-xl border-none px-3.5 text-[11px] font-bold uppercase tracking-wider outline-none ring-1 ring-inset transition-all focus:ring-2 cursor-pointer',
                  roleConf.selectClasses,
                )}
                value={u.role}
                onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value as Role })}
              >
                {(['USER', 'TECHNICIAN', 'ADMIN'] as Role[]).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {/* Delete — always visible, not hidden on hover */}
              <button
                onClick={() => {
                  if (confirm(`Permanently delete ${u.fullName}? This cannot be undone.`)) {
                    deleteUser.mutate(u.id)
                  }
                }}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-400 transition-all hover:border-red-200 hover:bg-red-100 hover:text-red-600 active:scale-95"
                title="Delete user"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        })}

        {!users.isLoading && users.data?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-[13px] font-semibold text-slate-400">No users found</p>
          </div>
        )}
      </div>
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[64px] rounded-xl border border-white/10 bg-white/8 px-3 py-2.5 text-center backdrop-blur-sm">
      <p className="text-[9px] font-medium text-white/45 leading-none">{label}</p>
      <p className="mt-1 text-xl font-black text-white leading-none">{value}</p>
    </div>
  )
}