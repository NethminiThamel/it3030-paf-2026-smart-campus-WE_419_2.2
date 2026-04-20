import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useAuth } from './auth/AuthContext'
import { AdminPage } from './pages/AdminPage'
import { BookingsPage } from './pages/BookingsPage'
import { DashboardPage } from './pages/DashboardPage'
import { FacilitiesPage } from './pages/FacilitiesPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { LoginGuidePage } from './pages/LoginGuidePage'
import { VerifyPage } from './pages/VerifyPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { TicketsPage } from './pages/TicketsPage'
import { TicketDetailPage } from './pages/TicketDetailPage'



import { ProfilePage } from './pages/ProfilePage'

function Protected({ children }: { children: ReactNode }) {

  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center text-slate-400">Loading…</div>
    )
  }
  if (!user) {
    return <Navigate to="/" replace />
  }
  return <AppShell>{children}</AppShell>
}

function AdminOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/app" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/guide" element={<LoginGuidePage />} />
      <Route
        path="/app"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/app/facilities"
        element={
          <Protected>
            <FacilitiesPage />
          </Protected>
        }
      />
      <Route
        path="/app/bookings"
        element={
          <Protected>
            <BookingsPage />
          </Protected>
        }
      />
      <Route
        path="/app/tickets"
        element={
          <Protected>
            <TicketsPage />
          </Protected>
        }
      />
      <Route
        path="/app/tickets/:id"
        element={
          <Protected>
            <TicketDetailPage />
          </Protected>
        }
      />

      
    
      <Route
        path="/app/admin"
        element={
          <Protected>
            <AdminOnly>
              <AdminPage />
            </AdminOnly>
          </Protected>
        }
      />
      <Route
        path="/app/notifications"
        element={
          <Protected>
            <NotificationsPage />
          </Protected>
        }
      />
      <Route
        path="/app/profile"
        element={
          <Protected>
            <ProfilePage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />


    </Routes>
  )
}
