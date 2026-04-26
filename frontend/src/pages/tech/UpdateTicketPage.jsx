import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa'

export default function UpdateTicketPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus]     = useState('in_progress')
  const [workType, setWorkType] = useState('onsite')
  const [notes, setNotes]       = useState('')
  const [image, setImage]           = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [imageError, setImageError] = useState('')

  // check-in / check-out
  const [checkInAt, setCheckInAt]   = useState(null)
  const [checkOutAt, setCheckOutAt] = useState(null)
  const [checkingIn, setCheckingIn]   = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)

  // test evidence
  const [testImage, setTestImage]           = useState(null)
  const [testImagePreview, setTestImagePreview] = useState(null)
  const [testNotes, setTestNotes] = useState('')

  // spare parts
  const [parts, setParts]             = useState([])
  const [partRequests, setPartRequests] = useState([])
  const [selectedPartId, setSelectedPartId] = useState('')
  const [qty, setQty]           = useState(1)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    api.get('/api/tickets')
      .then((res) => {
        const found = res.data.tickets.find((t) => t.ticket_id === Number(id))
        if (found) {
          setTicket(found)
          setStatus(found.status || 'in_progress')
          setNotes(found.repair_notes || '')
          setCheckInAt(found.check_in_at || null)
          setCheckOutAt(found.check_out_at || null)
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))

    api.get('/api/spare-parts').then(res => setParts(res.data.parts)).catch(() => {})
    api.get(`/api/spare-parts/requests/${id}`).then(res => setPartRequests(res.data.requests)).catch(() => {})
  }, [id])

  const handleCheckIn = async () => {
    setCheckingIn(true)
    try {
      await api.patch(`/api/tickets/${id}/checkin`)
      setCheckInAt(new Date().toISOString())
    } catch { alert('เช็คอินไม่สำเร็จ') }
    finally { setCheckingIn(false) }
  }

  const handleCheckOut = async () => {
    setCheckingOut(true)
    try {
      await api.patch(`/api/tickets/${id}/checkout`)
      setCheckOutAt(new Date().toISOString())
    } catch { alert('เช็คเอาท์ไม่สำเร็จ') }
    finally { setCheckingOut(false) }
  }

  const handleRequestPart = async () => {
    if (!selectedPartId || qty < 1) return
    setRequesting(true)
    try {
      await api.post('/api/spare-parts/request', {
        ticket_id: Number(id),
        part_id: Number(selectedPartId),
        qty_requested: qty,
      })
      const res = await api.get(`/api/spare-parts/requests/${id}`)
      setPartRequests(res.data.requests)
      setSelectedPartId('')
      setQty(1)
    } catch (err) {
      alert(err.response?.data?.message || 'เบิกไม่สำเร็จ')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  if (!ticket) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">ไม่พบตั๋วนี้</p>
    </div>
  )

  if (saved) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center w-full max-w-sm">
        <FaCheckCircle size={56} className="text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">บันทึกสำเร็จ!</h2>
        <button onClick={() => navigate('/tech/dashboard')} className="mt-6 w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-green-600 transition-colors">
          กลับแดชบอร์ด
        </button>
      </div>
    </div>
  )

  const statusOptions = [
    { value: 'in_progress', label: 'กำลังดำเนินการ' },
    { value: 'completed',   label: 'เสร็จสิ้น' },
  ]

  const photoRequired = status === 'completed' && workType === 'onsite'

  const handleSave = async () => {
    if (photoRequired && !image) {
      setImageError('กรุณาแนบรูปภาพหลักฐานสำหรับงานลงพื้นที่')
      return
    }
    setImageError('')
    setSaving(true)
    try {
      await api.patch(`/api/tickets/${id}/status`, {
        status,
        repair_notes: notes,
        test_notes: testNotes || undefined,
      })
      if (image) {
        const formData = new FormData()
        formData.append('image', image)
        await api.post(`/api/tickets/${id}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      if (testImage) {
        const formData = new FormData()
        formData.append('image', testImage)
        await api.post(`/api/tickets/${id}/test-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      setSaved(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-5">
          <FaArrowLeft size={13} /> ย้อนกลับ
        </button>
        <h1 className="text-xl font-bold text-gray-900 mb-1">อัปเดตงานซ่อม</h1>
        <p className="text-gray-500 text-sm mb-5">{ticket.title} · {ticket.charger_name}</p>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">

          {/* Check-in / Check-out */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-800">เวลาทำงาน</p>
            <div className="flex gap-2">
              <button
                onClick={handleCheckIn}
                disabled={!!checkInAt || checkingIn}
                className="flex-1 py-2 text-sm font-medium rounded-xl border border-blue-400 text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-100 transition-colors"
              >
                {checkInAt
                  ? `เช็คอิน ${new Date(checkInAt).toLocaleTimeString('th-TH', {hour:'2-digit',minute:'2-digit'})}`
                  : checkingIn ? 'กำลัง...' : 'เช็คอิน'}
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!checkInAt || !!checkOutAt || checkingOut}
                className="flex-1 py-2 text-sm font-medium rounded-xl border border-green-400 text-green-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-100 transition-colors"
              >
                {checkOutAt
                  ? `เช็คเอาท์ ${new Date(checkOutAt).toLocaleTimeString('th-TH', {hour:'2-digit',minute:'2-digit'})}`
                  : checkingOut ? 'กำลัง...' : 'เช็คเอาท์'}
              </button>
            </div>
            {checkInAt && checkOutAt && (
              <p className="text-xs text-green-700">
                ระยะเวลา: {Math.round((new Date(checkOutAt) - new Date(checkInAt)) / 60000)} นาที
              </p>
            )}
          </div>

          {/* เบิกอะไหล่ */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">เบิกอะไหล่</p>
            <div className="flex gap-2">
              <select
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- เลือกอะไหล่ --</option>
                {parts.map(p => (
                  <option key={p.part_id} value={p.part_id}>
                    {p.name} (คงเหลือ {p.stock_qty} {p.unit})
                  </option>
                ))}
              </select>
              <input
                type="number" min={1} value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-16 border border-gray-300 rounded-xl px-2 py-2 text-sm text-center"
              />
              <button
                onClick={handleRequestPart}
                disabled={!selectedPartId || requesting}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                ขอเบิก
              </button>
            </div>
            {partRequests.length > 0 && (
              <div className="space-y-1.5">
                {partRequests.map(r => (
                  <div key={r.request_id} className="flex items-center justify-between text-xs bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-gray-700">{r.part_name} ×{r.qty_requested} {r.unit}</span>
                    <span className={`font-semibold ${
                      r.status === 'approved' ? 'text-green-600' :
                      r.status === 'rejected' ? 'text-red-500' : 'text-yellow-600'
                    }`}>
                      {r.status === 'approved' ? 'อนุมัติแล้ว' :
                       r.status === 'rejected' ? 'ปฏิเสธ' : 'รอ admin'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* สถานะงาน */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">สถานะงาน</label>
            <div className="space-y-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    status === opt.value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 ${status === opt.value ? 'border-primary bg-primary' : 'border-gray-300'}`} />
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* บันทึกการซ่อม */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">บันทึกการซ่อม</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="อธิบายสิ่งที่ทำ วิธีแก้ไข อะไหล่ที่เปลี่ยน..."
              rows={5}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* ประเภทงาน */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภทงาน</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ value: 'onsite', label: 'ลงพื้นที่', desc: 'ต้องแนบรูปหลักฐาน' }, { value: 'remote', label: 'ออนไลน์ / รีโมท', desc: 'ไม่ต้องมีรูป' }].map((opt) => (
                <button key={opt.value} type="button" onClick={() => setWorkType(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${workType === opt.value ? 'border-primary bg-primary/5' : 'border-gray-200 text-gray-600'}`}>
                  <p className={`text-sm font-semibold ${workType === opt.value ? 'text-primary' : ''}`}>{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* รูประหว่างซ่อม */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              แนบรูปภาพ {photoRequired ? <span className="text-red-500 font-normal">* (บังคับสำหรับงานลงพื้นที่)</span> : <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>}
            </label>
            {imageError && <p className="text-xs text-red-500 mb-2">{imageError}</p>}
            <input
              type="file" accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0] || null
                setImage(file)
                if (file) {
                  const reader = new FileReader()
                  reader.onloadend = () => setImagePreview(reader.result)
                  reader.readAsDataURL(file)
                } else { setImagePreview(null) }
              }}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-medium file:cursor-pointer"
            />
            {imagePreview && (
              <div className="mt-3 relative w-fit">
                <img src={imagePreview} alt="preview" className="max-h-48 rounded-xl border border-gray-200 object-cover" />
                <button
                  onClick={() => { setImage(null); setImagePreview(null) }}
                  className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
                >✕</button>
              </div>
            )}
          </div>

          {/* หลักฐานผลทดสอบ — โชว์เฉพาะตอน completed */}
          {status === 'completed' && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">หลักฐานผลทดสอบ (หลังซ่อม)</p>
              <p className="text-xs text-gray-400">ถ่ายหน้าจอแสดง "Available" หรือ session ชาร์จสำเร็จ</p>
              <input
                type="file" accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0] || null
                  setTestImage(file)
                  if (file) {
                    const reader = new FileReader()
                    reader.onloadend = () => setTestImagePreview(reader.result)
                    reader.readAsDataURL(file)
                  }
                }}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-green-50 file:text-green-700 file:font-medium"
              />
              {testImagePreview && (
                <img src={testImagePreview} alt="test" className="max-h-40 rounded-xl border border-gray-200" />
              )}
              <textarea
                value={testNotes}
                onChange={(e) => setTestNotes(e.target.value)}
                placeholder="ผลการทดสอบ เช่น ทดสอบชาร์จ 5 นาที ได้ 7.4kW ปกติ"
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl shadow-md shadow-green-200 hover:bg-green-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}