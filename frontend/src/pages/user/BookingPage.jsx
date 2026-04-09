import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { useAuth } from '../../context/AuthContext'
import { FaBolt, FaCheckCircle, FaWrench } from 'react-icons/fa'
import api from '../../utils/api'

export default function BookingPage() {
  const { chargerId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [charger, setCharger] = useState(null)
  const [station, setStation] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [vehicleId, setVehicleId] = useState('')
  const [duration, setDuration] = useState(30)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/api/chargers/${chargerId}`),
      api.get('/api/vehicles')
    ])
      .then(([chargerRes, vehiclesRes]) => {
        const chargerData = chargerRes.data
        setCharger(chargerData)
        setVehicles(vehiclesRes.data)
        if (vehiclesRes.data.length > 0) {
          setVehicleId(vehiclesRes.data[0].vehicle_id)
        }
        if (chargerData.station_id) {
          return api.get(`/api/stations/${chargerData.station_id}`)
            .then(stRes => setStation(stRes.data))
            .catch(() => {})
        }
      })
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [chargerId])

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  if (error || !charger) return (
    <div className="flex flex-col min-h-screen pb-16">
      <Navbar title="จองตู้ชาร์จ" showBack onBack={() => navigate(-1)} />
      <div className="flex-1 flex items-center justify-center text-gray-400">{error || 'ไม่พบตู้ชาร์จ'}</div>
      <BottomNav />
    </div>
  )

  const estKwh = ((charger.power_kw * duration) / 60).toFixed(2)
  const estCost = (estKwh * charger.price_per_kwh).toFixed(2)

  const handleBooking = () => {
    if (!vehicleId) return
    setSubmitting(true)
    const now = new Date()
    const end = new Date(now.getTime() + duration * 60 * 1000)
    const toMysqlDatetime = (d) => {
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    }
    api.post('/api/bookings', {
      charger_id: Number(chargerId),
      start_time: toMysqlDatetime(now),
      end_time: toMysqlDatetime(end)
    })
      .then(() => {
        setSuccess(true)
        setTimeout(() => navigate('/bookings'), 2000)
      })
      .catch(() => setError('การจองไม่สำเร็จ กรุณาลองใหม่'))
      .finally(() => setSubmitting(false))
  }

  if (success) return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16 items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center w-full max-w-sm">
        <FaCheckCircle size={56} className="text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">จองสำเร็จ!</h2>
        <p className="text-gray-500 text-sm mt-2">กำลังไปยังหน้าการจอง...</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="จองตู้ชาร์จ" showBack onBack={() => navigate(-1)} />
      <div className="px-4 pt-4 space-y-4">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Charger info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
              <FaBolt className="text-primary" size={20} />
            </div>
            <div>
              <p className="font-bold text-gray-900">{charger.charger_name}</p>
              <p className="text-xs text-gray-500">{station?.name} · {charger.connector_type} · {charger.power_kw} kW</p>
            </div>
          </div>
        </div>

        {/* Vehicle select */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-2">เลือกยานพาหนะ</label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {vehicles.map((v) => (
              <option key={v.vehicle_id} value={v.vehicle_id}>{v.brand} {v.model} ({v.license_plate})</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-3">ระยะเวลาชาร์จ</label>
          <div className="flex gap-2 flex-wrap">
            {[15, 30, 45, 60, 90, 120].map((m) => (
              <button
                key={m}
                onClick={() => setDuration(m)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  duration === m
                    ? 'bg-primary text-white shadow-md shadow-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {m} นาที
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20">
          <h3 className="font-semibold text-gray-800 mb-3">สรุปการจอง</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">พลังงานโดยประมาณ</span><span className="font-medium">{estKwh} kWh</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ราคาโดยประมาณ</span><span className="font-semibold text-primary">{estCost} บาท</span></div>
          </div>
        </div>

        <button
          onClick={handleBooking}
          disabled={submitting || !vehicleId}
          className="w-full py-3.5 bg-primary disabled:opacity-50 text-white font-semibold rounded-xl shadow-md shadow-green-200 hover:bg-green-600 transition-colors"
        >
          {submitting ? 'กำลังจอง...' : 'ยืนยันการจอง'}
        </button>

        <button
          onClick={() => navigate('/report', { state: { chargerId: Number(chargerId), stationId: charger.station_id } })}
          className="w-full py-3 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          <FaWrench size={13} />
          แจ้งปัญหาตู้ชาร์จนี้
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
