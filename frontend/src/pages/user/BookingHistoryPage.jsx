import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import StatusBadge from '../../components/StatusBadge'
import { FaBolt, FaCalendarAlt } from 'react-icons/fa'
import api from '../../utils/api'

export default function BookingHistoryPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/bookings')
      .then(res => setBookings(res.data))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="ประวัติการจอง" showBack onBack={() => navigate(-1)} />
      <div className="px-4 pt-4 space-y-3">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {bookings.length === 0 && !error && (
          <div className="text-center py-12 text-gray-400">
            <FaBolt size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ยังไม่มีประวัติการจอง</p>
          </div>
        )}
        {bookings.map((b) => (
          <div key={b.booking_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{b.station_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{b.charger_name} · {b.vehicle_name}</p>
                <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                  <FaCalendarAlt size={10} />
                  <span>{new Date(b.start_time).toLocaleDateString('th-TH')}</span>
                </div>
              </div>
              <StatusBadge status={b.status} />
            </div>
            {b.total_amount && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-gray-500">{b.energy_kwh} kWh</span>
                <span className="font-semibold text-primary">{b.total_amount} บาท</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}
