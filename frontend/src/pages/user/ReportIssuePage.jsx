import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { FaCheckCircle } from 'react-icons/fa'
import api from '../../utils/api'

const ISSUE_OPTIONS = [
  { value: 'safety',          label: '🔴 อันตราย (ควัน/ไฟ/กลิ่นไหม้)' },
  { value: 'no_charge',       label: 'ชาร์จไม่ได้ / หยุดกลางคัน' },
  { value: 'payment',         label: 'ปัญหาการชำระเงิน' },
  { value: 'physical_damage', label: 'อุปกรณ์ชำรุด/เสียหาย' },
  { value: 'display',         label: 'หน้าจอ/ระบบไม่ตอบสนอง' },
  { value: 'other',           label: 'อื่นๆ' },
]

// description บังคับเฉพาะ type ที่ต้องการรายละเอียดเพื่อให้ช่างเตรียมตัวได้
const DESCRIPTION_REQUIRED = ['safety', 'payment', 'other']

const DESCRIPTION_PLACEHOLDER = {
  safety:          'อธิบายอาการที่พบ เช่น มีควันออกจากช่องไหน กลิ่นไหม้รุนแรงแค่ไหน มีประกายไฟหรือไม่',
  payment:         'อธิบายปัญหา เช่น ระบบตัดเงินแต่ชาร์จไม่ได้ ตัดเงินซ้ำ หรือจำนวนเงินผิด',
  no_charge:       'อธิบายเพิ่มเติม เช่น สายเสียบแล้วไม่มีไฟ หรือหยุดชาร์จเองกลางคัน (ไม่บังคับ)',
  physical_damage: 'อธิบายความเสียหายที่เห็น เช่น สายชาร์จขาด หน้าตู้บุบ (ไม่บังคับ)',
  display:         'อธิบายอาการ เช่น หน้าจอค้าง กดปุ่มไม่ตอบสนอง (ไม่บังคับ)',
  other:           'อธิบายปัญหาที่พบโดยละเอียด',
}

export default function ReportIssuePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state ?? {}

  const [stations, setStations] = useState([])
  const [chargers, setChargers] = useState([])
  const [selectedStationId, setSelectedStationId] = useState(prefill.stationId ? String(prefill.stationId) : '')
  const [chargerId, setChargerId] = useState('')
  const [issueType, setIssueType] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
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
        if (prefill.chargerId) {
          setChargerId(String(prefill.chargerId))
        } else {
          setChargerId('')
        }
      })
      .catch(() => setChargers([]))
      .finally(() => setLoadingChargers(false))
  }, [selectedStationId])

  // title ที่ส่งไป BE = label ของ option ที่เลือก หรือ customTitle ถ้าเป็น other
  const finalTitle = issueType === 'other'
    ? customTitle
    : ISSUE_OPTIONS.find(o => o.value === issueType)?.label || ''

  const descriptionRequired = DESCRIPTION_REQUIRED.includes(issueType)

  const handleSubmit = async () => {
    if (!chargerId || !issueType || !image) return
    if (descriptionRequired && !description) return
    if (issueType === 'other' && !customTitle) return
    setSubmitting(true)
    setError(null)
    try {
      // Step 1: สร้าง ticket ก่อน → ได้ ticket_id กลับมา
      const res = await api.post('/api/tickets', {
        charger_id: Number(chargerId),
        issue_type: issueType,
        title: finalTitle,
        description,
      })
      const ticketId = res.data.ticket_id

      // Step 2: upload รูปหลักฐาน ต้องรู้ ticket_id ก่อนถึงจะ upload ได้
      const formData = new FormData()
      formData.append('image', image)
      await api.post(`/api/tickets/${ticketId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setSubmitted(true)
    } catch {
      setError('ส่งรายงานไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
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
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">ประเภทปัญหา</label>
            <select
              value={issueType}
              onChange={(e) => { setIssueType(e.target.value); setCustomTitle('') }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- เลือกประเภทปัญหา --</option>
              {ISSUE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {issueType === 'other' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                ระบุหัวข้อปัญหา <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="เช่น หัวชาร์จถอดไม่ออก"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              รายละเอียด {descriptionRequired && <span className="text-red-500">*</span>}
              {!descriptionRequired && issueType && <span className="text-gray-400 font-normal text-xs">(ไม่บังคับ)</span>}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={DESCRIPTION_PLACEHOLDER[issueType] || 'อธิบายปัญหาที่พบ...'}
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              รูปภาพหลักฐาน <span className="text-red-500">* (บังคับ)</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">ถ่ายให้เห็นจุดที่มีปัญหาชัดเจน</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0] || null
                setImage(file)
                if (file) {
                  const reader = new FileReader()
                  reader.onloadend = () => setImagePreview(reader.result)
                  reader.readAsDataURL(file)
                } else {
                  setImagePreview(null)
                }
              }}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-medium file:cursor-pointer"
            />
            {imagePreview && (
              <div className="mt-3 relative w-fit">
                <img src={imagePreview} alt="preview" className="max-h-48 rounded-xl border border-gray-200 object-cover" />
                <button
                  onClick={() => { setImage(null); setImagePreview(null) }}
                  className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >✕</button>
              </div>
            )}
          </div>
        </div>
        <button
          disabled={
            !chargerId || !issueType || !image || submitting ||
            (descriptionRequired && !description) ||
            (issueType === 'other' && !customTitle)
          }
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