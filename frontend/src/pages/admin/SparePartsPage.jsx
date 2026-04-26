import { useState, useEffect } from 'react'
import api from '../../utils/api'

const CATEGORIES = ['electrical', 'mechanical', 'display', 'cable', 'connector', 'other']

export default function SparePartsPage() {
  const [parts, setParts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm] = useState({
    name: '', category: 'electrical', unit: 'ชิ้น',
    stock_qty: 0, min_stock: 5, cost_per_unit: 0,
  })

  const loadParts = () => {
    setLoading(true)
    api.get('/api/spare-parts')
      .then(r => setParts(r.data.parts))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadParts() }, [])

  const handleAdd = async () => {
    if (!form.name) return
    try {
      await api.post('/api/spare-parts', form)
      setShowAdd(false)
      setForm({ name: '', category: 'electrical', unit: 'ชิ้น', stock_qty: 0, min_stock: 5, cost_per_unit: 0 })
      loadParts()
    } catch (err) {
      alert(err.response?.data?.message || 'เพิ่มไม่สำเร็จ')
    }
  }

  const handleUpdateStock = async (partId, partName, currentQty) => {
    const input = prompt(`ปรับสต็อก "${partName}" (ปัจจุบัน: ${currentQty})`)
    if (input === null) return
    const newQty = Number(input)
    if (isNaN(newQty) || newQty < 0) { alert('กรุณาใส่ตัวเลข >= 0'); return }
    try {
      await api.put(`/api/spare-parts/${partId}/stock`, { stock_qty: newQty })
      loadParts()
    } catch (err) {
      alert(err.response?.data?.message || 'ปรับสต็อกไม่สำเร็จ')
    }
  }

  const lowStockCount = parts.filter(p => p.stock_qty <= p.min_stock).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">คลังอะไหล่</h1>
          <p className="text-gray-500 text-sm mt-0.5">{parts.length} รายการ</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
        >
          + เพิ่มอะไหล่
        </button>
      </div>

      {/* Low stock warning */}
      {lowStockCount > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          ⚠️ มี {lowStockCount} รายการใกล้หมดสต็อก
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">กำลังโหลด...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่ออะไหล่</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ประเภท</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">คงเหลือ</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">ขั้นต่ำ</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">ราคา/หน่วย</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {parts.map(p => (
                <tr key={p.part_id} className={`border-b border-gray-50 last:border-0 ${p.stock_qty <= p.min_stock ? 'bg-yellow-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{p.category}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${p.stock_qty <= p.min_stock ? 'text-red-600' : 'text-gray-800'}`}>
                      {p.stock_qty} {p.unit}
                    </span>
                    {p.stock_qty <= p.min_stock && <span className="ml-1 text-xs">⚠️</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{p.min_stock}</td>
                  <td className="px-4 py-3 text-right text-gray-700">฿{Number(p.cost_per_unit).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleUpdateStock(p.part_id, p.name, p.stock_qty)}
                      className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ปรับสต็อก
                    </button>
                  </td>
                </tr>
              ))}
              {parts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">ยังไม่มีอะไหล่ในคลัง</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">เพิ่มอะไหล่ใหม่</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ชื่ออะไหล่ *</label>
              <input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="เช่น สายชาร์จ Type 2"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ประเภท</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">หน่วย</label>
                <input
                  value={form.unit}
                  onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">จำนวนเริ่มต้น</label>
                <input
                  type="number" min={0} value={form.stock_qty}
                  onChange={(e) => setForm(f => ({ ...f, stock_qty: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ขั้นต่ำ</label>
                <input
                  type="number" min={0} value={form.min_stock}
                  onChange={(e) => setForm(f => ({ ...f, min_stock: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ราคา/หน่วย</label>
                <input
                  type="number" min={0} value={form.cost_per_unit}
                  onChange={(e) => setForm(f => ({ ...f, cost_per_unit: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAdd}
                disabled={!form.name}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
              >
                เพิ่ม
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}