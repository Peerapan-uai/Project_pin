import { useState, useEffect } from 'react'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaBolt, FaTimes } from 'react-icons/fa'

const EMPTY_FORM = { name: '', address: '', latitude: '', longitude: '', floor: '', open_time: '', close_time: '', status: 'active' }

export default function StationManagePage() {
  const [stations, setStations] = useState([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const fetchStations = () => {
    setLoading(true)
    api.get('/api/stations')
      .then((res) => setStations(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStations() }, [])

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setError(''); setShowModal(true) }
  const openEdit = (s) => {
    setEditingId(s.station_id)
    setForm({
      name: s.name ?? '',
      address: s.address ?? '',
      latitude: s.latitude ?? '',
      longitude: s.longitude ?? '',
      floor: s.floor ?? '',
      open_time: s.open_time ?? '',
      close_time: s.close_time ?? '',
      status: s.status ?? 'active',
    })
    setError('')
    setShowModal(true)
  }
  const closeModal = () => setShowModal(false)

  const handleDelete = (id) => {
    if (!window.confirm('ยืนยันการลบสถานีนี้?')) return
    api.delete(`/api/stations/${id}`)
      .then(() => fetchStations())
      .catch((err) => console.error(err))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.address || !form.latitude || !form.longitude) {
      setError('กรุณากรอกชื่อ ที่อยู่ latitude และ longitude')
      return
    }
    setSaving(true)
    const payload = { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) }
    const req = editingId
      ? api.put(`/api/stations/${editingId}`, payload)
      : api.post('/api/stations', payload)
    req
      .then(() => { closeModal(); fetchStations() })
      .catch((err) => setError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setSaving(false))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const filtered = stations.filter(
    (s) => s.name?.includes(search) || s.address?.includes(search)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการสถานี</h1>
          <p className="text-gray-500 text-sm mt-0.5">สถานีชาร์จทั้งหมด {stations.length} แห่ง</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors shadow-md shadow-green-200"
        >
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
                    <span className="text-green-600 font-semibold">{s.available_chargers ?? 0}</span>
                    <span className="text-gray-400">/{s.total_chargers ?? 0}</span>
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <StatusBadge status={s.status === 'active' ? 'available' : 'out_of_service'} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><FaEdit size={14} /></button>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editingId ? 'แก้ไขสถานี' : 'เพิ่มสถานีใหม่'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อสถานี *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="เช่น EV Station Central"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ที่อยู่ *</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="ที่อยู่สถานี"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="13.7563"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="100.5018"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ชั้น / โซน</label>
                <input
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="เช่น ชั้น B1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">เวลาเปิด</label>
                  <input
                    type="time"
                    value={form.open_time}
                    onChange={(e) => setForm({ ...form, open_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">เวลาปิด</label>
                  <input
                    type="time"
                    value={form.close_time}
                    onChange={(e) => setForm({ ...form, close_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">สถานะ</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50">
                  {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึก' : 'เพิ่มสถานี'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
