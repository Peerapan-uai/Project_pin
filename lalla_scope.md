# lalla_scope — งานของ lalla (22 endpoints + Database)

## สถานะปัจจุบัน
- Database MySQL schema — **เสร็จแล้ว ✅** (import ลง MySQL แล้ว มี sample data พร้อมเทส)
- Database MongoDB (Logs) — **ยังไม่ได้ทำฝั่ง lalla ⏳** (setup มีแล้ว แต่ยังไม่มี API ดึง log / TTL index)
- Backend routes admin/tech — **เสร็จแล้ว ✅** (ทุก endpoint เขียนครบ แก้ bug หมดแล้ว)
- Frontend admin/tech — **เสร็จแล้ว ✅** (AdminLoginPage ใช้งานได้แล้ว, DashboardPage แก้ bug แล้ว)
- เทส Swagger — **เสร็จแล้ว ✅** (เทสครบทุก 15 endpoint ผ่านหมด)

> อัปเดตล่าสุด: 2026-04-07

## ความรับผิดชอบหลัก
ดูแล Database schema ทั้งหมด + API ฝั่ง Admin และ Technician

| กลุ่ม | จำนวน |
|-------|-------|
| Users admin (GET all, ban, สร้างช่าง, แก้ข้อมูล) | 4 |
| Stations admin (POST/PUT/DELETE) | 3 |
| Chargers admin+tech (GET all, POST/PUT/PATCH status/DELETE) | 5 |
| Tickets admin+tech (GET all, assign, status, image) | 4 |
| Bookings admin (GET all, admin-cancel) | 2 |
| Payments admin (GET admin/all) | 1 |
| Dashboard Stats | 1 |
| Sessions admin (GET all) | 1 |
| **รวม** | **22** |

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

### Users — Admin only (4)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 1 | GET | `/api/users` | ดู user ทั้งหมดในระบบ | ✅ |
| 2 | PATCH | `/api/users/:id/ban` | ban/unban user | ✅ |
| 3 | POST | `/api/users/technician` | สร้าง account ช่าง | ✅ |
| 4 | PUT | `/api/users/:id` | admin แก้ไขข้อมูล user/ช่าง (ชื่อ/เบอร์/รหัสผ่าน) | ✅ |

### Stations — Admin only (3)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 4 | POST | `/api/stations` | เพิ่มสถานีใหม่ | ✅ |
| 5 | PUT | `/api/stations/:id` | แก้ข้อมูลสถานี | ✅ |
| 6 | DELETE | `/api/stations/:id` | ลบสถานี | ✅ |

### Chargers — Admin/Tech (5)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 7 | GET | `/api/chargers` | ดูตู้ชาร์จทั้งหมด (admin only) | ✅ |
| 8 | POST | `/api/chargers` | เพิ่มตู้ชาร์จ | ✅ |
| 9 | PUT | `/api/chargers/:id` | แก้ข้อมูลตู้ชาร์จ | ✅ |
| 10 | PATCH | `/api/chargers/:id/status` | เปลี่ยนสถานะ (available/reserved/charging/out_of_service) | ✅ |
| 11 | DELETE | `/api/chargers/:id` | ลบตู้ชาร์จ | ✅ |

### Tickets — Admin/Tech (4)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 12 | GET | `/api/tickets` | ดู ticket ทั้งหมด (admin เห็นทุกอัน, ช่างเห็นของตัวเอง) | ✅ |
| 13 | PATCH | `/api/tickets/:id/assign` | assign ticket ให้ช่าง | ✅ |
| 14 | PATCH | `/api/tickets/:id/status` | update สถานะ ticket (reported/assigned/in_progress/completed) | ✅ |
| 15 | POST | `/api/tickets/:id/image` | อัพโหลดรูป repair_image | ✅ |

### Bookings — Admin only (2)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 16 | GET | `/api/bookings/all` | ดู booking ทุกคนในระบบ (admin view) | ✅ |
| 17 | PATCH | `/api/bookings/:id/admin-cancel` | admin ยกเลิก booking ใดก็ได้ | ✅ |

### Payments — Admin only (1)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 18 | GET | `/api/payments/admin/all` | ดูรายการจ่ายเงินทั้งหมด พร้อม station/charger info | ✅ |

### Sessions — Admin only (1)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 19 | GET | `/api/sessions/all` | ดู charging session ทุกคน (admin view) | ✅ |

### Dashboard Stats — Admin only (1)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 20 | GET | `/api/admin/stats` | ดึงสถิติ dashboard (total_users, bookings_today, payments_count, charger_issue) | ✅ |

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

> รวม lalla ใน code จริง = **23 endpoints** (22 เดิม + nearby)

---

## ⚠️ Dependencies จาก nem ที่ต้องรู้

### Auto-notification เมื่อมี ticket ใหม่
- **nem แก้แล้ว ✅** `POST /api/tickets` INSERT notification ให้ช่างทุกคนอัตโนมัติ (bulk insert)
- notification title: `"มีแจ้งปัญหาใหม่"`, message: `"ตั๋วซ่อม #{id}: {title}"`
- **lalla ต้องทำ** ให้ tech dashboard อ่าน notification เหล่านี้และแสดงผล (unread badge + list)

### ปุ่มแจ้งปัญหาใน BookingPage
- **nem ทำแล้ว ✅** ปุ่ม "แจ้งปัญหาตู้ชาร์จนี้" ใน BookingPage → navigate `/report` พร้อม pre-fill chargerId + stationId
- ReportIssuePage รับ location.state มา pre-fill สถานี + ตู้ชาร์จอัตโนมัติ
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

## MongoDB — Log System (NoSQL)

โปรเจคนี้ใช้ **2 DB**: MySQL (ข้อมูลหลัก) + MongoDB (เก็บ log)

### ทำไมต้องมี MongoDB ด้วย
- Log มีปริมาณเยอะมาก (ทุก request = 1 document) → MySQL ไม่เหมาะ
- แต่ละ log มี body โครงสร้างไม่เหมือนกัน → MongoDB เก็บ JSON ยืดหยุ่นกว่า
- Log ไม่ต้อง JOIN กับ table อื่น → ไม่จำเป็นต้อง relational
- MongoDB เขียนไว ไม่มี FK check, ตั้ง TTL auto-delete log เก่าได้

### Setup ที่มีแล้ว (ไม่ต้องทำ)
| ไฟล์ | หน้าที่ |
|------|---------|
| `config/mongodb.js` | เชื่อม MongoDB |
| `models/Log.js` | Mongoose schema สำหรับ log |
| `middleware/logger.js` | บันทึกทุก request อัตโนมัติ (ทุก role) |
| `docker-compose.yml` | MongoDB container + Mongo Express (GUI: `localhost:8082`) |

### งานที่ lalla ต้องทำ (MongoDB)
| # | งาน | สถานะ |
|---|------|-------|
| 1 | `GET /api/admin/logs` — admin ดู log ทั้งหมด | ⏳ |
| 2 | `GET /api/admin/logs/:type` — filter log (เช่น error 4xx/5xx) | ⏳ |
| 3 | TTL index — ลบ log เก่าอัตโนมัติ (เช่น เกิน 90 วัน) | ⏳ |

---

## หมายเหตุเรื่อง Schema (MySQL)

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

## แผนงานอนาคต — เพิ่ม lalla จาก 22 → 40 endpoints

> ยังไม่ได้ทำ รอหลังจากอาจารย์ database ดูงานก่อน
> อัปเดตล่าสุด: 2026-04-07

### Google Maps — เพิ่ม 8
> lalla เป็นคนเขียน API ทั้งหมด, nem เรียกใช้จาก frontend

| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 23 | GET | `/api/stations/nearby` | หาสถานีใกล้เคียงจาก lat/lng + radius (ใช้ Haversine Formula) | ✅ |
| 24 | GET | `/api/stations/filter` | filter สถานีตาม charger type (DC Fast / AC Slow) + status | ⏳ |
| 25 | GET | `/api/stations/:id/availability` | check ตู้ว่างทั้งหมดในสถานี real-time | ⏳ |
| 26 | POST | `/api/distances/calculate` | คำนวณระยะห่างจาก user → สถานี (lat/lng → km) | ⏳ |
| 27 | POST | `/api/users/:id/location` | บันทึก location ปัจจุบันของ user | ⏳ |
| 28 | POST | `/api/locations/search` | search box autocomplete ชื่อสถานี/ที่อยู่ | ⏳ |
| 29 | GET | `/api/stations/:id/chargers` | ดูตู้ชาร์จทั้งหมดในสถานี (สำหรับ map info window) | ⏳ |
| 30 | GET | `/api/stations/:id/stats` | สถิติของสถานี (booking count, revenue, availability) | ⏳ |

ต้องสมัครก่อน:
- Google Maps API key: สมัครที่ Google Cloud Console (มี free tier $200/เดือน)
- npm: `@react-google-maps/api` (frontend), ไม่ต้อง package พิเศษ backend

### Admin Reports — เพิ่ม 5
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 31 | GET | `/api/admin/reports/revenue` | รายได้รายวัน/เดือน/ปี (filter by date range, station) | ⏳ |
| 32 | GET | `/api/admin/reports/usage` | สถิติการใช้งาน charger (utilization%, peak hours, downtime) | ⏳ |
| 33 | GET | `/api/admin/reports/stations` | สถิติแยกตามสถานี (revenue, session count, charger status) | ⏳ |
| 34 | GET | `/api/admin/reports/comparison` | เปรียบเทียบ vs เดือนที่แล้ว/ปีที่แล้ว (revenue%, sessions%) | ⏳ |
| 35 | POST | `/api/admin/reports/export` | export report เป็น CSV หรือ PDF | ⏳ |

### Notification Admin — เพิ่ม 5
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 36 | POST | `/api/notifications/broadcast` | admin ส่ง notification ถึงทุกคน | ⏳ |
| 37 | POST | `/api/notifications/targeted` | admin ส่งเฉพาะกลุ่ม (by role/location/status) | ⏳ |
| 38 | POST | `/api/notifications/schedule` | admin ตั้งเวลาส่ง notification | ⏳ |
| 39 | GET | `/api/notifications/analytics` | ดูสถิติ delivery rate / read rate | ⏳ |
| 40 | GET | `/api/users/:id` | admin ดู user รายคน + ประวัติทั้งหมด | ⏳ |

### Admin Logs — เพิ่ม 2
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 41 | GET | `/api/admin/logs` | ดู log ทั้งหมด (webhook/error/activity) | ⏳ |
| 42 | GET | `/api/admin/logs/:type` | filter log ตาม type | ⏳ |

> รวมถ้าทำครบ = **42 endpoints** ✅

---

## Database ที่ต้องเพิ่ม (อนาคต)

> รัน query เหล่านี้ใน phpMyAdmin ก่อน implement API ใหม่

### 1. ALTER TABLE payments (เพิ่ม 4 columns)
```sql
ALTER TABLE payments
ADD COLUMN webhook_id VARCHAR(255) NULL,
ADD COLUMN refund_status ENUM('none','pending','completed','failed') DEFAULT 'none',
ADD COLUMN refund_amount DECIMAL(10,2) NULL,
ADD COLUMN expires_at DATETIME NULL;
```
**เหตุผล:** รองรับ webhook idempotency, refund tracking, QR expire

### 2. CREATE TABLE refunds (ใหม่)
```sql
CREATE TABLE refunds (
  refund_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255),
  status ENUM('pending','completed','failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (refund_id),
  FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
**เหตุผล:** 1 payment อาจมีหลาย refund (partial refund) ต้องแยก table

### 3. ALTER TABLE stations (เพิ่ม Spatial Index)
```sql
ALTER TABLE stations
ADD INDEX idx_location (latitude, longitude);
```
**เหตุผล:** query nearby stations เร็วขึ้น ไม่ full table scan

### 4. CREATE TABLE notification_logs (ใหม่)
```sql
CREATE TABLE notification_logs (
  log_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  notification_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  delivered_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  status ENUM('pending','delivered','failed') DEFAULT 'pending',
  PRIMARY KEY (log_id),
  FOREIGN KEY (notification_id) REFERENCES notifications(notification_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
**เหตุผล:** track delivery/read rate สำหรับ `GET /api/notifications/analytics`

---

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

## ✅ MongoDB Setup — เสร็จแล้ว (2026-04-08)

### สิ่งที่เสร็จแล้ว:
- ✅ MongoDB Database: `ev_charger`
- ✅ Collection: `logs`
- ✅ Index created:
  - `userId_1` — search by userId
  - `statusCode_1` — search by status code
  - `createdAt_1` + TTL (7776000 sec = 90 days) — auto-delete old logs
- ✅ config/mongodb.js — connect to MongoDB
- ✅ models/Log.js — define log schema with fields: method, url, statusCode, userId, userRole, ip, userAgent, responseTime, body, createdAt

### สิ่งที่ยังต้องทำ:
- ⏳ middleware/logger.js — capture every request and save to MongoDB
- ⏳ routes/admin/logs.js — 2 endpoints: GET /api/admin/logs, GET /api/admin/logs/:type

## ✅ middleware/logger.js — เสร็จแล้ว (2026-04-08)

### สิ่งที่ทำ:
- ✅ จับทุก request (method, url, statusCode, userId, userRole, ip, userAgent, body, responseTime)
- ✅ บันทึก MongoDB อัตโนมัติ
- ✅ ทดสอบใน Swagger → logs บันทึกลงฐานข้อมูล

### ผลลัพธ์:
```
✅ Response finished, saving log...
✅ Log saved to MongoDB!
```
เห็นในทุก API call = ทำงานสมบูรณ์

