# lalla_scope — งานของ lalla (14 endpoints + Database)

## สถานะปัจจุบัน
- Database schema — **เสร็จแล้ว ✅** (import ลง MySQL แล้ว มี sample data พร้อมเทส)
- Backend routes admin/tech — **เสร็จแล้ว ✅** (ทุก endpoint เขียนครบ แก้ bug หมดแล้ว)
- Frontend admin/tech — **เสร็จแล้ว ✅** (AdminLoginPage ใช้งานได้แล้ว, DashboardPage แก้ bug แล้ว)
- เทส Swagger — **เสร็จแล้ว ✅** (เทสครบทุก 15 endpoint ผ่านหมด)

> อัปเดตล่าสุด: 2026-03-26

## ความรับผิดชอบหลัก
ดูแล Database schema ทั้งหมด + API ฝั่ง Admin และ Technician

| กลุ่ม | จำนวน |
|-------|-------|
| Users admin (GET all, ban, สร้างช่าง) | 3 |
| Stations admin (POST/PUT/DELETE) | 3 |
| Chargers admin+tech (POST/PUT/PATCH status) | 3 |
| Tickets admin+tech (GET all, assign, status, image) | 4 |
| Bookings admin (GET all) | 1 |
| **รวม** | **14** |
| Dashboard Stats (ต้องสร้าง route ใหม่) | +1 |

---

## ต้องทำก่อนเพื่อน (สำคัญมาก!)

### Database Schema
เพื่อนต้องสร้าง tables ให้ครบก่อน เพราะฉันรอ tables พวกนี้อยู่

Tables ที่ต้องมี:
- `users` — เก็บ user/admin/technician
- `vehicles` — รถของ user
- `stations` — สถานีชาร์จ
- `chargers` — ตู้ชาร์จในสถานี
- `bookings` — การจอง
- `charging_sessions` — session การชาร์จ
- `payments` — การจ่ายเงิน
- `reviews` — รีวิว
- `maintenance_tickets` — ticket แจ้งปัญหา
- `notifications` — การแจ้งเตือน

**Column สำคัญที่ต้องตกลงกันก่อนเขียน:**
- ชื่อ column ต้องตรงกับที่ฉันใช้ใน query
- role ENUM ต้องเป็น `'user'`, `'admin'`, `'technician'` เท่านั้น
- primary key ใช้ชื่อแบบ `user_id`, `station_id`, `charger_id` ฯลฯ

---

## API ที่ lalla ต้องเขียน (14 endpoints)

### Users — Admin only (3)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 1 | GET | `/api/users` | ดู user ทั้งหมดในระบบ | ✅ |
| 2 | PATCH | `/api/users/:id/ban` | ban/unban user | ✅ |
| 3 | POST | `/api/users/technician` | สร้าง account ช่าง | ✅ |

### Stations — Admin only (3)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 4 | POST | `/api/stations` | เพิ่มสถานีใหม่ | ✅ |
| 5 | PUT | `/api/stations/:id` | แก้ข้อมูลสถานี | ✅ |
| 6 | DELETE | `/api/stations/:id` | ลบสถานี | ✅ |

### Chargers — Admin/Tech (3)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 7 | POST | `/api/chargers` | เพิ่มตู้ชาร์จ | ✅ |
| 8 | PUT | `/api/chargers/:id` | แก้ข้อมูลตู้ชาร์จ | ✅ |
| 9 | PATCH | `/api/chargers/:id/status` | เปลี่ยนสถานะ (available/reserved/charging/out_of_service) | ✅ |

### Tickets — Admin/Tech (4)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 10 | GET | `/api/tickets` | ดู ticket ทั้งหมด (admin เห็นทุกอัน, ช่างเห็นของตัวเอง) | ✅ |
| 11 | PATCH | `/api/tickets/:id/assign` | assign ticket ให้ช่าง | ✅ |
| 12 | PATCH | `/api/tickets/:id/status` | update สถานะ ticket (reported/assigned/in_progress/completed) | ✅ |
| 13 | POST | `/api/tickets/:id/image` | อัพโหลดรูป repair_image | ✅ |

### Bookings — Admin only (1)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 14 | GET | `/api/bookings/all` | ดู booking ทุกคนในระบบ (admin view) | ✅ |

### Dashboard Stats — Admin only
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 15 | GET | `/api/admin/stats` | ดึงสถิติ dashboard (total_users, bookings_today, payments_count, charger_issue) | ✅ |

---

## Frontend ที่เพิ่มใหม่ (2026-03-26)

| ไฟล์ | หน้าที่ | สถานะ |
|------|---------|-------|
| `pages/admin/AdminLoginPage.jsx` | หน้า login PC-style สำหรับ Admin และ Technician | ✅ |
| `routes/AppRouter.jsx` | เพิ่ม route `/admin/login` | ✅ |

- เข้าได้ที่ `http://localhost:3000/admin/login`
- ถ้า login ด้วย role `user` จะขึ้น error "ไม่มีสิทธิ์เข้าใช้งานระบบ Staff"
- admin → `/admin/dashboard`, technician → `/tech/dashboard`
- ใช้ `api.post('/api/auth/login')` และ `useAuth()` hook เดียวกับ nem

### Payments — Admin only (+1 เพิ่มใหม่)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 15 | GET | `/api/payments/all` | ดูประวัติการจ่ายเงินทุกคนในระบบ (admin view) | ❌ |

### Sessions — Admin only (+1 เพิ่มใหม่)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 16 | GET | `/api/sessions/all` | ดู charging session ทุกคนในระบบ (admin view) | ❌ |

---

## ⚠️ Dependencies จาก nem ที่ต้องรู้

### Auto-notification เมื่อมี ticket ใหม่
- **nem จะแก้** `POST /api/tickets` ให้ INSERT ลง `notifications` table ให้ technician ทุกคนอัตโนมัติ
- **lalla ต้องทำ** ให้ tech dashboard อ่าน notification เหล่านี้และแสดงผล (unread badge + list)
- notification message จะเป็น: `"มี ticket ใหม่: {title} — ตู้ {charger_name}"`

### ปุ่มแจ้งปัญหาใน BookingPage
- nem เพิ่มปุ่ม 🔧 ใน BookingPage → นำ user ไปหน้า `/report` พร้อม pre-fill charger_id
- ticket จะถูกสร้างผ่าน `POST /api/tickets` (nem's endpoint)
- lalla ต้องทำให้ tech dashboard เห็น ticket นั้นและ assign งานได้

---

## ⚠️ ห้ามแตะเด็ดขาด — ของ nem

### Routes ที่ห้ามแก้
| Route | เพราะ |
|-------|-------|
| `routes/auth.js` | register/login ของ nem ทั้งหมด |
| `routes/vehicles.js` | CRUD รถของ user |
| `routes/bookings.js` — ยกเว้น GET all admin | user booking ของ nem |
| `routes/sessions.js` | start/stop charging ของ nem |
| `routes/payments.js` | payment ของ nem |
| `routes/reviews.js` | review ของ nem |
| `routes/notifications.js` | notification ของ nem |
| `routes/tickets.js` — เฉพาะ POST | user แจ้งปัญหา ของ nem |

### หน้า Frontend ที่ห้ามแก้
- `pages/user/` ทุกไฟล์ → ของ nem
- `pages/shared/` (Login, Register) → ของ nem
- `context/AuthContext.jsx` → ของ nem
- `utils/api.js` → ถ้าจะแก้ต้องบอก nem ก่อน

### จุดที่ระวังชนกัน
- `routes/tickets.js` — nem ทำแค่ POST ส่วนที่เหลือของ lalla อย่า overwrite ทั้งไฟล์
- `routes/bookings.js` — nem ทำ user bookings lalla เพิ่มแค่ GET all admin อย่าแก้ทับ
- `routes/chargers.js` — nem ทำ GET (อ่าน) lalla ทำ POST/PUT/PATCH อย่าแก้ GET ทิ้ง
- `routes/stations.js` — nem ทำ GET (อ่าน) lalla ทำ POST/PUT/DELETE อย่าแก้ GET ทิ้ง
- `middleware/auth.js` — ใช้ร่วมกัน ถ้าจะแก้ต้องบอกกันก่อน
- `server.js` — ใช้ร่วมกัน ถ้าจะเพิ่ม route ใหม่ต้องบอกกันก่อน

---

## หมายเหตุเรื่อง Schema

ไฟล์ [backend/schema.sql](backend/schema.sql) มีอยู่แล้ว — ตัดสินใจได้ 2 ทาง:
- **ใช้ต่อ** → import เข้า MySQL แล้วปรับเพิ่มเติมได้
- **เขียนใหม่** → ลบ db เก่าใน phpMyAdmin แล้วสร้างเอง

ถ้าแก้ schema ต้องบอกฉันด้วย เพราะ query ใน backend ต้องตรงกับชื่อ column

---

## ⚠️ Schema ที่ nem เพิ่มล่าสุด — ต้องรัน ALTER TABLE ด้วย

nem เพิ่ม 2 columns ใหม่เข้า DB แล้ว (schema.sql อัพเดทแล้ว) แต่ถ้า DB ตัวเองยังไม่มี ต้องรันใน phpMyAdmin:

```sql
ALTER TABLE vehicles
  ADD COLUMN battery_current_kwh DECIMAL(6,2) DEFAULT NULL
  AFTER battery_capacity_kwh;

ALTER TABLE chargers
  ADD COLUMN temperature_celsius DECIMAL(5,2) DEFAULT NULL
  AFTER status;
```

### `vehicles.battery_current_kwh`
- เก็บค่าพลังงานปัจจุบันในแบตรถ (kWh)
- nem อัพเดทอัตโนมัติทุกครั้งที่ชาร์จเสร็จ (`PATCH /api/sessions/:id/stop`)
- ไม่ต้องทำอะไรฝั่ง lalla

### `chargers.temperature_celsius`
- เก็บอุณหภูมิของตู้ชาร์จ (°C) — ป้องกัน overheat
- ตู้ชาร์จเร็ว (DC Fast Charge) ที่ทำงานหนักอุณหภูมิจะสูง ถ้าเกิน ~60°C ถือว่าอันตราย
- **lalla ต้องทำ:** แสดงค่า temperature ในหน้า admin charger management
- แนะนำ: ถ้า temperature >= 60 ให้แสดง badge "ร้อนเกิน" สีแดง หรือ auto set status = 'out_of_service'

---

## ลำดับการทำงาน (แนะนำ)

```
1. ดู schema.sql ที่มีอยู่ → ตัดสินใจว่าจะใช้หรือแก้
2. ตกลงชื่อ column กับฉันก่อน
3. Import schema ลง MySQL
4. ใส่ข้อมูลตัวอย่าง (stations, chargers) เพื่อให้ฉันเทสได้
5. เริ่มเขียน API admin/tech ทีละ route
6. เทสด้วย Postman + Swagger
```

---

## วิธีเทส API

1. รัน backend: `cd backend && nodemon server.js`
2. รัน frontend: `cd frontend && npm run dev`
3. เปิด `http://localhost:5001/api-docs` (Swagger)
4. Login ด้วย `admin@evcharge.com` / `password123` → copy token → กด Authorize → ใส่ token (ไม่ต้องพิมพ์ Bearer นำหน้า)
5. เปิดหน้า Admin: `http://localhost:3000/admin/login`

## สิ่งที่แก้/เพิ่มวันที่ 2026-03-26

| สิ่งที่ทำ | ไฟล์ที่แก้ |
|-----------|-----------|
| แก้ port frontend จาก 5000 → 5001 | `frontend/.env` |
| reset password hash ของ admin ใน DB | phpMyAdmin |
| แก้ bug DashboardPage `users.filter is not a function` | `frontend/src/pages/admin/DashboardPage.jsx` |
| แก้ Swagger doc ของ POST /api/users/technician (`name` → `first_name`+`last_name`) | `backend/routes/users.js` |
| เพิ่ม Swagger doc ให้ GET /api/bookings/all | `backend/routes/bookings.js` |
| เพิ่ม Swagger doc ให้ GET /api/admin/stats | `backend/server.js` |
| แก้ Swagger config ให้อ่าน server.js ด้วย | `backend/server.js` |
| เทสทุก 15 endpoint ผ่านหมด | — |

---

## วิธีให้ Claude สอน (สำหรับ lalla)

> ให้ Claude อธิบายควบคู่กับการเช็ค/แก้ bug ทีละ route ไม่ใช่แค่แก้ให้ผ่าน

**วิธีใช้:**
- ครอบ code ที่อยากเข้าใจแล้วบอกว่า "อธิบายที่ครอบไว้"
- ถามได้เลยถ้าไม่เข้าใจคำไหน เช่น "destructuring คืออะไร", "ทำไมต้องมี async await"
- ให้ Claude เช็ค bug ก่อนแก้เองเสมอ แล้วค่อยถามว่าทำไมต้องแก้

**ตัวอย่างที่ถามได้:**
```
"อธิบายที่ครอบไว้ที"
"ทำไมถึงใช้ [rows] แทน rows เฉยๆ"
"req.body คืออะไร"
"เช็คให้ทีว่า bug หายไปแล้วไหม"
"flow ของ route นี้เป็นยังไง"
```

**สิ่งที่จะได้:**
- เข้าใจว่าแต่ละบรรทัดทำอะไร ไม่ใช่แค่ copy
- รู้ว่า bug เกิดจากไหน ไม่ใช่แค่แก้ตามที่บอก
- พอถึงตอนอาจารย์ถาม จะตอบได้ครับ
