# nem_scope — งานของ nem (33 endpoints)

## สถานะปัจจุบัน
- Backend routes — **เทสผ่านหมดแล้ว ✅** (ทุก endpoint เทสผ่าน Swagger แล้ว)
- Frontend (UI) — **เชื่อม Backend แล้วส่วนใหญ่ ✅** (บางหน้ายังปรับอยู่)
- Frontend ที่ยังค้าง 🔄:
  - SearchPage: GPS + sort ตามระยะห่าง
  - ChargingPage: real-time kW/kWh/ค่าไฟ
  - BookingPage: ปุ่ม 🔧 แจ้งปัญหา
  - POST /api/tickets: auto-notify technician

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
| 26 | GET | `/api/payments/:id` | ดูรายการจ่ายเดียว | ✅ |

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
| `pages/user/VehicleManagePage.jsx` | ~29 | ส่ง `brand` แต่ backend ต้องการ `make` | เปลี่ยน field ให้ตรงกับ DB |

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

## ฟีเจอร์ที่ต้องทำในอนาคต

| ฟีเจอร์ | ไฟล์ | รายละเอียด |
|---------|------|------------|
| ดูรีวิวโดยไม่ต้อง login | `routes/reviews.js` | `GET /station/:stationId` ไม่มี auth แต่ตอนนี้ระบบบังคับ login ก่อนใช้งาน ต้องทำ public access ให้ได้ |

---

## วิธีเทส API

1. รัน backend: `nodemon server.js`
2. เปิด `http://localhost:5000/api-docs` (Swagger)
3. ทดสอบทีละ endpoint ตามลำดับ auth → vehicles → bookings → ...
4. อัปเดตสถานะในตารางข้างบนเป็น ✅ เมื่อผ่านแล้ว
