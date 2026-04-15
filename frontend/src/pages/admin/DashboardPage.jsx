import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBolt, FaBuilding, FaUsers, FaTicketAlt, FaClipboardList, FaExclamationTriangle, FaMoneyBillWave } from 'react-icons/fa'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [users, setUsers]           = useState([])
  const [stations, setStations]     = useState([])
  const [bookings, setBookings]     = useState([])
  const [tickets, setTickets]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [filterStation, setFilterStation] = useState('all')
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/api/users'),
      api.get('/api/stations'),
      api.get('/api/bookings/all'),
      api.get('/api/tickets'),
    ])
      .then(([usersRes, stationsRes, bookingsRes, ticketsRes]) => {
        setUsers(usersRes.data.users ?? [])
        setStations(Array.isArray(stationsRes.data) ? stationsRes.data : (stationsRes.data.stations ?? []))
        setBookings(bookingsRes.data.bookings ?? [])
        setTickets(ticketsRes.data.tickets ?? [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const today = new Date().toISOString().slice(0, 10)

  const filteredBookings = bookings.filter((b) => {
    const matchStation = filterStation === 'all' || String(b.station_id) === filterStation
    const matchDate    = !filterDate || (b.start_time && b.start_time.startsWith(filterDate))
    return matchStation && matchDate
  })

  const todayRevenue = bookings
    .filter((b) => b.payment_status === 'completed' && b.total_amount && b.start_time?.startsWith(today))
    .reduce((sum, b) => sum + Number(b.total_amount), 0)

  const filteredRevenue = filteredBookings
    .filter((b) => b.payment_status === 'completed' && b.total_amount)
    .reduce((sum, b) => sum + Number(b.total_amount), 0)

  const filteredTickets = filterStation === 'all'
    ? tickets
    : tickets.filter((t) => {
        const booking = filteredBookings.find((b) => b.station_name === t.station_name)
        return !!booking
      })

  const stats = [
    { label: 'สถานีทั้งหมด', value: stations.length, Icon: FaBuilding, light: 'bg-blue-50 text-blue-600' },
    { label: 'ผู้ใช้งาน', value: users.filter((u) => u.role === 'user').length, Icon: FaUsers, light: 'bg-purple-50 text-purple-600' },
    { label: filterDate || filterStation !== 'all' ? 'การจอง (ที่กรอง)' : 'การจองทั้งหมด', value: filteredBookings.length, Icon: FaClipboardList, light: 'bg-amber-50 text-amber-600' },
    { label: 'แจ้งซ่อม (เปิด)', value: tickets.filter((t) => t.status !== 'completed').length, Icon: FaTicketAlt, light: 'bg-red-50 text-red-600' },
    {
      label: filterDate || filterStation !== 'all' ? `รายได้ (ที่กรอง)` : 'รายได้วันนี้',
      value: `${(filterDate || filterStation !== 'all' ? filteredRevenue : todayRevenue).toFixed(2)} ฿`,
      Icon: FaMoneyBillWave,
      light: 'bg-green-50 text-green-600',
    },
  ]

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">แดชบอร์ด</h1>
          <p className="text-gray-500 text-sm">ภาพรวมระบบ EV Charger</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={filterStation}
            onChange={(e) => setFilterStation(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            <option value="all">ทุกสถานี</option>
            {stations.map((s) => (
              <option key={s.station_id} value={s.station_id}>{s.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          />
          {(filterStation !== 'all' || filterDate) && (
            <button
              onClick={() => { setFilterStation('all'); setFilterDate('') }}
              className="px-3 py-2 text-xs text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

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
          <h2 className="font-bold text-gray-900">แจ้งซ่อมล่าสุด</h2>
        </div>
        <div className="space-y-3">
          {tickets.filter((t) => t.status !== 'completed').slice(0, 10).map((t) => (
            <div key={t.ticket_id} onClick={() => navigate('/admin/tickets')} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
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
          {tickets.filter((t) => t.status !== 'completed').length === 0 && <p className="text-sm text-gray-400 text-center py-4">ไม่มีแจ้งซ่อม</p>}
        </div>
      </div>
    </div>
  )
}
