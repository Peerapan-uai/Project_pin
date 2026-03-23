import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { FaUserCog, FaPlus, FaWrench } from 'react-icons/fa'

export default function TechnicianManagePage() {
  const [technicians, setTechnicians] = useState([])
  const [tickets, setTickets]         = useState([])
  const [loading, setLoading]         = useState(true)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/users'),
      api.get('/api/tickets'),
    ])
      .then(([usersRes, ticketsRes]) => {
        setTechnicians(usersRes.data.filter((u) => u.role === 'technician'))
        setTickets(ticketsRes.data)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการช่าง</h1>
          <p className="text-gray-500 text-sm mt-0.5">ช่างเทคนิคทั้งหมด {technicians.length} คน</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 shadow-md shadow-green-200">
          <FaPlus size={13} /> เพิ่มช่าง
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {technicians.map((t) => {
          const assignedTickets = tickets.filter((tk) => tk.assigned_to === t.user_id && tk.status !== 'completed')
          return (
            <div key={t.user_id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaUserCog size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{t.first_name} {t.last_name}</p>
                  <p className="text-xs text-gray-500">{t.email}</p>
                  <p className="text-xs text-gray-400">{t.phone}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                  <FaWrench size={11} /> งานที่กำลังดำเนินการ ({assignedTickets.length})
                </p>
                {assignedTickets.length === 0
                  ? <p className="text-xs text-gray-400">ไม่มีงาน</p>
                  : assignedTickets.map((tk) => (
                    <p key={tk.ticket_id} className="text-xs text-gray-600 py-0.5">• {tk.title} ({tk.station_name})</p>
                  ))
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
