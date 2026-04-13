export type Role = 'ADMIN' | 'USER' | 'TECHNICIAN'

export interface User {
  id: number
  email: string
  fullName: string
  role: Role
}



export interface DashboardStats {
  pendingBookings: number
  openTickets: number
  totalUsers: number
  activeFacilities: number
  topFacilities: { name: string; count: number }[]
  bookingTrend: { period: string; count: number }[]
}
