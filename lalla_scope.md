# lalla_scope — งานของ lalla (14 endpoints + Database)

## สถานะปัจจุบัน (อัพเดท 27 มี.ค. 2026)
- Database schema — **เสร็จแล้ว ✅** (`backend/schema.sql` ใช้ได้ + import ลง MySQL แล้ว)
- Backend routes admin/tech — **ยังไม่ได้เขียน ❌** ← งานด่วนที่สุดตอนนี้
- Frontend admin/tech — **ทำเสร็จแล้ว ✅** (ทุกหน้าสร้างไว้แล้ว เชื่อม API จริงแล้ว รอแค่ backend)

> ⚠️ **DB พร้อมแล้ว nem ทำ backend ฝั่ง user เสร็จแล้ว** ตอนนี้ต้องรีบทำ backend admin/tech เพราะ frontend รออยู่

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
| 1 | GET | `/api/users` | ดู user ทั้งหมดในระบบ | ❌ |
| 2 | PATCH | `/api/users/:id/ban` | ban/unban user | ❌ |
| 3 | POST | `/api/users/technician` | สร้าง account ช่าง | ❌ |

### Stations — Admin only (3)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 4 | POST | `/api/stations` | เพิ่มสถานีใหม่ | ❌ |
| 5 | PUT | `/api/stations/:id` | แก้ข้อมูลสถานี | ❌ |
| 6 | DELETE | `/api/stations/:id` | ลบสถานี | ❌ |

### Chargers — Admin/Tech (3)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 7 | POST | `/api/chargers` | เพิ่มตู้ชาร์จ | ❌ |
| 8 | PUT | `/api/chargers/:id` | แก้ข้อมูลตู้ชาร์จ | ❌ |
| 9 | PATCH | `/api/chargers/:id/status` | เปลี่ยนสถานะ (available/in_use/maintenance) | ❌ |

### Tickets — Admin/Tech (4)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 10 | GET | `/api/tickets` | ดู ticket ทั้งหมด (admin เห็นทุกอัน, ช่างเห็นของตัวเอง) | ❌ |
| 11 | PATCH | `/api/tickets/:id/assign` | assign ticket ให้ช่าง | ❌ |
| 12 | PATCH | `/api/tickets/:id/status` | update สถานะ ticket | ❌ |
| 13 | POST | `/api/tickets/:id/image` | อัพโหลดรูปประกอบ | ❌ |

### Bookings — Admin only (1)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 14 | GET | `/api/bookings/all` | ดู booking ทุกคนในระบบ (admin view) | ❌ |

### Dashboard Stats — Admin only
> ⚠️ endpoint นี้ยังไม่มีใน code — lalla ต้องสร้าง route ใหม่เองใน server.js
> เพิ่ม `GET /api/admin/stats` สำหรับดึงสถิติหน้า dashboard (จำนวน user, booking วันนี้, รายได้, ตู้มีปัญหา)

### Payments — Admin only (+1 เพิ่มใหม่)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 15 | GET | `/api/payments/all` | ดูประวัติการจ่ายเงินทุกคนในระบบ (admin view) | ❌ |

### Sessions — Admin only (+1 เพิ่มใหม่)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 16 | GET | `/api/sessions/all` | ดู charging session ทุกคนในระบบ (admin view) | ❌ |

### Notifications — Admin only (+1 เพิ่มใหม่) ⚠️ ต้องเช็คก่อน
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 17 | GET | `/api/notifications/all` | ดู notification ของ user ทุกคนในระบบ (admin view) | ❌ |

> **ที่ต้องเพิ่มเพราะ:** `AdminNotificationsPage.jsx` เรียก `GET /api/notifications` อยู่ แต่ endpoint นั้นของ nem return แค่ notification ของตัวเองเท่านั้น (WHERE user_id = req.user.user_id) — ถ้า admin login แล้วเปิดหน้านี้จะเห็นแค่ notification ของ admin ไม่เห็นของ user คนอื่น
>
> **วิธีแก้:** สร้าง `GET /api/notifications/all` ใน `routes/notifications.js` ต่อจาก endpoint ของ nem (อย่าแก้ทับ) แล้วแก้ `AdminNotificationsPage.jsx` ให้เรียก `/api/notifications/all` แทน
>
> **ตรวจสอบก่อน:** เช็คใน `routes/notifications.js` ว่ามี `/all` อยู่แล้วไหม ถ้ายังไม่มีให้เพิ่ม

---

## ⚠️ Dependencies จาก nem ที่ต้องรู้

### Auto-notification เมื่อมี ticket ใหม่ — **เสร็จแล้ว ✅**
- **nem แก้แล้ว** `POST /api/tickets` INSERT ลง `notifications` table ให้ technician ทุกคนอัตโนมัติ
- notification message: `"มี ticket ใหม่: {title} — ตู้ {charger_name}"`
- **lalla ต้องทำ** ให้ tech dashboard อ่าน notification เหล่านี้และแสดงผล (unread badge + list)

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

---

## ⚠️ สำคัญมาก — รูปแบบ response ของแต่ละ API (ต้องอ่านก่อนเขียน frontend!)

backend ของโปรเจกต์นี้คืน response ไม่เหมือนกันทุก endpoint บางตัวคืน array ตรงๆ บางตัวห่อใน object ต้องเช็คให้ดีก่อน `.map()` yoking `.filter()` มิฉะนั้น tickets จะไม่แสดงเลย

| Endpoint | รูปแบบที่คืน | วิธี access ใน frontend |
|----------|-------------|------------------------|
| `GET /api/tickets` | `{ tickets: [...] }` | `res.data.tickets` |
| `GET /api/users` | `{ users: [...] }` | `res.data.users` |
| `GET /api/stations` | `{ stations: [...] }` | `res.data.stations` |
| `GET /api/chargers/station/:id` | `[...]` หรือ `{ chargers: [...] }` | `res.data.chargers \|\| res.data` |
| `GET /api/bookings` | `[...]` | `res.data` |
| `GET /api/vehicles` | `[...]` | `res.data` |
| `GET /api/notifications` | `{ notifications: [...] }` | `res.data.notifications` |

**Pattern ที่ปลอดภัย** ถ้าไม่แน่ใจให้เขียน:
```js
const items = res.data.tickets || res.data  // fallback กัน crash
```

**bug ที่เจอจริงและแก้แล้ว (27 มี.ค. 2026):**
- `TicketManagePage`, `TechnicianManagePage`, `TechDashboardPage`, `TechHistoryPage` ล้วนเคย `setTickets(res.data)` แทนที่จะเป็น `res.data.tickets` → tickets ไม่แสดงผลเลย แก้แล้วทั้งหมด

---

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

1. รัน backend: `nodemon server.js`
2. เปิด `http://localhost:5000/api-docs` (Swagger)
3. Login ด้วย admin account ก่อน → เอา token ไปใส่ใน Authorize
4. ทดสอบ route ที่เพิ่งเขียน

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
