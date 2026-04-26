# BE — Station Type (ข้อ 3)

> ในหน้าจัดการสถานีต้องระบุได้ว่าเป็นสถานีทั่วไป หรือสำหรับรถที่มีสัญญากับบริษัท

---

## สถานะปัจจุบัน

`stations.station_type` enum('public','private_fleet','commercial') **มีใน schema แล้ว** ✅  
แต่ PUT /api/stations/:id และ POST /api/stations **ยังไม่รับ station_type** ❌

---

## ไฟล์ที่แก้ — `backend/routes/stations.js`

### การเปลี่ยนแปลงที่ 1 — PUT /api/stations/:id

บรรทัดปัจจุบัน (line ~316):
```js
const { name, address, latitude, longitude, floor, open_time, close_time, image, status } = req.body;
```

แก้เป็น:
```js
const { name, address, latitude, longitude, floor, open_time, close_time, image, status, station_type } = req.body;

const validTypes = ['public', 'private_fleet', 'commercial']
if (station_type && !validTypes.includes(station_type))
  return res.status(400).json({ message: 'station_type ต้องเป็น public, private_fleet หรือ commercial' })
```

Query เปลี่ยนจาก:
```js
`UPDATE stations SET name = ?, address = ?, latitude = ?, longitude = ?,
 floor = ?, open_time = ?, close_time = ?, image = ?, status = ? WHERE station_id = ?`,
[name, address, latitude, longitude, floor || null, open_time || null, close_time || null, image || null, status || 'active', req.params.id]
```

เป็น:
```js
`UPDATE stations SET name = ?, address = ?, latitude = ?, longitude = ?,
 floor = ?, open_time = ?, close_time = ?, image = ?, status = ?, station_type = ? WHERE station_id = ?`,
[name, address, latitude, longitude, floor || null, open_time || null, close_time || null,
 image || null, status || 'active', station_type || 'public', req.params.id]
```

---

### การเปลี่ยนแปลงที่ 2 — POST /api/stations

บรรทัด ~250 (INSERT):

แก้ destructure เพิ่ม `station_type`:
```js
const { name, address, latitude, longitude, floor, open_time, close_time, image, status, station_type } = req.body;
```

Query เปลี่ยน INSERT เพิ่ม field:
```js
`INSERT INTO stations (name, address, latitude, longitude, floor, open_time, close_time, image, status, station_type)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
[name, address, latitude, longitude, floor || null, open_time || null, close_time || null,
 image || null, status || 'active', station_type || 'public']
```

---

## สรุป endpoints

| Method | Path | การเปลี่ยนแปลง |
|--------|------|----------------|
| PUT | `/api/stations/:id` | รับ `station_type` เพิ่ม + validate enum |
| POST | `/api/stations` | รับ `station_type` เพิ่ม, default = 'public' |

---

## Label Map (ใช้ทั้ง FE admin และ user)

| Enum value | ป้ายกำกับ | สี Badge แนะนำ |
|-----------|----------|---------------|
| `public` | สาธารณะ | bg-blue-100 text-blue-700 |
| `private_fleet` | รถสัญญา | bg-purple-100 text-purple-700 |
| `commercial` | เชิงพาณิชย์ | bg-green-100 text-green-700 |

---

## สิ่งที่ต้องทำ FE (บันทึกไว้ ไม่ใช่งานไฟล์นี้)

**StationManagePage:**
- form สร้าง/แก้ไขสถานี: เพิ่ม `<select>` station_type (3 ตัวเลือก)
- ตาราง/card รายการสถานี: เพิ่ม badge ประเภทสถานีตาม label map ด้านบน