import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { FaCar, FaPlus, FaTrash } from 'react-icons/fa'
import api from '../../utils/api'

export default function VehicleManagePage() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ brand: '', model: '', license_plate: '', connector_type: 'CCS', battery_capacity_kwh: '' })
  const [submitting, setSubmitting] = useState(false)

  const connectorTypes = ['CCS', 'CHAdeMO', 'Type2', 'Type1']

  useEffect(() => {
    api.get('/api/vehicles')
      .then(res => setVehicles(res.data))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = () => {
    if (!form.brand || !form.model || !form.license_plate) return
    setSubmitting(true)
    api.post('/api/vehicles', {
      ...form,
      battery_capacity_kwh: form.battery_capacity_kwh ? Number(form.battery_capacity_kwh) : undefined
    })
      .then(res => {
        setVehicles((prev) => [...prev, res.data])
        setForm({ brand: '', model: '', license_plate: '', connector_type: 'CCS', battery_capacity_kwh: '' })
        setShowForm(false)
      })
      .catch(() => setError('เพิ่มยานพาหนะไม่สำเร็จ'))
      .finally(() => setSubmitting(false))
  }

  const handleDelete = (vehicleId) => {
    api.delete(`/api/vehicles/${vehicleId}`)
      .then(() => setVehicles((prev) => prev.filter((x) => x.vehicle_id !== vehicleId)))
      .catch(() => setError('ลบยานพาหนะไม่สำเร็จ'))
  }

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="ยานพาหนะของฉัน" showBack onBack={() => navigate(-1)} />
      <div className="px-4 pt-4 space-y-3">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-primary/40 rounded-xl text-primary font-medium text-sm hover:bg-primary/5 transition-colors"
        >
          <FaPlus size={13} /> เพิ่มยานพาหนะ
        </button>

        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-800">เพิ่มยานพาหนะใหม่</h3>
            {['brand', 'model', 'license_plate'].map((f) => (
              <input key={f} type="text" placeholder={f === 'brand' ? 'ยี่ห้อ' : f === 'model' ? 'รุ่น' : 'ทะเบียนรถ'}
                value={form[f]} onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ))}
            <select value={form.connector_type} onChange={(e) => setForm((p) => ({ ...p, connector_type: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {connectorTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input type="number" placeholder="ความจุแบตเตอรี่ (kWh)" value={form.battery_capacity_kwh}
              onChange={(e) => setForm((p) => ({ ...p, battery_capacity_kwh: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleAdd} disabled={submitting} className="flex-1 py-2.5 bg-primary disabled:opacity-50 text-white rounded-xl text-sm font-semibold hover:bg-green-600">
                {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        )}

        {vehicles.map((v) => (
          <div key={v.vehicle_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaCar size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{v.brand} {v.model}</p>
              <p className="text-xs text-gray-500">{v.license_plate} · {v.connector_type}</p>
              {v.battery_capacity_kwh && <p className="text-xs text-gray-400">{v.battery_capacity_kwh} kWh</p>}
            </div>
            <button onClick={() => handleDelete(v.vehicle_id)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <FaTrash size={14} />
            </button>
          </div>
        ))}

        {vehicles.length === 0 && !showForm && !error && (
          <div className="text-center py-12 text-gray-400">
            <FaCar size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ยังไม่มียานพาหนะ</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
