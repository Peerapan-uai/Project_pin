import { useState, useEffect } from 'react'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaBolt, FaTimes } from 'react-icons/fa'

const EMPTY_FORM = { name: '', address: '', latitude: '', longitude: '', floor: '', open_time: '', close_time: '', status: 'active' }
const EMPTY_CHARGER_FORM = { charger_name: '', connector_type: '', power_kw: '', price_per_kwh: '', status: 'available' }

export default function StationManagePage() {
  const [stations, setStations]         = useState([])
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [editingId, setEditingId]       = useState(null)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  // charger modal state
  const [chargerStation, setChargerStation] = useState(null)
  const [chargers, setChargers]             = useState([])
  const [chargerLoading, setChargerLoading] = useState(false)
  const [editingCharger, setEditingCharger] = useState(null)
  const [chargerForm, setChargerForm]       = useState(EMPTY_CHARGER_FORM)
  const [chargerError, setChargerError]     = useState('')
  const [chargerSaving, setChargerSaving]   = useState(false)

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

  const openChargerModal = (station) => {
    setChargerStation(station)
    setEditingCharger(null)
    setChargerForm(EMPTY_CHARGER_FORM)
    setChargerError('')
    setChargerLoading(true)
    api.get(`/api/stations/${station.station_id}`)
      .then((res) => setChargers(res.data.chargers ?? []))
      .catch(() => setChargers([]))
      .finally(() => setChargerLoading(false))
  }
  const closeChargerModal = () => { setChargerStation(null); setEditingCharger(null) }

  const startEditCharger = (c) => {
    setEditingCharger(c.charger_id)
    setChargerForm({
      charger_name: c.charger_name ?? '',
      connector_type: c.connector_type ?? '',
      power_kw: c.power_kw ?? '',
      price_per_kwh: c.price_per_kwh ?? '',
      status: c.status ?? 'available',
    })
    setChargerError('')
  }

  const handleDeleteCharger = (id) => {
    if (!window.confirm('ยืนยันการลบตู้ชาร์จนี้?')) return
    api.delete(`/api/chargers/${id}`)
      .then(() => {
        setChargers((prev) => prev.filter((c) => c.charger_id !== id))
        fetchStations()
      })
      .catch((err) => setChargerError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
  }

  const handleChargerSubmit = (e) => {
    e.preventDefault()
    if (!chargerForm.charger_name || !chargerForm.connector_type || !chargerForm.power_kw || !chargerForm.price_per_kwh) {
      setChargerError('กรุณากรอกข้อมูลให้ครบ')
      return
    }
    setChargerSaving(true)
    const payload = {
      ...chargerForm,
      station_id: chargerStation.station_id,
      power_kw: Number(chargerForm.power_kw),
      price_per_kwh: Number(chargerForm.price_per_kwh),
    }
    const req = editingCharger
      ? api.put(`/api/chargers/${editingCharger}`, payload)
      : api.post('/api/chargers', payload)
    req
      .then(() => {
        setEditingCharger(null)
        setChargerForm(EMPTY_CHARGER_FORM)
        setChargerError('')
        return api.get(`/api/stations/${chargerStation.station_id}`)
      })
      .then((res) => {
        setChargers(res.data.chargers ?? [])
        fetchStations()
      })
      .catch((err) => setChargerError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setChargerSaving(false))
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
                    <button onClick={() => openChargerModal(s)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="จัดการตู้ชาร์จ"><FaBolt size={14} /></button>
                    <button onClick={() => openEdit(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="แก้ไขสถานี"><FaEdit size={14} /></button>
                    <button
                      onClick={() => handleDelete(s.station_id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      title="ลบสถานี"
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

      {/* Charger Management Modal */}
      {chargerStation && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-bold text-gray-900">ตู้ชาร์จ — {chargerStation.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{chargers.length} ตู้</p>
              </div>
              <button onClick={closeChargerModal} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {chargerError && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{chargerError}</p>}

              {/* Charger list */}
              {chargerLoading
                ? <p className="text-sm text-gray-400 text-center py-4">กำลังโหลด...</p>
                : chargers.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีตู้ชาร์จ</p>
                  : (
                    <div className="space-y-2">
                      {chargers.map((c) => (
                        <div key={c.charger_id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FaBolt size={13} className="text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{c.charger_name}</p>
                              <p className="text-xs text-gray-400">{c.connector_type} · {c.power_kw} kW · {c.price_per_kwh} ฿/kWh</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StatusBadge status={c.status} />
                            <button onClick={() => startEditCharger(c)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg"><FaEdit size={13} /></button>
                            <button onClick={() => handleDeleteCharger(c.charger_id)} className="p-1.5 text-red-400 hover:bg-red-100 rounded-lg"><FaTrash size={13} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
              }

              {/* Add/Edit charger form */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">{editingCharger ? 'แก้ไขตู้ชาร์จ' : 'เพิ่มตู้ชาร์จใหม่'}</p>
                <form onSubmit={handleChargerSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อตู้ *</label>
                      <input
                        value={chargerForm.charger_name}
                        onChange={(e) => setChargerForm({ ...chargerForm, charger_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="เช่น Charger A1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Connector *</label>
                      <input
                        value={chargerForm.connector_type}
                        onChange={(e) => setChargerForm({ ...chargerForm, connector_type: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="เช่น Type2, CHAdeMO"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">กำลัง (kW) *</label>
                      <input
                        type="number"
                        step="any"
                        value={chargerForm.power_kw}
                        onChange={(e) => setChargerForm({ ...chargerForm, power_kw: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="22"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">ราคา/kWh *</label>
                      <input
                        type="number"
                        step="any"
                        value={chargerForm.price_per_kwh}
                        onChange={(e) => setChargerForm({ ...chargerForm, price_per_kwh: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="7.50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">สถานะ</label>
                    <select
                      value={chargerForm.status}
                      onChange={(e) => setChargerForm({ ...chargerForm, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="available">available</option>
                      <option value="in_use">in_use</option>
                      <option value="out_of_service">out_of_service</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    {editingCharger && (
                      <button
                        type="button"
                        onClick={() => { setEditingCharger(null); setChargerForm(EMPTY_CHARGER_FORM); setChargerError('') }}
                        className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                      >
                        ยกเลิก
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={chargerSaving}
                      className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {chargerSaving ? 'กำลังบันทึก...' : editingCharger ? 'บันทึก' : <><FaPlus size={12} /> เพิ่มตู้</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Station Modal */}
      {!chargerStation && showModal && (
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
