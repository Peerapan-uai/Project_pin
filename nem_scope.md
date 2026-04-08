# nem_scope — งานของ nem (33 endpoints + 1 พบใน code)

## สถานะปัจจุบัน
- Backend routes — **เทสผ่านหมดแล้ว ✅** (ทุก endpoint เทสผ่าน Swagger แล้ว)
- Frontend (UI) — **เชื่อม Backend แล้วครบทุกหน้า ✅**
- Wallet API — **เสร็จแล้ว ✅** (3 endpoints: balance, topup, deduct)
- Omise Credit Card — **เสร็จแล้ว ✅** (frontend ใช้ Omise.js tokenize จริง)
- Code Splitting — **เสร็จแล้ว ✅** (lazy loading ทุกหน้า)

### งานที่ยังต้องทำ (nem)
| # | งาน | ไฟล์ | สถานะ |
|---|------|------|-------|
| 1 | sessions/start เช็ค wallet balance + unpaid payment + wallet_frozen | `routes/sessions.js` | ⏳ |
| 2 | sessions/stop auto deduct จาก wallet | `routes/sessions.js` | ⏳ |
| 3 | payments refund คืนเงินเข้า wallet (ถ้า method='wallet') | `routes/payments.js` | ⏳ |
| 4 | wallet/topup + deduct เช็ค wallet_frozen | `routes/wallet.js` | ⏳ |
| 5 | Wallet UI — WalletPage (ดูยอด + เติมเงิน QR/บัตร) | `pages/user/WalletPage.jsx` | ⏳ |
| 6 | เพิ่ม Wallet เข้า BottomNav/Profile | Frontend | ⏳ |
| 7 | ChargingPage แสดง wallet balance + block ถ้าไม่พอ | `pages/user/ChargingPage.jsx` | ⏳ |
| 8 | Google Maps ไม่เสถียร | `pages/user/SearchPage.jsx` | ⏳ |

### 🔧 Performance Optimization (nem) — ต้องแก้
| # | ไฟล์ | ปัญหา | วิธีแก้ | ประหยัดได้ |
|---|------|-------|---------|-----------|
| 1 | `routes/sessions.js` (stop) | N+1 query — UPDATE charger, UPDATE booking, INSERT payment ทำทีละอัน sequential | ใช้ `Promise.all()` ยิง 3 queries พร้อมกัน (ไม่ depend กัน) | ~15ms ต่อ request |
| 2 | `routes/chargers.js` (GET /:id) | query charger แล้ว query station แยก = 2 round-trips ไป DB | ใช้ `JOIN stations ON chargers.station_id = stations.station_id` รวมเป็น query เดียว | ~200ms (ตัด network round-trip ไป DB 1 รอบ) |
| 3 | `routes/notifications.js` (GET) | ดึง notification ทั้งหมดไม่มี LIMIT — ถ้า user มี 500+ แจ้งเตือนก็ส่งหมด | เพิ่ม `LIMIT 20` + `SELECT COUNT(*) WHERE is_read = 0` แยก query นับ unread | ลด payload จาก 500 rows → 20 rows + unread count |
| 4 | `routes/bookings.js` (GET) | ดึง booking ทั้งหมดของ user ไม่มี LIMIT | เพิ่ม `LIMIT 20 OFFSET ?` + รับ `?page=1` จาก query string | ลด payload, หน้า FE โหลดเร็วขึ้น |

---

## ความรับผิดชอบ
nem ดูแล API ฝั่ง user ทั้งหมด ตั้งแต่ auth ไปจนถึง notification

| กลุ่ม | จำนวน |
|-------|-------|
| Auth (register, login, logout) | 3 |
| Profile (GET, PUT) | 2 |
| Vehicles (CRUD) | 5 |
| Stations GET อย่างเดียว | 2 |
| Chargers GET อย่างเดียว | 2 |
| Bookings (จอง/ดู/ยกเลิก/queue) | 5 |
| Sessions (start/stop/history/status) | 4 |
| Payments (จ่าย/ประวัติ/รายการเดียว) | 3 |
| Reviews (POST/GET/DELETE) | 3 |
| Tickets (POST สร้างอย่างเดียว) | 1 |
| Notifications (GET/read-all/read) | 3 |
| **รวม** | **33** |

---

## API ที่ nem ต้องเขียน (33 endpoints)

### Auth (3)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 1 | POST | `/api/auth/register` | สมัครสมาชิก | ✅ |
| 2 | POST | `/api/auth/login` | เข้าสู่ระบบ → return JWT | ✅ |
| 3 | POST | `/api/auth/logout` | ออกจากระบบ | ✅ |

### Profile (2)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 4 | GET | `/api/users/profile` | ดูโปรไฟล์ตัวเอง | ✅ |
| 5 | PUT | `/api/users/profile` | แก้ชื่อ/เบอร์/รหัสผ่าน | ✅ |

### Vehicles (5)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 6 | GET | `/api/vehicles` | ดูรถของตัวเอง | ✅ |
| 7 | GET | `/api/vehicles/:id` | ดูรถคันเดียว | ✅ |
| 8 | POST | `/api/vehicles` | เพิ่มรถ | ✅ |
| 9 | PUT | `/api/vehicles/:id` | แก้ข้อมูลรถ | ✅ |
| 10 | DELETE | `/api/vehicles/:id` | ลบรถ | ✅ |

### Stations & Chargers — อ่านอย่างเดียว (4)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 11 | GET | `/api/stations` | ดูสถานีทั้งหมด | ✅ |
| 12 | GET | `/api/stations/:id` | ดูสถานีเดียว + ตู้ชาร์จ | ✅ |
| 13 | GET | `/api/chargers/station/:id` | ดูตู้ชาร์จในสถานี | ✅ |
| 14 | GET | `/api/chargers/:id` | ดูตู้ชาร์จตัวเดียว | ✅ |

### Bookings (5)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 15 | POST | `/api/bookings` | จองตู้ชาร์จ | ✅ |
| 16 | GET | `/api/bookings` | ดูประวัติการจองของตัวเอง | ✅ |
| 17 | GET | `/api/bookings/queue/:chargerId` | ดู queue | ✅ |
| 18 | GET | `/api/bookings/:id` | ดูการจองเดียว | ✅ |
| 19 | PATCH | `/api/bookings/:id/cancel` | ยกเลิกการจอง | ✅ |

### Sessions (4)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 20 | POST | `/api/sessions/start` | เริ่มชาร์จ | ✅ |
| 21 | PATCH | `/api/sessions/:id/stop` | หยุดชาร์จ + คำนวณค่าใช้จ่าย | ✅ |
| 22 | GET | `/api/sessions/history` | ดูประวัติการชาร์จ | ✅ |
| 23 | GET | `/api/sessions/:id/status` | เช็คสถานะ session | ✅ |

### Payments (3)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 24 | POST | `/api/payments` | บันทึกการจ่ายเงิน | ✅ |
| 25 | GET | `/api/payments/history` | ดูประวัติการจ่าย | ✅ |
| 26 | GET | `/api/payments/:id` | ดูรายการจ่ายเดียว | ✅ (แก้ bug route ผิดแล้ว) |

### Reviews (3)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 27 | POST | `/api/reviews` | รีวิวสถานี | ✅ |
| 28 | GET | `/api/reviews/station/:id` | ดูรีวิวของสถานี | ✅ |
| 29 | DELETE | `/api/reviews/:id` | ลบรีวิวของตัวเอง | ✅ |

### Tickets — แค่สร้าง (1)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 30 | POST | `/api/tickets` | แจ้งปัญหา | ✅ |

### Notifications (3)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 31 | GET | `/api/notifications` | ดูการแจ้งเตือน | ✅ |
| 32 | PATCH | `/api/notifications/read-all` | อ่านทั้งหมด | ✅ |
| 33 | PATCH | `/api/notifications/:id/read` | อ่านทีละอัน | ✅ |

---

## Bug ที่รู้แล้วใน draft route files (ต้องแก้)

| ไฟล์ | บรรทัด | ปัญหา | วิธีแก้ |
|------|--------|-------|---------|
| `routes/users.js` | ~34 | `SELECT name` → ไม่มี column นี้ | ✅ แก้แล้ว |
| `routes/users.js` | ~81 | `UPDATE SET name = ?` → error | ✅ แก้แล้ว |
| `routes/bookings.js` | ~145 | `u.name AS user_name` → ไม่มี column | ✅ แก้แล้ว |
| `routes/reviews.js` | ~117 | `u.name AS reviewer_name` → ไม่มี column | เปลี่ยนเป็น `CONCAT(u.first_name, ' ', u.last_name)` |
| `pages/user/VehicleManagePage.jsx` | ~29 | ~~ส่ง `brand` แต่ backend ต้องการ `make`~~ | ✅ ไม่ใช่ bug — ทั้ง schema, backend, frontend ใช้ `brand` ถูกต้อง |
| `routes/payments.js` | 149 | route ชื่อ `/all` แต่ logic ใช้ `req.params.id` → ควรเป็น `/:id` | ✅ แก้แล้ว (lalla แก้ให้) |
| `routes/payments.js` | 173 | `router.get('/all')` ซ้ำและไม่มี handler | ✅ แก้แล้ว (lalla แก้ให้) |

---

## สิ่งที่ต้องรอ lalla ก่อน

| รอสิ่งนี้ | เพราะ |
|-----------|-------|
| Table `users` | ต้องมีก่อนถึง register/login ได้ |
| Table `vehicles` | ต้องมีก่อนถึงเพิ่มรถได้ |
| Table `stations`, `chargers` | ต้องมีก่อนถึง query ได้ |
| Table `bookings`, `charging_sessions` | ต้องมีก่อนถึงจองได้ |
| Table `notifications` | ต้องมีก่อนถึงดึง notification ได้ |
| ชื่อ column ที่ตกลงกัน | เขียน query ผิดจะ error ทุกอัน |

---

## ⚠️ ห้ามแตะเด็ดขาด — ของ lalla

### Routes ที่ห้ามแก้
| Route | เพราะ |
|-------|-------|
| `routes/users.js` — GET all, PATCH ban, POST technician | admin only ของ lalla |
| `routes/stations.js` — POST, PUT, DELETE | admin only ของ lalla |
| `routes/chargers.js` — POST, PUT, PATCH status | admin/tech ของ lalla |
| `routes/tickets.js` — PATCH assign, PATCH status, POST image | admin/tech ของ lalla |

### หน้า Frontend ที่ห้ามแก้
- `pages/admin/` ทุกไฟล์ → ของ lalla
- `pages/tech/` ทุกไฟล์ → ของ lalla

### จุดที่ระวังชนกัน
- `routes/tickets.js` — nem ทำแค่ POST lalla ทำที่เหลือ อย่าแก้ทั้งไฟล์
- `routes/bookings.js` — nem ทำ user bookings lalla ทำ admin GET all อย่าแก้ทับ
- `middleware/auth.js` — ใช้ร่วมกัน ถ้าจะแก้ต้องบอกกันก่อน
- `server.js` — ใช้ร่วมกัน ถ้าจะเพิ่ม route ใหม่ต้องบอกกันก่อน

---

## endpoint ที่พบใน code แต่ไม่อยู่ใน scope เดิม

| ไฟล์ | Method | Path | หมายเหตุ |
|------|--------|------|---------|
| `routes/users.js` | DELETE | `/api/users/profile` | มีอยู่ใน code — ลบ profile ตัวเอง |

## Background Job ที่มีอยู่ในระบบ

| ไฟล์ | หน้าที่ | รายละเอียด |
|------|---------|-----------|
| `jobs/expireBookings.js` | หมดอายุ booking อัตโนมัติ | ทุก 1 นาที ตรวจ booking ที่ confirmed > 30 นาที → set status = 'expired' + คืนตู้ชาร์จเป็น available |
| `jobs/expirePayments.js` | หมดอายุ payment อัตโนมัติ ✅ | ทุก 1 นาที ตรวจ payment pending > 15 นาที → set status = 'failed' |

> รวม nem ใน code จริง = **54 endpoints** (51 เดิม + 3 wallet ใหม่)

### Wallet API — เพิ่ม 3 (nem รับผิดชอบทั้งหมด)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 52 | GET | `/api/wallet/balance` | ดูยอด wallet + 10 รายการล่าสุด | ✅ |
| 53 | POST | `/api/wallet/topup` | เติมเงิน wallet (promptpay/credit_card) ขั้นต่ำ 20 บาท | ✅ |
| 54 | POST | `/api/wallet/deduct` | ตัดเงินจาก wallet ตอนชาร์จเสร็จ | ✅ |

---

## API ที่ต้องทำในอนาคต — เพิ่ม nem จาก 34 → 51 endpoints

> ยังไม่ได้ทำ รอหลังจากอาจารย์ database ดูงานก่อน
> อัปเดตล่าสุด: 2026-04-07

### Payment จริง — เพิ่ม 14 (nem รับผิดชอบทั้งหมด)
> ตัดสินใจแล้ว: nem ทำ payment ทั้งหมด (Option 1 - Monolith style)
> 3 endpoints แรก (35-37) มีแล้ว ✅ แต่นับรวมเพื่อให้เห็น payment flow ครบ

| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 35 | POST | `/api/payments` | บันทึกการจ่ายเงิน (สร้าง payment record) | ✅ |
| 36 | GET | `/api/payments/history` | ดูประวัติการจ่ายทั้งหมดของตัวเอง | ✅ |
| 37 | GET | `/api/payments/:id` | ดูรายการจ่ายเดียว | ✅ |
| 38 | POST | `/api/payments/qr` | generate PromptPay QR Code จริง (ใช้ npm promptpay-qr) | ✅ |
| 39 | POST | `/api/payments/charge` | จ่ายด้วยบัตรเครดิต/เดบิต ผ่าน Omise API | ✅ |
| 40 | PATCH | `/api/payments/:id/confirm` | user confirm ว่าสแกน QR จ่ายแล้ว | ✅ |
| 41 | GET | `/api/payments/:id/status` | check สถานะ payment | ✅ |
| 42 | POST | `/api/payments/webhook/omise` | รับ webhook จาก Omise (card charge success/fail) | ✅ |
| 43 | POST | `/api/payments/webhook/promptpay` | รับ webhook จากธนาคาร (QR transfer success) | ✅ |
| 44 | GET | `/api/payments/admin/all` | admin ดูรายการจ่ายทั้งหมด | ✅ |
| 45 | GET | `/api/payments/admin/:id` | admin ดูรายการจ่ายเดียว | ✅ |
| 46 | POST | `/api/payments/:id/refund` | admin คืนเงิน | ✅ |
| 47 | GET | `/api/payments/:id/refunds` | ดูประวัติการคืนเงิน | ✅ |
| 48 | DELETE | `/api/payments/:id/cancel` | admin ยกเลิก payment ที่ pending | ✅ |

หมายเหตุ: API เขียนเสร็จหมดแล้ว ✅ — เหลือแค่เชื่อม frontend:
- PromptPay QR: ต้องสมัคร npm `promptpay-qr` + `qrcode`
- Omise: ต้องสมัคร account ที่ omise.co → ใส่ test API key
- Webhook: ต้อง expose localhost ด้วย ngrok ตอนเทส

### Notifications user — 3 endpoints (มีแล้ว ✅)
> อยู่ใน 34 endpoints ที่ทำเสร็จแล้ว แต่นับรวมเพื่อให้ครบ 51

| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 49 | GET | `/api/notifications` | ดูการแจ้งเตือนของตัวเอง | ✅ |
| 50 | PATCH | `/api/notifications/read-all` | อ่านทั้งหมด | ✅ |
| 51 | PATCH | `/api/notifications/:id/read` | อ่านทีละอัน | ✅ |

### Auto-notify Technician — เพิ่ม Logic (ไม่ใช่ endpoint ใหม่)
| งาน | ไฟล์ | รายละเอียด | สถานะ |
|-----|------|------------|-------|
| POST /api/tickets: auto-notify ช่าง | `routes/tickets.js` | เมื่อ user สร้าง ticket → INSERT notification ให้ช่างทุกคนอัตโนมัติ | ✅ |

> รวมถ้าทำครบ = **51 endpoints** ✅

---

## ฟีเจอร์ Frontend ที่ต้องทำในอนาคต

> ยังไม่ได้ทำ รอหลังจากอาจารย์ database ดูงานก่อน

| ฟีเจอร์ | ไฟล์ | รายละเอียด | สถานะ |
|---------|------|------------|-------|
| SearchPage: GPS + sort ระยะห่าง | `pages/user/SearchPage.jsx` | useGeolocation hook + fetchNearby + formatDistance | ✅ |
| SearchPage: Google Maps แสดงแผนที่ | `pages/user/SearchPage.jsx` | ใช้ `@react-google-maps/api` + pin สถานี | ⏳ |
| ChargingPage: real-time kW/kWh/ค่าไฟ | `pages/user/ChargingPage.jsx` | polling 10s + tick timer 1s คำนวณ kWh/cost live | ✅ |
| BookingPage: ปุ่ม 🔧 แจ้งปัญหา | `pages/user/BookingPage.jsx` | navigate `/report` พร้อม pre-fill chargerId + stationId | ✅ |
| PaymentPage: PromptPay QR จริง | `pages/user/PaymentPage.jsx` | เรียก `POST /api/payments/qr` → แสดง QR ให้ user สแกน | ✅ |
| PaymentPage: บัตรเครดิต/เดบิต | `pages/user/PaymentPage.jsx` | ใช้ Omise.js tokenize บัตร → ส่ง token ไป `POST /api/payments/charge` | ✅ |
| ดูรีวิวโดยไม่ต้อง login | `routes/reviews.js` | `GET /station/:stationId` ไม่มี auth middleware แล้ว | ✅ |

---

## วิธีเทส API

1. รัน backend: `nodemon server.js`
2. เปิด `http://localhost:5000/api-docs` (Swagger)
3. ทดสอบทีละ endpoint ตามลำดับ auth → vehicles → bookings → ...
4. อัปเดตสถานะในตารางข้างบนเป็น ✅ เมื่อผ่านแล้ว
