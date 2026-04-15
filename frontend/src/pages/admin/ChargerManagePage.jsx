import { useState, useEffect } from 'react'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import { FaPlus, FaEdit, FaTrash, FaBolt } from 'react-icons/fa'

export default function ChargerManagePage() {
  const [chargers, setChargers]         = useState([])
  const [stations, setStations]         = useState([])
  const [filterStation, setFilterStation] = useState('all')
  const [loading, setLoading]           = useState(true)

  const fetchAll = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/stations'),
      api.get('/api/chargers'),
    ])
      .then(([stationsRes, chargersRes]) => {
        setStations(stationsRes.data.stations ?? [])
        setChargers(Array.isArray(chargersRes.data) ? chargersRes.data : chargersRes.data.chargers ?? [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const handleDelete = (id) => {
    if (!window.confirm('ยืนยันการลบตู้ชาร์จนี้?')) return
    api.delete(`/api/chargers/${id}`)
      .then(() => fetchAll())
      .catch((err) => console.error(err))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const filtered = filterStation === 'all'
    ? chargers
    : chargers.filter((c) => c.station_id === Number(filterStation))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการตู้ชาร์จ</h1>
          <p className="text-gray-500 text-sm mt-0.5">ตู้ชาร์จทั้งหมด {chargers.length} ตู้</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors shadow-md shadow-green-200">
          <FaPlus size={13} /> เพิ่มตู้ชาร์จ
        </button>
      </div>

      <div className="mb-4">
        <select
          value={filterStation}
          onChange={(e) => setFilterStation(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">ทุกสถานี</option>
          {stations.map((s) => <option key={s.station_id} value={s.station_id}>{s.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600">ตู้ชาร์จ</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">สถานี</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">ประเภท</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">กำลัง</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">ราคา/kWh</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">อุณหภูมิ</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">สถานะ</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => {
              const station = stations.find((s) => s.station_id === c.station_id)
              return (
                <tr key={c.charger_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaBolt size={13} className="text-primary" />
                      </div>
                      <p className="font-medium text-gray-900">{c.charger_name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-gray-500 text-xs">{station?.name}</td>
                  <td className="px-5 py-4 text-center text-gray-600">{c.connector_type}</td>
                  <td className="px-5 py-4 text-center font-medium text-gray-800">{c.power_kw} kW</td>
                  <td className="px-5 py-4 text-center text-gray-600">{c.price_per_kwh} ฿</td>
                  <td className="px-5 py-4 text-center text-gray-600"> {c.temperature_celsius == null ? "-" 
                  : c.temperature_celsius >= 60 
                  ? <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">{c.temperature_celsius}°C ร้อนเกิน </span>
                  : <span className="text-gray-600 text-sm">{c.temperature_celsius}°C</span>}
                  </td>
                  <td className="px-5 py-4 text-center"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><FaEdit size={14} /></button>
                      <button
                        onClick={() => handleDelete(c.charger_id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
