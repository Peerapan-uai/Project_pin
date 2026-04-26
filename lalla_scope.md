# lalla_scope — งานของ lalla + สิ่งที่ nem เพิ่มมา

## 🔴 Claude อ่านก่อน — ห้ามทำ 2 อย่างนี้เด็ดขาด

> **ห้าม import / re-import schema.sql ใหม่ทั้งไฟล์**
> เพราะ schema.sql มี `DROP TABLE IF EXISTS` ทุกตาราง → ข้อมูลในระบบหายหมด
>
> **ถ้า DB ต้องการ schema ใหม่** → ใช้ไฟล์ `backend/LALLA_MIGRATION.sql` เท่านั้น (ดู section ด้านล่าง)

---

## ⚠️ nem เพิ่ม 14 Features ใหม่ — lalla ต้องรัน migration ก่อน (สำคัญมาก)

**อัปเดต: 2026-04-26** — nem ทำ Phase 1+2+3 เสร็จครบ 14 features

### วิธีรัน migration (ทำครั้งเดียวก็พอ)
1. เปิด phpMyAdmin → เลือก DB → SQL tab
2. เปิดไฟล์ `backend/LALLA_MIGRATION.sql`
3. Copy ทีละ block แล้วกด Go
4. ถ้า error "Duplicate column" / "Table already exists" → ข้ามได้ ไม่ใช่ error จริง (ใช้ `IF NOT EXISTS` อยู่แล้ว)

### Tables ใหม่ที่ nem เพิ่ม
| Table | ใช้ทำอะไร |
|-------|----------|
| `user_favorites` | user กด heart บันทึกสถานีโปรด |
| `point_balances` | ยอดแต้มสะสมของ user |
| `point_transactions` | ประวัติได้/ใช้แต้ม (earn/redeem/expire/adjust) |
| `tariffs` | TOU pricing (on_peak/off_peak) แต่ละตู้ |
| `recurring_schedules` | ตารางจองประจำ (รายสัปดาห์) |
| `booking_skip_dates` | วันที่ skip ใน recurring schedule |

### Columns ใหม่ในตารางเดิม
| ตาราง | Column ใหม่ | หมายเหตุ |
|-------|------------|---------|
| `chargers` | `idle_fee_enabled` | 0=auto-stop, 1=idle fee mode |
| `chargers` | `max_temperature_celsius` | threshold overheat (default 60) |
| `users` | `outstanding_debt` | หนี้ค้างจ่าย (idle fee/cancel fee) |
| `users` | `wallet_frozen` | freeze wallet เมื่อมีหนี้ |
| `users` | `freeze_reason` | เหตุผล freeze |
| `bookings` | `scheduled_start` | เวลาจองล่วงหน้า |
| `bookings` | `duration_min` | ระยะเวลาที่จอง (นาที) |
| `bookings` | `recurring_schedule_id` | FK → recurring_schedules |
| `charging_sessions` | `full_charge_time` | เวลาที่แบต = 100% |
| `charging_sessions` | `idle_start_time` | เริ่มนับ idle fee |
| `charging_sessions` | `idle_end_time` | จบ idle fee |
| `charging_sessions` | `idle_fee` | ค่า idle fee ที่เก็บได้ |

### Routes ใหม่ที่ nem เพิ่มใน server.js
```
/api/points           → routes/points.js
/api/recurring-bookings → routes/recurringBookings.js
/api/trip-plan        → routes/tripPlan.js
```

### Endpoints ใหม่ในไฟล์เดิม
| Route | Endpoint ใหม่ | หน้าที่ |
|-------|--------------|---------|
| `routes/bookings.js` | `GET /suggest-recurring` | แนะนำ recurring slot จากประวัติ |
| `routes/bookings.js` | `PATCH /:id/cancel` | user cancel + เก็บ ฿20 ถ้า < 60 นาที |
| `routes/chargers.js` | `GET /:id/available-slots` | ดู slot ว่างในวันที่เลือก |
| `routes/sessions.js` | `POST /:id/notify-milestone` | แจ้งเตือน 80%/100% |
| `routes/sessions.js` | `POST /:id/unplug` | user ยืนยัน unplug → commit idle fee |

### Cron Jobs ใหม่
| ไฟล์ | ทำงานทุก | หน้าที่ |
|------|---------|---------|
| `jobs/idleFeeAutoStop.js` | 1 นาที | เริ่ม idle fee หลัง grace 5 นาที (Mode B) |
| `jobs/recurringBookingsGen.js` | วันอาทิตย์ 00:00 | สร้าง booking จาก recurring_schedules 4 สัปดาห์ล่วงหน้า |

### ไฟล์ใหม่ทั้งหมดของ nem
```
backend/routes/points.js
backend/routes/recurringBookings.js
backend/routes/tripPlan.js
backend/jobs/idleFeeAutoStop.js
backend/jobs/recurringBookingsGen.js
backend/LALLA_MIGRATION.sql        ← รันนี้ก่อน!
frontend/src/pages/user/PointsPage.jsx
frontend/src/pages/user/RecurringSchedulePage.jsx
```

---

## สถานะปัจจุบัน (อัปเดต 2026-04-26)

| งาน | สถานะ |
|-----|-------|
| Database MySQL schema | ✅ |
| Database MongoDB (Logs) | ✅ |
| Backend routes admin/tech (43 endpoints) | ✅ |
| Frontend admin/tech | ✅ |
| nem: 14 user features (Phase 1+2+3) | ✅ |
| Migration script สำหรับ lalla | ✅ `backend/LALLA_MIGRATION.sql` |

---

## สรุป endpoints ทั้งหมดของ lalla
| กลุ่ม | จำนวน | สถานะ |
|-------|-------|-------|
| Users, Stations, Chargers, Tickets, Bookings, Payments, Sessions, Dashboard | 22 | ✅ |
| User detail (GET /:id) | 1 | ✅ |
| Nearby stations + stats | 2 | ✅ |
| Admin Logs | 2 | ✅ |
| Admin Wallet | 6 | ✅ |
| Admin Reports + PDF Invoice | 6 | ✅ |
| Admin Notifications (รวม schedule) | 4 | ✅ |
| **รวมทั้งหมด** | **43** | 43✅ |

---

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

## API ที่ lalla ทำ (43 endpoints) — เสร็จครบ ✅

### Users — Admin only (4)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/users` | ดู user ทั้งหมด |
| PATCH | `/api/users/:id/ban` | ban/unban user |
| POST | `/api/users/technician` | สร้าง account ช่าง |
| PUT | `/api/users/:id` | admin แก้ข้อมูล user/ช่าง |

### Stations — Admin only (3)
| Method | Path | หน้าที่ |
|--------|------|---------|
| POST | `/api/stations` | เพิ่มสถานีใหม่ |
| PUT | `/api/stations/:id` | แก้ข้อมูลสถานี |
| DELETE | `/api/stations/:id` | soft delete สถานี |

### Chargers — Admin/Tech (5)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/chargers` | ดูตู้ชาร์จทั้งหมด (admin) |
| POST | `/api/chargers` | เพิ่มตู้ชาร์จ |
| PUT | `/api/chargers/:id` | แก้ข้อมูลตู้ชาร์จ |
| PATCH | `/api/chargers/:id/status` | เปลี่ยนสถานะ |
| DELETE | `/api/chargers/:id` | soft delete ตู้ชาร์จ |

### Tickets — Admin/Tech (4)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/tickets` | ดู ticket ทั้งหมด |
| PATCH | `/api/tickets/:id/assign` | assign ticket ให้ช่าง |
| PATCH | `/api/tickets/:id/status` | update สถานะ ticket |
| POST | `/api/tickets/:id/image` | อัพโหลดรูป repair_image |

### Bookings — Admin only (2)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/bookings/all` | ดู booking ทุกคน (admin view) |
| PATCH | `/api/bookings/:id/admin-cancel` | admin ยกเลิก booking |

### Payments — Admin only (1)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/payments/admin/all` | ดูรายการจ่ายเงินทั้งหมด |

### Sessions — Admin only (1)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/sessions/all` | ดู charging session ทุกคน |

### Dashboard Stats (1)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/admin/stats` | สถิติ dashboard |

### Nearby + Stats (2)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/stations/nearby` | หาสถานีใกล้เคียง (Haversine) |
| GET | `/api/stations/:id/stats` | สถิติสถานี |

### Admin Logs (2)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/admin/logs` | ดู log ทั้งหมด |
| GET | `/api/admin/logs/:type` | filter log ตาม type |

### Admin Wallet (6)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/admin/users/:id/wallet` | ยอด + ประวัติ wallet |
| GET | `/api/admin/wallet/transactions` | transactions ทั้งหมด |
| GET | `/api/admin/wallet/transactions/:txnId` | transaction เดียว |
| POST | `/api/admin/users/:id/wallet/adjust` | ปรับยอด + reason |
| PATCH | `/api/admin/users/:id/wallet/freeze` | freeze/unfreeze |
| GET | `/api/admin/wallet/summary` | dashboard summary |

### Admin Reports (6)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/admin/reports/revenue` | รายได้ |
| GET | `/api/admin/reports/bookings` | สถิติการจอง |
| GET | `/api/admin/reports/users` | สถิติ user |
| GET | `/api/admin/reports/chargers` | สถิติตู้ชาร์จ |
| GET | `/api/admin/reports/export` | export CSV |
| GET | `/api/payments/:id/invoice` | PDF Invoice |

### Admin Notifications (4)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/admin/notifications` | ดูทั้งหมด |
| POST | `/api/admin/notifications` | ส่งประกาศ |
| POST | `/api/admin/notifications/schedule` | ตั้งเวลาส่ง |
| DELETE | `/api/admin/notifications/:id` | ลบ |

---

## ⚠️ ห้ามแตะเด็ดขาด — ของ nem

### Routes ที่ห้ามแก้
| Route | เพราะ |
|-------|-------|
| `routes/auth.js` | register/login ของ nem |
| `routes/vehicles.js` | CRUD รถของ user |
| `routes/bookings.js` — ยกเว้น GET all admin | user booking + cancel + suggest-recurring |
| `routes/sessions.js` | start/stop/notify-milestone/unplug ของ nem |
| `routes/payments.js` | payment ของ nem |
| `routes/reviews.js` | review ของ nem |
| `routes/notifications.js` | notification ของ nem |
| `routes/tickets.js` — เฉพาะ POST | user แจ้งปัญหา |
| `routes/points.js` | reward points ของ nem |
| `routes/recurringBookings.js` | recurring schedule ของ nem |
| `routes/tripPlan.js` | trip planning ของ nem |

### หน้า Frontend ที่ห้ามแก้
- `pages/user/` ทุกไฟล์ → ของ nem
- `pages/shared/` (Login, Register) → ของ nem
- `context/AuthContext.jsx` → ของ nem
- `utils/api.js` → ถ้าจะแก้ต้องบอก nem ก่อน

### จุดที่ระวังชนกัน
- `routes/tickets.js` — nem ทำแค่ POST ส่วนที่เหลือของ lalla อย่า overwrite ทั้งไฟล์
- `routes/bookings.js` — nem เพิ่ม `suggest-recurring`, `cancel` (fee logic) อย่าแก้ทับ
- `routes/chargers.js` — nem เพิ่ม `GET /:id/available-slots` อย่าลบทิ้ง
- `routes/sessions.js` — nem เพิ่ม `notify-milestone`, `unplug` อย่าลบทิ้ง
- `routes/stations.js` — nem ทำ GET (อ่าน) lalla ทำ POST/PUT/DELETE อย่าแก้ GET ทิ้ง
- `middleware/auth.js` — ใช้ร่วมกัน ถ้าจะแก้ต้องบอกกันก่อน
- `server.js` — nem เพิ่ม routes: `/api/points`, `/api/recurring-bookings`, `/api/trip-plan` แล้ว อย่า overwrite

---

## ระบบ Refund Request — เสร็จแล้ว ✅

| Method | Path | หน้าที่ |
|--------|------|---------|
| POST | `/api/payments/:id/refund-request` | user ส่งขอคืนเงิน |
| GET | `/api/admin/refunds?status=pending` | admin ดูรายการ |
| POST | `/api/admin/refunds/:id/approve` | approve → คืนเงินเข้า wallet |
| POST | `/api/admin/refunds/:id/reject` | reject + reason + notification |

- รูปแนบเก็บที่ `backend/uploads/refunds/`
- FE: `PaymentHistoryPage.jsx` (user), `RefundManagePage.jsx` (admin)

---

## Soft Delete (Recycle Bin) — เสร็จแล้ว ✅

- `users`, `stations`, `chargers` มี column `deleted_at DATETIME NULL`
- DELETE endpoints ทั้งหมดเป็น Soft Delete (`UPDATE SET deleted_at = NOW()`)
- `PATCH /:id/restore` กู้คืนได้
- `backend/routes/admin/trash.js` — 9 endpoints GET/restore/permanent
- FE: `TrashPage.jsx` + route `/admin/trash` + menu "Recycle Bin" ใน Sidebar

---

## MongoDB — Log System (NoSQL)

| ไฟล์ | หน้าที่ |
|------|---------|
| `config/mongodb.js` | เชื่อม MongoDB |
| `models/Log.js` | Mongoose schema |
| `middleware/logger.js` | บันทึกทุก request อัตโนมัติ (fire-and-forget) |
| `docker-compose.yml` | MongoDB container + Mongo Express (`localhost:8082`) |
| `routes/admin/logs.js` | GET /api/admin/logs, GET /api/admin/logs/:type |

- TTL index 90 วัน (auto-delete log เก่า)
- Mongo Express ไม่มี auth → `ME_CONFIG_BASICAUTH: "false"` (ค่อยแก้ก็ได้)

---

## 🔒 Security & Stability

| # | งาน | สถานะ |
|---|-----|-------|
| 1 | CORS จำกัด origin `localhost:3000`, `localhost:5173` | ✅ |
| 2 | Rate limiting login — max 10 ครั้ง / 15 นาที | ✅ |
| 3 | JWT_SECRET เปลี่ยนเป็น random 128 ตัวอักษร | ✅ |
| 4 | `BASE_URL` export จาก `api.js` แทน hardcoded localhost | ✅ |
| 5 | Error handling frontend — toast แทน console.error | ⏳ |

---

## Performance Indexes — รันใน phpMyAdmin ถ้ายังไม่มี

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

---

## วิธีเทส API

1. รัน backend: `cd backend && nodemon server.js`
2. รัน frontend: `cd frontend && npm run dev`
3. เปิด `http://localhost:5001/api-docs` (Swagger)
4. Login ด้วย `admin@evcharge.com` / `password123` → copy token → กด Authorize → ใส่ token (ไม่ต้องพิมพ์ Bearer นำหน้า)
5. เปิดหน้า Admin: `http://localhost:3000/admin/login`

---

## วิธีให้ Claude สอน (สำหรับ lalla)

- ครอบ code ที่อยากเข้าใจแล้วบอกว่า "อธิบายที่ครอบไว้"
- ถามได้เลยถ้าไม่เข้าใจ: "destructuring คืออะไร", "ทำไมต้องมี async await"
- ให้ Claude เช็ค bug ก่อนแก้เองเสมอ แล้วค่อยถามว่าทำไมต้องแก้
