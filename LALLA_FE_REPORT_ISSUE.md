# FE — ReportIssuePage.jsx

> ไฟล์: `frontend/src/pages/user/ReportIssuePage.jsx`
> ไฟล์นี้มีอยู่แล้ว 148 บรรทัด — แก้ไขของเดิม ไม่ต้องสร้างใหม่

---

## สิ่งที่ต้องแก้ (4 จุด)

---

### จุดที่ 1 — เพิ่ม state สำหรับ issue_type, image, และ custom title

```js
// เดิม
const [title, setTitle] = useState('')
const [priority, setPriority] = useState('medium')  // ลบออก

// เพิ่ม/แทนที่
const [issueType, setIssueType] = useState('')
const [customTitle, setCustomTitle] = useState('')   // สำหรับ "อื่นๆ"
const [image, setImage] = useState(null)
const [imagePreview, setImagePreview] = useState(null)
```

---

### จุดที่ 2 — เปลี่ยน dropdown "หัวข้อปัญหา" (บรรทัด 112-125)

**เดิม:** dropdown ค่าเป็นภาษาไทย ส่ง title ตรงๆ  
**ใหม่:** dropdown ค่าเป็น ENUM ส่ง issue_type ไป BE

```jsx
// ISSUE TYPE OPTIONS (ใส่ไว้บน component หรือข้างนอก)
const ISSUE_OPTIONS = [
  { value: 'safety',          label: '🔴 อันตราย (ควัน/ไฟ/กลิ่นไหม้)' },
  { value: 'no_charge',       label: 'ชาร์จไม่ได้ / หยุดกลางคัน' },
  { value: 'payment',         label: 'ปัญหาการชำระเงิน' },
  { value: 'physical_damage', label: 'อุปกรณ์ชำรุด/เสียหาย' },
  { value: 'display',         label: 'หน้าจอ/ระบบไม่ตอบสนอง' },
  { value: 'other',           label: 'อื่นๆ' },
]

// แทนที่ select เดิม
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-1.5">ประเภทปัญหา</label>
  <select
    value={issueType}
    onChange={(e) => { setIssueType(e.target.value); setCustomTitle('') }}
    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
  >
    <option value="">-- เลือกประเภทปัญหา --</option>
    {ISSUE_OPTIONS.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
</div>

{/* ถ้าเลือก "อื่นๆ" → แสดง text input */}
{issueType === 'other' && (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      ระบุหัวข้อปัญหา <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      value={customTitle}
      onChange={(e) => setCustomTitle(e.target.value)}
      placeholder="เช่น หัวชาร์จถอดไม่ออก"
      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    />
  </div>
)}
```

---

### จุดที่ 3 — เพิ่ม mandatory image upload (ใหม่ทั้งหมด)

```jsx
{/* เพิ่มหลัง textarea description */}
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
    รูปภาพหลักฐาน <span className="text-red-500">* (บังคับ)</span>
  </label>
  <p className="text-xs text-gray-400 mb-2">ถ่ายให้เห็นจุดที่มีปัญหาชัดเจน</p>
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files[0] || null
      setImage(file)
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => setImagePreview(reader.result)
        reader.readAsDataURL(file)
      } else {
        setImagePreview(null)
      }
    }}
    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-medium file:cursor-pointer"
  />
  {imagePreview && (
    <div className="mt-3 relative w-fit">
      <img src={imagePreview} alt="preview" className="max-h-48 rounded-xl border border-gray-200 object-cover" />
      <button
        onClick={() => { setImage(null); setImagePreview(null) }}
        className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
      >✕</button>
    </div>
  )}
</div>
```

---

### จุดที่ 4 — แก้ handleSubmit (บรรทัด 52-64)

```js
// title ที่ส่งไป = label ของ option ที่เลือก หรือ customTitle ถ้าเป็น other
const finalTitle = issueType === 'other'
  ? customTitle
  : ISSUE_OPTIONS.find(o => o.value === issueType)?.label || ''

const handleSubmit = async () => {
  if (!chargerId || !issueType || !description || !image) return
  if (issueType === 'other' && !customTitle) return
  setSubmitting(true)
  setError(null)
  try {
    // Step 1: สร้าง ticket (JSON)
    const res = await api.post('/api/tickets', {
      charger_id: Number(chargerId),
      issue_type: issueType,
      title: finalTitle,
      description,
    })
    const ticketId = res.data.ticket_id

    // Step 2: upload รูป (multipart)
    const formData = new FormData()
    formData.append('image', image)
    await api.post(`/api/tickets/${ticketId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    setSubmitted(true)
  } catch {
    setError('ส่งรายงานไม่สำเร็จ กรุณาลองใหม่')
  } finally {
    setSubmitting(false)
  }
}
```

**⚠️ Gotcha — 2 API calls:**  
สร้าง ticket ก่อน → ได้ `ticket_id` → ค่อย upload รูป  
เพราะ image endpoint ต้องการ ticket_id ใน URL

---

### แก้ปุ่ม Submit (บรรทัด 137-143)

```jsx
// เดิม
disabled={!chargerId || !title || !description || submitting}

// แก้เป็น
disabled={
  !chargerId || !issueType || !description || !image || submitting ||
  (issueType === 'other' && !customTitle)
}
```

---

## สรุปการเปลี่ยนแปลง

| เดิม | ใหม่ |
|------|------|
| dropdown title = Thai string | dropdown issue_type = ENUM |
| ไม่มีรูป | mandatory image (บังคับ) |
| priority field | ลบออก (auto-calculate ที่ BE) |
| `api.post` ครั้งเดียว | POST ticket → POST image (2 calls) |
| "อื่นๆ" ไม่มี free-text | "อื่นๆ" → text input สำหรับ title |