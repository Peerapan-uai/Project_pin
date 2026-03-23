import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { FaCheckCircle } from 'react-icons/fa'
import api from '../../utils/api'

export default function ReportIssuePage() {
  const navigate = useNavigate()
  const [stations, setStations] = useState([])
  const [chargers, setChargers] = useState([])
  const [selectedStationId, setSelectedStationId] = useState('')
  const [chargerId, setChargerId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [loadingChargers, setLoadingChargers] = useState(false)

  useEffect(() => {
    api.get('/api/stations')
      .then(res => setStations(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedStationId) {
      setChargers([])
      setChargerId('')
      return
    }
    setLoadingChargers(true)
    api.get(`/api/chargers/station/${selectedStationId}`)
      .then(res => {
        setChargers(res.data)
        setChargerId('')
      })
      .catch(() => setChargers([]))
      .finally(() => setLoadingChargers(false))
  }, [selectedStationId])

  const handleSubmit = () => {
    if (!chargerId || !title || !description) return
    setSubmitting(true)
    api.post('/api/tickets', {
      charger_id: Number(chargerId),
      title,
      description,
      priority
    })
      .then(() => setSubmitted(true))
      .catch(() => setError('ส่งรายงานไม่สำเร็จ กรุณาลองใหม่'))
      .finally(() => setSubmitting(false))
  }

  if (submitted) return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16 items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center w-full max-w-sm">
        <FaCheckCircle size={56} className="text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">แจ้งปัญหาสำเร็จ!</h2>
        <p className="text-gray-500 text-sm mt-2">ทีมงานจะดำเนินการโดยเร็ว</p>
        <button onClick={() => navigate('/home')} className="mt-6 w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-green-600 transition-colors">กลับหน้าหลัก</button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="แจ้งปัญหา" showBack onBack={() => navigate(-1)} />
      <div className="px-4 pt-4 space-y-4">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">สถานี</label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- เลือกสถานี --</option>
              {stations.map((s) => (
                <option key={s.station_id} value={s.station_id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">ตู้ชาร์จที่มีปัญหา</label>
            <select
              value={chargerId}
              onChange={(e) => setChargerId(e.target.value)}
              disabled={!selectedStationId || loadingChargers}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
            >
              <option value="">-- เลือกตู้ชาร์จ --</option>
              {chargers.map((c) => (
                <option key={c.charger_id} value={c.charger_id}>{c.charger_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">หัวข้อปัญหา</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น หน้าจอไม่แสดงผล"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">รายละเอียด</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายปัญหาที่พบ..."
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>
        <button
          disabled={!chargerId || !title || !description || submitting}
          onClick={handleSubmit}
          className="w-full py-3.5 bg-primary disabled:opacity-50 text-white font-semibold rounded-xl shadow-md shadow-green-200 hover:bg-green-600 transition-colors"
        >
          {submitting ? 'กำลังส่ง...' : 'ส่งรายงาน'}
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
