import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { FaBolt, FaStopCircle, FaClock, FaPlug } from 'react-icons/fa'
import api from '../../utils/api'

export default function ChargingPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stopping, setStopping] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const baseDurationRef = useRef(0)
  const fetchedAtRef = useRef(0)
  const intervalRef = useRef(null)
  const tickRef = useRef(null)

  useEffect(() => {
    const fetchStatus = () => {
      api.get(`/api/sessions/${sessionId}/status`)
        .then(res => {
          setSession(res.data.session)
          baseDurationRef.current = res.data.session?.duration_seconds ?? 0
          fetchedAtRef.current = Date.now()
          setElapsedSec(baseDurationRef.current)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }

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
  }, [sessionId])

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
      .then(res => navigate(`/payment/${sessionId}`, {
        state: {
          total_cost: res.data.total_cost,
          energy_kwh: res.data.energy_kwh
        }
      }))
      .catch(() => {
        setStopping(false)
        navigate(`/payment/${sessionId}`)
      })
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
