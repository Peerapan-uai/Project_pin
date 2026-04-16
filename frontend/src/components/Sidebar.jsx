import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  FaTachometerAlt,
  FaBuilding,
  FaBolt,
  FaUsers,
  FaUserCog,
  FaClipboardList,
  FaTicketAlt,
  FaBell,
  FaSignOutAlt,
  FaMoneyBillWave,
  FaUndo,
  FaWallet,
  FaChartBar,
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

const navItems = [
  { to: '/admin/dashboard',     label: 'แดชบอร์ด',           Icon: FaTachometerAlt },
  { to: '/admin/stations',      label: 'จัดการสถานี',        Icon: FaBuilding },
  { to: '/admin/chargers',      label: 'จัดการตู้ชาร์จ',    Icon: FaBolt },
  { to: '/admin/users',         label: 'จัดการผู้ใช้',       Icon: FaUsers },
  { to: '/admin/technicians',   label: 'จัดการช่าง',         Icon: FaUserCog },
  { to: '/admin/bookings',      label: 'การจอง',             Icon: FaClipboardList },
  { to: '/admin/tickets',       label: 'แจ้งซ่อม',           Icon: FaTicketAlt },
  { to: '/admin/payments',      label: 'การเงิน',            Icon: FaMoneyBillWave },
  { to: '/admin/refunds',        label: 'คืนเงิน',             Icon: FaUndo },
  { to: '/admin/wallet',        label: 'จัดการ Wallet',       Icon: FaWallet },
  { to: '/admin/reports',       label: 'รายงาน',              Icon: FaChartBar },
  { to: '/admin/notifications', label: 'แจ้งเตือน',          Icon: FaBell },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    api.get('/api/notifications')
      .then((res) => {
        setUnreadCount(res.data.unread_count ?? 0)
      })
      .catch(() => {})
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <aside className="fixed top-0 left-0 w-[250px] h-screen bg-gray-900 text-white flex flex-col z-50 shadow-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0 shadow">
          <FaBolt size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-base leading-tight">EV Charger</p>
          <p className="text-gray-400 text-xs">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <div className="relative flex-shrink-0">
                  <Icon size={16} />
                  {to === '/admin/notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-all"
        >
          <FaSignOutAlt size={16} />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}
