import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  FaTachometerAlt,
  FaHistory,
  FaBell,
  FaSignOutAlt,
  FaBolt,
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import TopBar from '../components/TopBar'

const techNavItems = [
  { to: '/tech/dashboard',      label: 'แดชบอร์ด',      Icon: FaTachometerAlt },
  { to: '/tech/history',        label: 'ประวัติงาน',    Icon: FaHistory },
  { to: '/tech/notifications',  label: 'แจ้งเตือน',     Icon: FaBell },
]

const mobileNavItems = [
  { to: '/tech/dashboard',     label: 'แดชบอร์ด',   Icon: FaTachometerAlt },
  { to: '/tech/history',       label: 'ประวัติ',     Icon: FaHistory },
  { to: '/tech/notifications', label: 'แจ้งเตือน',  Icon: FaBell },
]

export default function ResponsiveLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    api.get('/api/notifications')
      .then((res) => {
        setUnreadCount(res.data.unread_count ?? res.data.notifications?.filter((n) => !n.is_read).length ?? 0)
      })
      .catch(() => {})
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="md:flex">
        {/* Sidebar for desktop */}
        <aside className="hidden md:flex md:flex-col w-[250px] bg-gray-800 text-white min-h-screen fixed top-0 left-0 z-50 shadow-xl">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0 shadow">
              <FaBolt size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">EV Charger</p>
              <p className="text-gray-400 text-xs">Technician</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {techNavItems.map(({ to, label, Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`
                    }
                  >
                    <div className="relative flex-shrink-0">
                      <Icon size={16} />
                      {to === '/tech/notifications' && unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
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

        {/* Main content */}
        <div className="md:ml-[250px] flex-1 min-w-0 flex flex-col min-h-screen pb-20 md:pb-0">
          <div className="hidden md:block">
            <TopBar notifPath="/tech/notifications" />
          </div>
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch h-16">
          {mobileNavItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={20} className={isActive ? 'text-primary' : 'text-gray-400'} />
                    {to === '/tech/notifications' && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={isActive ? 'text-primary' : 'text-gray-400'}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
          >
            <FaSignOutAlt size={20} />
            <span>ออก</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
