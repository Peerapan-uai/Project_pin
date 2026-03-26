import { useState, useEffect } from 'react'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import { FaTicketAlt, FaUserCog } from 'react-icons/fa'

export default function TicketManagePage() {
  const [tickets, setTickets]       = useState([])
  const [technicians, setTechnicians] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading]       = useState(true)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/tickets'),
      api.get('/api/users'),
    ])
      .then(([ticketsRes, usersRes]) => {
        setTickets(ticketsRes.data.tickets || ticketsRes.data)
        setTechnicians((usersRes.data.users || usersRes.data).filter((u) => u.role === 'technician'))
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const assign = (ticketId, techId) => {
    api.patch(`/api/tickets/${ticketId}/assign`, { technician_id: Number(techId) })
      .then(() => fetchData())
      .catch((err) => console.error(err))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const filtered = filterStatus === 'all' ? tickets : tickets.filter((t) => t.status === filterStatus)
  const statuses = ['all', 'reported', 'assigned', 'in_progress', 'completed']

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ตั๋วแจ้งปัญหา</h1>
        <p className="text-gray-500 text-sm mt-0.5">ตั๋วทั้งหมด {tickets.length} รายการ</p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterStatus === s ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/50'}`}
          >
            {s === 'all' ? 'ทั้งหมด' : <StatusBadge status={s} />}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((t) => (
          <div key={t.ticket_id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <FaTicketAlt size={13} className="text-gray-400" />
                  <h3 className="font-semibold text-gray-900">{t.title}</h3>
                  <StatusBadge status={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
                <p className="text-xs text-gray-500">{t.charger_name} · {t.station_name}</p>
                <p className="text-xs text-gray-400 mt-1">{t.description}</p>
                {t.tech_name && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <FaUserCog size={10} /> มอบหมายให้ {t.tech_name}
                  </p>
                )}
              </div>
              {t.status === 'reported' && (
                <div className="flex-shrink-0">
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && assign(t.ticket_id, e.target.value)}
                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">มอบหมายช่าง...</option>
                    {technicians.map((tech) => (
                      <option key={tech.user_id} value={tech.user_id}>{tech.first_name} {tech.last_name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {t.repair_notes && (
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-medium">หมายเหตุ:</span> {t.repair_notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
