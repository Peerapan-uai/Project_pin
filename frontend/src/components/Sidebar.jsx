import { NavLink, useNavigate } from 'react-router-dom'
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
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin/dashboard',     label: 'แดชบอร์ด',           Icon: FaTachometerAlt },
  { to: '/admin/stations',      label: 'จัดการสถานี',        Icon: FaBuilding },
  { to: '/admin/chargers',      label: 'จัดการตู้ชาร์จ',    Icon: FaBolt },
  { to: '/admin/users',         label: 'จัดการผู้ใช้',       Icon: FaUsers },
  { to: '/admin/technicians',   label: 'จัดการช่าง',         Icon: FaUserCog },
  { to: '/admin/bookings',      label: 'การจอง',             Icon: FaClipboardList },
  { to: '/admin/tickets',       label: 'ตั๋วแจ้งปัญหา',     Icon: FaTicketAlt },
  { to: '/admin/notifications', label: 'แจ้งเตือน',          Icon: FaBell },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
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
                <Icon size={16} className="flex-shrink-0" />
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
