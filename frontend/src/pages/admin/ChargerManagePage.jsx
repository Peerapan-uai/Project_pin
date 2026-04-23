import { useState, useEffect } from 'react'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../context/ToastContext'
import Select from '../../components/ui/Select'
import { FaPlus, FaEdit, FaTrash, FaBolt, FaTimes } from 'react-icons/fa'

const EMPTY_FORM = { charger_name: '', station_id: '', connector_type: '', power_kw: '', price_per_kwh: '', status: 'available' }
const CONNECTOR_TYPES = [
  { value: 'CCS',     label: 'CCS (DC)' },
  { value: 'CHAdeMO', label: 'CHAdeMO (DC)' },
  { value: 'Type2',   label: 'Type 2 (AC)' },
  { value: 'Type1',   label: 'Type 1 (AC)' },
]
const STATUSES = [
  { value: 'available',      label: 'ว่าง' },
  { value: 'out_of_service', label: 'ปิดซ่อม' },
]

export default function ChargerManagePage() {
  const toast = useToast()
  const [chargers, setChargers]           = useState([])
  const [stations, setStations]           = useState([])
  const [filterStation, setFilterStation] = useState('all')
  const [loading, setLoading]             = useState(true)
  const [editCharger, setEditCharger]     = useState(null)
  const [showAdd, setShowAdd]             = useState(false)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [saving, setSaving]               = useState(false)
  const [formError, setFormError]         = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

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

  const handleDelete = () => {
    if (!confirmDeleteId) return
    api.delete(`/api/chargers/${confirmDeleteId}`)
      .then(() => { setConfirmDeleteId(null); fetchAll(); toast.success('ลบตู้ชาร์จสำเร็จ') })
      .catch((err) => { setConfirmDeleteId(null); toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด') })
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
      .then(() => { setEditCharger(null); fetchAll(); toast.success('แก้ไขตู้ชาร์จสำเร็จ') })
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
      .then(() => { setShowAdd(false); fetchAll(); toast.success('เพิ่มตู้ชาร์จสำเร็จ') })
      .catch((err) => setFormError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setSaving(false))
  }

  const PER_PAGE = 20
  const [page, setPage] = useState(1)

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  // derive station options จาก chargers ที่มีอยู่ (ป้องกันกรณี stations API ว่าง)
  const stationOptions = stations.length > 0
    ? stations
    : [...new Map(chargers.map((c) => [c.station_id, c.station_name])).entries()]
        .map(([id, name]) => ({ station_id: id, name }))

  const filtered = filterStation === 'all'
    ? chargers
    : chargers.filter((c) => c.station_id === Number(filterStation))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

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
        <Select
          value={form.station_id}
          onChange={(v) => setForm({ ...form, station_id: v })}
          placeholder="-- เลือกสถานี --"
          options={stationOptions.map((s) => ({ value: s.station_id, label: s.name }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">ประเภทหัวชาร์จ *</label>
          <Select
            value={form.connector_type}
            onChange={(v) => setForm({ ...form, connector_type: v })}
            placeholder="-- เลือก --"
            options={CONNECTOR_TYPES}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">สถานะ</label>
          <Select
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={STATUSES}
          />
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
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">จัดการตู้ชาร์จ</h1>
          <p className="text-gray-500 text-sm mt-0.5">ตู้ชาร์จทั้งหมด {chargers.length} ตู้</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={filterStation}
            onChange={(v) => { setFilterStation(v); setPage(1) }}
            options={[{ value: 'all', label: 'ทุกสถานี' }, ...stationOptions.map((s) => ({ value: s.station_id, label: s.name }))]}
          />
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors shadow-sm shadow-green-200">
            <FaPlus size={12} /> เพิ่มตู้ชาร์จ
          </button>
        </div>
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
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">สถานะ</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.map((c) => {
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
                  <td className="px-5 py-4 text-center"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="แก้ไข">
                        <FaEdit size={14} />
                      </button>
                      <button onClick={() => setConfirmDeleteId(c.charger_id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="ลบ">
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 px-5 py-3 border-t border-gray-100">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">‹</button>
            <span className="px-2 text-sm text-gray-500">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">›</button>
          </div>
        )}
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

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
              <FaTrash size={18} className="text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-900 text-lg">ยืนยันการลบ</h3>
              <p className="text-gray-500 text-sm mt-1">คุณต้องการลบตู้ชาร์จนี้จริงๆ ใช่ไหม? สามารถกู้คืนได้ที่ Recycle ภายใน 30 วัน</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium">
                ยกเลิก
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
                ลบตู้ชาร์จ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}