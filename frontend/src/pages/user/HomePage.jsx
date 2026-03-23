import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaSearch, FaMapMarkerAlt, FaStar, FaBolt, FaClock } from 'react-icons/fa'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [stations, setStations] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/stations')
      .then(res => setStations(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    api.get('/api/notifications', { _skipRedirect: true })
      .then(res => {
        const notifications = res.data.notifications || res.data
        setUnread(Array.isArray(notifications) ? notifications.filter((n) => !n.is_read).length : 0)
      })
      .catch(() => {})
  }, [])

  const filtered = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar
        title="EV Charger"
        showNotification
        unreadCount={unread}
        onNotificationClick={() => navigate('/notifications')}
      />

      <div className="px-4 pt-4 pb-2">
        <p className="text-gray-500 text-sm">สวัสดี, <span className="font-semibold text-gray-800">{user?.first_name}</span></p>
        <h2 className="text-xl font-bold text-gray-900 mt-0.5">หาสถานีชาร์จใกล้คุณ</h2>
      </div>

      {/* Search */}
      <div className="px-4 mt-3">
        <div className="relative">
          <FaSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาสถานีชาร์จ..."
            className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <div className="px-4 mt-3">
          <p className="text-red-500 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Station cards */}
      <div className="px-4 mt-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          สถานีทั้งหมด ({filtered.length})
        </h3>
        {filtered.map((station) => (
          <button
            key={station.station_id}
            onClick={() => navigate(`/stations/${station.station_id}`)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate">{station.name}</h4>
                <div className="flex items-center gap-1 mt-1">
                  <FaMapMarkerAlt size={11} className="text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-500 truncate">{station.address}</p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                    <FaStar size={11} /> {station.rating}
                    <span className="text-gray-400 font-normal">({station.review_count})</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <FaClock size={11} className="text-gray-400" />
                    {station.open_time}–{station.close_time}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    station.available_chargers > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {station.available_chargers > 0 ? 'ว่าง' : 'เต็ม'}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <FaBolt size={11} className="text-primary" />
                  <span>{station.available_chargers}/{station.total_chargers}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && !error && (
          <div className="text-center py-12 text-gray-400">
            <FaSearch size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ไม่พบสถานีที่ค้นหา</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
