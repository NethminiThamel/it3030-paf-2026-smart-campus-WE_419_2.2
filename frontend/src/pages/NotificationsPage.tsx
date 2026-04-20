import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Calendar,
  CheckCircle2,
  Ticket,
  ChevronRight,
  Info,
  AlertCircle,
  Check,
  Trash2,
} from 'lucide-react'
import { api } from '../api/client'
import type { NotificationDto } from '../types'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

export function NotificationsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<NotificationDto[]>('/api/v1/notifications')).data,
  })

  const markRead = useMutation({
    mutationFn: async (id: number) => { await api.post(`/api/v1/notifications/${id}/read`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notif-count'] })
    },
  })

  const markAllRead = useMutation({
    mutationFn: async () => { await api.post('/api/v1/notifications/mark-all-read') },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notif-count'] })
    },
  })

  const deleteNotification = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/api/v1/notifications/${id}`) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const clearRead = useMutation({
    mutationFn: async () => { await api.delete('/api/v1/notifications/clear-all') },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-teal-500" />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading</span>
      </div>
    )
  }

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0
  const readCount = (notifications?.length ?? 0) - unreadCount

  const getCategoryStyles = (category: string, title: string) => {
    const t = title.toLowerCase()
    if (category === 'BOOKING') return { icon: Calendar, bg: 'bg-amber-50', text: 'text-amber-500', dot: 'bg-amber-400' }
    if (t.includes('assigned') || t.includes('technician')) return { icon: Ticket, bg: 'bg-indigo-50', text: 'text-indigo-500', dot: 'bg-indigo-400' }
    if (t.includes('progress') || t.includes('updated')) return { icon: Info, bg: 'bg-blue-50', text: 'text-blue-500', dot: 'bg-blue-400' }
    if (t.includes('resolved') || t.includes('closed') || t.includes('approved')) return { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-500', dot: 'bg-emerald-400' }
    return { icon: AlertCircle, bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' }
  }

  const handleNotificationClick = (n: NotificationDto) => {
    if (!n.isRead) markRead.mutate(n.id)
    if (n.category === 'TICKET' && n.entityId) navigate(`/app/tickets/${n.entityId}`)
    else if (n.category === 'BOOKING') navigate('/app/bookings')
  }

  const unread = notifications?.filter((n) => !n.isRead) ?? []
  const read = notifications?.filter((n) => n.isRead) ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-slate-400 font-medium">
            {unreadCount > 0 ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                {unreadCount} unread update{unreadCount !== 1 ? 's' : ''}
              </>
            ) : (
              'You\'re all caught up'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {readCount > 0 && (
            <button
              onClick={() => clearRead.mutate()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-red-400 shadow-sm transition hover:bg-red-50 hover:border-red-100 active:scale-95"
            >
              <Trash2 className="h-3 w-3" />
              Clear read
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1.5 rounded-xl bg-[#0d1117] px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-slate-800 active:scale-95"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* ── Empty state ── */}
      {notifications?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white py-20 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-200">
            <Bell className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Nothing here yet</h3>
          <p className="mt-1 max-w-xs text-[12px] text-slate-400">
            We'll notify you when there are updates to your bookings or tickets.
          </p>
        </div>
      )}

      {/* ── Unread section ── */}
      {unread.length > 0 && (
        <div className="space-y-2">
          <p className="px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Unread</p>
          {unread.map((n) => (
            <NotificationCard
              key={n.id}
              n={n}
              styles={getCategoryStyles(n.category, n.title)}
              onClick={() => handleNotificationClick(n)}
              onMarkRead={(e) => { e.stopPropagation(); markRead.mutate(n.id) }}
              onDelete={(e) => { e.stopPropagation(); deleteNotification.mutate(n.id) }}
            />
          ))}
        </div>
      )}

      {/* ── Read section ── */}
      {read.length > 0 && (
        <div className="space-y-2">
          <p className="px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Earlier</p>
          {read.map((n) => (
            <NotificationCard
              key={n.id}
              n={n}
              styles={getCategoryStyles(n.category, n.title)}
              onClick={() => handleNotificationClick(n)}
              onMarkRead={(e) => { e.stopPropagation(); markRead.mutate(n.id) }}
              onDelete={(e) => { e.stopPropagation(); deleteNotification.mutate(n.id) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Notification card ── */
type Styles = { icon: React.ElementType; bg: string; text: string; dot: string }

function NotificationCard({
  n,
  styles,
  onClick,
  onMarkRead,
  onDelete,
}: {
  n: NotificationDto
  styles: Styles
  onClick: () => void
  onMarkRead: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'group relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
        n.isRead
          ? 'border-slate-100 bg-white/60 opacity-60'
          : 'border-slate-200 bg-white shadow-sm'
      )}
    >
      {/* Icon */}
      <div className={clsx('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105', styles.bg, styles.text)}>
        <styles.icon className="h-5 w-5" />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {!n.isRead && <span className={clsx('h-1.5 w-1.5 flex-shrink-0 rounded-full', styles.dot)} />}
            <h4 className="truncate text-[13px] font-bold text-slate-900">{n.title}</h4>
          </div>
          <span className="flex-shrink-0 text-[10px] font-medium text-slate-400">
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
          </span>
        </div>

        <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{n.message}</p>

        {n.entityId && (
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            View details <ChevronRight className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 flex-col gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {!n.isRead && (
          <button
            onClick={onMarkRead}
            title="Mark as read"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition hover:bg-teal-50 hover:text-teal-600"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onDelete}
          title="Delete"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}