import { useState, useEffect } from 'react'
import { FaBolt, FaBuilding, FaUsers, FaTicketAlt, FaClipboardList, FaExclamationTriangle } from 'react-icons/fa'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'

export default function DashboardPage() {
  const [users, setUsers]       = useState([])
  const [stations, setStations] = useState([])
  const [bookings, setBookings] = useState([])
  const [tickets, setTickets]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/users'),
      api.get('/api/stations'),
      api.get('/api/bookings'),
      api.get('/api/tickets'),
    ])
      .then(([usersRes, stationsRes, bookingsRes, ticketsRes]) => {
        setUsers(usersRes.data)
        setStations(stationsRes.data)
        setBookings(bookingsRes.data)
        setTickets(ticketsRes.data)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const stats = [
    { label: 'สถานีทั้งหมด', value: stations.length, Icon: FaBuilding, color: 'bg-blue-500', light: 'bg-blue-50 text-blue-600' },
    { label: 'ผู้ใช้งาน', value: users.filter((u) => u.role === 'user').length, Icon: FaUsers, color: 'bg-purple-500', light: 'bg-purple-50 text-purple-600' },
    { label: 'การจองทั้งหมด', value: bookings.length, Icon: FaClipboardList, color: 'bg-amber-500', light: 'bg-amber-50 text-amber-600' },
    { label: 'ตั๋วซ่อม (เปิด)', value: tickets.filter((t) => t.status !== 'completed').length, Icon: FaTicketAlt, color: 'bg-red-500', light: 'bg-red-50 text-red-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">แดชบอร์ด</h1>
      <p className="text-gray-500 text-sm mb-6">ภาพรวมระบบ EV Charger</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, Icon, light }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">{label}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${light}`}>
                <Icon size={17} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent tickets */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FaExclamationTriangle className="text-amber-500" />
          <h2 className="font-bold text-gray-900">ตั๋วซ่อมล่าสุด</h2>
        </div>
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.ticket_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.title}</p>
                <p className="text-xs text-gray-500">{t.charger_name} · {t.station_name}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={t.status} />
                <StatusBadge status={t.priority} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
