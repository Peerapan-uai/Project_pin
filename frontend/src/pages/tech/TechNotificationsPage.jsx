import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { FaBell, FaTools } from 'react-icons/fa'

export default function TechNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)

  const fetchNotifications = () => {
    setLoading(true)
    api.get('/api/notifications')
      .then((res) => setNotifications(res.data.notifications ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchNotifications() }, [])

  const markAllRead = () => {
    api.patch('/api/notifications/read-all')
      .then(() => fetchNotifications())
      .catch((err) => console.error(err))
  }

  const markRead = (id) => {
    api.patch(`/api/notifications/${id}/read`)
      .then(() => setNotifications((prev) =>
        prev.map((n) => n.notification_id === id ? { ...n, is_read: true } : n)
      ))
      .catch((err) => console.error(err))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">การแจ้งเตือน</h1>
            <p className="text-gray-500 text-sm mt-0.5">ยังไม่อ่าน {unreadCount} รายการ</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary font-medium hover:text-green-600"
            >
              อ่านทั้งหมด
            </button>
          )}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <FaBell size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ไม่มีการแจ้งเตือน</p>
          </div>
        )}

        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.notification_id}
              onClick={() => !n.is_read && markRead(n.notification_id)}
              className={`bg-white rounded-xl p-4 shadow-sm border flex gap-3 transition-colors ${
                !n.is_read
                  ? 'border-primary/20 cursor-pointer hover:bg-primary/5'
                  : 'border-gray-100'
              }`}
            >
              <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                <FaTools size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${!n.is_read ? 'text-gray-900' : 'text-gray-500'}`}>{n.title}</p>
                  {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-300 mt-1">{new Date(n.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
