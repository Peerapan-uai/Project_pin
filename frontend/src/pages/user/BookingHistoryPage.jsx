import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import StatusBadge from '../../components/StatusBadge'
import { FaBolt, FaCalendarAlt, FaDirections, FaClock } from 'react-icons/fa'
import api from '../../utils/api'


function useSecsLeft(startTime) {
  const EXPIRE_MINUTES = 30
  const getExpireAt = () => {
    const raw = String(startTime)
    // ถ้า DB ส่งมาไม่มี timezone suffix ให้ถือเป็น UTC
    const ts = raw.endsWith('Z') || raw.includes('+') ? raw : raw.replace(' ', 'T') + 'Z'
    return new Date(ts).getTime() + EXPIRE_MINUTES * 60 * 1000
  }
  const [secsLeft, setSecsLeft] = useState(() =>
    Math.max(0, Math.floor((getExpireAt() - Date.now()) / 1000))
  )
  useEffect(() => {
    const calc = () =>
      setSecsLeft(Math.max(0, Math.floor((getExpireAt() - Date.now()) / 1000)))
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [startTime])
  return secsLeft
}

function BookingCard({ b, starting, onStart, navigate }) {
  const secsLeft = useSecsLeft(b.start_time)
  const expired = secsLeft === 0
  const urgent = secsLeft <= 300 && secsLeft > 0

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{b.station_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{b.charger_name} · {b.connector_type}</p>
          <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
            <FaCalendarAlt size={10} />
            <span>{new Date(b.start_time).toLocaleString('th-TH')}</span>
          </div>
          {b.status === 'confirmed' && (
            expired ? (
              <p className="text-xs text-red-500 font-semibold mt-1.5">หมดเวลาจอง</p>
            ) : (
              <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${urgent ? 'text-red-500' : 'text-amber-500'}`}>
                <FaClock size={10} />
                <span>หมดอายุใน {Math.floor(secsLeft / 60)}:{String(secsLeft % 60).padStart(2, '0')} นาที</span>
              </div>
            )
          )}
        </div>
        {b.status === 'confirmed' && expired
          ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">หมดอายุ</span>
          : <StatusBadge status={b.status} />
        }
      </div>
      {b.status === 'confirmed' && !expired && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onStart(b)}
            disabled={starting === b.booking_id}
            className="flex-1 py-2.5 bg-primary disabled:opacity-50 text-white text-sm font-semibold rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <FaBolt size={13} />
            {starting === b.booking_id ? 'กำลังเริ่ม...' : 'เริ่มชาร์จเลย'}
          </button>
          {b.latitude && b.longitude && (
            <button
              onClick={() => navigate('/search', { state: { navigateTo: {
                station_id: b.station_id,
                name: b.station_name,
                latitude: b.latitude,
                longitude: b.longitude,
              }}})}
              className="px-3 py-2.5 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center active:scale-95 transition-all"
            >
              <FaDirections size={16} />
            </button>
          )}
        </div>
      )}
      {b.status === 'active' && b.session_id && (
        <button
          onClick={() => navigate(`/charging/${b.session_id}`)}
          className="mt-3 w-full py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <FaBolt size={13} />
          ดูการชาร์จที่กำลังดำเนินอยู่
        </button>
      )}
      {b.total_amount && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-sm">
          <span className="text-gray-500">{b.energy_kwh} kWh</span>
          <span className="font-semibold text-primary">{b.total_amount} บาท</span>
        </div>
      )}
    </div>
  )
}

export default function BookingHistoryPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [starting, setStarting] = useState(null)

  useEffect(() => {
    api.get('/api/bookings')
      .then(res => setBookings(res.data))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [])

  const handleStartCharging = (booking) => {
    setStarting(booking.booking_id)
    api.post('/api/sessions/start', {
      booking_id: booking.booking_id,
      charger_id: booking.charger_id
    })
      .then(res => navigate(`/charging/${res.data.session_id}`))
      .catch(err => {
        const code = err.response?.data?.code
        const msg = code === 'CHARGER_OVERHEATED'
          ? err.response.data.message
          : (err.response?.data?.message || 'เริ่มชาร์จไม่สำเร็จ กรุณาลองใหม่')
        setError(msg)
        setStarting(null)
      })
  }

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
          <BookingCard key={b.booking_id} b={b} starting={starting} onStart={handleStartCharging} navigate={navigate} />
        ))}
      </div>
      <BottomNav />
    </div>
  )
}
