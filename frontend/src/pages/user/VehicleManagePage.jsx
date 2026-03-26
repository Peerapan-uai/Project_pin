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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

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
      .then(() => {
        return api.get('/api/vehicles')
      })
      .then(res => {
        setVehicles(res.data)
        setForm({ brand: '', model: '', license_plate: '', connector_type: 'CCS', battery_capacity_kwh: '' })
        setShowForm(false)
      })
      .catch(() => setError('เพิ่มยานพาหนะไม่สำเร็จ'))
      .finally(() => setSubmitting(false))
  }

  const handleDelete = () => {
    api.delete(`/api/vehicles/${confirmDeleteId}`)
      .then(() => {
        setVehicles((prev) => prev.filter((x) => x.vehicle_id !== confirmDeleteId))
        setConfirmDeleteId(null)
      })
      .catch(() => {
        setError('ลบยานพาหนะไม่สำเร็จ')
        setConfirmDeleteId(null)
      })
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
              {v.battery_capacity_kwh != null && (
                <div className="mt-1.5">
                  {v.battery_current_kwh != null ? (
                    <>
                      <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                        <span>แบตเตอรี่</span>
                        <span>{v.battery_current_kwh}/{v.battery_capacity_kwh} kWh ({Math.round((v.battery_current_kwh / v.battery_capacity_kwh) * 100)}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, (v.battery_current_kwh / v.battery_capacity_kwh) * 100)}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">ความจุ {v.battery_capacity_kwh} kWh</p>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => setConfirmDeleteId(v.vehicle_id)}
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
      {/* Delete vehicle confirm */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaTrash size={22} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">ลบยานพาหนะ?</h2>
              <p className="text-sm text-gray-500 mt-1">ข้อมูลรถคันนี้จะถูกลบถาวร</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
