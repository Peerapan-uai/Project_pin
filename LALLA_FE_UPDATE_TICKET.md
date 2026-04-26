# FE — UpdateTicketPage.jsx

> ไฟล์: `frontend/src/pages/tech/UpdateTicketPage.jsx`
> มีอยู่แล้ว 183 บรรทัด — เพิ่มฟีเจอร์ใหม่ 3 อย่าง

---

## สิ่งที่ต้องเพิ่ม

1. **Check-in / Check-out ปุ่ม** — เช็คเวลาทำงาน
2. **Test evidence image** — รูปพิสูจน์ว่าซ่อมเสร็จแล้วใช้ได้จริง
3. **Part request form** — เบิกอะไหล่

---

## จุดที่ 1 — Check-in / Check-out

### เพิ่ม state

```js
const [checkInAt, setCheckInAt] = useState(null)   // จาก ticket data
const [checkOutAt, setCheckOutAt] = useState(null)
const [checkingIn, setCheckingIn] = useState(false)
const [checkingOut, setCheckingOut] = useState(false)
```

### ใน useEffect ที่โหลด ticket ให้เพิ่ม:

```js
if (found) {
  setTicket(found)
  setStatus(found.status || 'in_progress')
  setNotes(found.repair_notes || '')
  setCheckInAt(found.check_in_at || null)    // เพิ่ม
  setCheckOutAt(found.check_out_at || null)  // เพิ่ม
}
```

### ฟังก์ชัน

```js
const handleCheckIn = async () => {
  setCheckingIn(true)
  try {
    await api.patch(`/api/tickets/${id}/checkin`)
    setCheckInAt(new Date().toISOString())
  } catch { alert('เช็คอินไม่สำเร็จ') }
  finally { setCheckingIn(false) }
}

const handleCheckOut = async () => {
  setCheckingOut(true)
  try {
    await api.patch(`/api/tickets/${id}/checkout`)
    setCheckOutAt(new Date().toISOString())
  } catch { alert('เช็คเอาท์ไม่สำเร็จ') }
  finally { setCheckingOut(false) }
}
```

### UI — เพิ่มก่อน section "สถานะงาน"

```jsx
{/* Check-in / Check-out */}
<div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
  <p className="text-sm font-semibold text-blue-800">เวลาทำงาน</p>
  <div className="flex gap-2">
    <button
      onClick={handleCheckIn}
      disabled={!!checkInAt || checkingIn}
      className="flex-1 py-2 text-sm font-medium rounded-xl border border-blue-400 text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-100 transition-colors"
    >
      {checkInAt
        ? `เช็คอิน ${new Date(checkInAt).toLocaleTimeString('th-TH', {hour:'2-digit',minute:'2-digit'})}`
        : checkingIn ? 'กำลัง...' : 'เช็คอิน'}
    </button>
    <button
      onClick={handleCheckOut}
      disabled={!checkInAt || !!checkOutAt || checkingOut}
      className="flex-1 py-2 text-sm font-medium rounded-xl border border-green-400 text-green-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-100 transition-colors"
    >
      {checkOutAt
        ? `เช็คเอาท์ ${new Date(checkOutAt).toLocaleTimeString('th-TH', {hour:'2-digit',minute:'2-digit'})}`
        : checkingOut ? 'กำลัง...' : 'เช็คเอาท์'}
    </button>
  </div>
  {checkInAt && checkOutAt && (
    <p className="text-xs text-green-700">
      ระยะเวลา: {Math.round((new Date(checkOutAt)-new Date(checkInAt))/60000)} นาที
    </p>
  )}
</div>
```

**⚠️ Gotcha:** ปุ่ม checkout disabled ถ้ายังไม่ได้ check-in

---

## จุดที่ 2 — Test Evidence Image (รูปหลังซ่อม)

### เพิ่ม state

```js
const [testImage, setTestImage] = useState(null)
const [testImagePreview, setTestImagePreview] = useState(null)
const [testNotes, setTestNotes] = useState('')
```

### เพิ่มใน handleSave (หลังจาก upload repair image)

```js
// อัปโหลด test evidence ถ้ามี (upload ไปที่ column test_evidence_image)
if (testImage) {
  const formData = new FormData()
  formData.append('image', testImage)
  await api.post(`/api/tickets/${id}/test-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
// บันทึก test_notes
if (testNotes) {
  await api.patch(`/api/tickets/${id}/status`, {
    status,
    repair_notes: notes,
    test_notes: testNotes,  // ส่งพร้อม status update
  })
}
```

**⚠️ หมายเหตุ:** ต้องเพิ่ม endpoint `POST /api/tickets/:id/test-image` ใน BE ด้วย
โดยก็อป endpoint `/api/tickets/:id/image` แล้วเปลี่ยน column เป็น `test_evidence_image`
และเพิ่ม `test_notes` ใน PATCH `/api/tickets/:id/status`

### UI — เพิ่มหลัง section repair image (เมื่อ status = 'completed')

```jsx
{status === 'completed' && (
  <div className="border-t border-gray-100 pt-4 space-y-3">
    <p className="text-sm font-semibold text-gray-700">หลักฐานผลทดสอบ (หลังซ่อม)</p>
    <p className="text-xs text-gray-400">ถ่ายหน้าจอแสดง "Available" หรือ session ชาร์จสำเร็จ</p>
    <input
      type="file" accept="image/*"
      onChange={(e) => {
        const file = e.target.files[0] || null
        setTestImage(file)
        if (file) {
          const reader = new FileReader()
          reader.onloadend = () => setTestImagePreview(reader.result)
          reader.readAsDataURL(file)
        }
      }}
      className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-green-50 file:text-green-700 file:font-medium"
    />
    {testImagePreview && (
      <img src={testImagePreview} alt="test" className="max-h-40 rounded-xl border border-gray-200" />
    )}
    <textarea
      value={testNotes}
      onChange={(e) => setTestNotes(e.target.value)}
      placeholder="ผลการทดสอบ เช่น ทดสอบชาร์จ 5 นาที ได้ 7.4kW ปกติ"
      rows={3}
      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
    />
  </div>
)}
```

---

## จุดที่ 3 — Part Request Form

### เพิ่ม state

```js
const [parts, setParts] = useState([])          // รายการอะไหล่ทั้งหมด
const [partRequests, setPartRequests] = useState([]) // รายการที่เบิกแล้ว
const [selectedPartId, setSelectedPartId] = useState('')
const [qty, setQty] = useState(1)
const [requesting, setRequesting] = useState(false)
```

### โหลดข้อมูลใน useEffect

```js
// โหลด spare parts list
api.get('/api/spare-parts').then(res => setParts(res.data.parts)).catch(() => {})
// โหลด requests ของ ticket นี้
api.get(`/api/spare-parts/requests/${id}`).then(res => setPartRequests(res.data.requests)).catch(() => {})
```

### ฟังก์ชัน

```js
const handleRequestPart = async () => {
  if (!selectedPartId || qty < 1) return
  setRequesting(true)
  try {
    await api.post('/api/spare-parts/request', {
      ticket_id: Number(id),
      part_id: Number(selectedPartId),
      qty_requested: qty,
    })
    // refresh list
    const res = await api.get(`/api/spare-parts/requests/${id}`)
    setPartRequests(res.data.requests)
    setSelectedPartId('')
    setQty(1)
  } catch (err) {
    alert(err.response?.data?.message || 'เบิกไม่สำเร็จ')
  } finally {
    setRequesting(false)
  }
}
```

### UI — เพิ่มหลัง check-in/out section

```jsx
<div className="space-y-3">
  <p className="text-sm font-semibold text-gray-700">เบิกอะไหล่</p>
  <div className="flex gap-2">
    <select
      value={selectedPartId}
      onChange={(e) => setSelectedPartId(e.target.value)}
      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="">-- เลือกอะไหล่ --</option>
      {parts.map(p => (
        <option key={p.part_id} value={p.part_id}>
          {p.name} (คงเหลือ {p.stock_qty} {p.unit})
        </option>
      ))}
    </select>
    <input
      type="number" min={1} value={qty}
      onChange={(e) => setQty(Number(e.target.value))}
      className="w-16 border border-gray-300 rounded-xl px-2 py-2 text-sm text-center"
    />
    <button
      onClick={handleRequestPart}
      disabled={!selectedPartId || requesting}
      className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50"
    >
      ขอเบิก
    </button>
  </div>

  {/* รายการที่เบิกแล้ว */}
  {partRequests.length > 0 && (
    <div className="space-y-1.5">
      {partRequests.map(r => (
        <div key={r.request_id} className="flex items-center justify-between text-xs bg-gray-50 rounded-xl px-3 py-2">
          <span className="text-gray-700">{r.part_name} ×{r.qty_requested} {r.unit}</span>
          <span className={`font-semibold ${
            r.status === 'approved' ? 'text-green-600' :
            r.status === 'rejected' ? 'text-red-500' : 'text-yellow-600'
          }`}>
            {r.status === 'approved' ? 'อนุมัติแล้ว' :
             r.status === 'rejected' ? 'ปฏิเสธ' : 'รอ admin'}
          </span>
        </div>
      ))}
    </div>
  )}
</div>
```

---

## สรุป BE endpoints ที่ UpdateTicketPage ต้องการ

| API | มีแล้ว? |
|-----|---------|
| `PATCH /api/tickets/:id/checkin` | ✅ tickets.js |
| `PATCH /api/tickets/:id/checkout` | ✅ tickets.js |
| `PATCH /api/tickets/:id/status` (+ test_notes) | ✅ แต่ต้องเพิ่ม test_notes ใน UPDATE |
| `POST /api/tickets/:id/image` (repair_image) | ✅ tickets.js |
| `POST /api/tickets/:id/test-image` (test_evidence_image) | ❌ ต้องเพิ่มใน tickets.js |
| `GET /api/spare-parts` | ❌ ต้องทำ spareParts.js ก่อน |
| `POST /api/spare-parts/request` | ❌ ต้องทำ spareParts.js ก่อน |
| `GET /api/spare-parts/requests/:ticketId` | ❌ ต้องทำ spareParts.js ก่อน |