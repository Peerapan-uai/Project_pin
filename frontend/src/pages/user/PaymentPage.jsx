import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { FaCheckCircle, FaCreditCard, FaQrcode } from 'react-icons/fa'
import api from '../../utils/api'

export default function PaymentPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [method, setMethod] = useState('promptpay')
  const [paid, setPaid] = useState(false)
  const [sessionStatus, setSessionStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/api/sessions/${sessionId}/status`)
      .then(res => setSessionStatus(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  const handlePay = () => {
    const amount = sessionStatus?.total_cost ?? sessionStatus?.amount ?? 0
    setSubmitting(true)
    api.post('/api/payments', {
      session_id: Number(sessionId),
      amount,
      payment_method: method
    })
      .then(() => setPaid(true))
      .catch(() => setError('การชำระเงินไม่สำเร็จ กรุณาลองใหม่'))
      .finally(() => setSubmitting(false))
  }

  if (paid) return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16 items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center w-full max-w-sm">
        <FaCheckCircle size={56} className="text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">ชำระเงินสำเร็จ!</h2>
        <p className="text-gray-500 text-sm mt-2">ขอบคุณที่ใช้บริการ</p>
        <button onClick={() => navigate('/home')} className="mt-6 w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-green-600 transition-colors">
          กลับหน้าหลัก
        </button>
      </div>
    </div>
  )

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="ชำระเงิน" showBack onBack={() => navigate(-1)} />
      <div className="px-4 pt-4 space-y-4">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Session #{sessionId}</p>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-gray-500">พลังงาน</span>
            <span className="font-medium">{sessionStatus?.energy_kwh ?? '—'} kWh</span>
          </div>
          <div className="flex justify-between text-base font-bold mt-1.5">
            <span>ยอดรวม</span>
            <span className="text-primary">{sessionStatus?.total_cost ?? sessionStatus?.amount ?? '—'} บาท</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="font-semibold text-gray-800 mb-3">วิธีชำระเงิน</p>
          <div className="space-y-2">
            {[
              { id: 'promptpay', label: 'PromptPay / QR Code', Icon: FaQrcode },
              { id: 'credit_card', label: 'บัตรเครดิต/เดบิต', Icon: FaCreditCard },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setMethod(id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${method === id ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
              >
                <Icon size={18} className={method === id ? 'text-primary' : 'text-gray-400'} />
                <span className={`text-sm font-medium ${method === id ? 'text-primary' : 'text-gray-700'}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handlePay}
          disabled={submitting}
          className="w-full py-3.5 bg-primary disabled:opacity-50 text-white font-semibold rounded-xl shadow-md shadow-green-200 hover:bg-green-600 transition-colors"
        >
          {submitting ? 'กำลังชำระ...' : 'ยืนยันการชำระเงิน'}
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
