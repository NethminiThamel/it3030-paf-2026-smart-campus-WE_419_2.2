import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, CheckCircle2, Layers, Ticket, ArrowRight } from 'lucide-react'
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
import type { Booking, DashboardStats, Ticket as TicketT } from '../types'
import clsx from 'clsx'

export function DashboardPage() {
  const { user } = useAuth()

  const adminStats = useQuery({
    queryKey: ['admin-dashboard'],
    enabled: user?.role === 'ADMIN',
    queryFn: async () => (await api.get<DashboardStats>('/api/v1/admin/dashboard')).data,
  })

  const bookings = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => (await api.get<Booking[]>('/api/v1/bookings')).data,
  })

  const tickets = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => (await api.get<TicketT[]>('/api/v1/tickets')).data,
  })

  if (!user) return null

  if (user.role === 'ADMIN' && adminStats.data) {
    const s = adminStats.data
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Pending Bookings"
            value={s.pendingBookings}
            icon={<CalendarClock className="h-5 w-5" />}
            variant="teal"
          />
          <StatCard title="Open Tickets" value={s.openTickets} icon={<Ticket className="h-5 w-5" />} variant="orange" />
          <StatCard title="Active Facilities" value={s.activeFacilities} icon={<Layers className="h-5 w-5" />} variant="blue" />
          <StatCard title="Total Users" value={s.totalUsers} icon={<CheckCircle2 className="h-5 w-5" />} variant="navy" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card shadow-2xl shadow-black/5">
            <h2 className="mb-6 text-base font-extrabold text-[#101924] uppercase tracking-wider">Booking Trend (7d)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.bookingTrend}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#cbd5e1" opacity={0.5} />
                  <XAxis 
                    dataKey="period" 
                    stroke="#64748b" 
                    fontSize={10} 
                    fontWeight={700}
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    fontWeight={700}
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                    contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ fontWeight: 'bold', color: '#101924' }}
                  />
                  <Bar dataKey="count" fill="#00868f" radius={[8, 8, 0, 0]} barSize={40} minPointSize={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <h2 className="mb-6 text-base font-bold text-slate-800">Popular Venues</h2>
            <ul className="space-y-3">
              {s.topFacilities.map((f) => (
                <li
                  key={f.name}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                >
                  <span className="text-sm font-semibold text-slate-700">{f.name}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-teal-600 shadow-sm ring-1 ring-slate-200">
                    {f.count} bookings
                  </span>
                </li>
              ))}
              {s.topFacilities.length === 0 && (
                <p className="text-sm text-slate-500 italic">No activity recorded yet</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  const pendingMine = bookings.data?.filter((b) => b.status === 'PENDING').length ?? 0
  const openMine =
    tickets.data?.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length ?? 0

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid gap-6 sm:grid-cols-2">
        <StatCard
          title="My Pending Bookings"
          value={pendingMine}
          icon={<CalendarClock className="h-5 w-5" />}
          variant="teal"
        />
        <StatCard title="Tickets in Progress" value={openMine} icon={<Ticket className="h-5 w-5" />} variant="orange" />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, variant }: { title: string; value: number; icon: ReactNode; variant: 'teal' | 'orange' | 'blue' | 'navy' }) {
  const styles = {
    teal: 'bg-[#004d61] text-white',
    orange: 'bg-[#ffb366] text-[#663300]',
    blue: 'bg-[#007b8f] text-white',
    navy: 'bg-[#1a202c] text-white',
  }

  return (
    <div className={clsx('relative flex flex-col justify-between rounded-3xl p-6 h-40 shadow-lg transition hover:scale-[1.02]', styles[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">{title}</div>
          <div className="mt-1 text-3xl font-extrabold">{value}</div>
          <div className="mt-2 text-[10px] font-medium opacity-60">Updated just now</div>
        </div>
        <div className={clsx('rounded-xl p-2.5 bg-white/10 ring-1 ring-white/20')}>
          {icon}
        </div>
      </div>
      <div className="flex justify-end">
        <ArrowRight className="h-4 w-4 opacity-70" />
      </div>
    </div>
  )
}
