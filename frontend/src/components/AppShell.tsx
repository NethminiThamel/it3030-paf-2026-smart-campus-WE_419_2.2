import {
  Bell,
  Building2,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Ticket,
  Users,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Role } from '../types'
import clsx from 'clsx'

const nav = (role: Role) => {
  const base = [
    { to: '/app', label: 'Overview', icon: LayoutDashboard, roles: ['ADMIN', 'USER', 'TECHNICIAN'] as Role[] },
    { to: '/app/facilities', label: 'Facilities', icon: Building2, roles: ['ADMIN', 'USER', 'TECHNICIAN'] },
    { to: '/app/bookings', label: 'Bookings', icon: CalendarDays, roles: ['ADMIN', 'USER', 'TECHNICIAN'] },
    { to: '/app/tickets', label: 'Tickets', icon: Ticket, roles: ['ADMIN', 'USER', 'TECHNICIAN'] },
  ]
  if (role === 'ADMIN') {
    base.push({ to: '/app/admin', label: 'Admin', icon: Users, roles: ['ADMIN'] })
  }
  return base.filter((x) => x.roles.includes(role))
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const { data: unread } = useQuery({
    queryKey: ['notif-count'],
    queryFn: async () => (await api.get<{ count: number }>('/api/v1/notifications/unread-count')).data,
    refetchInterval: 30_000,
    enabled: !!user,
  })

  if (!user) return null

  const items = nav(user.role)
  const now = new Date()

  return (
    <div className="flex h-screen overflow-hidden bg-[#e2e8f0]">
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-[280px] bg-[#101924] transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-full flex-col p-5">
          {/* Logo & Brand */}
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f172a] shadow-xl ring-1 ring-slate-800">
              <img src="/logo.png" alt="CampusFlow" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">CampusFlow</span>
          </div>

          {/* Profile Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1e293b] ring-4 ring-slate-800/50 text-xl font-bold text-white uppercase tracking-tighter shadow-xl">
                {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#101924] bg-emerald-500 shadow-sm" />
            </div>
            <div className="text-sm font-bold text-white tracking-tight">{user.fullName}</div>
            <div className="text-[10px] font-medium text-slate-400 opacity-80">{user.email}</div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === '/app'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300',
                    isActive
                      ? 'bg-[#e2e8f0] text-[#101924] shadow-lg shadow-black/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white',
                  )
                }
              >
                <it.icon className={clsx('h-4 w-4')} />
                {it.label}
              </NavLink>
            ))}
          </nav>

          {/* Bottom Widget (Calendar) */}
          <div className="mt-6 rounded-[1.5rem] bg-white/5 p-4 backdrop-blur-md border border-white/5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-60">
                {now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center text-[9px] font-bold text-slate-400">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="opacity-30">{d}</div>
              ))}
              {(() => {
                const year = now.getFullYear()
                const month = now.getMonth()
                const firstDay = new Date(year, month, 1).getDay()
                const daysInMonth = new Date(year, month + 1, 0).getDate()
                const offset = Array.from({ length: firstDay })
                const days = Array.from({ length: daysInMonth })
                const today = now.getDate()

                return (
                  <>
                    {offset.map((_, i) => <div key={`off-${i}`} />)}
                    {days.map((_, i) => {
                      const d = i + 1
                      const isToday = d === today
                      return (
                        <div
                          key={d}
                          className={clsx(
                            'py-1 transition-all duration-300',
                            isToday
                              ? 'rounded-lg bg-teal-500 text-white shadow-lg shadow-teal-500/40'
                              : 'hover:text-white cursor-default opacity-70'
                          )}
                        >
                          {d}
                        </div>
                      )
                    })}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-20 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden p-2 text-slate-600"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-800">Campus Overview</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              to="/app/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 transition"
            >
              <Bell className="h-5 w-5" />
              {(unread?.count ?? 0) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-[#e2e8f0]">
                  {unread!.count > 9 ? '9+' : unread!.count}
                </span>
              )}
            </Link>
            <button
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 transition"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
