import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { FaBell, FaBolt, FaShoppingCart, FaTools, FaCalendarCheck } from 'react-icons/fa'

const typeIcon = { booking: FaCalendarCheck, charging: FaBolt, payment: FaShoppingCart, maintenance: FaTools }
const typeBg   = { booking: 'bg-blue-100 text-blue-600', charging: 'bg-green-100 text-primary', payment: 'bg-amber-100 text-amber-600', maintenance: 'bg-orange-100 text-orange-600' }

const isWithin = (dateStr, period) => {
  const d   = new Date(dateStr)
  const now = new Date()
  if (period === 'day')   return d.toDateString() === now.toDateString()
  if (period === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0)
    return d >= start
  }
  if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  if (period === 'year')  return d.getFullYear() === now.getFullYear()
  return true
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [users, setUsers]                 = useState([])
  const [filterUser, setFilterUser]       = useState('')
  const [filterRole, setFilterRole]       = useState('all')
  const [filterPeriod, setFilterPeriod]   = useState('all')
  const [loading, setLoading]             = useState(true)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/notifications'),
      api.get('/api/users'),
    ])
      .then(([notifRes, usersRes]) => {
        setNotifications(notifRes.data.notifications ?? [])
        setUsers(usersRes.data.users ?? [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const markAllRead = () => {
    api.patch('/api/notifications/read-all')
      .then(() => fetchData())
      .catch((err) => console.error(err))
  }

  const markRead = (id) => {
    api.patch(`/api/notifications/${id}/read`)
      .then(() => setNotifications((prev) => prev.filter((n) => n.notification_id !== id)))
      .catch((err) => console.error(err))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const filtered = notifications.filter((n) => {
    const user = users.find((u) => u.user_id === n.user_id)
    const matchUser   = !filterUser.trim() ||
      `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.toLowerCase().includes(filterUser.toLowerCase()) ||
      String(n.user_id).includes(filterUser.trim())
    const matchRole   = filterRole === 'all' || user?.role === filterRole
    const matchPeriod = isWithin(n.created_at, filterPeriod)
    return matchUser && matchRole && matchPeriod
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การแจ้งเตือน</h1>
          <p className="text-gray-500 text-sm mt-0.5">ยังไม่อ่าน {unreadCount} รายการ · ทั้งหมด {notifications.length} รายการ</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-600 hover:bg-gray-200 font-medium"
          >
            อ่านทั้งหมด
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          placeholder="ค้นหาชื่อหรือ ID ผู้ใช้..."
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="all">ทุก role</option>
          <option value="user">User</option>
          <option value="technician">ช่าง</option>
        </select>
        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="all">ทุกช่วงเวลา</option>
          <option value="day">วันนี้</option>
          <option value="week">7 วันล่าสุด</option>
          <option value="month">เดือนนี้</option>
          <option value="year">ปีนี้</option>
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((n) => {
          const user = users.find((u) => u.user_id === n.user_id)
          const Icon = typeIcon[n.type] || FaBell
          return (
            <div
              key={n.notification_id}
              onClick={() => !n.is_read && markRead(n.notification_id)}
              className={`bg-white rounded-xl p-4 shadow-sm border flex gap-4 transition-colors ${
                !n.is_read ? 'border-primary/20 cursor-pointer hover:bg-primary/5' : 'border-gray-100'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeBg[n.type] || 'bg-gray-100 text-gray-500'}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-semibold text-sm ${!n.is_read ? 'text-gray-900' : 'text-gray-500'}`}>{n.title}</p>
                  {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  ถึง: {user?.first_name} {user?.last_name} · {new Date(n.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <FaBell size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ไม่มีการแจ้งเตือน</p>
          </div>
        )}
      </div>
    </div>
  )
}
