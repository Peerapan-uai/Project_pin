import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { FaHeart, FaMapMarkerAlt, FaBolt } from 'react-icons/fa'
import api from '../../utils/api'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/favorites')
      .then(res => setFavorites(res.data.favorites || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = async (stationId) => {
    try {
      await api.delete(`/api/favorites/${stationId}`)
      setFavorites(prev => prev.filter(f => f.station_id !== stationId))
    } catch (_) {}
  }

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="สถานีโปรด" showBack onBack={() => navigate(-1)} />
      <div className="px-4 pt-4 space-y-3">
        {favorites.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FaHeart size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">ยังไม่มีสถานีโปรด</p>
            <p className="text-xs mt-1">กดหัวใจในหน้าสถานีเพื่อเพิ่ม</p>
          </div>
        ) : (
          favorites.map(s => (
            <div
              key={s.station_id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
            >
              <button
                onClick={() => navigate(`/stations/${s.station_id}`)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FaBolt size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{s.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <FaMapMarkerAlt size={10} className="text-gray-400 flex-shrink-0" />
                    <p className="text-xs text-gray-500 truncate">{s.address}</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleRemove(s.station_id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              >
                <FaHeart size={16} />
              </button>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  )
}
