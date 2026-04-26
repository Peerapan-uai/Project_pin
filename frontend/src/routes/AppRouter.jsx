import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Layouts (โหลดทันที เพราะใช้ทุกหน้า)
import MobileLayout from '../layouts/MobileLayout'
import DesktopLayout from '../layouts/DesktopLayout'
import ResponsiveLayout from '../layouts/ResponsiveLayout'

// Shared pages
const LoginPage = lazy(() => import('../pages/shared/LoginPage'))
const RegisterPage = lazy(() => import('../pages/shared/RegisterPage'))

// User pages
const HomePage = lazy(() => import('../pages/user/HomePage'))
const StationDetailPage = lazy(() => import('../pages/user/StationDetailPage'))
const ChargerDetailPage = lazy(() => import('../pages/user/ChargerDetailPage'))
const BookingPage = lazy(() => import('../pages/user/BookingPage'))
const ChargingPage = lazy(() => import('../pages/user/ChargingPage'))
const PaymentPage = lazy(() => import('../pages/user/PaymentPage'))
const BookingHistoryPage = lazy(() => import('../pages/user/BookingHistoryPage'))
const BookingDetailPage = lazy(() => import('../pages/user/BookingDetailPage'))
const PaymentHistoryPage = lazy(() => import('../pages/user/PaymentHistoryPage'))
const ReviewPage = lazy(() => import('../pages/user/ReviewPage'))
const ReportIssuePage = lazy(() => import('../pages/user/ReportIssuePage'))
const ProfilePage = lazy(() => import('../pages/user/ProfilePage'))
const VehicleManagePage = lazy(() => import('../pages/user/VehicleManagePage'))
const NotificationsPage = lazy(() => import('../pages/user/NotificationsPage'))
const SearchPage = lazy(() => import('../pages/user/SearchPage'))
const WalletPage = lazy(() => import('../pages/user/WalletPage'))
const FavoritesPage = lazy(() => import('../pages/user/FavoritesPage'))
const PointsPage = lazy(() => import('../pages/user/PointsPage'))
const RecurringSchedulePage = lazy(() => import('../pages/user/RecurringSchedulePage'))

// Admin pages
const AdminLoginPage = lazy(() => import('../pages/admin/AdminLoginPage'))
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage'))
const StationManagePage = lazy(() => import('../pages/admin/StationManagePage'))
const ChargerManagePage = lazy(() => import('../pages/admin/ChargerManagePage'))
const UserManagePage = lazy(() => import('../pages/admin/UserManagePage'))
const TechnicianManagePage = lazy(() => import('../pages/admin/TechnicianManagePage'))
const BookingManagePage = lazy(() => import('../pages/admin/BookingManagePage'))
const TicketManagePage = lazy(() => import('../pages/admin/TicketManagePage'))
const AdminNotificationsPage = lazy(() => import('../pages/admin/AdminNotificationsPage'))
const PaymentsPage = lazy(() => import('../pages/admin/PaymentsPage'))
const RefundManagePage = lazy(() => import('../pages/admin/RefundManagePage'))
const WalletManagePage = lazy(() => import('../pages/admin/WalletManagePage'))
const ReportsPage      = lazy(() => import('../pages/admin/ReportsPage'))
const TrashPage        = lazy(() => import('../pages/admin/TrashPage'))

// Tech pages
const TechDashboardPage = lazy(() => import('../pages/tech/TechDashboardPage'))
const TicketDetailPage = lazy(() => import('../pages/tech/TicketDetailPage'))
const UpdateTicketPage = lazy(() => import('../pages/tech/UpdateTicketPage'))
const TechHistoryPage = lazy(() => import('../pages/tech/TechHistoryPage'))
const TechNotificationsPage = lazy(() => import('../pages/tech/TechNotificationsPage'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

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
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
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
      <Route path="/bookings/:id" element={<PrivateRoute><MobileLayout><BookingDetailPage /></MobileLayout></PrivateRoute>} />
      <Route path="/payments" element={<PrivateRoute><MobileLayout><PaymentHistoryPage /></MobileLayout></PrivateRoute>} />
      <Route path="/review/:stationId" element={<PrivateRoute><MobileLayout><ReviewPage /></MobileLayout></PrivateRoute>} />
      <Route path="/report" element={<PrivateRoute><MobileLayout><ReportIssuePage /></MobileLayout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><MobileLayout><ProfilePage /></MobileLayout></PrivateRoute>} />
      <Route path="/vehicles" element={<PrivateRoute><MobileLayout><VehicleManagePage /></MobileLayout></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><MobileLayout><NotificationsPage /></MobileLayout></PrivateRoute>} />
      <Route path="/wallet" element={<PrivateRoute><MobileLayout><WalletPage /></MobileLayout></PrivateRoute>} />
      <Route path="/favorites" element={<PrivateRoute><MobileLayout><FavoritesPage /></MobileLayout></PrivateRoute>} />
      <Route path="/points" element={<PrivateRoute><MobileLayout><PointsPage /></MobileLayout></PrivateRoute>} />
      <Route path="/recurring" element={<PrivateRoute><MobileLayout><RecurringSchedulePage /></MobileLayout></PrivateRoute>} />

      {/* Admin pages */}
      <Route path="/admin/dashboard" element={<RoleRoute roles={['admin']}><DesktopLayout><DashboardPage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/stations" element={<RoleRoute roles={['admin']}><DesktopLayout><StationManagePage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/chargers" element={<RoleRoute roles={['admin']}><DesktopLayout><ChargerManagePage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/users" element={<RoleRoute roles={['admin']}><DesktopLayout><UserManagePage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/technicians" element={<RoleRoute roles={['admin']}><DesktopLayout><TechnicianManagePage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/bookings" element={<RoleRoute roles={['admin']}><DesktopLayout><BookingManagePage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/tickets" element={<RoleRoute roles={['admin']}><DesktopLayout><TicketManagePage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/notifications" element={<RoleRoute roles={['admin']}><DesktopLayout><AdminNotificationsPage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/payments" element={<RoleRoute roles={['admin']}><DesktopLayout><PaymentsPage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/refunds" element={<RoleRoute roles={['admin']}><DesktopLayout><RefundManagePage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/wallet" element={<RoleRoute roles={['admin']}><DesktopLayout><WalletManagePage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/reports" element={<RoleRoute roles={['admin']}><DesktopLayout><ReportsPage /></DesktopLayout></RoleRoute>} />
      <Route path="/admin/trash" element={<RoleRoute roles={['admin']}><DesktopLayout><TrashPage /></DesktopLayout></RoleRoute>} />



      {/* Tech pages */}
      <Route path="/tech/dashboard" element={<RoleRoute roles={['technician']}><ResponsiveLayout><TechDashboardPage /></ResponsiveLayout></RoleRoute>} />
      <Route path="/tech/tickets/:id" element={<RoleRoute roles={['technician']}><ResponsiveLayout><TicketDetailPage /></ResponsiveLayout></RoleRoute>} />
      <Route path="/tech/tickets/:id/update" element={<RoleRoute roles={['technician']}><ResponsiveLayout><UpdateTicketPage /></ResponsiveLayout></RoleRoute>} />
      <Route path="/tech/history" element={<RoleRoute roles={['technician']}><ResponsiveLayout><TechHistoryPage /></ResponsiveLayout></RoleRoute>} />
      <Route path="/tech/notifications" element={<RoleRoute roles={['technician']}><ResponsiveLayout><TechNotificationsPage /></ResponsiveLayout></RoleRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </Suspense>
  )
}
