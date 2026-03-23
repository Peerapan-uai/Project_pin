import { FaBell } from 'react-icons/fa'

export default function NotificationBell({ count = 0, onClick }) {
  const displayCount = count > 99 ? '99+' : count

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-full"
      aria-label={`การแจ้งเตือน${count > 0 ? ` ${displayCount} รายการที่ยังไม่ได้อ่าน` : ''}`}
    >
      <FaBell size={22} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none shadow">
          {displayCount}
        </span>
      )}
    </button>
  )
}
