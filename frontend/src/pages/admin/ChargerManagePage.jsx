import { useState, useEffect } from 'react'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import { FaPlus, FaEdit, FaTrash, FaBolt, FaTimes } from 'react-icons/fa'

const EMPTY_FORM = { station_id: '', charger_name: '', connector_type: 'CCS', power_kw: '', price_per_kwh: '', status: 'available', qr_code: '' }

export default function ChargerManagePage() {
  const [chargers, setChargers]           = useState([])
  const [stations, setStations]           = useState([])
  const [filterStation, setFilterStation] = useState('all')
  const [loading, setLoading]             = useState(true)
  const [showModal, setShowModal]         = useState(false)
  const [editingId, setEditingId]         = useState(null)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')

  const fetchAll = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/stations'),
      api.get('/api/chargers'),
    ])
      .then(([stationsRes, chargersRes]) => {
        setStations(Array.isArray(stationsRes.data) ? stationsRes.data : [])
        setChargers(Array.isArray(chargersRes.data) ? chargersRes.data : [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setError(''); setShowModal(true) }
  const openEdit = (c) => {
    setEditingId(c.charger_id)
    setForm({ station_id: c.station_id, charger_name: c.charger_name, connector_type: c.connector_type, power_kw: c.power_kw, price_per_kwh: c.price_per_kwh ?? '', status: c.status, qr_code: c.qr_code ?? '' })
    setError('')
    setShowModal(true)
  }
  const closeModal = () => setShowModal(false)

  const handleDelete = (id) => {
    if (!window.confirm('ยืนยันการลบตู้ชาร์จนี้?')) return
    api.delete(`/api/chargers/${id}`)
      .then(() => fetchAll())
      .catch((err) => console.error(err))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.station_id || !form.charger_name || !form.connector_type || !form.power_kw || !form.status || !form.qr_code) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบ')
      return
    }
    setSaving(true)
    const payload = { ...form, station_id: Number(form.station_id), power_kw: Number(form.power_kw), price_per_kwh: form.price_per_kwh ? Number(form.price_per_kwh) : null }
    const req = editingId
      ? api.put(`/api/chargers/${editingId}`, payload)
      : api.post('/api/chargers', payload)
    req
      .then(() => { closeModal(); fetchAll() })
      .catch((err) => setError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setSaving(false))
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
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors shadow-md shadow-green-200"
        >
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
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">สถานะ</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={c.charger_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FaBolt size={13} className="text-primary" />
                    </div>
                    <p className="font-medium text-gray-900">{c.charger_name}</p>
                  </div>
                </td>
                <td className="px-5 py-4 hidden md:table-cell text-gray-500 text-xs">{c.station_name}</td>
                <td className="px-5 py-4 text-center text-gray-600">{c.connector_type}</td>
                <td className="px-5 py-4 text-center font-medium text-gray-800">{c.power_kw} kW</td>
                <td className="px-5 py-4 text-center text-gray-600">{c.price_per_kwh ? `${c.price_per_kwh} ฿` : '-'}</td>
                <td className="px-5 py-4 text-center"><StatusBadge status={c.status} /></td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><FaEdit size={14} /></button>
                    <button onClick={() => handleDelete(c.charger_id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><FaTrash size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">ไม่พบตู้ชาร์จ</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editingId ? 'แก้ไขตู้ชาร์จ' : 'เพิ่มตู้ชาร์จ'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">สถานี *</label>
                <select
                  value={form.station_id}
                  onChange={(e) => setForm({ ...form, station_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">เลือกสถานี</option>
                  {stations.map((s) => <option key={s.station_id} value={s.station_id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อตู้ชาร์จ *</label>
                <input
                  value={form.charger_name}
                  onChange={(e) => setForm({ ...form, charger_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="เช่น Charger A1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">ประเภทหัวชาร์จ *</label>
                  <select
                    value={form.connector_type}
                    onChange={(e) => setForm({ ...form, connector_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {['CCS', 'CHAdeMO', 'Type2', 'Type1'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">กำลัง (kW) *</label>
                  <input
                    type="number"
                    value={form.power_kw}
                    onChange={(e) => setForm({ ...form, power_kw: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">ราคา/kWh (฿)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price_per_kwh}
                    onChange={(e) => setForm({ ...form, price_per_kwh: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="5.00"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">สถานะ *</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {['available', 'reserved', 'charging', 'out_of_service'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">QR Code *</label>
                <input
                  value={form.qr_code}
                  onChange={(e) => setForm({ ...form, qr_code: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="QR-001"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50">
                  {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึก' : 'เพิ่มตู้ชาร์จ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
