import { useNavigate } from 'react-router-dom'
import { FaBell, FaUserCircle } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'

export default function TopBar({ notifPath = '/admin/notifications' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()

  return (
    <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center justify-end gap-4 sticky top-0 z-40 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      {/* Notification bell */}
      <button
        onClick={() => navigate(notifPath)}
        className="relative p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <FaBell size={17} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200" />

      {/* User info */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <FaUserCircle size={18} className="text-primary" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-[11px] text-gray-400 leading-tight">{user?.email}</p>
        </div>
      </div>
    </header>
  )
}