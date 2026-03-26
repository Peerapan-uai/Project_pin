import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaSearch, FaMapMarkerAlt, FaStar, FaBolt, FaClock, FaTimes } from 'react-icons/fa'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import api from '../../utils/api'

const CONNECTOR_TYPES = ['ทั้งหมด', 'CCS', 'CHAdeMO', 'Type2', 'Type1']

export default function SearchPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedConnector, setSelectedConnector] = useState('ทั้งหมด')
  const [onlyAvailable, setOnlyAvailable] = useState(false)

  useEffect(() => {
    api.get('/api/stations')
      .then(res => setStations(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = stations.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
    const connectorList = s.connector_types ? s.connector_types.split(',') : []
    const matchConnector =
      selectedConnector === 'ทั้งหมด' ||
      connectorList.includes(selectedConnector)
    const matchAvailable = !onlyAvailable || s.available_chargers > 0
    return matchSearch && matchConnector && matchAvailable
  })

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="ค้นหาสถานี" />

      {/* Search bar */}
      <div className="px-4 pt-4">
        <div className="relative">
          <FaSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อสถานี หรือที่อยู่..."
            autoFocus
            className="w-full pl-9 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Connector filter chips */}
      <div className="px-4 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CONNECTOR_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedConnector(type)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedConnector === type
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Available only toggle */}
      <div className="px-4 mt-2">
        <button
          onClick={() => setOnlyAvailable((v) => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            onlyAvailable
              ? 'bg-green-50 text-green-700 border-green-300'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
            onlyAvailable ? 'border-green-500 bg-green-500' : 'border-gray-300'
          }`}>
            {onlyAvailable && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
          </span>
          ว่างอยู่เท่านั้น
        </button>
      </div>

      {/* Results */}
      <div className="px-4 mt-4 space-y-3">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {!loading && (
          <p className="text-xs text-gray-400 font-medium">
            {search || selectedConnector !== 'ทั้งหมด' || onlyAvailable
              ? `ผลลัพธ์ (${filtered.length})`
              : `สถานีทั้งหมด (${filtered.length})`}
          </p>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-sm">กำลังโหลด...</div>
          </div>
        )}

        {!loading && filtered.map((station) => (
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
                    <FaStar size={11} /> {station.rating ?? 0}
                    <span className="text-gray-400 font-normal">({station.review_count ?? 0})</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <FaClock size={11} className="text-gray-400" />
                    {station.open_time}–{station.close_time}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  station.available_chargers > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                }`}>
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

        {!loading && filtered.length === 0 && !error && (
          <div className="text-center py-16 text-gray-400">
            <FaSearch size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">ไม่พบสถานีที่ค้นหา</p>
            <p className="text-xs mt-1 opacity-60">ลองเปลี่ยน filter หรือคำค้นหา</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
