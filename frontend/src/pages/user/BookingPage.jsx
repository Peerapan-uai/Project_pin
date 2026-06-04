import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { FaBolt, FaCheckCircle, FaWrench, FaClock, FaCalendarAlt, FaSyncAlt } from 'react-icons/fa'
import api from '../../utils/api'

const SCHEDULED_DURATION_MIN = 30

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function formatDate(d) {
  return d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })
}

function toISOLocal(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}

export default function BookingPage() {
  const { chargerId } = useParams()
  const navigate = useNavigate()

  const [charger, setCharger] = useState(null)
  const [station, setStation] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Steps: 1=vehicle, 2=date, 3=time, 4=duration, 5=confirm
  const [step, setStep] = useState(1)
  const [vehicleId, setVehicleId] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)

  // Suggestion popup
  const [suggestion, setSuggestion] = useState(null)
  const [showSuggestion, setShowSuggestion] = useState(false)

  const today = new Date()
  const calDays = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1))

  useEffect(() => {
    Promise.all([
      api.get(`/api/chargers/${chargerId}`),
      api.get('/api/vehicles'),
    ])
      .then(([chargerRes, vehiclesRes]) => {
        const chargerData = chargerRes.data
        setCharger(chargerData)
        setVehicles(vehiclesRes.data)
        if (vehiclesRes.data.length > 0) setVehicleId(vehiclesRes.data[0].vehicle_id)
        if (chargerData.station_id) {
          return api.get(`/api/stations/${chargerData.station_id}`)
            .then(stRes => setStation(stRes.data))
            .catch(() => {})
        }
      })
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))

    // เช็ค suggestion (เรียกแค่ครั้งเดียว)
    api.get('/api/bookings/suggest-recurring')
      .then(res => {
        if (res.data.suggestions?.length > 0) {
          setSuggestion(res.data.suggestions[0])
          setShowSuggestion(true)
        }
      })
      .catch(() => {})
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!selectedDate) return
    const dateStr = selectedDate.toISOString().split('T')[0]
    setLoadingSlots(true)
    setSelectedSlot(null)
    api.get(`/api/chargers/${chargerId}/available-slots?date=${dateStr}`)
      .then(res => setSlots(res.data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, chargerId])

  const handleImmediateBooking = () => {
    if (!vehicleId) { setError('กรุณาเพิ่มข้อมูลรถของคุณก่อนจอง'); return }
    setSubmitting(true)
    api.post('/api/bookings', { charger_id: Number(chargerId), vehicle_id: Number(vehicleId) })
      .then(() => { setSuccess(true); setTimeout(() => navigate('/bookings'), 2000) })
      .catch(err => {
        const code = err.response?.data?.code
        const msg = err.response?.data?.message
        if (code === 'CHARGER_OVERHEATED') setError(msg)
        else if (msg?.includes('not available')) setError('ตู้ชาร์จนี้ไม่ว่างในขณะนี้')
        else setError(msg || 'การจองไม่สำเร็จ กรุณาลองใหม่')
      })
      .finally(() => setSubmitting(false))
  }

  const handleScheduledBooking = () => {
    if (!selectedDate || !selectedSlot) return
    setSubmitting(true)
    const dateStr = selectedDate.toISOString().split('T')[0]
    const scheduledStart = `${dateStr}T${selectedSlot}:00`
    api.post('/api/bookings', {
      charger_id: Number(chargerId),
      vehicle_id: vehicleId ? Number(vehicleId) : undefined,
      scheduled_start: scheduledStart,
      duration_min: SCHEDULED_DURATION_MIN,
    })
      .then(() => { setSuccess(true); setTimeout(() => navigate('/bookings'), 2000) })
      .catch(err => {
        const code = err.response?.data?.code
        const msg = err.response?.data?.message
        if (code === 'SLOT_CONFLICT') setError('ช่วงเวลานี้มีการจองแล้ว กรุณาเลือกเวลาอื่น')
        else setError(msg || 'การจองไม่สำเร็จ กรุณาลองใหม่')
      })
      .finally(() => setSubmitting(false))
  }

  const handleLockRecurring = () => {
    if (!suggestion) return
    api.post('/api/recurring-bookings', {
      charger_id: suggestion.charger_id,
      days_of_week: [suggestion.day.substring(0, 3).toLowerCase()],
      start_time: `${String(suggestion.hour).padStart(2, '0')}:00`,
      duration_min: 60,
      weeks_ahead: 4,
    })
      .then(() => setShowSuggestion(false))
      .catch(() => setShowSuggestion(false))
  }

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  if (error && !charger) return (
    <div className="flex flex-col min-h-screen pb-16">
      <Navbar title="จองตู้ชาร์จ" showBack onBack={() => navigate(-1)} />
      <div className="flex-1 flex items-center justify-center text-gray-400">{error}</div>
      <BottomNav />
    </div>
  )

  if (success) return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16 items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center w-full max-w-sm">
        <FaCheckCircle size={56} className="text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">จองสำเร็จ!</h2>
        <p className="text-gray-500 text-sm mt-2">กำลังไปยังหน้าการจอง...</p>
      </div>
    </div>
  )

  // Suggestion popup
  const dayThMap = { Monday: 'จันทร์', Tuesday: 'อังคาร', Wednesday: 'พุธ', Thursday: 'พฤหัส', Friday: 'ศุกร์', Saturday: 'เสาร์', Sunday: 'อาทิตย์' }
  const suggestionDayTh = suggestion ? (dayThMap[suggestion.day] || suggestion.day) : ''

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="จองตู้ชาร์จ" showBack onBack={() => navigate(-1)} />

      {/* Suggestion popup */}
      {showSuggestion && suggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl p-5 shadow-xl w-full max-w-sm">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-xl">💡</span>
              <p className="text-sm font-semibold text-gray-800">
                เห็นว่าคุณจองทุกวัน{suggestionDayTh} เวลา {String(suggestion.hour).padStart(2, '0')}:00 บ่อยมาก
                <br />อยากให้ล็อกประจำมั้ย?
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowSuggestion(false)}
                className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-600"
              >ยังก่อน</button>
              <button
                onClick={handleLockRecurring}
                className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-semibold"
              >ล็อกเลย</button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-4 space-y-4">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Charger info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
              <FaBolt className="text-primary" size={20} />
            </div>
            <div>
              <p className="font-bold text-gray-900">{charger?.charger_name}</p>
              <p className="text-xs text-gray-500">{station?.name} · {charger?.connector_type} · {charger?.power_kw} kW</p>
            </div>
          </div>
        </div>

        {/* Immediate booking option */}
        {charger?.status === 'available' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-green-800 mb-2">⚡ จองเดี๋ยวนี้เลย</p>
            {vehicles.length > 0 ? (
              <select
                value={vehicleId}
                onChange={e => setVehicleId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {vehicles.map(v => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>{v.brand} {v.model} ({v.license_plate})</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber-600 mb-3">ยังไม่มีข้อมูลรถ — <span className="underline cursor-pointer" onClick={() => navigate('/vehicles')}>เพิ่มรถที่โปรไฟล์</span></p>
            )}
            <button
              onClick={handleImmediateBooking}
              disabled={submitting}
              className="w-full py-3 bg-primary disabled:opacity-50 text-white font-semibold rounded-xl text-sm"
            >
              {submitting ? 'กำลังจอง...' : 'จองเดี๋ยวนี้'}
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">หรือ</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Scheduled booking */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-primary" size={15} />
            <p className="font-semibold text-gray-800 text-sm">จองล่วงหน้า (ตั้งเวลา)</p>
          </div>

          {/* Step 2: เลือกวัน */}
          <div>
            <p className="text-xs text-gray-500 mb-2">เลือกวัน</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {calDays.map((d, i) => {
                const ds = d.toISOString().split('T')[0]
                const sel = selectedDate?.toISOString().split('T')[0] === ds
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(d)}
                    className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      sel ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {formatDate(d)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 3: เลือก time slot */}
          {selectedDate && (
            <div>
              <p className="text-xs text-gray-500 mb-2">เลือกเวลา</p>
              {loadingSlots ? (
                <p className="text-xs text-gray-400">กำลังโหลดช่วงเวลา...</p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
                  {slots.filter(s => s.available || s.start === selectedSlot).map((s, i) => (
                    <button
                      key={i}
                      disabled={!s.available}
                      onClick={() => setSelectedSlot(s.start)}
                      className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        !s.available
                          ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                          : selectedSlot === s.start
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
                      }`}
                    >
                      {s.start}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* confirm */}
          {selectedDate && selectedSlot && (
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">วัน:</span> {formatDate(selectedDate)}</p>
              <p><span className="font-medium">เวลา:</span> {selectedSlot} น.</p>
              <p><span className="font-medium">ระยะเวลา:</span> {SCHEDULED_DURATION_MIN} นาที</p>
            </div>
          )}

          <button
            onClick={handleScheduledBooking}
            disabled={submitting || !selectedDate || !selectedSlot}
            className="w-full py-3 bg-blue-600 disabled:opacity-40 text-white font-semibold rounded-xl text-sm"
          >
            {submitting ? 'กำลังจอง...' : 'ยืนยันการจองล่วงหน้า'}
          </button>
        </div>

        {/* Recurring shortcut */}
        <button
          onClick={() => navigate('/recurring')}
          className="w-full py-3 flex items-center justify-center gap-2 text-sm text-blue-600 border border-blue-200 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <FaSyncAlt size={13} />
          จัดการการจองประจำ
        </button>

        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-start gap-3">
          <FaClock size={14} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">มีเวลา 30 นาทีหลังจองเพื่อเริ่มชาร์จ หากไม่เริ่มภายในเวลาที่กำหนด การจองจะถูกยกเลิกอัตโนมัติ</p>
        </div>

        <button
          onClick={() => navigate('/report', { state: { chargerId: Number(chargerId), stationId: charger?.station_id } })}
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
