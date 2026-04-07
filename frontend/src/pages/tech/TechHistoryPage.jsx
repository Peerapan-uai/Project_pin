import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import { FaHistory, FaCheckCircle, FaCalendarAlt, FaChevronRight, FaClipboardCheck, FaCalendarCheck } from 'react-icons/fa'

export default function TechHistoryPage() {
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/tickets')
      .then((res) => setTickets(res.data.tickets ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const completed = tickets.filter(
    (t) => t.assigned_to === user?.user_id && t.status === 'completed'
  )

  const now = new Date()
  const thisMonth = completed.filter((t) => {
    if (!t.completed_at) return false
    const d = new Date(t.completed_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const avgDays = completed.length > 0
    ? (completed.reduce((sum, t) => {
        if (!t.created_at || !t.completed_at) return sum
        const diff = (new Date(t.completed_at) - new Date(t.created_at)) / (1000 * 60 * 60 * 24)
        return sum + diff
      }, 0) / completed.length).toFixed(1)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-1">ประวัติงาน</h1>
        <p className="text-gray-500 text-sm mb-5">งานที่เสร็จสิ้นแล้ว {completed.length} รายการ</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaCalendarCheck size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{thisMonth.length}</p>
              <p className="text-xs text-gray-500">เสร็จเดือนนี้</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaClipboardCheck size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{avgDays}</p>
              <p className="text-xs text-gray-500">เฉลี่ยวัน/งาน</p>
            </div>
          </div>
        </div>

        {completed.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <FaHistory size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ยังไม่มีประวัติงาน</p>
          </div>
        )}
        <div className="space-y-3">
          {completed.map((t) => (
            <button
              key={t.ticket_id}
              onClick={() => navigate(`/tech/tickets/${t.ticket_id}`)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FaCheckCircle size={17} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{t.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.charger_name} · {t.station_name}</p>
                {t.completed_at && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <FaCalendarAlt size={10} />
                    <span>เสร็จ: {new Date(t.completed_at).toLocaleDateString('th-TH')}</span>
                  </div>
                )}
              </div>
              <FaChevronRight size={12} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
