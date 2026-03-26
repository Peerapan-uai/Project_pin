import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import { FaTicketAlt, FaCheckCircle, FaClock, FaWrench, FaChevronRight } from 'react-icons/fa'

export default function TechDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/tickets')
      .then((res) => setTickets(res.data.tickets || res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const myTickets = tickets.filter((t) => t.assigned_to === user?.user_id)
  const open      = myTickets.filter((t) => t.status !== 'completed')
  const completed = myTickets.filter((t) => t.status === 'completed')

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-1">แดชบอร์ดช่าง</h1>
        <p className="text-gray-500 text-sm mb-5">สวัสดี, {user?.first_name} {user?.last_name}</p>

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
            <button
              key={t.ticket_id}
              onClick={() => navigate(`/tech/tickets/${t.ticket_id}`)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98] flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <StatusBadge status={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
                <p className="font-semibold text-sm text-gray-900">{t.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.charger_name} · {t.station_name}</p>
              </div>
              <FaChevronRight size={12} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
