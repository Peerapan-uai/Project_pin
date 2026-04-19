import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBolt, FaBuilding, FaUsers, FaTicketAlt, FaClipboardList, FaExclamationTriangle, FaMoneyBillWave } from 'react-icons/fa'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import Select from '../../components/ui/Select'
import CalendarPicker from '../../components/ui/CalendarPicker'

const POLL_INTERVAL = 10000

export default function DashboardPage() {
  const navigate = useNavigate()
  const [users, setUsers]           = useState([])
  const [stations, setStations]     = useState([])
  const [bookings, setBookings]     = useState([])
  const [tickets, setTickets]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [filterStation, setFilterStation] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [topStations, setTopStations] = useState([])
  const [todayRevenue, setTodayRevenue] = useState(0)
  const intervalRef = useRef(null)

  const fetchTodayRevenue = useCallback(() => {
    // ไม่ส่ง to_date → backend ใช้ new Date() (ตอนนี้) เป็น upper bound → รวมทั้งวันนี้
    const today = new Date().toISOString().slice(0, 10)
    api.get(`/api/admin/reports/revenue?period=daily&from_date=${today}`)
      .then((res) => setTodayRevenue(res.data.summary?.total_revenue ?? 0))
      .catch(() => {})
  }, [])

  const fetchAll = useCallback(() => {
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
      .catch(() => {})
      .finally(() => setLoading(false))

    fetchTodayRevenue()

    api.get('/api/admin/reports/stations')
      .then((res) => {
        const sorted = (res.data.data ?? [])
          .filter((s) => s.total_revenue > 0)
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, 3)
        setTopStations(sorted)
      })
      .catch(() => {})
  }, [fetchTodayRevenue])

  useEffect(() => {
    fetchAll()
    intervalRef.current = setInterval(fetchAll, POLL_INTERVAL)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchAll() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchAll])

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const filteredBookings = bookings.filter((b) => {
    const matchStation = filterStation === 'all' || String(b.station_id) === filterStation
    const matchDate    = !filterDate || (b.start_time && b.start_time.startsWith(filterDate))
    return matchStation && matchDate
  })

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
    { label: 'ช่างในระบบ', value: users.filter((u) => u.role === 'technician').length, Icon: FaUsers, light: 'bg-teal-50 text-teal-600' },
    { label: 'แจ้งซ่อม (เปิด)', value: tickets.filter((t) => t.status !== 'completed').length, Icon: FaTicketAlt, light: 'bg-red-50 text-red-600' },
    {
      label: filterDate || filterStation !== 'all' ? `รายได้ (ที่กรอง)` : 'รายได้วันนี้',
      value: `${Number(filterDate || filterStation !== 'all' ? filteredRevenue : todayRevenue).toFixed(2)} ฿`,
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
          <Select
            value={filterStation}
            onChange={(v) => setFilterStation(v)}
            options={[{ value: 'all', label: 'ทุกสถานี' }, ...stations.map((s) => ({ value: s.station_id, label: s.name }))]}
          />
          <div className="w-44">
            <CalendarPicker value={filterDate} onChange={setFilterDate} placeholder="กรองวันที่" />
          </div>
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

      {/* Top 3 สถานีรายได้สูงสุด */}
      {topStations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="mb-5">
            <h2 className="font-bold text-gray-900">Top 3 สถานีรายได้สูงสุด</h2>
            <p className="text-xs text-gray-400 mt-0.5">รายได้สะสมตลอดเวลา (ทุก payment ที่ผ่านมา)</p>
          </div>
          <div className="space-y-4">
            {topStations.map((s, i) => {
              const barColors = ['bg-primary', 'bg-blue-400', 'bg-violet-400']
              const badgeColors = ['text-primary border-primary/30 bg-green-50', 'text-blue-500 border-blue-200 bg-blue-50', 'text-violet-500 border-violet-200 bg-violet-50']
              const maxRevenue = topStations[0].total_revenue
              const pct = maxRevenue > 0 ? (s.total_revenue / maxRevenue) * 100 : 0
              return (
                <div key={s.station_id} className="flex items-center gap-3 px-1">
                  <span className="text-sm font-bold text-gray-400 w-7 flex-shrink-0">0{i + 1}</span>
                  <p className="text-sm font-medium text-gray-800 truncate flex-1">{s.name}</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex-[2]">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColors[i]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex-shrink-0 whitespace-nowrap ${badgeColors[i]}`}>
                    {Number(s.total_revenue).toFixed(0)} ฿
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
