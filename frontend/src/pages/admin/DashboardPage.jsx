import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBolt, FaUsers, FaTicketAlt, FaClipboardList, FaExclamationTriangle, FaMoneyBillWave, FaUserCog, FaWallet, FaArrowUp, FaArrowDown, FaSearch } from 'react-icons/fa'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '../../utils/api'
import Select from '../../components/ui/Select'

const PRIORITY_COLOR = { low: 'bg-green-100 text-green-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-600', critical: 'bg-red-200 text-red-800' }
const PRIORITY_ICON_BG = { low: 'bg-green-100', medium: 'bg-amber-100', high: 'bg-red-100', critical: 'bg-red-200' }
const PRIORITY_LABEL = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง', critical: 'วิกฤต' }

const ISSUE_TYPE_META = {
  safety:          { label: 'ความปลอดภัย',  color: 'bg-red-100 text-red-700' },
  no_charge:       { label: 'ชาร์จไม่ได้',   color: 'bg-amber-100 text-amber-700' },
  payment:         { label: 'ชำระเงิน',      color: 'bg-blue-100 text-blue-700' },
  physical_damage: { label: 'ความเสียหาย',   color: 'bg-orange-100 text-orange-700' },
  display:         { label: 'หน้าจอ',        color: 'bg-purple-100 text-purple-700' },
  other:           { label: 'อื่นๆ',          color: 'bg-gray-100 text-gray-600' },
}

const POLL_INTERVAL = 30000

function getDateRange(preset) {
  const now = new Date()
  const to = now.toISOString().slice(0, 10)
  let from
  if (preset === 'today') {
    from = to
  } else if (preset === '7d') {
    const d = new Date(now)
    d.setDate(d.getDate() - 6)
    from = d.toISOString().slice(0, 10)
  } else {
    // 30d
    const d = new Date(now)
    d.setDate(d.getDate() - 29)
    from = d.toISOString().slice(0, 10)
  }
  return { from, to }
}

function getCompareType(preset) {
  if (preset === 'today') return 'daily'
  if (preset === '7d') return 'weekly'
  return 'monthly'
}

const presets = [
  { value: 'today', label: 'วันนี้' },
  { value: '7d', label: '7 วัน' },
  { value: '30d', label: '30 วัน' },
]

const DONUT_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e']

export default function DashboardPage() {
  const navigate = useNavigate()

  const [period, setPeriod] = useState('today')
  const [filterStation, setFilterStation] = useState('all')

  const [users, setUsers] = useState([])
  const [stations, setStations] = useState([])
  const [bookings, setBookings] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  const [revenueData, setRevenueData] = useState({ total: 0, chart: [] })
  const [comparison, setComparison] = useState(null)
  const [usageData, setUsageData] = useState({ totalEnergy: 0, totalSessions: 0 })
  const [topStations, setTopStations] = useState([])
  const [allStationRevenue, setAllStationRevenue] = useState([])
  const [walletSummary, setWalletSummary] = useState(null)

  // ticket panel state
  const [ticketSearch, setTicketSearch] = useState('')
  const [ticketPage, setTicketPage] = useState(1)

  const intervalRef = useRef(null)

  const fetchAll = useCallback(() => {
    const { from, to } = getDateRange(period)
    const stationParam = filterStation !== 'all' ? `&station_id=${filterStation}` : ''

    const coreP = Promise.all([
      api.get('/api/users'),
      api.get('/api/stations'),
      api.get('/api/bookings/all'),
      api.get('/api/tickets'),
    ]).then(([u, s, b, t]) => {
      setUsers(u.data.users ?? [])
      setStations(Array.isArray(s.data) ? s.data : (s.data.stations ?? []))
      setBookings(b.data.bookings ?? [])
      setTickets(t.data.tickets ?? [])
    }).catch(() => {})

    // ไม่ส่ง to_date → backend ใช้ new Date() (เวลาปัจจุบัน) เป็น upper bound → ครอบคลุมทั้งวัน
    const revP = api.get(`/api/admin/reports/revenue?period=daily&from_date=${from}${stationParam}`)
      .then((res) => {
        const rows = res.data.data ?? []
        const chart = [...rows].sort((a, b) => a.period_date.localeCompare(b.period_date))
          .map((r) => ({ date: r.period_date.slice(5), revenue: Number(r.revenue) }))
        setRevenueData({ total: res.data.summary?.total_revenue ?? 0, chart })
      }).catch(() => {})

    const compP = api.get(`/api/admin/reports/comparison?compare_type=${getCompareType(period)}`)
      .then((res) => setComparison(res.data))
      .catch(() => {})

    const useP = api.get(`/api/admin/reports/usage?from_date=${from}`)
      .then((res) => {
        const rows = res.data.data ?? []
        const totalEnergy = rows.reduce((s, r) => s + Number(r.total_energy_kwh || 0), 0)
        const totalSessions = rows.reduce((s, r) => s + Number(r.total_sessions || 0), 0)
        setUsageData({ totalEnergy, totalSessions })
      }).catch(() => {})

    const topP = api.get('/api/admin/reports/stations')
      .then((res) => {
        const all = (res.data.data ?? []).filter((s) => s.total_revenue > 0)
        const sorted = [...all].sort((a, b) => b.total_revenue - a.total_revenue)
        setTopStations(sorted.slice(0, 5))
        setAllStationRevenue(sorted)
      }).catch(() => {})

    const walP = api.get(`/api/admin/wallet/summary?from_date=${from}&to_date=${to}`)
      .then((res) => setWalletSummary(res.data.summary ?? null))
      .catch(() => {})

    Promise.all([coreP, revP, compP, useP, topP, walP])
      .finally(() => setLoading(false))
  }, [period, filterStation])

  useEffect(() => {
    setLoading(true)
    fetchAll()
    intervalRef.current = setInterval(fetchAll, POLL_INTERVAL)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchAll() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchAll])

  // reset ticket page เมื่อเปลี่ยน filter
  useEffect(() => { setTicketPage(1) }, [period, filterStation])

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const { from, to } = getDateRange(period)
  const selectedStation = filterStation !== 'all'
    ? stations.find((s) => String(s.station_id) === String(filterStation))
    : null

  const filteredBookings = bookings.filter((b) => {
    const matchStation = filterStation === 'all' || String(b.station_id) === String(filterStation)
    const matchDate = !from || (b.start_time && b.start_time.slice(0, 10) >= from && b.start_time.slice(0, 10) <= to)
    return matchStation && matchDate
  })

  // tickets: เฉพาะ status=reported + กรองสถานี + กรอง date range + search
  const filteredTickets = tickets.filter((t) => {
    if (t.status !== 'reported') return false
    if (selectedStation && t.station_name !== selectedStation.name) return false
    if (t.created_at) {
      const tDate = t.created_at.slice(0, 10)
      if (tDate < from || tDate > to) return false
    }
    if (ticketSearch.trim()) {
      const q = ticketSearch.toLowerCase()
      const haystack = `${t.title ?? ''} ${t.station_name ?? ''} ${t.charger_name ?? ''} ${t.reporter_name ?? ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const TICKETS_PER_PAGE = 12
  const ticketTotalPages = Math.max(1, Math.ceil(filteredTickets.length / TICKETS_PER_PAGE))
  const pagedTickets = filteredTickets.slice((ticketPage - 1) * TICKETS_PER_PAGE, ticketPage * TICKETS_PER_PAGE)

  // ticket summary — ทุก status ในช่วง period + station filter
  const summaryTickets = tickets.filter((t) => {
    if (selectedStation && t.station_name !== selectedStation.name) return false
    if (t.created_at) {
      const tDate = t.created_at.slice(0, 10)
      if (tDate < from || tDate > to) return false
    }
    return true
  })
  const byPriority = { low: 0, medium: 0, high: 0, critical: 0 }
  const byIssueType = { safety: 0, no_charge: 0, payment: 0, physical_damage: 0, display: 0, other: 0 }
  summaryTickets.forEach((t) => {
    if (byPriority[t.priority] !== undefined) byPriority[t.priority]++
    if (byIssueType[t.issue_type] !== undefined) byIssueType[t.issue_type]++
  })

  // format ticket date
  const formatTicketDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (period === 'today') {
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  // ผู้ใช้: นับ unique users จาก bookings ตาม date range (ทุกสถานี = ทุก booking ในช่วง, เลือกสถานี = เฉพาะสถานีนั้น)
  const filteredUserCount = new Set(filteredBookings.map((b) => b.user_id)).size

  const allTechs = users.filter((u) => u.role === 'technician')
  const readyTechs = allTechs.filter((u) => u.tech_status === 'AVAILABLE')

  const pctChange = comparison ? Number(comparison.percentage_change) : 0
  const periodLabel = presets.find((p) => p.value === period)?.label ?? 'วันนี้'

  // dynamic stat cards (ข้อมูลที่เปลี่ยนตาม period)
  const dynamicStats = [
    {
      label: `รายได้ (${periodLabel})`,
      value: `${Number(revenueData.total).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿`,
      sub: comparison ? (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${pctChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {pctChange >= 0 ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
          {Math.abs(pctChange).toFixed(1)}% vs {comparison.previous_label}
        </span>
      ) : null,
      Icon: FaMoneyBillWave,
      light: 'bg-green-50 text-green-600',
    },
    {
      label: 'การจอง',
      value: filteredBookings.length,
      Icon: FaClipboardList,
      light: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'แจ้งซ่อม',
      value: filteredTickets.length,
      Icon: FaTicketAlt,
      light: 'bg-red-50 text-red-600',
    },
  ]

  // static stat cards (ข้อมูลคงที่ ไม่ค่อยเปลี่ยน)
  const staticStats = [
    {
      label: selectedStation ? 'ผู้ใช้สถานี' : `ผู้ใช้งาน (${periodLabel})`,
      value: filteredUserCount,
      Icon: FaUsers,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'ช่างเทคนิค',
      value: `${readyTechs.length} / ${allTechs.length}`,
      sub: 'พร้อม / ทั้งหมด',
      Icon: FaUserCog,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      label: 'พลังงาน',
      value: `${usageData.totalEnergy.toFixed(1)} kWh`,
      sub: `${usageData.totalSessions} sessions`,
      Icon: FaBolt,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ]

  // donut chart data
  const donutData = allStationRevenue.map((s) => ({
    name: s.name,
    value: Number(s.total_revenue),
  }))

  return (
    <div>
      {/* Header + Filters */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">แดชบอร์ด</h1>
          <p className="text-gray-500 text-sm">ภาพรวมระบบ EV Charger</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {presets.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  period === p.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="w-44">
            <Select
              value={filterStation}
              onChange={(v) => setFilterStation(v)}
              options={[{ value: 'all', label: 'ทุกสถานี' }, ...stations.map((s) => ({ value: s.station_id, label: s.name }))]}
            />
          </div>
        </div>
      </div>

      {/* Dynamic Stats (เปลี่ยนตาม period) + Static Stats (คงที่) */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Dynamic cards */}
        <div className="grid grid-cols-3 gap-4 flex-1">
          {dynamicStats.map(({ label, value, sub, Icon, light }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${light}`}>
                  <Icon size={17} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {sub && <div className="mt-1">{sub}</div>}
            </div>
          ))}
        </div>

        {/* Static cards — design ต่าง: compact row style */}
        <div className="flex flex-col gap-2 w-full lg:w-64 flex-shrink-0">
          {staticStats.map(({ label, value, sub, Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl px-4 py-3 flex items-center gap-3`}>
              <div className={`w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center ${color}`}>
                <Icon size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{value}</p>
              </div>
              {sub && <p className="text-[10px] text-gray-400 flex-shrink-0">{sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Trend Chart */}
      {revenueData.chart.length > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-1">รายได้ย้อนหลัง</h2>
          <p className="text-xs text-gray-400 mb-4">รายได้รายวันในช่วง {periodLabel}</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueData.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v) => `${v.toLocaleString()} ฿`} width={80} />
              <Tooltip
                formatter={(v) => [`${Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿`, 'รายได้']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Wallet Summary */}
      {walletSummary && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FaWallet className="text-indigo-500" />
            <h2 className="font-bold text-gray-900">สรุป Wallet ในระบบ ({periodLabel})</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">ยอดเงินรวม</p>
              <p className="text-lg font-bold text-gray-900">{Number(walletSummary.total_wallet_balance).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">เติมเงิน</p>
              <p className="text-lg font-bold text-green-600">{Number(walletSummary.total_topup).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">ใช้จ่าย</p>
              <p className="text-lg font-bold text-amber-600">{Number(walletSummary.total_deduct).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">คืนเงิน</p>
              <p className="text-lg font-bold text-blue-600">{Number(walletSummary.total_refund).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">ปรับยอด</p>
              <p className="text-lg font-bold text-violet-600">{Number(walletSummary.total_adjust).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</p>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Summary — breakdown ตาม priority + issue_type */}
      {summaryTickets.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FaTicketAlt className="text-red-400" size={14} />
            <h2 className="font-bold text-gray-900">สรุปแจ้งซ่อม ({periodLabel})</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{summaryTickets.length} รายการ</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* by priority */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">แยกตาม Priority</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(byPriority).map(([key, count]) => (
                  <div key={key} className={`flex items-center justify-between rounded-xl px-3 py-2 ${PRIORITY_COLOR[key]}`}>
                    <span className="text-xs font-medium">{PRIORITY_LABEL[key]}</span>
                    <span className="text-lg font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* by issue type */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">แยกตามประเภทปัญหา</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(byIssueType).map(([key, count]) => {
                  const meta = ISSUE_TYPE_META[key]
                  return (
                    <div key={key} className={`flex items-center justify-between rounded-xl px-3 py-2 ${meta.color}`}>
                      <span className="text-xs font-medium">{meta.label}</span>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two columns: Top stations (+ donut) + Recent tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top สถานีรายได้สูงสุด + Donut Chart ใน card เดียว */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="mb-3">
            <h2 className="font-bold text-gray-900">Top 5 สถานีรายได้สูงสุด</h2>
            <p className="text-xs text-gray-400 mt-0.5">รายได้สะสมตลอดเวลา</p>
          </div>
          {topStations.length > 0 ? (
            <div className="space-y-2.5">
              {topStations.map((s, i) => {
                const barColors = ['bg-primary', 'bg-blue-400', 'bg-violet-400', 'bg-amber-400', 'bg-pink-400']
                const badgeColors = [
                  'text-primary border-primary/30 bg-green-50',
                  'text-blue-500 border-blue-200 bg-blue-50',
                  'text-violet-500 border-violet-200 bg-violet-50',
                  'text-amber-500 border-amber-200 bg-amber-50',
                  'text-pink-500 border-pink-200 bg-pink-50',
                ]
                const maxRevenue = topStations[0].total_revenue
                const pct = maxRevenue > 0 ? (s.total_revenue / maxRevenue) * 100 : 0
                return (
                  <div key={s.station_id} className="flex items-center gap-2 px-1">
                    <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">0{i + 1}</span>
                    <p className="text-xs font-medium text-gray-800 truncate flex-1">{s.name}</p>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden flex-[2]">
                      <div className={`h-full rounded-full transition-all duration-500 ${barColors[i]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex-shrink-0 whitespace-nowrap ${badgeColors[i]}`}>
                      {Number(s.total_revenue).toLocaleString()} ฿
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีข้อมูลรายได้</p>
          )}

          {/* Donut Chart อยู่ใน card เดียวกัน */}
          {donutData.length > 0 && (
            <>
              <div className="border-t border-gray-100 mt-4 pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">สัดส่วนรายได้</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿`, 'รายได้']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    iconSize={6}
                    formatter={(val) => <span className="text-[11px] text-gray-600">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Recent tickets — design เหมือนหน้า Wallet */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          {/* Header + Search */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0 gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <FaExclamationTriangle size={13} className="text-amber-500" />
              <span className="font-semibold text-gray-800 text-sm">แจ้งซ่อมล่าสุด</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredTickets.length}</span>
            </div>
            <div className="relative flex-1 max-w-[200px]">
              <FaSearch size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => { setTicketSearch(e.target.value); setTicketPage(1) }}
                placeholder="ค้นหาชื่อ, สถานี, ตู้..."
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              />
            </div>
          </div>

          {/* Column labels */}
          <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
            <span className="text-xs font-medium text-gray-500">รายการ</span>
          </div>

          {/* Scrollable rows — แสดง 6 รายการ, scroll ถึง 12 */}
          <div className="overflow-y-auto divide-y divide-gray-50" style={{ maxHeight: '384px' }}>
            {pagedTickets.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-10">ไม่มีรายการแจ้งซ่อม</p>
            )}
            {pagedTickets.map((t) => (
              <div
                key={t.ticket_id}
                onClick={() => navigate('/admin/tickets')}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${PRIORITY_ICON_BG[t.priority] || 'bg-gray-100'}`}>
                  <FaExclamationTriangle size={13} className={t.priority === 'critical' || t.priority === 'high' ? 'text-red-500' : t.priority === 'medium' ? 'text-amber-500' : 'text-green-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {t.station_name} · <span className="text-blue-500 font-medium">{t.charger_name}</span>
                  </p>
                  <p className="text-xs text-gray-400">{formatTicketDate(t.created_at)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {ticketTotalPages > 1 && (
            <div className="flex justify-center items-center gap-2 px-5 py-3 border-t border-gray-100 flex-shrink-0">
              <button disabled={ticketPage === 1} onClick={() => setTicketPage((p) => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">&#8249;</button>
              <span className="px-2 text-sm text-gray-500">{ticketPage} / {ticketTotalPages}</span>
              <button disabled={ticketPage === ticketTotalPages} onClick={() => setTicketPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">&#8250;</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}