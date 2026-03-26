import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import StatusBadge from '../../components/StatusBadge'
import { FaMapMarkerAlt, FaBolt, FaClock, FaPlug, FaCreditCard, FaReceipt } from 'react-icons/fa'
import api from '../../utils/api'

export default function BookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/api/bookings/${id}`)
      .then(res => setBooking(res.data.booking))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>
  if (error || !booking) return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="รายละเอียดการจอง" showBack onBack={() => navigate(-1)} />
      <p className="text-center text-red-500 mt-10">{error || 'ไม่พบข้อมูล'}</p>
    </div>
  )

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '—'
  const fmtDateTime = (d) => d ? `${fmtDate(d)} ${fmtTime(d)}` : '—'

  const methodLabel = { promptpay: 'PromptPay / QR Code', credit_card: 'บัตรเครดิต/เดบิต', wallet: 'Wallet' }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="รายละเอียดการจอง" showBack onBack={() => navigate(-1)} />

      <div className="px-4 pt-4 space-y-3">

        {/* สถานะ */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">การจอง #{booking.booking_id}</p>
            <p className="font-bold text-gray-900">{booking.station_name}</p>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <FaMapMarkerAlt size={10} />
              <span className="truncate">{booking.address}</span>
            </div>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {/* ข้อมูลตู้ชาร์จ */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ตู้ชาร์จ</p>
          <Row icon={FaPlug} label="ชื่อตู้" value={booking.charger_name} />
          <Row icon={FaBolt} label="ประเภทหัวชาร์จ" value={booking.connector_type} />
          <Row icon={FaBolt} label="กำลังไฟ" value={`${booking.power_kw} kW`} />
          {booking.price_per_kwh && <Row icon={FaReceipt} label="ราคา" value={`${booking.price_per_kwh} บาท/kWh`} />}
        </div>

        {/* เวลาจอง */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">เวลาจอง</p>
          <Row icon={FaClock} label="เริ่ม" value={fmtDateTime(booking.start_time)} />
          <Row icon={FaClock} label="สิ้นสุด" value={fmtDateTime(booking.end_time)} />
        </div>

        {/* ข้อมูลการชาร์จ */}
        {booking.session_id && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">การชาร์จ</p>
            <Row icon={FaClock} label="เริ่มชาร์จ" value={fmtDateTime(booking.session_start)} />
            <Row icon={FaClock} label="หยุดชาร์จ" value={fmtDateTime(booking.session_end)} />
            {booking.duration_minutes != null && (
              <Row icon={FaClock} label="ระยะเวลา" value={`${booking.duration_minutes} นาที`} />
            )}
            {booking.energy_kwh != null && (
              <Row icon={FaBolt} label="พลังงานที่ชาร์จ" value={`${booking.energy_kwh} kWh`} />
            )}
          </div>
        )}

        {/* การชำระเงิน */}
        {booking.payment_id && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">การชำระเงิน</p>
            <Row icon={FaCreditCard} label="ยอดที่ชำระ" value={`${booking.paid_amount} บาท`} highlight />
            <Row icon={FaCreditCard} label="วิธีชำระ" value={methodLabel[booking.payment_method] || booking.payment_method} />
            <Row icon={FaReceipt} label="เลขอ้างอิง" value={booking.transaction_ref} />
            <Row icon={FaClock} label="ชำระเมื่อ" value={fmtDateTime(booking.paid_at)} />
          </div>
        )}

        {/* ปุ่มรีวิว */}
        {booking.status === 'completed' && (
          <button
            onClick={() => navigate(`/review/${booking.station_id ?? booking.charger_id}`)}
            className="w-full py-3 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary/5 transition-colors text-sm"
          >
            ⭐ เขียนรีวิวสถานีนี้
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

function Row({ icon: Icon, label, value, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Icon size={12} className="text-gray-400" />
        <span>{label}</span>
      </div>
      <span className={`text-sm font-medium ${highlight ? 'text-primary text-base font-bold' : 'text-gray-800'}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}
