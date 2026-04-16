import { useState, useEffect } from 'react'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import { FaPlus, FaEdit, FaTrash, FaBolt, FaTimes } from 'react-icons/fa'

const EMPTY_FORM = { charger_name: '', station_id: '', connector_type: '', power_kw: '', price_per_kwh: '', status: 'available' }
const CONNECTOR_TYPES = [
  { value: 'CCS',     label: 'CCS (DC)' },
  { value: 'CHAdeMO', label: 'CHAdeMO (DC)' },
  { value: 'Type2',   label: 'Type 2 (AC)' },
  { value: 'Type1',   label: 'Type 1 (AC)' },
]
const STATUSES = [
  { value: 'available',     label: 'ว่าง' },
  { value: 'reserved',      label: 'จองแล้ว' },
  { value: 'charging',      label: 'กำลังชาร์จ' },
  { value: 'out_of_service', label: 'ปิดซ่อม' },
]

export default function ChargerManagePage() {
  const [chargers, setChargers]           = useState([])
  const [stations, setStations]           = useState([])
  const [filterStation, setFilterStation] = useState('all')
  const [loading, setLoading]             = useState(true)
  const [editCharger, setEditCharger]     = useState(null)
  const [showAdd, setShowAdd]             = useState(false)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [saving, setSaving]               = useState(false)
  const [formError, setFormError]         = useState('')

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
      .catch((err) => alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
  }

  const openEdit = (c) => {
    setForm({
      charger_name: c.charger_name,
      station_id: c.station_id,
      connector_type: c.connector_type,
      power_kw: c.power_kw,
      price_per_kwh: c.price_per_kwh,
      status: c.status,
    })
    setFormError('')
    setEditCharger(c)
  }

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setFormError('')
    setShowAdd(true)
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!form.charger_name || !form.station_id || !form.connector_type || !form.power_kw || !form.price_per_kwh) {
      setFormError('กรุณากรอกข้อมูลให้ครบ')
      return
    }
    setSaving(true)
    api.put(`/api/chargers/${editCharger.charger_id}`, form)
      .then(() => { setEditCharger(null); fetchAll() })
      .catch((err) => setFormError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setSaving(false))
  }

  const handleAddSubmit = (e) => {
    e.preventDefault()
    if (!form.charger_name || !form.station_id || !form.connector_type || !form.power_kw || !form.price_per_kwh) {
      setFormError('กรุณากรอกข้อมูลให้ครบ')
      return
    }
    setSaving(true)
    api.post('/api/chargers', form)
      .then(() => { setShowAdd(false); fetchAll() })
      .catch((err) => setFormError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setSaving(false))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  // derive station options จาก chargers ที่มีอยู่ (ป้องกันกรณี stations API ว่าง)
  const stationOptions = stations.length > 0
    ? stations
    : [...new Map(chargers.map((c) => [c.station_id, c.station_name])).entries()]
        .map(([id, name]) => ({ station_id: id, name }))

  const filtered = filterStation === 'all'
    ? chargers
    : chargers.filter((c) => c.station_id === Number(filterStation))

  const ChargerForm = ({ onSubmit, title }) => (
    <form onSubmit={onSubmit} className="p-6 space-y-4">
      {formError && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{formError}</p>}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อตู้ชาร์จ *</label>
        <input value={form.charger_name} onChange={(e) => setForm({ ...form, charger_name: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="เช่น SIAM-DC01" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">สถานี *</label>
        <select value={form.station_id} onChange={(e) => setForm({ ...form, station_id: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
          <option value="">-- เลือกสถานี --</option>
          {stationOptions.map((s) => <option key={s.station_id} value={s.station_id}>{s.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">ประเภทหัวชาร์จ *</label>
          <select value={form.connector_type} onChange={(e) => setForm({ ...form, connector_type: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
            <option value="">-- เลือก --</option>
            {CONNECTOR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">สถานะ</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">กำลัง (kW) *</label>
          <input type="number" value={form.power_kw} onChange={(e) => setForm({ ...form, power_kw: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="เช่น 50" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">ราคา/kWh (฿) *</label>
          <input type="number" step="0.01" value={form.price_per_kwh} onChange={(e) => setForm({ ...form, price_per_kwh: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="เช่น 5.50" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => { setEditCharger(null); setShowAdd(false) }}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
          ยกเลิก
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50">
          {saving ? 'กำลังบันทึก...' : title}
        </button>
      </div>
    </form>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการตู้ชาร์จ</h1>
          <p className="text-gray-500 text-sm mt-0.5">ตู้ชาร์จทั้งหมด {chargers.length} ตู้</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors shadow-md shadow-green-200">
          <FaPlus size={13} /> เพิ่มตู้ชาร์จ
        </button>
      </div>

      <div className="mb-4">
        <select value={filterStation} onChange={(e) => setFilterStation(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="all">ทุกสถานี</option>
          {stationOptions.map((s) => <option key={s.station_id} value={s.station_id}>{s.name}</option>)}
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
              const station = stationOptions.find((s) => s.station_id === c.station_id)
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
                  <td className="px-5 py-4 text-center text-gray-600">
                    {c.temperature_celsius == null ? '-'
                      : c.temperature_celsius >= 60
                      ? <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">{c.temperature_celsius}°C ร้อนเกิน</span>
                      : <span className="text-gray-600 text-sm">{c.temperature_celsius}°C</span>}
                  </td>
                  <td className="px-5 py-4 text-center"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="แก้ไข">
                        <FaEdit size={14} />
                      </button>
                      <button onClick={() => handleDelete(c.charger_id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="ลบ">
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

      {/* Edit Modal */}
      {editCharger && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">แก้ไขตู้ชาร์จ</h2>
              <button onClick={() => setEditCharger(null)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <ChargerForm onSubmit={handleEditSubmit} title="บันทึก" />
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">เพิ่มตู้ชาร์จ</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <ChargerForm onSubmit={handleAddSubmit} title="เพิ่มตู้ชาร์จ" />
          </div>
        </div>
      )}
    </div>
  )
}