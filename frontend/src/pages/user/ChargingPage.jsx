import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { FaBolt } from 'react-icons/fa'
import api from '../../utils/api'

export default function ChargingPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stopping, setStopping] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    const fetchStatus = () => {
      api.get(`/api/sessions/${sessionId}/status`)
        .then(res => setStatus(res.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }

    fetchStatus()
    intervalRef.current = setInterval(fetchStatus, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [sessionId])

  const handleStop = () => {
    setStopping(true)
    api.patch(`/api/sessions/${sessionId}/stop`)
      .then(() => navigate(`/payment/${sessionId}`))
      .catch(() => {
        setStopping(false)
        navigate(`/payment/${sessionId}`)
      })
  }

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="กำลังชาร์จ" showBack onBack={() => navigate(-1)} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-32 h-32 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center">
          <FaBolt size={48} className="text-primary" />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">กำลังชาร์จ...</p>
          <p className="text-gray-500 text-sm mt-1">Session #{sessionId}</p>
          {status?.energy_kwh != null && (
            <p className="text-gray-600 text-sm mt-1">พลังงาน: {status.energy_kwh} kWh</p>
          )}
          {status?.duration_minutes != null && (
            <p className="text-gray-600 text-sm mt-0.5">เวลา: {status.duration_minutes} นาที</p>
          )}
        </div>
        <button
          onClick={handleStop}
          disabled={stopping}
          className="w-full max-w-xs py-3 bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
        >
          {stopping ? 'กำลังหยุด...' : 'หยุดชาร์จ'}
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
