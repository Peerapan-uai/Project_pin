# lalla_scope — งานของ lalla (22 endpoints + Database)

## 🔴 Claude อ่านก่อน — ห้ามทำ 2 อย่างนี้เด็ดขาด

> **ห้าม import / re-import schema.sql ใหม่ทั้งไฟล์**
> เพราะ schema.sql มี `DROP TABLE IF EXISTS` ทุกตาราง → ข้อมูลในระบบหายหมด
>
> **ถ้า DB ต้องการ schema ใหม่** → ใช้ ALTER TABLE เท่านั้น (ดู section "Schema ที่ต้องรัน" ด้านล่าง)
> schema.sql ในโปรเจคเป็นแค่ reference / เอกสาร ไม่ใช่ไฟล์ที่จะ import ซ้ำ

### ✅ วิธีที่ถูกต้องถ้า schema เปลี่ยน
1. เปิด phpMyAdmin → SQL tab
2. รัน ALTER TABLE ที่ระบุไว้ใน section "Schema ที่ต้องรัน" ด้านล่างทีละ statement
3. ตรวจสอบว่า query สำเร็จก่อนไปต่อ

---

## ✅ Backend เสร็จหมดแล้ว — เหลือแค่ Bug + Frontend UI

> **43 endpoints เสร็จหมดแล้ว** (อัปเดต 2026-04-12)
> สิ่งที่เหลือ: แก้ bug 3 ตัว + ทำ Frontend Admin UI 4 หน้า (ดู section "งานที่ต้องทำต่อ")

## สถานะปัจจุบัน (อัปเดต 2026-04-15)
- Database MySQL schema — **เสร็จแล้ว ✅**
- Database MongoDB (Logs) — **เสร็จแล้ว ✅** (TTL index 90 วัน, logger middleware, logs API)
- Backend routes admin/tech (22 endpoints) — **เสร็จแล้ว ✅**
- Admin Logs (2 endpoints) — **เสร็จแล้ว ✅**
- Frontend admin/tech — **เสร็จแล้ว ✅**
- เทส Swagger ทุก endpoint — **เสร็จแล้ว ✅**
- `POST /api/users/technician` — **แก้ bug ✅** เพิ่ม INSERT tech_profiles + primary_skill
- `GET /api/users/:id` — **เพิ่มใหม่ ✅** admin ดู user รายคน + ประวัติทั้งหมด
- `GET /api/users` — **แก้แล้ว ✅** เพิ่ม LEFT JOIN tech_profiles ดึง primary_skill
- Admin Wallet (6 endpoints) — **เสร็จแล้ว ✅** เทส Swagger ผ่านหมด
- Admin Reports (6 endpoints) — **เสร็จแล้ว ✅** เทส Swagger ผ่านหมด (แก้ bug P.amount + usage query)
- Admin Notifications (4 endpoints) — **เสร็จแล้ว ✅** เทส Swagger ผ่านหมด
- Schedule Notifications — **เสร็จแล้ว ✅** (2026-04-15) มี cron job จริง + table scheduled_notifications
- FE: dropdown + badge primary_skill ใน TechnicianManagePage — **เสร็จแล้ว ✅**
- Google Maps API — ตัดจาก 7 → 2 endpoints (nearby ✅ + stats ✅)

## สรุป endpoints ทั้งหมดของ lalla
| กลุ่ม | จำนวน | สถานะ |
|-------|-------|-------|
| Users, Stations, Chargers, Tickets, Bookings, Payments, Sessions, Dashboard | 22 | ✅ |
| User detail (GET /:id) | 1 | ✅ |
| Nearby stations + stats | 2 | ✅ |
| Admin Logs | 2 | ✅ |
| Admin Wallet | 6 | ✅ เทสผ่าน |
| Admin Reports + PDF Invoice | 6 | ✅ เทสผ่าน |
| Admin Notifications (รวม schedule) | 4 | ✅ เทสผ่าน |
| **รวมทั้งหมด** | **43** | 43✅ |

## งานที่ต้องทำต่อ

### ✅ Bug แก้แล้ว (2026-04-19)
| # | ปัญหา | ไฟล์ | สถานะ |
|---|-------|------|-------|
| 1 | **Admin cancel booking ไม่คืน charger** | `routes/bookings.js` | ✅ แก้แล้ว — SELECT charger_id ก่อน แล้ว UPDATE chargers SET status='available' |
| 2 | **`GET /sessions/all` route ordering bug** | `routes/sessions.js` | ✅ ไม่ใช่ bug จริง — `/:id/status` ต้อง 2 segment ไม่ชนกับ `/all` |
| 3 | **Mongo Express ไม่มี auth** | `docker-compose.yml:50` | 🟡 ยังไม่แก้ — ค่อยทำก็ได้ |
| 4 | **server.js require path ผิด** `'./routes   auth'` | `server.js:18` | ✅ แก้แล้ว → `'./routes/auth'` |

### ✅ Frontend Admin — เสร็จหมดแล้ว
| # | หน้า | สถานะ |
|---|------|-------|
| 1 | Wallet Management UI | ✅ |
| 2 | Refund Approval UI | ✅ เพิ่ม predefined reject reasons + custom approve modal (2026-04-19) |
| 3 | Reports / CSV Export UI | ✅ |
| 4 | PDF Invoice ปุ่มดาวน์โหลด | ✅ |

---

## ✅ ระบบ Refund Request — เสร็จแล้ว (อัปเดต 2026-04-18)

### ⚠️ DB ที่ต้องรัน ALTER TABLE ก่อน (lalla ต้องทำ)
```sql
ALTER TABLE refund_requests
  ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT '' AFTER user_id,
  MODIFY COLUMN reason TEXT DEFAULT NULL;
```

### โครงสร้างตาราง refund_requests (ปัจจุบัน)
| column | type | หมายเหตุ |
|--------|------|---------|
| request_id | INT PK AUTO_INCREMENT | |
| payment_id | INT FK → payments | |
| user_id | INT FK → users | |
| title | VARCHAR(255) NOT NULL | **ใหม่** — หัวข้อการขอคืนเงิน |
| reason | TEXT DEFAULT NULL | รายละเอียดเพิ่มเติม (ไม่บังคับ) |
| image_url | VARCHAR(500) | JSON array ของ path รูป เช่น `["/uploads/refunds/xxx.jpg"]` |
| status | ENUM('pending','approved','rejected') | default 'pending' |
| reviewed_by | INT FK → users | admin ที่ approve/reject |
| reviewed_at | TIMESTAMP NULL | |
| created_at | TIMESTAMP | |

### Backend (nem ทำ — ห้ามแก้)
| Method | Path | หน้าที่ |
|--------|------|---------|
| POST | `/api/payments/:id/refund-request` | user ส่งขอคืนเงิน รับ `{ title, reason?, images?: [base64] }` |
| GET | `/api/admin/refunds?status=pending` | admin ดูรายการ (filter ด้วย status) |
| POST | `/api/admin/refunds/:id/approve` | approve → คืนเงินเข้า wallet + notification |
| POST | `/api/admin/refunds/:id/reject` | reject รับ `{ reason? }` + notification |

### Response จาก GET /api/admin/refunds
```json
{
  "refund_request": [
    {
      "request_id": 1,
      "user_id": 5,
      "title": "ตู้ชาร์จไม่ทำงาน / ชาร์จไม่ได้",
      "reason": "กดชาร์จแล้วตู้ไม่ตอบสนองเลย",
      "image_url": "[\"/uploads/refunds/refund_5_xxx.jpg\"]",
      "status": "pending",
      "payment_id": 12,
      "amount": "250.00",
      "method": "credit_card",
      "first_name": "สมชาย",
      "last_name": "ใจดี",
      "email": "user@example.com",
      "created_at": "2026-04-18T..."
    }
  ]
}
```

### Frontend ที่ทำแล้ว
| ไฟล์ | หน้าที่ | สถานะ |
|------|---------|-------|
| `pages/user/PaymentHistoryPage.jsx` | user กดปุ่ม "ขอคืนเงิน" → modal เลือกหัวข้อ + รายละเอียด + รูป | ✅ |
| `pages/admin/RefundManagePage.jsx` | admin เห็นรายการ + approve/reject + ดูรูป | ✅ |

### หัวข้อที่ user เลือกได้ (dropdown)
1. ตู้ชาร์จไม่ทำงาน / ชาร์จไม่ได้
2. ถูกเก็บเงินผิดจำนวน
3. ชาร์จไม่เสร็จ / หยุดกลางคัน
4. จองแล้วใช้งานไม่ได้
5. ยกเลิกการจองแต่ยังถูกตัดเงิน
6. อื่นๆ (พิมพ์เอง)

### รูปภาพแนบ
- เก็บที่ `backend/uploads/refunds/` (static serve อยู่แล้ว)
- `image_url` ใน DB เป็น JSON string เช่น `["/uploads/refunds/file.jpg", ...]`
- ใน RefundManagePage ใช้ `JSON.parse(rr.image_url)` แล้ว render ด้วย `BASE_URL + path`

---

### ⏳ งานจิปาถะ
| # | งาน | สถานะ |
|---|------|-------|
| 1 | commit + push ไฟล์ที่ค้าง (server.js, notifications.js, package.json) | ⏳ |
| 2 | อัปเดต schema.sql ให้ตรง DB จริง (tech_profiles columns + scheduled_notifications) | ⏳ |

## 🔴 Bug จาก Code Review (2026-04-12) — lalla ต้องแก้
| # | ปัญหา | ไฟล์ | ความร้ายแรง |
|---|-------|------|------------|
| 1 | **Admin cancel booking ไม่คืน charger เป็น available** — แค่ UPDATE bookings ไม่มี UPDATE chargers SET status='available' | `routes/bookings.js:246-261` | 🔴 ต้องแก้ |
| 2 | **`GET /sessions/all` route ordering bug** — อยู่หลัง `GET /:id/status` ทำให้ Express จับ "all" เป็น `:id` → route ไม่ทำงาน | `routes/sessions.js:402` (ย้ายไว้ก่อน `:id/status`) | 🔴 ต้องแก้ |
| 3 | **Mongo Express ไม่มี auth** — `ME_CONFIG_BASICAUTH: "false"` ใครก็เข้า port 8082 แก้ข้อมูลได้ | `docker-compose.yml:50` | 🟡 ควรแก้ |

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

## ~~ต้องทำก่อนเพื่อน~~ ✅ เสร็จหมดแล้ว

> Database schema + tables ทั้งหมดเสร็จเรียบร้อยแล้ว ไม่ต้องทำอะไรเพิ่ม

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

### งานที่ lalla ต้องทำ (MongoDB) — เสร็จหมดแล้ว ✅
| # | งาน | สถานะ |
|---|------|-------|
| 1 | `GET /api/admin/logs` — admin ดู log ทั้งหมด | ✅ |
| 2 | `GET /api/admin/logs/:type` — filter log (เช่น error 4xx/5xx) | ✅ |
| 3 | TTL index — ลบ log เก่าอัตโนมัติ (เช่น เกิน 90 วัน) | ✅ |

---

## หมายเหตุเรื่อง Schema (MySQL)

ไฟล์ [backend/schema.sql](backend/schema.sql) มีอยู่แล้ว — ตัดสินใจได้ 2 ทาง:
- **ใช้ต่อ** → import เข้า MySQL แล้วปรับเพิ่มเติมได้
- **เขียนใหม่** → ลบ db เก่าใน phpMyAdmin แล้วสร้างเอง

ถ้าแก้ schema ต้องบอกฉันด้วย เพราะ query ใน backend ต้องตรงกับชื่อ column

---

## ⚠️ Schema ที่ต้องรัน ALTER TABLE — รันใน phpMyAdmin ทีละ statement

> ⚠️ ห้าม import schema.sql ใหม่ — มี DROP TABLE → ข้อมูลหาย (ดูคำเตือนด้านบน)

### วิธีเช็ค DB ว่ามีแล้วหรือยัง (รันใน phpMyAdmin ก่อนทำอะไร)

```sql
-- เช็ค columns ทั้งหมดของแต่ละตาราง
SHOW COLUMNS FROM vehicles;
SHOW COLUMNS FROM chargers;
SHOW COLUMNS FROM bookings;
```

แล้วเปรียบเทียบ:
| ต้องมี column/ENUM | ตาราง | ถ้าไม่มี → รัน Statement # |
|--------------------|-------|--------------------------|
| `battery_current_kwh` | vehicles | Statement 1 |
| `temperature_celsius` | chargers | Statement 2 |
| `active` ใน ENUM status | bookings | Statement 3 |

> ถ้า `SHOW COLUMNS FROM bookings` แล้วเห็น status ENUM มี `'active'` อยู่แล้ว → ไม่ต้องรัน Statement 3

---

### Statement 1 — vehicles.battery_current_kwh
```sql
ALTER TABLE vehicles
  ADD COLUMN battery_current_kwh DECIMAL(6,2) DEFAULT NULL
  AFTER battery_capacity_kwh;
```
- nem อัพเดทค่านี้อัตโนมัติทุกครั้งที่ชาร์จเสร็จ
- ไม่ต้องทำอะไรฝั่ง lalla

---

### Statement 2 — chargers.temperature_celsius
```sql
ALTER TABLE chargers
  ADD COLUMN temperature_celsius DECIMAL(5,2) DEFAULT NULL
  AFTER status;
```
- **lalla ต้องทำ:** แสดงค่าใน admin charger management
- ถ้า temperature >= 60 → แสดง badge "ร้อนเกิน" สีแดง หรือ auto set `out_of_service`

---

### Statement 3 — bookings.status เพิ่ม 'active' (เพิ่มเมื่อ 2026-04-09)
```sql
ALTER TABLE bookings
  MODIFY status ENUM('pending','confirmed','active','cancelled','completed','expired')
  NOT NULL DEFAULT 'pending';
```
**ทำไมต้องมี `'active'`:**
- ตอน user กดเริ่มชาร์จ → booking เปลี่ยนจาก `confirmed` → `active`
- expire job เช็คแค่ `WHERE status = 'confirmed'` → booking ที่ชาร์จอยู่ไม่โดน expire กลางคัน
- ตอนหยุดชาร์จ → `completed`

**lalla ต้องระวัง:** ถ้ามี query ที่ดึง booking ที่กำลัง active อยู่ ต้องเพิ่ม `'active'` ด้วย:
```sql
-- booking ที่ยังไม่เสร็จ (confirmed = จอง, active = กำลังชาร์จ)
WHERE status IN ('confirmed', 'active')
```

---

## ~~ลำดับการทำงาน~~ ✅ ผ่านขั้นตอนนี้หมดแล้ว

---

## วิธีเทส API

1. รัน backend: `cd backend && nodemon server.js`
2. รัน frontend: `cd frontend && npm run dev`
3. เปิด `http://localhost:5001/api-docs` (Swagger)
4. Login ด้วย `admin@evcharge.com` / `password123` → copy token → กด Authorize → ใส่ token (ไม่ต้องพิมพ์ Bearer นำหน้า)
5. เปิดหน้า Admin: `http://localhost:3000/admin/login`

## ~~แผนงานที่เหลือ 23 endpoints~~ ✅ Backend เสร็จหมดแล้ว (อัปเดต 2026-04-12)

### ~~🔴 ลำดับ 1 — Admin Wallet (6 endpoints)~~ ✅ เสร็จแล้ว

### 🟡 ลำดับ 2 — Google Maps / Stations API (2 endpoints — ตัด 5 ที่ซ้ำซ้อนออกแล้ว)
> วิเคราะห์แล้ว: 5 จาก 7 endpoints เดิมซ้ำซ้อนกับสิ่งที่ frontend ทำได้แล้ว
> เหลือเฉพาะ 2 ที่มีเหตุผลทางเทคนิคจริง

| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 23 | GET | `/api/stations/nearby` | หาสถานีใกล้เคียงจาก lat/lng + radius (ใช้ Haversine ใน SQL + spatial index) | ✅ |
| 24 | GET | `/api/stations/:id/stats` | สถิติของสถานี (booking count, revenue, charger availability %) — ต้อง aggregate หลาย table | ✅ |

#### ❌ ตัดออก 5 endpoints — เหตุผลทางเทคนิค
| endpoint เดิม | ทำไมตัด |
|--------------|---------|
| `GET /api/stations/filter` | frontend filter เร็วกว่า — สถานี ~100 แห่งโหลดมาหมดแล้ว, filter ฝั่ง client = 0ms vs API call = 200ms+ network round-trip |
| `GET /api/stations/:id/availability` | ซ้ำกับ `GET /api/chargers/station/:id` ที่ nem มีแล้ว — return chargers พร้อม status อยู่แล้ว |
| `POST /api/distances/calculate` | Haversine formula เป็นสูตรคณิตศาสตร์ล้วน (0.001ms) — frontend คำนวณเองได้ไม่ต้องเรียก API (200ms+ round-trip) |
| `POST /api/users/:id/location` | ไม่มี table เก็บ location, ไม่มี use case จริงที่ต้อง persist user location ใน DB |
| `POST /api/locations/search` | frontend ใช้ Google Places Autocomplete SDK โดยตรง — ผ่าน backend = เพิ่ม latency ไม่มีประโยชน์ |

### ~~🟡 ลำดับ 3 — Admin Reports (6 endpoints)~~ ✅ เสร็จแล้ว

### ~~🟡 ลำดับ 4 — PDF Invoice~~ ✅ รวมอยู่ใน Reports แล้ว

### ~~🟢 ลำดับ 5 — Notification Admin (4 endpoints)~~ ✅ เสร็จแล้ว

### Admin Logs — เสร็จแล้ว ✅
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 41 | GET | `/api/admin/logs` | ดู log ทั้งหมด | ✅ |
| 42 | GET | `/api/admin/logs/:type` | filter log ตาม type | ✅ |

> รวมทั้งหมด = **43 endpoints** (43✅ — เสร็จหมดแล้ว)

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

## ⚠️ งานที่ต้องทำเพิ่ม — Wallet Admin (เพิ่มใหม่ 2026-04-08)

### Schema ที่ต้องแก้ก่อน (บอก nem ด้วย)
```sql
-- เพิ่ม type ใหม่สำหรับ admin action
ALTER TABLE wallet_transactions
  MODIFY COLUMN type ENUM('topup','deduct','refund','adjust') NOT NULL,
  ADD COLUMN reason VARCHAR(255) DEFAULT NULL,
  ADD COLUMN adjusted_by INT UNSIGNED DEFAULT NULL;

-- freeze wallet user
ALTER TABLE users
  ADD COLUMN wallet_frozen TINYINT(1) NOT NULL DEFAULT 0;
```

### Admin Wallet Endpoints (6 endpoints — lalla ทำ) — เสร็จแล้ว ✅
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 1 | GET | `/api/admin/users/:id/wallet` | ดูยอด + ประวัติ wallet ของ user | ✅ |
| 2 | GET | `/api/admin/wallet/transactions` | ดู transactions ทั้งหมดทุก user + filter | ✅ |
| 3 | GET | `/api/admin/wallet/transactions/:txnId` | ดู transaction เดียวละเอียด | ✅ |
| 4 | POST | `/api/admin/users/:id/wallet/adjust` | คืนเงิน/ปรับยอด + reason + บันทึก adjusted_by | ✅ |
| 5 | PATCH | `/api/admin/users/:id/wallet/freeze` | freeze/unfreeze wallet user | ✅ (backend only — ยังไม่มี UI) |
| 6 | GET | `/api/admin/wallet/summary` | dashboard: topup/deduct/refund รวมทั้งระบบ | ✅ |

### ทำไมต้องมี
| กรณี | admin ต้องทำอะไร |
|------|----------------|
| ตู้ดับกลางคัน ตัดเงินแล้วแต่ชาร์จไม่ครบ | adjust wallet คืนเงินบางส่วน |
| topup สำเร็จแต่ยอดไม่ขึ้น | adjust wallet เพิ่มยอดให้ |
| deduct ซ้ำ (double charge) | adjust wallet คืนเต็มจำนวน |
| สงสัย fraud | freeze wallet ระหว่างสืบสวน |

### Admin UI ที่ต้องทำ
- หน้าจัดการ wallet ใน Admin panel (ดูยอด/ประวัติ/ปรับยอด/freeze)
- แสดงยอด wallet ของ user ในหน้า UserManagePage ด้วย

---

## 🔒 Security & Stability (lalla) — อัปเดต 2026-04-18

### ✅ เสร็จแล้ว
| # | งาน | ไฟล์ | สถานะ |
|---|-----|------|-------|
| 1 | CORS จำกัด origin `localhost:3000`, `localhost:5173` + `credentials: true` | `server.js` | ✅ |
| 2 | Rate limiting login — max 10 ครั้ง / 15 นาที (`express-rate-limit`) | `server.js` | ✅ |
| 3 | JWT_SECRET เปลี่ยนเป็น random 128 ตัวอักษร | `backend/.env` | ✅ |
| 4 | Hardcoded `http://localhost:5000` ใน JSX แก้เป็น `BASE_URL` จาก api.js | `TicketManagePage.jsx`, `RefundManagePage.jsx` | ✅ |
| 5 | export `BASE_URL` จาก `api.js` เพื่อให้ทุกไฟล์ import ใช้ได้ | `utils/api.js` | ✅ |

### ⏳ ยังไม่ได้ทำ — ทำต่อ
| # | งาน | ไฟล์ | หมายเหตุ |
|---|-----|------|---------|
| 6 | Error handling frontend — เปลี่ยน `.catch(console.error)` เป็น toast แจ้ง user | ทุก page | ต้อง install `react-hot-toast` ก่อน |

---

## 🔧 Performance Optimization (lalla) — ต้องทำ

### 1. Re-import schema.sql เพื่อเพิ่ม Performance Indexes
nem เพิ่ม 12 indexes ใน `schema.sql` แล้ว — ถ้า DB ของ lalla ยังไม่มี ให้รันใน phpMyAdmin:
```sql
CREATE INDEX idx_chargers_station     ON chargers(station_id, status);
CREATE INDEX idx_bookings_user        ON bookings(user_id, status);
CREATE INDEX idx_bookings_charger     ON bookings(charger_id, status);
CREATE INDEX idx_sessions_user        ON charging_sessions(user_id, status);
CREATE INDEX idx_payments_user        ON payments(user_id, status);
CREATE INDEX idx_payments_session     ON payments(session_id);
CREATE INDEX idx_notifications_user   ON notifications(user_id, is_read);
CREATE INDEX idx_reviews_station      ON reviews(station_id);
CREATE INDEX idx_vehicles_user        ON vehicles(user_id);
CREATE INDEX idx_stations_location    ON stations(latitude, longitude);
CREATE INDEX idx_tickets_user         ON maintenance_tickets(user_id);
CREATE INDEX idx_wallet_txn_user      ON wallet_transactions(user_id);
```
**ทำไมต้องมี:** ไม่มี index = MySQL full table scan ทุก query (O(n)) → มี index = B-tree lookup (O(log n))
เช่น `WHERE user_id = 3 AND status = 'pending'` ถ้าไม่มี index ต้องอ่านทุก row ใน bookings

### 2. Pagination สำหรับ Admin List Endpoints
admin endpoints ที่ return list (GET /api/users, GET /api/bookings/all, GET /api/sessions/all) ควรเพิ่ม `LIMIT 20 OFFSET ?` + รับ `?page=1`
**ทำไม:** ถ้ามี users 1000 คน ส่ง JSON 1000 rows กลับมาทั้ง response size ใหญ่ + browser render ช้า

### 3. Logger เปลี่ยนเป็น fire-and-forget แล้ว ✅
`middleware/logger.js` เปลี่ยนจาก `await Log.create()` เป็น `Log.create().catch()` แล้ว
**ทำไม:** log ไม่ใช่ business logic — ถ้า MongoDB ช้า 50ms ไม่ควรทำให้ user รอ response ช้าไปด้วย

---

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

### สิ่งที่เสร็จแล้วเพิ่มเติม:
- ✅ middleware/logger.js — capture every request and save to MongoDB
- ✅ routes/admin/logs.js — 2 endpoints: GET /api/admin/logs, GET /api/admin/logs/:type
- ✅ bug fix: import auth + roleCheck ผิด → แก้แล้ว (2026-04-08)

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

