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
import { useState, type ReactNode, useMemo } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Role } from '../types'
import clsx from 'clsx'

const nav = (role: Role) => {
  const base = [
    { to: '/app', label: 'Overview', icon: LayoutDashboard, roles: ['ADMIN', 'USER', 'TECHNICIAN'] as Role[] },
    { to: '/app/facilities', label: 'Facilities', icon: Building2, roles: ['ADMIN', 'USER', 'TECHNICIAN'] as Role[] },
    { to: '/app/bookings', label: 'Bookings', icon: CalendarDays, roles: ['ADMIN', 'USER', 'TECHNICIAN'] as Role[] },
    { to: '/app/tickets', label: 'Tickets', icon: Ticket, roles: ['ADMIN', 'USER', 'TECHNICIAN'] as Role[] },
    { to: '/app/profile', label: 'Profile', icon: Users, roles: ['ADMIN', 'USER', 'TECHNICIAN'] as Role[] },
  ]

  if (role === 'ADMIN') {
    base.push({ to: '/app/admin', label: 'Admin', icon: Users, roles: ['ADMIN'] as Role[] })
  }
  return base.filter((x) => x.roles.includes(role))
}

function MiniCalendar() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthLabel = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()

  return (
    <div className="mt-auto rounded-2xl border border-white/5 bg-white/5 p-3">
      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="py-0.5 text-[8px] font-semibold text-white/20">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`off-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1
          return (
            <div
              key={d}
              className={clsx(
                'py-0.5 text-[9px] font-medium transition-colors',
                d === today
                  ? 'rounded-md bg-teal-500 font-bold text-white shadow-sm shadow-teal-500/30'
                  : 'text-white/40'
              )}
            >
              {d}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const { data: unread } = useQuery({
    queryKey: ['notif-count'],
    queryFn: async () => (await api.get<{ count: number }>('/api/v1/notifications/unread-count')).data,
    refetchInterval: 30_000,
    enabled: !!user,
  })

  const initials = useMemo(() => {
    return (user?.fullName || user?.email || 'User')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [user])

  if (!user) return null

  const items = nav(user.role)
  const currentPath = location.pathname
  const pageTitle =
    items.find((it) => it.to === currentPath || (currentPath.startsWith(it.to) && it.to !== '/app'))?.label ||
    'Overview'

  const mainNavItems = items.filter((it) => it.label !== 'Admin')
  const adminNavItems = items.filter((it) => it.label === 'Admin')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* ── Sidebar ── */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col bg-[#0d1117] transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-full flex-col p-4 gap-0">
          {/* Brand */}
          <div className="mb-6 flex items-center gap-3 px-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-lg shadow-teal-900/20 transition-transform hover:scale-105 active:scale-95">
              <img src="/logo.png" alt="CampusFlow" className="h-7 w-7 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-[17px] font-black tracking-tight text-white leading-tight">CampusFlow</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-teal-400 opacity-80">Operations Hub</span>
            </div>
          </div>



          {/* Profile card */}
          <Link 
            to="/app/profile" 
            className="mb-5 flex flex-col items-center rounded-2xl border border-white/5 bg-white/5 px-3 py-4 text-center transition-all hover:bg-white/10 hover:border-white/10 active:scale-[0.98] group"
          >
            <div className="relative mb-2.5">
              <div className={clsx(
                "flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg transition-transform group-hover:scale-110 overflow-hidden",
                user.profilePicture ? "bg-white" : "bg-gradient-to-br from-teal-500 to-cyan-600"
              )}>
                {user.profilePicture ? (
                  <img src={`${import.meta.env.VITE_API_BASE}${user.profilePicture}`} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0d1117] bg-emerald-500" />
            </div>

            <p className="text-[12px] font-bold leading-tight text-white group-hover:text-teal-400 transition-colors">{user.fullName}</p>
            <p className="mt-0.5 text-[10px] text-white/35 truncate w-full px-1">{user.email}</p>
          </Link>


          {/* Navigation */}
          <nav className="flex flex-col gap-1 overflow-y-auto">
            <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/25">Main</p>
            {mainNavItems.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === '/app'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold transition-all duration-200',
                    isActive
                      ? 'border border-teal-500/20 bg-gradient-to-r from-teal-500/15 to-cyan-500/10 text-teal-300'
                      : 'text-white/40 hover:bg-white/5 hover:text-white/70',
                  )
                }
              >
                <it.icon className="h-4 w-4 flex-shrink-0" />
                {it.label}
              </NavLink>
            ))}

            {adminNavItems.length > 0 && (
              <>
                <p className="mb-1 mt-4 px-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/25">System</p>
                {adminNavItems.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold transition-all duration-200',
                        isActive
                          ? 'border border-teal-500/20 bg-gradient-to-r from-teal-500/15 to-cyan-500/10 text-teal-300'
                          : 'text-white/40 hover:bg-white/5 hover:text-white/70',
                      )
                    }
                  >
                    <it.icon className="h-4 w-4 flex-shrink-0" />
                    {it.label}
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          {/* Mini Calendar */}
          <MiniCalendar />
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-[68px] flex-shrink-0 items-center justify-between bg-slate-100 px-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-[18px] font-bold tracking-tight text-slate-900">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/app/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
            >
              <Bell className="h-4 w-4" />
              {(unread?.count ?? 0) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-100 bg-rose-500 text-[9px] font-bold text-white">
                  {unread!.count > 9 ? '9+' : unread!.count}
                </span>
              )}
            </Link>
            <button
              onClick={() => { logout(); navigate('/') }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-7 pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}