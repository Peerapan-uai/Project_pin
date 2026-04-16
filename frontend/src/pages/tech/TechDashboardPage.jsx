import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import { FaTicketAlt, FaCheckCircle, FaClock, FaWrench, FaChevronRight, FaCalendarAlt } from 'react-icons/fa'

const STATUS_CONFIG = {
  AVAILABLE: { label: 'พร้อมทำงาน', dot: 'bg-green-500', badge: 'bg-green-100 text-green-700 border-green-200' },
  BUSY:      { label: 'กำลังทำงาน', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  OFFLINE:   { label: 'ไม่พร้อม',   dot: 'bg-gray-400',  badge: 'bg-gray-100 text-gray-500 border-gray-200'  },
}

export default function TechDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tickets, setTickets]       = useState([])
  const [techStatus, setTechStatus] = useState(null)   // AVAILABLE | BUSY | OFFLINE
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [loading, setLoading]       = useState(true)

  const fetchData = () => {
    Promise.all([
      api.get('/api/tickets'),
      user?.user_id ? api.get(`/api/users/${user.user_id}`) : Promise.resolve(null),
    ])
      .then(([ticketsRes, userRes]) => {
        setTickets(ticketsRes.data.tickets ?? [])
        setTechStatus(userRes?.data?.user?.tech_status ?? null)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleAccept = (e, ticketId) => {
    e.stopPropagation()
    api.patch(`/api/tickets/${ticketId}/status`, { status: 'in_progress' })
      .then(() => fetchData())
      .catch((err) => console.error(err))
  }

  const toggleStatus = () => {
    const cur = techStatus ?? 'OFFLINE'
    if (cur === 'BUSY') return
    const next = cur === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE'
    setTogglingStatus(true)
    api.patch('/api/users/me/status', { status: next })
      .then(() => setTechStatus(next))
      .catch((err) => alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setTogglingStatus(false))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const myTickets = tickets.filter((t) => t.assigned_to === user?.user_id)
  const open      = myTickets.filter((t) => t.status !== 'completed')
  const completed = myTickets.filter((t) => t.status === 'completed')
  const currentStatus = techStatus ?? 'OFFLINE'
  const cfg           = STATUS_CONFIG[currentStatus]

  return (
    <div>
      {/* Header + status toggle */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">แดชบอร์ดช่าง</h1>
          <p className="text-gray-500 text-sm">
            งานทั้งหมด {myTickets.length} รายการ · รอดำเนินการ {open.length} รายการ
          </p>
        </div>

        {/* Status toggle */}
        <button
          onClick={toggleStatus}
          disabled={togglingStatus || currentStatus === 'BUSY'}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
            ${cfg.badge}
            ${currentStatus === 'BUSY' ? 'cursor-default opacity-80' : 'hover:opacity-80 cursor-pointer'}
          `}
        >
          <span className={`w-2 h-2 rounded-full ${cfg.dot} ${currentStatus === 'AVAILABLE' ? 'animate-pulse' : ''}`} />
          {togglingStatus ? 'กำลังเปลี่ยน...' : cfg.label}
          {currentStatus !== 'BUSY' && (
            <span className="text-xs opacity-60 ml-1">
              (กดเพื่อ{currentStatus === 'AVAILABLE' ? 'หยุด' : 'พร้อม'})
            </span>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'งานทั้งหมด', value: myTickets.length, Icon: FaTicketAlt, bg: 'bg-primary/10 text-primary' },
          { label: 'รอดำเนินการ', value: open.length, Icon: FaClock, bg: 'bg-amber-100 text-amber-600' },
          { label: 'เสร็จสิ้น', value: completed.length, Icon: FaCheckCircle, bg: 'bg-green-100 text-green-600' },
        ].map(({ label, value, Icon, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${bg}`}>
              <Icon size={15} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Open tickets */}
      <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <FaWrench size={14} className="text-primary" /> งานที่ต้องทำ
      </h2>
      <div className="space-y-3">
        {open.length === 0 && (
          <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <FaCheckCircle size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ไม่มีงานค้างอยู่</p>
          </div>
        )}
        {open.map((t) => (
          <div
            key={t.ticket_id}
            onClick={() => navigate(`/tech/tickets/${t.ticket_id}`)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98] flex items-center gap-3 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <StatusBadge status={t.priority} />
                <StatusBadge status={t.status} />
              </div>
              <p className="font-semibold text-sm text-gray-900">{t.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.charger_name} · {t.station_name}</p>
              {t.created_at && (
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                  <FaCalendarAlt size={9} />
                  <span>แจ้งเมื่อ: {new Date(t.created_at).toLocaleDateString('th-TH')}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {t.status === 'assigned' ? (
                <button
                  onClick={(e) => handleAccept(e, t.ticket_id)}
                  className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  รับงาน
                </button>
              ) : (
                <FaChevronRight size={12} className="text-gray-300" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}