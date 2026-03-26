import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import StatusBadge from '../../components/StatusBadge'
import { FaReceipt } from 'react-icons/fa'
import api from '../../utils/api'

export default function PaymentHistoryPage() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/payments/history')
      .then(res => setPayments(res.data.payments || []))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [])

  const methodLabel = { credit_card: 'บัตรเครดิต', promptpay: 'PromptPay' }

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
              </div>
              <div className="text-right">
                <p className="font-bold text-primary text-base">{p.amount} บาท</p>
                <StatusBadge status={p.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}
