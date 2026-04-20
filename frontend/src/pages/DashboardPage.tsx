import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarClock,
  CheckCircle2,
  Layers,
  Ticket,
  ArrowRight,
  ShieldCheck,
  Activity,
  Clock3,
  Building2,
  CalendarDays,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { DashboardStats, Ticket as TicketT, Booking } from '../types'
import clsx from 'clsx'

export function DashboardPage() {
  const { user } = useAuth()

  const adminStats = useQuery({
    queryKey: ['admin-dashboard'],
    enabled: user?.role === 'ADMIN',
    queryFn: async () => (await api.get<DashboardStats>('/api/v1/admin/dashboard')).data,
  })

  const tickets = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => (await api.get<TicketT[]>('/api/v1/tickets')).data,
  })

  const bookings = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => (await api.get<Booking[]>('/api/v1/bookings')).data,
  })

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])


  if (!user) return null

  /* ── ADMIN VIEW ── */
  if (user.role === 'ADMIN' && adminStats.data) {
    const s = adminStats.data

    return (
      <div className="space-y-5 animate-in fade-in duration-500">

        {/* ── Hero banner ── */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1117] via-[#0f2027] to-[#0d3a40] p-6 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-cyan-500/8 blur-2xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/75">
                <ShieldCheck className="h-3 w-3" />
                Admin Dashboard
              </div>
              <h2 className="text-2xl font-black tracking-tight sm:text-[26px]">
                {greeting}, {user.fullName || 'Admin'}
              </h2>
              <p className="mt-1.5 max-w-lg text-[12px] leading-relaxed text-white/50">
                Bookings, support activity, facilities, and campus usage at a glance.
              </p>
            </div>

            <div className="flex gap-2.5 flex-shrink-0">
              <HeroStatPill label="Pending" value={s.pendingBookings} />
              <HeroStatPill label="Tickets" value={s.openTickets} />
              <HeroStatPill label="Facilities" value={s.activeFacilities} />
              <HeroStatPill label="Users" value={s.totalUsers} />
            </div>
          </div>
        </section>

        {/* ── Stat cards ── */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Pending Bookings"
            value={s.pendingBookings}
            subtitle="Awaiting review"
            icon={<CalendarClock className="h-4 w-4" />}
            variant="teal"
          />
          <StatCard
            title="Open Tickets"
            value={s.openTickets}
            subtitle="Need follow-up"
            icon={<Ticket className="h-4 w-4" />}
            variant="amber"
          />
          <StatCard
            title="Active Facilities"
            value={s.activeFacilities}
            subtitle="Currently available"
            icon={<Layers className="h-4 w-4" />}
            variant="blue"
          />
          <StatCard
            title="Total Users"
            value={s.totalUsers}
            subtitle="Registered accounts"
            icon={<CheckCircle2 className="h-4 w-4" />}
            variant="dark"
          />
        </section>

        {/* ── Booking trend + venues ── */}
        <section className="grid gap-4 xl:grid-cols-3">
          <DashboardPanel
            title="Booking Trend"
            subtitle="Past 7 days"
            icon={<Activity className="h-4 w-4" />}
            className="xl:col-span-2"
          >
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.bookingTrend} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} fontWeight={600} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.08)', fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Popular Venues" subtitle="Most used spaces" icon={<Building2 className="h-4 w-4" />}>
            <div className="space-y-2.5">
              {s.topFacilities.length > 0 ? (
                s.topFacilities.map((f, index) => {
                  const colors = ['bg-teal-600', 'bg-blue-600', 'bg-violet-600', 'bg-amber-500']
                  return (
                    <div key={f.name} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 shadow-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[12px] font-semibold text-slate-800">{f.name}</p>
                        <p className="text-[10px] text-slate-400">Facility usage count</p>
                      </div>
                      <span className={clsx('rounded-full px-2.5 py-1 text-[10px] font-bold text-white', colors[index] ?? 'bg-slate-500')}>
                        {f.count}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-[12px] text-slate-400">
                  No activity recorded yet
                </div>
              )}
            </div>
          </DashboardPanel>
        </section>

        {/* ── Peak hours + peak days ── */}
        <section className="grid gap-4 lg:grid-cols-2">
          <DashboardPanel title="Peak Booking Hours" subtitle="Most active time slots" icon={<Clock3 className="h-4 w-4" />}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.peakBookingHours} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} fontWeight={600} width={65} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.08)', fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Peak Booking Days" subtitle="Busiest days of the week" icon={<CalendarClock className="h-4 w-4" />}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.peakBookingDays} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight={600} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.08)', fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>
        </section>
      </div>
    )
  }

  /* ── USER / TECHNICIAN VIEW ── */
  const activeTickets = tickets.data?.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED' && t.status !== 'REJECTED').length ?? 0
  const pendingBookings = bookings.data?.filter(b => b.status === 'PENDING').length ?? 0
  const approvedBookings = bookings.data?.filter(b => b.status === 'APPROVED').length ?? 0

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1117] via-[#0f2027] to-[#1e293b] p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/75">
              <Activity className="h-3 w-3" />
              Activity Overview
            </div>
            <h2 className="text-2xl font-black tracking-tight">Welcome back</h2>
            <p className="mt-1.5 text-[12px] text-white/50">Your personal campus activity and support summary.</p>
          </div>
          <div className="flex gap-2.5 flex-shrink-0">
             <HeroStatPill label="Bookings" value={bookings.data?.length ?? 0} />
             <HeroStatPill label="Tickets" value={tickets.data?.length ?? 0} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Pending Approval"
          value={pendingBookings}
          subtitle="Bookings awaiting review"
          icon={<CalendarClock className="h-4 w-4" />}
          variant="amber"
        />
        <StatCard
          title="Active Bookings"
          value={approvedBookings}
          subtitle="Confirmed reservations"
          icon={<CalendarDays className="h-4 w-4" />}
          variant="teal"
        />
        <StatCard
          title="Support Tickets"
          value={activeTickets}
          subtitle="Open and in-progress"
          icon={<Ticket className="h-4 w-4" />}
          variant="blue"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardPanel title="Upcoming Reservations" subtitle="Your next approved bookings" icon={<CalendarDays className="h-4 w-4" />}>
          <div className="space-y-3">
            {bookings.data?.filter(b => b.status === 'APPROVED').slice(0, 3).map(b => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5 transition hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                    <Building2 className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">{b.facilityName}</p>
                    <p className="text-[11px] text-slate-400">
                       {new Date(b.startTime).toLocaleDateString()} at {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-600 uppercase tracking-wider">Confirmed</span>
              </div>
            )) || <p className="py-10 text-center text-[12px] text-slate-400">No upcoming bookings</p>}
            {bookings.data?.filter(b => b.status === 'APPROVED').length === 0 && (
               <p className="py-10 text-center text-[12px] text-slate-400 font-medium italic">Your upcoming confirmed bookings will appear here</p>
            )}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Recent Support Activity" subtitle="Updates on your reports" icon={<Activity className="h-4 w-4" />}>
           <div className="space-y-3">
            {tickets.data?.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5 transition hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200",
                    t.status === 'OPEN' ? "text-amber-500" : "text-blue-500"
                  )}>
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-slate-800">{t.category}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{t.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <span className={clsx(
                     "rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest",
                     t.status === 'OPEN' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                   )}>{t.status.replace('_', ' ')}</span>
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">ID: CF-{t.id}</span>
                </div>
              </div>
            )) || <p className="py-10 text-center text-[12px] text-slate-400 font-medium italic">No recent ticket activity</p>}
            {tickets.data?.length === 0 && (
               <p className="py-10 text-center text-[12px] text-slate-400 font-medium italic">Your support reports will appear here</p>
            )}
           </div>
        </DashboardPanel>
      </div>
    </div>
  )
}



/* ── Sub-components ── */

function HeroStatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[64px] rounded-xl border border-white/10 bg-white/8 px-3 py-2.5 text-center backdrop-blur-sm">
      <p className="text-[9px] font-medium text-white/45 leading-none">{label}</p>
      <p className="mt-1 text-xl font-black text-white leading-none">{value}</p>
    </div>
  )
}

function DashboardPanel({
  title,
  subtitle,
  icon,
  className,
  children,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div className={clsx('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-bold tracking-tight text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>}
        </div>
        {icon && (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            {icon}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant,
}: {
  title: string
  value: number
  subtitle: string
  icon: ReactNode
  variant: 'teal' | 'amber' | 'blue' | 'dark'
}) {
  const styles: Record<string, string> = {
    teal: 'from-teal-600 to-teal-500',
    amber: 'from-amber-500 to-amber-400',
    blue: 'from-blue-700 to-blue-500',
    dark: 'from-slate-900 to-slate-700',
  }

  return (
    <div
      className={clsx(
        'group relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer',
        styles[variant],
      )}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 blur-xl" />

      <div className="relative flex flex-col gap-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">{title}</p>
            <p className="mt-2.5 text-4xl font-black leading-none tracking-tight text-white">{value}</p>
            <p className="mt-2 text-[11px] text-white/60">{subtitle}</p>
          </div>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
            {icon}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3.5 text-[11px] font-semibold text-white/60">
          <span>View details</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  )
}