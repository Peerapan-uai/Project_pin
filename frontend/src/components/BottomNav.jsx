import { NavLink } from 'react-router-dom'
import { FaHome, FaSearch, FaClipboardList, FaUser } from 'react-icons/fa'

const navItems = [
  { to: '/home',   label: 'หน้าหลัก', Icon: FaHome },
  { to: '/search', label: 'ค้นหา',    Icon: FaSearch },
  { to: '/bookings', label: 'การจอง',    Icon: FaClipboardList },
  { to: '/profile',  label: 'โปรไฟล์',  Icon: FaUser },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch h-16">
        {navItems.map(({ to, label, Icon }) => (
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
                <Icon size={20} className={isActive ? 'text-primary' : 'text-gray-400'} />
                <span className={isActive ? 'text-primary' : 'text-gray-400'}>{label}</span>
                {isActive && (
                  <span className="absolute top-0 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
