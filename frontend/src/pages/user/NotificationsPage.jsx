import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { FaBell, FaBolt, FaShoppingCart, FaTools, FaCalendarCheck } from 'react-icons/fa'
import api from '../../utils/api'

const typeIcon = {
  booking: FaCalendarCheck,
  charging: FaBolt,
  payment: FaShoppingCart,
  maintenance: FaTools,
}
const typeBg = {
  booking: 'bg-blue-100 text-blue-600',
  charging: 'bg-primary/10 text-primary',
  payment: 'bg-amber-100 text-amber-600',
  maintenance: 'bg-orange-100 text-orange-600',
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/notifications')
      .then(res => setNotifications(res.data.notifications || res.data))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [])

  const markRead = (notificationId) => {
    api.patch(`/api/notifications/${notificationId}/read`)
      .then(() => {
        setNotifications((prev) =>
          prev.map((n) => n.notification_id === notificationId ? { ...n, is_read: true } : n)
        )
      })
      .catch(() => {})
  }

  const markAllRead = () => {
    api.patch('/api/notifications/read-all')
      .then(() => setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true }))))
      .catch(() => {})
  }

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="การแจ้งเตือน" showBack onBack={() => navigate(-1)} />
      <div className="px-4 pt-3">
        {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
        <div className="flex justify-end mb-2">
          <button onClick={markAllRead} className="text-xs text-primary font-medium hover:text-green-600">อ่านทั้งหมด</button>
        </div>
        <div className="space-y-2">
          {notifications.length === 0 && !error && (
            <div className="text-center py-12 text-gray-400">
              <FaBell size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">ไม่มีการแจ้งเตือน</p>
            </div>
          )}
          {notifications.map((n) => {
            const Icon = typeIcon[n.type] || FaBell
            return (
              <div
                key={n.notification_id}
                onClick={() => !n.is_read && markRead(n.notification_id)}
                className={`bg-white rounded-xl p-3.5 shadow-sm border flex gap-3 cursor-pointer ${!n.is_read ? 'border-primary/20 bg-primary/[0.02]' : 'border-gray-100'}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${typeBg[n.type] || 'bg-gray-100 text-gray-500'}`}>
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-300 mt-1">{new Date(n.created_at).toLocaleDateString('th-TH', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
