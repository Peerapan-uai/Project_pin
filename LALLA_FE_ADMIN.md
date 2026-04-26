# FE — Admin Pages (Ticket + Spare Parts)

> สองไฟล์ในนี้:
> 1. `frontend/src/pages/admin/TicketManagePage.jsx` — แก้ของเดิม (315 บรรทัด)
> 2. `frontend/src/pages/admin/SparePartsPage.jsx` — ไฟล์ใหม่

---

## ไฟล์ 1: TicketManagePage.jsx — สิ่งที่ต้องเพิ่ม

---

### เพิ่ม 1 — Priority Badge แสดง issue_type

ใน ticket card/row ที่มีอยู่แล้ว เพิ่ม badge แสดง issue_type:

```jsx
// helper ข้างนอก component
const ISSUE_LABEL = {
  safety:          { label: 'อันตราย', color: 'bg-red-100 text-red-700' },
  no_charge:       { label: 'ชาร์จไม่ได้', color: 'bg-orange-100 text-orange-700' },
  payment:         { label: 'ชำระเงิน', color: 'bg-orange-100 text-orange-700' },
  physical_damage: { label: 'เสียหาย', color: 'bg-yellow-100 text-yellow-700' },
  display:         { label: 'หน้าจอ', color: 'bg-blue-100 text-blue-700' },
  other:           { label: 'อื่นๆ', color: 'bg-gray-100 text-gray-600' },
}

// ใน JSX ของแต่ละ ticket row
{ticket.issue_type && (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ISSUE_LABEL[ticket.issue_type]?.color}`}>
    {ISSUE_LABEL[ticket.issue_type]?.label}
  </span>
)}
```

---

### เพิ่ม 2 — Priority Override Dropdown (admin เปลี่ยน priority)

เพิ่มใน ticket detail modal/panel:

```jsx
// state
const [overridePriority, setOverridePriority] = useState(ticket.priority)
const [overriding, setOverriding] = useState(false)

// ฟังก์ชัน
const handlePriorityOverride = async (ticketId, newPriority, issueType) => {
  if (issueType === 'safety' && newPriority !== 'critical') {
    alert('Safety ticket ไม่สามารถลด priority ได้')
    return
  }
  setOverriding(true)
  try {
    await api.patch(`/api/tickets/${ticketId}/priority`, { priority: newPriority })
    // refresh tickets
  } catch (err) {
    alert(err.response?.data?.message || 'เปลี่ยน priority ไม่สำเร็จ')
  } finally {
    setOverriding(false)
  }
}

// UI
<select
  value={overridePriority}
  onChange={(e) => handlePriorityOverride(ticket.ticket_id, e.target.value, ticket.issue_type)}
  disabled={overriding || ticket.issue_type === 'safety'}
  className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none disabled:opacity-50"
>
  <option value="low">🟢 Low</option>
  <option value="medium">🟡 Medium</option>
  <option value="high">🟠 High</option>
  <option value="critical">🔴 Critical</option>
</select>
{ticket.issue_type === 'safety' && (
  <span className="text-xs text-red-500">🔒 ล็อก</span>
)}
```

---

### เพิ่ม 3 — Part Requests Panel (ดู + อนุมัติ)

เพิ่มใน ticket detail modal (section ใหม่):

```jsx
// state
const [partRequests, setPartRequests] = useState([])

// โหลด part requests เมื่อเปิด ticket detail
const loadPartRequests = async (ticketId) => {
  const res = await api.get(`/api/spare-parts/requests/${ticketId}`)
  setPartRequests(res.data.requests)
}

// ฟังก์ชัน approve/reject
const handleApprove = async (requestId) => {
  await api.patch(`/api/spare-parts/request/${requestId}/approve`)
  loadPartRequests(ticket.ticket_id)
}
const handleReject = async (requestId) => {
  await api.patch(`/api/spare-parts/request/${requestId}/reject`)
  loadPartRequests(ticket.ticket_id)
}

// UI
{partRequests.length > 0 && (
  <div className="mt-4 border-t border-gray-100 pt-4">
    <p className="text-sm font-semibold text-gray-700 mb-2">การขอเบิกอะไหล่</p>
    <div className="space-y-2">
      {partRequests.map(r => (
        <div key={r.request_id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
          <div>
            <p className="text-sm font-medium">{r.part_name} ×{r.qty_requested} {r.unit}</p>
            <p className="text-xs text-gray-400">{new Date(r.requested_at).toLocaleString('th-TH')}</p>
          </div>
          {r.status === 'pending' ? (
            <div className="flex gap-1.5">
              <button onClick={() => handleApprove(r.request_id)}
                className="text-xs px-2.5 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600">
                อนุมัติ
              </button>
              <button onClick={() => handleReject(r.request_id)}
                className="text-xs px-2.5 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                ปฏิเสธ
              </button>
            </div>
          ) : (
            <span className={`text-xs font-semibold ${r.status === 'approved' ? 'text-green-600' : 'text-red-500'}`}>
              {r.status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
)}
```

---

## ไฟล์ 2: SparePartsPage.jsx (ใหม่ทั้งหมด)

> register route ใน AppRouter.jsx:
> `<Route path="/admin/spare-parts" element={<RoleRoute roles={['admin']}><DesktopLayout><SparePartsPage /></DesktopLayout></RoleRoute>} />`

---

### โครงสร้าง component

```jsx
import { useState, useEffect } from 'react'
import api from '../../utils/api'

export default function SparePartsPage() {
  const [parts, setParts] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name:'', category:'electrical', unit:'ชิ้น', stock_qty:0, min_stock:5, cost_per_unit:0 })

  const loadParts = () => api.get('/api/spare-parts').then(r => setParts(r.data.parts))
  useEffect(() => { loadParts() }, [])

  const handleAdd = async () => {
    await api.post('/api/spare-parts', form)
    setShowAdd(false)
    loadParts()
  }

  const handleUpdateStock = async (partId, newQty) => {
    await api.put(`/api/spare-parts/${partId}/stock`, { stock_qty: newQty })
    loadParts()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">คลังอะไหล่</h1>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-green-600">
          + เพิ่มอะไหล่
        </button>
      </div>

      {/* Low stock warning */}
      {parts.some(p => p.stock_qty <= p.min_stock) && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          ⚠️ มีอะไหล่บางรายการใกล้หมดสต็อก
        </div>
      )}

      {/* Table */}
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
              <tr key={p.part_id} className={`border-b border-gray-50 ${p.stock_qty <= p.min_stock ? 'bg-yellow-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.category}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-bold ${p.stock_qty <= p.min_stock ? 'text-red-600' : 'text-gray-800'}`}>
                    {p.stock_qty} {p.unit}
                  </span>
                  {p.stock_qty <= p.min_stock && <span className="ml-1 text-xs text-red-500">⚠️</span>}
                </td>
                <td className="px-4 py-3 text-center text-gray-500">{p.min_stock}</td>
                <td className="px-4 py-3 text-right text-gray-700">฿{p.cost_per_unit}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      const newQty = prompt(`ปรับสต็อก "${p.name}" (ปัจจุบัน: ${p.stock_qty})`)
                      if (newQty !== null && !isNaN(newQty)) handleUpdateStock(p.part_id, Number(newQty))
                    }}
                    className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">
                    ปรับสต็อก
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">เพิ่มอะไหล่ใหม่</h2>
            {/* form fields: name, category select, unit, stock_qty, min_stock, cost_per_unit */}
            {/* ... ใส่ input fields ตาม form state */}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm">ยกเลิก</button>
              <button onClick={handleAdd} className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-semibold">เพิ่ม</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## สรุป API ที่ Admin pages ต้องการ

| API | มีแล้ว? |
|-----|---------|
| `PATCH /api/tickets/:id/priority` | ✅ tickets.js |
| `GET /api/spare-parts` | ❌ spareParts.js |
| `POST /api/spare-parts` | ❌ spareParts.js |
| `PUT /api/spare-parts/:id/stock` | ❌ spareParts.js |
| `GET /api/spare-parts/requests/:ticketId` | ❌ spareParts.js |
| `PATCH /api/spare-parts/request/:id/approve` | ❌ spareParts.js |
| `PATCH /api/spare-parts/request/:id/reject` | ❌ spareParts.js |

**→ ทำ spareParts.js ก่อน แล้วค่อยทำ FE admin**