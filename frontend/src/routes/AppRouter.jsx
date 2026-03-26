import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Layouts
import MobileLayout from '../layouts/MobileLayout'
import DesktopLayout from '../layouts/DesktopLayout'
import ResponsiveLayout from '../layouts/ResponsiveLayout'

// Shared pages
import LoginPage from '../pages/shared/LoginPage'
import RegisterPage from '../pages/shared/RegisterPage'

// User pages
import HomePage from '../pages/user/HomePage'
import StationDetailPage from '../pages/user/StationDetailPage'
import ChargerDetailPage from '../pages/user/ChargerDetailPage'
import BookingPage from '../pages/user/BookingPage'
import ChargingPage from '../pages/user/ChargingPage'
import PaymentPage from '../pages/user/PaymentPage'
import BookingHistoryPage from '../pages/user/BookingHistoryPage'
import PaymentHistoryPage from '../pages/user/PaymentHistoryPage'
import ReviewPage from '../pages/user/ReviewPage'
import ReportIssuePage from '../pages/user/ReportIssuePage'
import ProfilePage from '../pages/user/ProfilePage'
import VehicleManagePage from '../pages/user/VehicleManagePage'
import NotificationsPage from '../pages/user/NotificationsPage'
import SearchPage from '../pages/user/SearchPage'

// Admin pages
import DashboardPage from '../pages/admin/DashboardPage'
import StationManagePage from '../pages/admin/StationManagePage'
import ChargerManagePage from '../pages/admin/ChargerManagePage'
import UserManagePage from '../pages/admin/UserManagePage'
import TechnicianManagePage from '../pages/admin/TechnicianManagePage'
import BookingManagePage from '../pages/admin/BookingManagePage'
import TicketManagePage from '../pages/admin/TicketManagePage'
import AdminNotificationsPage from '../pages/admin/AdminNotificationsPage'

// Tech pages
import TechDashboardPage from '../pages/tech/TechDashboardPage'
import TicketDetailPage from '../pages/tech/TicketDetailPage'
import UpdateTicketPage from '../pages/tech/UpdateTicketPage'
import TechHistoryPage from '../pages/tech/TechHistoryPage'
import TechNotificationsPage from '../pages/tech/TechNotificationsPage'

// PrivateRoute — ต้อง login ก่อน
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">กำลังโหลด...</div></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

// RoleRoute — เช็ค role ด้วย
function RoleRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">กำลังโหลด...</div></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!roles.includes(user?.role)) return <Navigate to="/login" replace />
  return children
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* User pages */}
      <Route path="/home" element={<PrivateRoute><MobileLayout><HomePage /></MobileLayout></PrivateRoute>} />
      <Route path="/search" element={<PrivateRoute><MobileLayout><SearchPage /></MobileLayout></PrivateRoute>} />
      <Route path="/stations/:id" element={<PrivateRoute><MobileLayout><StationDetailPage /></MobileLayout></PrivateRoute>} />
      <Route path="/chargers/:id" element={<PrivateRoute><MobileLayout><ChargerDetailPage /></MobileLayout></PrivateRoute>} />
      <Route path="/booking/:chargerId" element={<PrivateRoute><MobileLayout><BookingPage /></MobileLayout></PrivateRoute>} />
      <Route path="/charging/:sessionId" element={<PrivateRoute><MobileLayout><ChargingPage /></MobileLayout></PrivateRoute>} />
      <Route path="/payment/:sessionId" element={<PrivateRoute><MobileLayout><PaymentPage /></MobileLayout></PrivateRoute>} />
      <Route path="/bookings" element={<PrivateRoute><MobileLayout><BookingHistoryPage /></MobileLayout></PrivateRoute>} />
      <Route path="/payments" element={<PrivateRoute><MobileLayout><PaymentHistoryPage /></MobileLayout></PrivateRoute>} />
      <Route path="/review/:stationId" element={<PrivateRoute><MobileLayout><ReviewPage /></MobileLayout></PrivateRoute>} />
      <Route path="/report" element={<PrivateRoute><MobileLayout><ReportIssuePage /></MobileLayout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><MobileLayout><ProfilePage /></MobileLayout></PrivateRoute>} />
      <Route path="/vehicles" element={<PrivateRoute><MobileLayout><VehicleManagePage /></MobileLayout></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><MobileLayout><NotificationsPage /></MobileLayout></PrivateRoute>} />

      {/* Admin pages */}
      <Route path="/admin/dashboard" element={<RoleRoute roles={['admin']}><DesktopLayout><DashboardPage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/stations" element={<RoleRoute roles={['admin']}><DesktopLayout><StationManagePage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/chargers" element={<RoleRoute roles={['admin']}><DesktopLayout><ChargerManagePage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/users" element={<RoleRoute roles={['admin']}><DesktopLayout><UserManagePage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/technicians" element={<RoleRoute roles={['admin']}><DesktopLayout><TechnicianManagePage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/bookings" element={<RoleRoute roles={['admin']}><DesktopLayout><BookingManagePage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/tickets" element={<RoleRoute roles={['admin']}><DesktopLayout><TicketManagePage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/notifications" element={<RoleRoute roles={['admin']}><DesktopLayout><AdminNotificationsPage /></DesktopLayout></RoleRoute>} />

      {/* Tech pages */}
      <Route path="/tech/dashboard" element={<RoleRoute roles={['technician']}><ResponsiveLayout><TechDashboardPage /></ResponsiveLayout></RoleRoute>} />
      <Route path="/tech/tickets/:id" element={<RoleRoute roles={['technician']}><ResponsiveLayout><TicketDetailPage /></ResponsiveLayout></RoleRoute>} />
      <Route path="/tech/tickets/:id/update" element={<RoleRoute roles={['technician']}><ResponsiveLayout><UpdateTicketPage /></ResponsiveLayout></RoleRoute>} />
      <Route path="/tech/history" element={<RoleRoute roles={['technician']}><ResponsiveLayout><TechHistoryPage /></ResponsiveLayout></RoleRoute>} />
      <Route path="/tech/notifications" element={<RoleRoute roles={['technician']}><ResponsiveLayout><TechNotificationsPage /></ResponsiveLayout></RoleRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
