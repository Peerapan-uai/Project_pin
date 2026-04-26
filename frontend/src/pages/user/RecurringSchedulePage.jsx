import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { FaPlus, FaTrash, FaToggleOn, FaToggleOff, FaCalendarCheck } from 'react-icons/fa'
import api from '../../utils/api'

const RECURRING_DURATION_MIN = 30

const DAYS = [
  { key: 'mon', label: 'จ' },
  { key: 'tue', label: 'อ' },
  { key: 'wed', label: 'พ' },
  { key: 'thu', label: 'พฤ' },
  { key: 'fri', label: 'ศ' },
  { key: 'sat', label: 'ส' },
  { key: 'sun', label: 'อา' },
]
const WEEKS_OPTIONS = [1, 2, 4, 8]

export default function RecurringSchedulePage() {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Form state
  const [chargers, setChargers] = useState([])
  const [selectedDays, setSelectedDays] = useState([])
  const [chargerId, setChargerId] = useState('')
  const [startTime, setStartTime] = useState('18:00')
  const [weeksAhead, setWeeksAhead] = useState(4)

  const fetchSchedules = () => {
    setLoading(true)
    api.get('/api/recurring-bookings')
      .then(res => setSchedules(res.data.schedules || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSchedules()
    // โหลดตู้ charger ที่ user เคยจอง เพื่อให้เลือก
    api.get('/api/bookings')
      .then(res => {
        const seen = new Set()
        const unique = (res.data || []).filter(b => {
          if (seen.has(b.charger_id)) return false
          seen.add(b.charger_id)
          return true
        })
        setChargers(unique.map(b => ({ charger_id: b.charger_id, charger_name: b.charger_name, station_name: b.station_name })))
        if (unique.length > 0) setChargerId(unique[0].charger_id)
      })
      .catch(() => {})
  }, [])

  const toggleDay = (d) => {
    setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  const handleCreate = () => {
    if (!chargerId || selectedDays.length === 0) {
      setError('กรุณาเลือกตู้และวัน')
      return
    }
    setSubmitting(true)
    setError(null)
    api.post('/api/recurring-bookings', {
      charger_id: Number(chargerId),
      days_of_week: selectedDays,
      start_time: startTime,
      duration_min: RECURRING_DURATION_MIN,
      weeks_ahead: weeksAhead,
    })
      .then(() => {
        setShowForm(false)
        setSelectedDays([])
        fetchSchedules()
      })
      .catch(err => setError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setSubmitting(false))
  }

  const handleToggle = (id, currentActive) => {
    api.patch(`/api/recurring-bookings/${id}`, { active: !currentActive })
      .then(() => fetchSchedules())
      .catch(() => {})
  }

  const handleDelete = (id) => {
    if (!window.confirm('ลบ recurring schedule นี้?')) return
    api.delete(`/api/recurring-bookings/${id}`)
      .then(() => fetchSchedules())
      .catch(() => {})
  }

  const dayThMap = { mon: 'จ', tue: 'อ', wed: 'พ', thu: 'พฤ', fri: 'ศ', sat: 'ส', sun: 'อา' }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="การจองประจำ" showBack onBack={() => navigate(-1)} />

      <div className="px-4 pt-4 space-y-4">
        <button
          onClick={() => setShowForm(v => !v)}
          className="w-full py-3 flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-2xl"
        >
          <FaPlus size={13} />
          {showForm ? 'ปิดฟอร์ม' : 'สร้างการจองประจำ'}
        </button>

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <p className="font-semibold text-gray-800 text-sm">ตู้ชาร์จ</p>
            {chargers.length > 0 ? (
              <select
                value={chargerId}
                onChange={e => setChargerId(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
              >
                {chargers.map(c => (
                  <option key={c.charger_id} value={c.charger_id}>
                    {c.charger_name} — {c.station_name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-gray-400">ยังไม่มีประวัติการจอง กรุณาจองก่อนอย่างน้อย 1 ครั้ง</p>
            )}

            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">วันที่ต้องการจอง</p>
              <div className="flex gap-2">
                {DAYS.map(d => (
                  <button
                    key={d.key}
                    onClick={() => toggleDay(d.key)}
                    className={`w-9 h-9 rounded-full text-xs font-bold border transition-colors ${
                      selectedDays.includes(d.key) ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">เวลา</p>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">ทำซ้ำ</p>
              <div className="flex gap-2">
                {WEEKS_OPTIONS.map(w => (
                  <button
                    key={w}
                    onClick={() => setWeeksAhead(w)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      weeksAhead === w ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {w} สัปดาห์
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={submitting}
              className="w-full py-3 bg-primary disabled:opacity-50 text-white font-semibold rounded-xl text-sm"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-4">กำลังโหลด...</p>
        ) : schedules.length === 0 ? (
          <div className="text-center py-10">
            <FaCalendarCheck size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">ยังไม่มีการจองประจำ</p>
          </div>
        ) : (
          schedules.map(s => (
            <div key={s.schedule_id} className={`bg-white rounded-2xl p-4 shadow-sm border ${s.active ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{s.charger_name}</p>
                  <p className="text-xs text-gray-500">{s.station_name}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {s.days_of_week.split(',').map(d => (
                      <span key={d} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                        {dayThMap[d] || d}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{s.start_time} · {s.duration_min} นาที · {s.weeks_ahead} สัปดาห์</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(s.schedule_id, s.active)} className="text-xl">
                    {s.active ? <FaToggleOn className="text-primary" /> : <FaToggleOff className="text-gray-400" />}
                  </button>
                  <button onClick={() => handleDelete(s.schedule_id)} className="text-red-400 hover:text-red-600">
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}
