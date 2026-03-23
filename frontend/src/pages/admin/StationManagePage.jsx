import { useState, useEffect } from 'react'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaBolt } from 'react-icons/fa'

export default function StationManagePage() {
  const [stations, setStations] = useState([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)

  const fetchStations = () => {
    setLoading(true)
    api.get('/api/stations')
      .then((res) => setStations(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStations() }, [])

  const handleDelete = (id) => {
    if (!window.confirm('ยืนยันการลบสถานีนี้?')) return
    api.delete(`/api/stations/${id}`)
      .then(() => fetchStations())
      .catch((err) => console.error(err))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const filtered = stations.filter(
    (s) => s.name.includes(search) || s.address.includes(search)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการสถานี</h1>
          <p className="text-gray-500 text-sm mt-0.5">สถานีชาร์จทั้งหมด {stations.length} แห่ง</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors shadow-md shadow-green-200">
          <FaPlus size={13} /> เพิ่มสถานี
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาสถานี..."
          className="w-full max-w-sm border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600">ชื่อสถานี</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">ที่อยู่</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">ตู้ชาร์จ</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">สถานะ</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <tr key={s.station_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.floor}</p>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <div className="flex items-start gap-1.5 max-w-xs">
                    <FaMapMarkerAlt size={11} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500 line-clamp-2">{s.address}</p>
                  </div>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="flex items-center justify-center gap-1 text-sm">
                    <FaBolt size={11} className="text-primary" />
                    <span className="text-green-600 font-semibold">{s.available_chargers}</span>
                    <span className="text-gray-400">/{s.total_chargers}</span>
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <StatusBadge status={s.status === 'active' ? 'available' : 'out_of_service'} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><FaEdit size={14} /></button>
                    <button
                      onClick={() => handleDelete(s.station_id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">ไม่พบสถานีที่ค้นหา</div>
        )}
      </div>
    </div>
  )
}
