import { FaChevronLeft } from 'react-icons/fa'
import NotificationBell from './NotificationBell'

export default function Navbar({
  title = '',
  showBack = false,
  onBack,
  showNotification = false,
  unreadCount = 0,
  onNotificationClick,
}) {
  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="flex items-center h-14 px-4">
        {/* Left: back button or spacer */}
        <div className="w-10 flex-shrink-0">
          {showBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1.5 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="ย้อนกลับ"
            >
              <FaChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Center: title */}
        <h1 className="flex-1 text-center text-base font-semibold text-gray-900 truncate px-2">
          {title}
        </h1>

        {/* Right: notification bell or spacer */}
        <div className="w-10 flex-shrink-0 flex justify-end">
          {showNotification && (
            <NotificationBell count={unreadCount} onClick={onNotificationClick} />
          )}
        </div>
      </div>
    </header>
  )
}
