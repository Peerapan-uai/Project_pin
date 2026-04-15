import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { FaCheckCircle, FaCreditCard, FaQrcode, FaMobileAlt } from 'react-icons/fa'
import api from '../../utils/api'

const STEPS = { SELECT: 'select', QR: 'qr', CARD: 'card', PROCESSING: 'processing', SUCCESS: 'success' }

export default function PaymentPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [method, setMethod] = useState('promptpay')
  const [step, setStep] = useState(STEPS.SELECT)
  const [error, setError] = useState(null)
  const [txRef, setTxRef] = useState('')
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState({ total_cost: null, energy_kwh: null })
  const [qrImage, setQrImage] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvv: '' })

  // รับ total_cost จาก ChargingPage หรือ fetch จาก API
  useEffect(() => {
    const state = location.state
    if (state?.total_cost != null) {
      setSessionData({ total_cost: state.total_cost, energy_kwh: state.energy_kwh })
      setLoading(false)
    } else {
      api.get(`/api/sessions/${sessionId}/status`)
        .then(res => {
          const s = res.data.session || res.data
          setSessionData({ total_cost: s.total_cost ?? null, energy_kwh: s.energy_kwh ?? null })
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [sessionId, location.state])

  // QR: เรียก API สร้าง PromptPay QR จริง แล้วเก็บรูปไว้แสดง
  const doQR = async (amount) => {
    setStep(STEPS.PROCESSING)
    setError(null)
    try {
      const res = await api.post('/api/payments/qr', {
        session_id: Number(sessionId),
        amount: amount ?? 0,
      })
      setQrImage(res.data.qr_image)       // base64 PNG จาก backend
      setPaymentId(res.data.payment_id)   // เก็บไว้ใช้ตอน confirm
      setStep(STEPS.QR)
    } catch {
      setError('ไม่สามารถสร้าง QR ได้ กรุณาลองใหม่')
      setStep(STEPS.SELECT)
    }
  }

  // QR: user กด "ฉันสแกนแล้ว" → บอก backend ว่าจ่ายแล้ว
  const doConfirm = async () => {
    setStep(STEPS.PROCESSING)
    setError(null)
    try {
      await api.patch(`/api/payments/${paymentId}/confirm`)
      setTxRef(`TXN${String(paymentId).padStart(6, '0')}`)
      setStep(STEPS.SUCCESS)
    } catch {
      setError('ยืนยันการชำระเงินไม่สำเร็จ กรุณาลองใหม่')
      setStep(STEPS.QR)
    }
  }

  // Card: tokenize บัตรด้วย Omise.js แล้วส่ง token ไป backend
  const doCardPayment = async (amount) => {
    const { name, number, expiry, cvv } = cardForm
    if (!name || !number || !expiry || !cvv) {
      setError('กรุณากรอกข้อมูลบัตรให้ครบ')
      return
    }
    const [mm, yy] = expiry.split('/')
    if (!mm || !yy) {
      setError('รูปแบบวันหมดอายุไม่ถูกต้อง (MM/YY)')
      return
    }

    setStep(STEPS.PROCESSING)
    setError(null)

    const Omise = window['Omise']
    if (!Omise) {
      setError('โหลด Omise ไม่ได้ กรุณา refresh หน้า')
      setStep(STEPS.CARD)
      return
    }

    Omise.setPublicKey(import.meta.env.VITE_OMISE_PUBLIC_KEY)
    Omise.createToken('card', {
      name,
      number: number.replace(/\s/g, ''),
      expiration_month: parseInt(mm, 10),
      expiration_year: parseInt('20' + yy.trim(), 10),
      security_code: cvv,
    }, async (_statusCode, response) => {
      if (response.object === 'error' || !response.id) {
        setError(response.message || 'บัตรไม่ถูกต้อง กรุณาตรวจสอบข้อมูล')
        setStep(STEPS.CARD)
        return
      }
      try {
        const res = await api.post('/api/payments/charge', {
          session_id: Number(sessionId),
          amount: amount ?? 0,
          token: response.id,
        })
        const ref = res.data.transaction_ref || `TXN${String(res.data.payment_id).padStart(6, '0')}`
        setTxRef(ref)
        setStep(STEPS.SUCCESS)
      } catch (err) {
        setError(err?.response?.data?.message || 'การชำระเงินไม่สำเร็จ กรุณาลองใหม่')
        setStep(STEPS.CARD)
      }
    })
  }

  useEffect(() => {
    if (step === STEPS.SUCCESS) {
      const t = setTimeout(() => navigate('/bookings'), 4000)
      return () => clearTimeout(t)
    }
  }, [step, navigate])

  // polling ตรวจสถานะ payment ทุก 5 วินาที ตอนอยู่หน้า QR
  useEffect(() => {
    if (step !== STEPS.QR || !paymentId) return

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/payments/${paymentId}/status`)
        const status = res.data.status

        if (status === 'completed') {
          // จ่ายแล้ว → ไป SUCCESS อัตโนมัติ ไม่ต้องกดปุ่ม
          setTxRef(`TXN${String(paymentId).padStart(6, '0')}`)
          setStep(STEPS.SUCCESS)
        } else if (status === 'failed') {
          // หมดอายุ → แสดง error + กลับไปเลือก method ใหม่
          setError('QR หมดอายุแล้ว กรุณาสร้างใหม่')
          setStep(STEPS.SELECT)
        }
      } catch {
        // network error — ไม่ทำอะไร รอ poll รอบหน้า
      }
    }, 5000)

    return () => clearInterval(interval) // cleanup เมื่อออกจาก QR step
  }, [step, paymentId])

  const amount = sessionData.total_cost

  // --- SUCCESS ---
  if (step === STEPS.SUCCESS) return (
    <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center w-full max-w-sm">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaCheckCircle size={44} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">ชำระเงินสำเร็จ!</h2>
        <p className="text-gray-500 text-sm mt-1">ขอบคุณที่ใช้บริการ EV Charger</p>
        <div className="mt-4 bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">ยอดที่ชำระ</span>
            <span className="font-bold text-green-600">{amount ?? '—'} บาท</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">วิธีชำระ</span>
            <span className="font-medium">{method === 'promptpay' ? 'PromptPay' : 'บัตรเครดิต'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">เลขอ้างอิง</span>
            <span className="font-medium text-gray-700">{txRef}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">กำลังพาไปยังประวัติการจอง...</p>
        <button
          onClick={() => navigate('/bookings')}
          className="mt-4 w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-green-600 transition-colors"
        >
          ไปยังประวัติการจอง
        </button>
      </div>
    </div>
  )

  // --- PROCESSING ---
  if (step === STEPS.PROCESSING) return (
    <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center w-full max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <h2 className="text-lg font-bold text-gray-900">กำลังดำเนินการ...</h2>
        <p className="text-gray-400 text-sm mt-1">กรุณารอสักครู่</p>
      </div>
    </div>
  )

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  // --- QR PROMPTPAY ---
  if (step === STEPS.QR) return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="สแกน QR ชำระเงิน" showBack onBack={() => setStep(STEPS.SELECT)} />
      <div className="px-4 pt-6 flex flex-col items-center space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full flex flex-col items-center">
          <p className="text-sm text-gray-500 mb-1">ยอดที่ต้องชำระ</p>
          <p className="text-3xl font-bold text-primary mb-4">{amount ?? '—'} บาท</p>
          <img
            src={qrImage}
            alt="PromptPay QR"
            className="w-48 h-48 rounded-xl border border-gray-200"
          />
          <p className="text-xs text-gray-400 mt-3 text-center">
            สแกนด้วย TrueMoney, PromptPay<br />หรือแอปธนาคารใดก็ได้
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FaMobileAlt size={12} /> เปิดแอปธนาคาร → สแกน QR → ยืนยันการชำระเงิน
        </div>
        <button
          onClick={() => doConfirm()}
          className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl shadow-md shadow-green-200 hover:bg-green-600 transition-colors"
        >
          ฉันสแกนและจ่ายแล้ว
        </button>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </div>
    </div>
  )

  // --- CREDIT CARD ---
  if (step === STEPS.CARD) return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="ชำระด้วยบัตร" showBack onBack={() => setStep(STEPS.SELECT)} />
      <div className="px-4 pt-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-sm text-gray-500">ยอดที่ต้องชำระ</p>
          <p className="text-2xl font-bold text-primary mt-1">{amount ?? '—'} บาท</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <p className="font-semibold text-gray-800">ข้อมูลบัตร</p>
          <input
            placeholder="หมายเลขบัตร (16 หลัก)"
            value={cardForm.number}
            onChange={e => setCardForm(f => ({ ...f, number: e.target.value }))}
            maxLength={19}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            placeholder="ชื่อเจ้าของบัตร (ภาษาอังกฤษ)"
            value={cardForm.name}
            onChange={e => setCardForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <input
              placeholder="MM/YY"
              value={cardForm.expiry}
              onChange={e => setCardForm(f => ({ ...f, expiry: e.target.value }))}
              maxLength={5}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              placeholder="CVV"
              value={cardForm.cvv}
              onChange={e => setCardForm(f => ({ ...f, cvv: e.target.value }))}
              maxLength={4}
              className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <p className="text-xs text-gray-400 text-center">* ทดสอบใช้บัตร: 4242 4242 4242 4242 / 12/28 / 123</p>
        </div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          onClick={() => doCardPayment(amount)}
          className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl shadow-md shadow-green-200 hover:bg-green-600 transition-colors"
        >
          ยืนยันการชำระเงิน {amount ?? ''} บาท
        </button>
      </div>
    </div>
  )

  // --- SELECT METHOD ---
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="ชำระเงิน" showBack onBack={() => navigate(-1)} />
      <div className="px-4 pt-4 space-y-4">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Session #{sessionId}</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">พลังงาน</span>
            <span className="font-medium">{sessionData.energy_kwh ?? '—'} kWh</span>
          </div>
          <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-100">
            <span className="text-gray-800">ยอดรวม</span>
            <span className="text-primary">{amount ?? '—'} บาท</span>
          </div>
        </div>

        {/* Method */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="font-semibold text-gray-800 mb-3">เลือกวิธีชำระเงิน</p>
          <div className="space-y-2">
            {[
              { id: 'promptpay', label: 'PromptPay / QR Code', sub: 'TrueMoney, ธนาคารทุกแห่ง', Icon: FaQrcode },
              { id: 'credit_card', label: 'บัตรเครดิต/เดบิต', sub: 'Visa, Mastercard', Icon: FaCreditCard },
            ].map(({ id, label, sub, Icon }) => (
              <button
                key={id}
                onClick={() => setMethod(id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                  method === id ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
              >
                <Icon size={20} className={method === id ? 'text-primary' : 'text-gray-400'} />
                <div className="text-left">
                  <p className={`text-sm font-semibold ${method === id ? 'text-primary' : 'text-gray-700'}`}>{label}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
                <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  method === id ? 'border-primary' : 'border-gray-300'
                }`}>
                  {method === id && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => method === 'promptpay' ? doQR(amount) : setStep(STEPS.CARD)}
          className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl shadow-md shadow-green-200 hover:bg-green-600 transition-colors"
        >
          ถัดไป →
        </button>
      </div>
    </div>
  )
}
