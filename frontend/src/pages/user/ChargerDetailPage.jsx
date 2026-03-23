import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import StatusBadge from '../../components/StatusBadge'
import { FaBolt, FaPlug, FaMoneyBillWave } from 'react-icons/fa'
import api from '../../utils/api'

export default function ChargerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [charger, setCharger] = useState(null)
  const [station, setStation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/api/chargers/${id}`)
      .then(res => {
        const chargerData = res.data
        setCharger(chargerData)
        if (chargerData.station_id) {
          return api.get(`/api/stations/${chargerData.station_id}`)
            .then(stRes => setStation(stRes.data))
            .catch(() => {})
        }
      })
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  if (error || !charger) return (
    <div className="flex flex-col min-h-screen pb-16">
      <Navbar title="ตู้ชาร์จ" showBack onBack={() => navigate(-1)} />
      <div className="flex-1 flex items-center justify-center text-gray-400">{error || 'ไม่พบตู้ชาร์จ'}</div>
      <BottomNav />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title={charger.charger_name} showBack onBack={() => navigate(-1)} />
      <div className="px-4 pt-4 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{charger.charger_name}</h2>
            <StatusBadge status={charger.status} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center"><FaBolt className="text-primary" /></div>
              <div><p className="text-xs text-gray-500">กำลังไฟ</p><p className="font-semibold text-gray-900">{charger.power_kw} kW</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center"><FaPlug className="text-blue-500" /></div>
              <div><p className="text-xs text-gray-500">ประเภทหัวชาร์จ</p><p className="font-semibold text-gray-900">{charger.connector_type}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center"><FaMoneyBillWave className="text-amber-500" /></div>
              <div><p className="text-xs text-gray-500">ราคา</p><p className="font-semibold text-gray-900">{charger.price_per_kwh} บาท/kWh</p></div>
            </div>
          </div>
          {station && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">สถานี</p>
              <p className="font-medium text-gray-800">{station.name}</p>
            </div>
          )}
        </div>
        {charger.status === 'available' && (
          <button
            onClick={() => navigate(`/booking/${charger.charger_id}`)}
            className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl shadow-md shadow-green-200 hover:bg-green-600 transition-colors"
          >
            จองตู้ชาร์จนี้
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
