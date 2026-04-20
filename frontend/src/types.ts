export type Role = 'ADMIN' | 'USER' | 'TECHNICIAN'

export interface User {
  id: number
  email: string
  fullName: string
  role: Role
  profilePicture: string | null
}


export type FacilityType = 'LECTURE_HALL' | 'LAB' | 'MEETING_ROOM' | 'EQUIPMENT'
export type FacilityStatus = 'ACTIVE' | 'OUT_OF_SERVICE'

export interface Facility {
  id: number
  name: string
  resourceType: FacilityType
  capacity: number
  location: string
  availabilityWindow: string | null
  status: FacilityStatus
  description: string | null
  currentlyAvailable: boolean | null
  images: string[]
}

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface Booking {
  id: number
  facilityName: string
  purpose: string
  startTime: string
  endTime: string
  status: BookingStatus
  qrToken?: string | null
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Ticket {
  id: number
  reporterId: number
  reporterEmail: string
  facilityId: number | null
  facilityName: string | null
  category: string
  description: string
  priority: TicketPriority
  contactEmail: string
  status: TicketStatus
  assignedTechnicianId: number | null
  assignedTechnicianEmail: string | null
  rejectReason: string | null
  resolutionNote: string | null
  createdAt: string
  updatedAt: string
  attachments: { id: number; storedFilename: string; originalFilename: string; contentType: string }[]
  commentCount: number
}

export interface NotificationDto {
  id: number
  type: string
  title: string
  message: string
  category: 'BOOKING' | 'TICKET'
  entityId: number | null
  isRead: boolean
  createdAt: string
}

export interface DashboardStats {

  pendingBookings: number
  openTickets: number
  totalUsers: number
  activeFacilities: number
  topFacilities: { name: string; count: number }[]
  bookingTrend: { period: string; count: number }[]
  peakBookingHours: { name: string; count: number }[]
  peakBookingDays: { name: string; count: number }[]
}

