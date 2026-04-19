import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import StatusBadge from '../../components/StatusBadge'
import { FaReceipt, FaTimes, FaImage } from 'react-icons/fa'
import api from '../../utils/api'

export default function PaymentHistoryPage() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const REFUND_TITLES = [
    'ตู้ชาร์จไม่ทำงาน / ชาร์จไม่ได้',
    'ถูกเก็บเงินผิดจำนวน',
    'ชาร์จไม่เสร็จ / หยุดกลางคัน',
    'จองแล้วใช้งานไม่ได้',
    'ยกเลิกการจองแต่ยังถูกตัดเงิน',
    'อื่นๆ',
  ]

  const [modal, setModal] = useState(null) // payment object
  const [title, setTitle] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [reason, setReason] = useState('')
  const [images, setImages] = useState([]) // base64 strings
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const fileRef = useRef()

  const fetchPayments = () => {
    setLoading(true)
    api.get('/api/payments/history')
      .then(res => setPayments(res.data.payments || []))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPayments() }, [])

  const methodLabel = { credit_card: 'บัตรเครดิต', promptpay: 'PromptPay' }

  const openModal = (p) => {
    setModal(p)
    setTitle('')
    setCustomTitle('')
    setReason('')
    setImages([])
    setSubmitError('')
  }

  const closeModal = () => {
    setModal(null)
    setTitle('')
    setCustomTitle('')
    setReason('')
    setImages([])
    setSubmitError('')
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const remaining = 5 - images.length
    files.slice(0, remaining).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => setImages(prev => [...prev, ev.target.result])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx))

  const finalTitle = title === 'อื่นๆ' ? customTitle.trim() : title

  const handleSubmit = async () => {
    if (!title) { setSubmitError('กรุณาเลือกหัวข้อ'); return }
    if (title === 'อื่นๆ' && !customTitle.trim()) { setSubmitError('กรุณาระบุหัวข้อ'); return }
    setSubmitting(true)
    setSubmitError('')
    try {
      await api.post(`/api/payments/${modal.payment_id}/refund-request`, {
        title: finalTitle,
        reason: reason.trim(),
        images: images.length > 0 ? images : [],
      })
      setPayments(prev => prev.map(p =>
        p.payment_id === modal.payment_id
          ? { ...p, refund_status: 'pending' }
          : p
      ))
      closeModal()
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  const refundBadge = (status) => {
    if (status === 'pending')  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">รอดำเนินการ</span>
    if (status === 'approved') return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">คืนเงินแล้ว</span>
    if (status === 'rejected') return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">ถูกปฏิเสธ</span>
    return null
  }

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="ประวัติการชำระเงิน" showBack onBack={() => navigate(-1)} />
      <div className="px-4 pt-4 space-y-3">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {payments.length === 0 && !error && (
          <div className="text-center py-12 text-gray-400">
            <FaReceipt size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ยังไม่มีประวัติการชำระเงิน</p>
          </div>
        )}
        {payments.map((p) => (
          <div key={p.payment_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{p.station_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{methodLabel[p.method] || p.method}</p>
                <p className="text-xs text-gray-400 mt-0.5">Ref: {p.transaction_ref}</p>
                {p.paid_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(p.paid_at).toLocaleString('th-TH')}
                  </p>
                )}
              </div>
              <div className="text-right space-y-1.5">
                <p className="font-bold text-primary text-base">{p.amount} บาท</p>
                <StatusBadge status={p.status} />
                {p.status === 'completed' && (
                  p.refund_status
                    ? refundBadge(p.refund_status)
                    : <button
                        onClick={() => openModal(p)}
                        className="block text-xs font-semibold text-orange-500 border border-orange-300 rounded-full px-2.5 py-0.5 hover:bg-orange-50 transition-colors"
                      >
                        ขอคืนเงิน
                      </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />

      {/* Refund Request Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-md mb-2" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">ขอคืนเงิน</h2>
                <p className="text-xs text-gray-400 mt-0.5">{modal.station_name} · {Number(modal.amount).toFixed(2)} บาท</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <FaTimes size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* หัวข้อ */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  หัวข้อ <span className="text-red-500">*</span>
                </label>
                <select
                  value={title}
                  onChange={e => { setTitle(e.target.value); setCustomTitle('') }}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="">-- เลือกหัวข้อ --</option>
                  {REFUND_TITLES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {title === 'อื่นๆ' && (
                  <input
                    type="text"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    placeholder="ระบุหัวข้อของคุณ..."
                    className="mt-2 w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
              </div>

              {/* รายละเอียด */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  รายละเอียด (ไม่บังคับ)
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  placeholder="อธิบายรายละเอียดเพิ่มเติม..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* แนบรูป */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  แนบรูปภาพ (ไม่บังคับ, สูงสุด 5 รูป)
                </label>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                {images.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-2">
                    {images.map((src, i) => (
                      <div key={i} className="relative">
                        <img src={src} alt="" className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <FaTimes size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {images.length < 5 && (
                  <button
                    onClick={() => fileRef.current.click()}
                    className="flex items-center gap-1.5 text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl px-3 py-2 hover:bg-gray-50"
                  >
                    <FaImage size={12} /> เพิ่มรูปภาพ
                  </button>
                )}
              </div>

              {submitError && <p className="text-red-500 text-xs">{submitError}</p>}

              {/* ปุ่ม */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'กำลังส่ง...' : 'ส่งคำขอ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
