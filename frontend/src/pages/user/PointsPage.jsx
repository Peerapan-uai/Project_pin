import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { FaStar, FaTimes, FaCheckCircle, FaGift, FaBolt, FaHistory } from 'react-icons/fa'
import api from '../../utils/api'

const TYPE_LABEL = { earn: 'ได้รับแต้ม', redeem: 'แลกส่วนลด', expire: 'หมดอายุ', adjust: 'ปรับแต้ม' }
const TYPE_COLOR = { earn: 'text-green-600', redeem: 'text-blue-500', expire: 'text-gray-400', adjust: 'text-yellow-600' }
const TYPE_BG = { earn: 'bg-green-50', redeem: 'bg-blue-50', expire: 'bg-gray-100', adjust: 'bg-yellow-50' }
const TYPE_ICON_COLOR = { earn: 'text-green-500', redeem: 'text-blue-500', expire: 'text-gray-400', adjust: 'text-yellow-500' }

export default function PointsPage() {
  const navigate = useNavigate()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState(100)
  const [redeeming, setRedeeming] = useState(false)
  const [redeemResult, setRedeemResult] = useState(null)
  const [error, setError] = useState(null)

  const fetchPoints = () => {
    api.get('/api/points/balance')
      .then(res => {
        setBalance(res.data.balance || 0)
        setTransactions(res.data.transactions || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPoints() }, [])

  const handleRedeem = async () => {
    setRedeeming(true)
    setError(null)
    try {
      const res = await api.post('/api/points/redeem', { points: redeemPoints })
      setRedeemResult(res.data)
      if (res.data.redeem_token) {
        localStorage.setItem('ev_redeem_token', res.data.redeem_token)
        localStorage.setItem('ev_redeem_discount', String(res.data.discount_amount))
      }
      fetchPoints()
    } catch (e) {
      setError(e.response?.data?.message || 'เกิดข้อผิดพลาด')
    } finally {
      setRedeeming(false)
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' }) : ''
  const maxRedeemable = Math.floor(balance / 100) * 100
  const progressToNext = balance % 100
  const canRedeem = balance >= 100

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <Navbar title="แต้มสะสม" showBack onBack={() => navigate(-1)} />

      {/* Header */}
      <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 px-4 pt-6 pb-14 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-8 -translate-x-6" />
        <div className="relative flex flex-col items-center gap-1">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-1">
            <FaStar size={28} className="text-white" />
          </div>
          <p className="text-orange-100 text-sm">แต้มสะสมของคุณ</p>
          <p className="text-white text-6xl font-bold tracking-tight">{balance.toLocaleString()}</p>
          <p className="text-orange-100 text-xs mt-1">แต้ม</p>

          {/* Progress bar to next 100 pts */}
          <div className="w-full mt-4">
            <div className="flex justify-between text-xs text-orange-100 mb-1">
              <span>{progressToNext}/100 แต้มถึงรางวัลถัดไป</span>
              <span>= ลด ฿10</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {/* Redeem card */}
        <button
          onClick={() => { setShowModal(true); setRedeemResult(null); setError(null) }}
          disabled={!canRedeem}
          className={`w-full rounded-2xl p-4 shadow-sm border text-left flex items-center gap-3 transition-all ${
            canRedeem
              ? 'bg-white border-amber-200 hover:shadow-md active:scale-[0.98]'
              : 'bg-white border-gray-100 opacity-60'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${canRedeem ? 'bg-amber-50' : 'bg-gray-50'}`}>
            <FaGift size={20} className={canRedeem ? 'text-amber-500' : 'text-gray-400'} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">แลกแต้มรับส่วนลด</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {canRedeem
                ? `แลกได้สูงสุด ${maxRedeemable} แต้ม = ลด ฿${maxRedeemable / 10}`
                : `ต้องการอีก ${100 - progressToNext} แต้ม`}
            </p>
          </div>
          {canRedeem && (
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-1 rounded-full shrink-0">
              แลกได้!
            </span>
          )}
        </button>

        {/* How to earn */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">วิธีสะสมแต้ม</p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                <FaBolt size={13} className="text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-700">ชาร์จรถ EV</p>
                <p className="text-xs text-gray-400">ทุก ฿1 ที่ชาร์จ = 1 แต้ม</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
                <FaStar size={13} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-gray-700">แลกส่วนลด</p>
                <p className="text-xs text-gray-400">100 แต้ม = ลด ฿10 จากค่าชาร์จ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FaHistory size={13} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">ประวัติแต้ม</p>
          </div>
          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center">
                <FaStar size={24} className="text-gray-200" />
              </div>
              <p className="text-sm text-gray-400">ยังไม่มีประวัติแต้ม</p>
              <p className="text-xs text-gray-300">เริ่มชาร์จเพื่อสะสมแต้ม</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {transactions.map((txn, i) => (
                <div key={txn.txn_id} className={`flex items-center gap-3 px-4 py-3.5 ${i < transactions.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${TYPE_BG[txn.type] || 'bg-gray-100'}`}>
                    <FaStar size={14} className={TYPE_ICON_COLOR[txn.type] || 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{TYPE_LABEL[txn.type] || txn.type}</p>
                    {txn.ref && <p className="text-xs text-gray-400 truncate">{txn.ref}</p>}
                    {txn.expires_at && txn.type === 'earn' && (
                      <p className="text-xs text-orange-300">หมดอายุ {formatDate(txn.expires_at)}</p>
                    )}
                  </div>
                  <p className={`text-sm font-bold ${TYPE_COLOR[txn.type] || 'text-gray-600'}`}>
                    {txn.amount > 0 ? '+' : ''}{txn.amount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Redeem Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">แลกแต้มรับส่วนลด</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>

            {redeemResult ? (
              <div className="text-center space-y-3 py-4">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <FaCheckCircle size={36} className="text-green-500" />
                </div>
                <p className="font-bold text-gray-900 text-lg">แลกสำเร็จ!</p>
                <p className="text-sm text-gray-600">
                  คุณได้รับส่วนลด <span className="font-bold text-green-600">฿{redeemResult.discount_amount}</span>
                </p>
                <p className="text-xs text-gray-400">จะถูกหักจากค่าชาร์จครั้งถัดไปอัตโนมัติ (ใช้ได้ 1 ครั้ง)</p>
                <p className="text-xs text-gray-400">แต้มคงเหลือ: {redeemResult.new_balance} แต้ม</p>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-green-600"
                >
                  เสร็จสิ้น
                </button>
              </div>
            ) : (
              <>
                {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

                <div>
                  <label className="text-xs text-gray-500 mb-2 block font-medium">เลือกจำนวนแต้มที่ต้องการแลก</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: Math.min(Math.floor(balance / 100), 6) }, (_, i) => (i + 1) * 100).map(pts => (
                      <button
                        key={pts}
                        onClick={() => setRedeemPoints(pts)}
                        className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                          redeemPoints === pts
                            ? 'border-amber-400 bg-amber-50 text-amber-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-amber-200'
                        }`}
                      >
                        <div>{pts}</div>
                        <div className="text-xs font-normal">= ฿{pts / 10}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-600">ส่วนลดที่จะได้รับ</p>
                    <p className="text-2xl font-bold text-amber-700">฿{redeemPoints / 10}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-amber-600">แต้มที่ใช้</p>
                    <p className="text-lg font-bold text-amber-700">{redeemPoints} แต้ม</p>
                  </div>
                </div>

                <button
                  onClick={handleRedeem}
                  disabled={redeeming}
                  className="w-full py-3.5 bg-amber-400 disabled:opacity-50 text-white font-semibold rounded-2xl hover:bg-amber-500 active:scale-[0.98] transition-all"
                >
                  {redeeming ? 'กำลังแลก...' : 'ยืนยันแลกแต้ม'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
