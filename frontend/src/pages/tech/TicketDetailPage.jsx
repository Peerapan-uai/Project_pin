import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import { FaArrowLeft, FaMapMarkerAlt, FaBolt, FaUser, FaWrench, FaLocationArrow, FaHistory } from 'react-icons/fa'

export default function TicketDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])

  useEffect(() => {
    api.get('/api/tickets')
      .then((res) => {
        const found = res.data.tickets.find((t) => t.ticket_id === Number(id))
        setTicket(found || null)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    api.get(`/api/tickets/${id}/repair-history`)
      .then((res) => setHistory(res.data.history))
      .catch(() => {})
  }, [id])

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  if (!ticket) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center text-gray-400">
        <p>ไม่พบตั๋วนี้</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary text-sm">ย้อนกลับ</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-5">
          <FaArrowLeft size={13} /> ย้อนกลับ
        </button>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h1 className="font-bold text-lg text-gray-900">{ticket.title}</h1>
            <div className="flex gap-2 flex-wrap">
              <StatusBadge status={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <FaBolt size={14} className="text-primary" />
              <div>
                <p className="text-xs text-gray-400">ตู้ชาร์จ</p>
                <p className="font-medium text-gray-800">{ticket.charger_name}</p>
                <p className="text-xs text-gray-500">{ticket.connector_type} · {parseFloat(ticket.power_kw)} kW</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaMapMarkerAlt size={14} className="text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">สถานี</p>
                <p className="font-medium text-gray-800">{ticket.station_name}</p>
                <p className="text-xs text-gray-500">{ticket.station_address}</p>
                {ticket.floor && <p className="text-xs text-gray-500">ชั้น {ticket.floor}</p>}
              </div>
              {ticket.latitude && ticket.longitude && (
                <button
                  onClick={() => window.open(`https://maps.google.com/?q=${ticket.latitude},${ticket.longitude}`, '_blank')}
                  className="flex items-center gap-1 text-xs text-primary border border-primary/30 rounded-lg px-2.5 py-1.5 hover:bg-primary/5 shrink-0"
                >
                  <FaLocationArrow size={11} /> นำทาง
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <FaUser size={14} className="text-gray-400" />
              <div><p className="text-xs text-gray-400">ผู้แจ้ง</p><p className="font-medium text-gray-800">{ticket.reporter_name}</p></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">รายละเอียดปัญหา</p>
            <p className="text-sm text-gray-700">{ticket.description}</p>
          </div>

          {ticket.repair_notes && (
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1.5"><FaWrench size={11} /> บันทึกซ่อม</p>
              <p className="text-sm text-gray-700">{ticket.repair_notes}</p>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mt-4">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <FaHistory size={13} className="text-gray-400" /> ประวัติซ่อมตู้นี้ (3 ครั้งล่าสุด)
            </p>
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.ticket_id} className="border border-gray-100 rounded-xl p-3 text-sm">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-medium text-gray-800">{h.title}</p>
                    <StatusBadge status={h.priority} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    ซ่อมโดย {h.tech_name || '-'} · {h.completed_at ? new Date(h.completed_at).toLocaleDateString('th-TH') : '-'}
                  </p>
                  {h.repair_notes && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{h.repair_notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {ticket.status !== 'completed' && (
          <button
            onClick={() => navigate(`/tech/tickets/${ticket.ticket_id}/update`)}
            className="mt-4 w-full py-3.5 bg-primary text-white font-semibold rounded-xl shadow-md shadow-green-200 hover:bg-green-600 transition-colors"
          >
            อัปเดตสถานะงาน
          </button>
        )}
      </div>
    </div>
  )
}
