import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { FaBolt, FaStopCircle, FaClock, FaPlug, FaWallet, FaExclamationTriangle, FaCar } from 'react-icons/fa'
import api from '../../utils/api'

export default function ChargingPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stopping, setStopping] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [walletBalance, setWalletBalance] = useState(null)
  const [stopResult, setStopResult] = useState(null)  // ผลลัพธ์หลังหยุดชาร์จ
  const baseDurationRef = useRef(0)
  const fetchedAtRef = useRef(0)
  const intervalRef = useRef(null)
  const tickRef = useRef(null)

  useEffect(() => {
    const fetchStatus = () => {
      api.get(`/api/sessions/${sessionId}/status`)
        .then(res => {
          // BE auto stop เมื่อเงินไม่พอ
          if (res.data.auto_stopped) {
            clearInterval(intervalRef.current)
            clearInterval(tickRef.current)
            const pm = res.data.payment_method
            if (pm === 'wallet' || pm === 'credit_card') {
              setStopResult({
                energy_kwh: res.data.energy_kwh,
                total_cost: res.data.total_cost,
                payment_method: pm,
                auto_stopped: true,
                battery_after_kwh: res.data.battery_after_kwh,
                battery_capacity_kwh: res.data.battery_capacity_kwh,
              })
            } else {
              navigate(`/payment/${sessionId}`, {
                state: { total_cost: res.data.total_cost, energy_kwh: res.data.energy_kwh }
              })
            }
            return
          }
          setSession(res.data.session)
          baseDurationRef.current = res.data.session?.duration_seconds ?? 0
          fetchedAtRef.current = Date.now()
          setElapsedSec(baseDurationRef.current)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }

    api.get('/api/wallet/balance').then(res => setWalletBalance(res.data.balance)).catch(() => {})

    fetchStatus()
    intervalRef.current = setInterval(fetchStatus, 10000)
    tickRef.current = setInterval(() => {
      const delta = Math.floor((Date.now() - fetchedAtRef.current) / 1000)
      setElapsedSec(baseDurationRef.current + delta)
    }, 1000)

    return () => {
      clearInterval(intervalRef.current)
      clearInterval(tickRef.current)
    }
  }, [sessionId]) // eslint-disable-line

  const durationSec = Math.max(0, elapsedSec)
  const durationMin = durationSec / 60
  const hours = Math.floor(durationSec / 3600)
  const mins = Math.floor((durationSec % 3600) / 60)
  const secs = Math.floor(durationSec % 60)
  const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const powerKw = session?.power_kw ?? 0
  const pricePerKwh = session?.price_per_kwh ?? 0
  const estimatedKwh = parseFloat(((powerKw * durationMin) / 60).toFixed(3))
  const estimatedCost = parseFloat((estimatedKwh * pricePerKwh).toFixed(2))

  const handleStop = () => {
    setStopping(true)
    const energy_kwh = estimatedKwh > 0 ? estimatedKwh : 1
    api.patch(`/api/sessions/${sessionId}/stop`, { energy_kwh })
      .then(res => {
        const pm = res.data.payment_method
        if (pm === 'wallet' || pm === 'credit_card') {
          // จ่ายอัตโนมัติสำเร็จแล้ว → แสดงสรุป (รวม battery info)
          setStopResult({
            ...res.data,
            battery_after_kwh: res.data.battery_after_kwh,
            battery_capacity_kwh: res.data.battery_capacity_kwh,
          })
        } else {
          // ยังไม่จ่าย (pending) → ไปหน้าชำระเงินเอง
          navigate(`/payment/${sessionId}`, {
            state: { total_cost: res.data.total_cost, energy_kwh: res.data.energy_kwh }
          })
        }
      })
      .catch(() => {
        setStopping(false)
        navigate(`/payment/${sessionId}`)
      })
  }

  // ชาร์จเสร็จ + จ่ายอัตโนมัติสำเร็จ
  if (stopResult) {
    const methodLabel = stopResult.payment_method === 'wallet' ? 'Wallet' : 'บัตรเครดิต'
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center w-full max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBolt size={40} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {stopResult.auto_stopped ? 'หยุดชาร์จอัตโนมัติ' : 'ชาร์จเสร็จสิ้น!'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {stopResult.auto_stopped ? 'ยอดเงินในกระเป๋าใกล้หมด ระบบหยุดชาร์จให้อัตโนมัติ' : 'ชำระเงินอัตโนมัติเรียบร้อย'}
          </p>
          <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">พลังงาน</span>
              <span className="font-medium">{stopResult.energy_kwh} kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ยอดชำระ</span>
              <span className="font-bold text-primary">{stopResult.total_cost} บาท</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ชำระผ่าน</span>
              <span className="font-medium">{methodLabel}</span>
            </div>
          </div>

          {/* แสดง battery ที่อัพเดทแล้ว */}
          {stopResult.battery_after_kwh != null && stopResult.battery_capacity_kwh != null && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaCar size={14} className="text-green-600" />
                <span className="text-sm font-semibold text-green-800">แบตเตอรี่รถของคุณ</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{stopResult.battery_after_kwh} / {stopResult.battery_capacity_kwh} kWh</span>
                <span className="font-bold text-green-700">
                  {Math.round((stopResult.battery_after_kwh / stopResult.battery_capacity_kwh) * 100)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-1000"
                  style={{ width: `${Math.min(100, (stopResult.battery_after_kwh / stopResult.battery_capacity_kwh) * 100)}%` }}
                />
              </div>
            </div>
          )}
          <button
            onClick={() => navigate('/bookings')}
            className="mt-6 w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-green-600 transition-colors"
          >
            ไปยังประวัติการจอง
          </button>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="flex justify-center p-10">
      <div className="text-gray-500">กำลังโหลด...</div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="กำลังชาร์จ" showBack onBack={() => navigate(-1)} />

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">

        {/* Animated bolt */}
        <div className="relative w-36 h-36 rounded-full bg-green-50 border-4 border-primary flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
          <FaBolt size={52} className="text-primary animate-pulse" />
        </div>

        {/* Station name */}
        {session?.station_name && (
          <p className="text-gray-500 text-sm font-medium">{session.station_name}</p>
        )}

        {/* Timer */}
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
            <FaClock size={10} /> เวลาที่ชาร์จ
          </p>
          <p className="text-4xl font-mono font-bold text-gray-900">{timeStr}</p>
        </div>

        {/* Stats grid */}
        <div className="w-full max-w-xs grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-1">กำลัง</p>
            <p className="text-lg font-bold text-primary">{powerKw}</p>
            <p className="text-xs text-gray-400">kW</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-1">พลังงาน</p>
            <p className="text-lg font-bold text-primary">{estimatedKwh}</p>
            <p className="text-xs text-gray-400">kWh</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-1">ค่าไฟ</p>
            <p className="text-lg font-bold text-primary">{estimatedCost}</p>
            <p className="text-xs text-gray-400">฿</p>
          </div>
        </div>

        {/* Connector info */}
        {session?.connector_type && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FaPlug size={12} />
            <span>{session.connector_type} · {pricePerKwh} ฿/kWh</span>
          </div>
        )}

        {/* Wallet balance + warning */}
        {walletBalance !== null && (
          <div className={`w-full max-w-xs rounded-2xl px-4 py-3 flex items-center gap-3 ${estimatedCost > walletBalance ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <FaWallet size={16} className={estimatedCost > walletBalance ? 'text-red-500' : 'text-green-600'} />
            <div className="flex-1">
              <p className="text-xs text-gray-500">ยอด Wallet</p>
              <p className={`text-sm font-bold ${estimatedCost > walletBalance ? 'text-red-600' : 'text-green-700'}`}>
                ฿{parseFloat(walletBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {estimatedCost > walletBalance && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <FaExclamationTriangle size={12} />
                <span>ไม่พอ</span>
              </div>
            )}
          </div>
        )}

        {/* Stop button */}
        <button
          onClick={handleStop}
          disabled={stopping}
          className="w-full max-w-xs py-3.5 bg-red-500 disabled:opacity-50 text-white font-semibold rounded-2xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2 mt-2"
        >
          <FaStopCircle size={18} />
          {stopping ? 'กำลังหยุด...' : 'หยุดชาร์จ'}
        </button>

        <p className="text-xs text-gray-400 text-center">Session #{sessionId}</p>
      </div>

      <BottomNav />
    </div>
  )
}
