import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa'

export default function UpdateTicketPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('in_progress')
  const [notes, setNotes]     = useState('')
  const [image, setImage]         = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    api.get('/api/tickets')
      .then((res) => {
        const found = res.data.tickets.find((t) => t.ticket_id === Number(id))
        if (found) {
          setTicket(found)
          setStatus(found.status || 'in_progress')
          setNotes(found.repair_notes || '')
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

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

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch(`/api/tickets/${id}/status`, { status, repair_notes: notes })
      if (image) {
        const formData = new FormData()
        formData.append('image', image)
        await api.post(`/api/tickets/${id}/image`, formData, {
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              แนบรูปภาพ {status === 'completed' ? <span className="text-red-400 font-normal">(แนะนำให้แนบหลักฐาน)</span> : <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>}
            </label>
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
                  className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

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
