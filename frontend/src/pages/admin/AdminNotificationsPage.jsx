import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { FaBell, FaBolt, FaShoppingCart, FaTools, FaCalendarCheck } from 'react-icons/fa'

const typeIcon = { booking: FaCalendarCheck, charging: FaBolt, payment: FaShoppingCart, maintenance: FaTools }
const typeBg = { booking: 'bg-blue-100 text-blue-600', charging: 'bg-green-100 text-primary', payment: 'bg-amber-100 text-amber-600', maintenance: 'bg-orange-100 text-orange-600' }

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [filterUser, setFilterUser]       = useState('all')
  const [users, setUsers]                 = useState([])
  const [loading, setLoading]             = useState(true)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/notifications'),
      api.get('/api/users'),
    ])
      .then(([notifRes, usersRes]) => {
        setNotifications(notifRes.data)
        setUsers(usersRes.data)
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

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const filtered = filterUser === 'all'
    ? notifications
    : notifications.filter((n) => n.user_id === Number(filterUser))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การแจ้งเตือน</h1>
          <p className="text-gray-500 text-sm mt-0.5">ทั้งหมด {notifications.length} รายการ</p>
        </div>
        <button
          onClick={markAllRead}
          className="px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-600 hover:bg-gray-200 font-medium"
        >
          อ่านทั้งหมด
        </button>
      </div>

      <div className="mb-4">
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">ผู้ใช้ทั้งหมด</option>
          {users.map((u) => (
            <option key={u.user_id} value={u.user_id}>{u.first_name} {u.last_name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((n) => {
          const user = users.find((u) => u.user_id === n.user_id)
          const Icon = typeIcon[n.type] || FaBell
          return (
            <div key={n.notification_id} className={`bg-white rounded-xl p-4 shadow-sm border flex gap-4 ${!n.is_read ? 'border-primary/20' : 'border-gray-100'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeBg[n.type] || 'bg-gray-100 text-gray-500'}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-semibold text-sm ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                  {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  ถึง: {user?.first_name} {user?.last_name} · {new Date(n.created_at).toLocaleDateString('th-TH')}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
