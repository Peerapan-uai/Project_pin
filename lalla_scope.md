# งานของเพื่อน — Database + Admin/Tech API (15 endpoints)

## ความรับผิดชอบหลัก
ดูแล Database schema ทั้งหมด + API ฝั่ง Admin และ Technician

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

## API ที่เพื่อนทำ (13 endpoints)

### Users — Admin only (3)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/users` | ดู user ทั้งหมดในระบบ |
| PATCH | `/api/users/:id/ban` | ban/unban user |
| POST | `/api/users/technician` | สร้าง account ช่าง |

### Stations — Admin only (3)
| Method | Path | หน้าที่ |
|--------|------|---------|
| POST | `/api/stations` | เพิ่มสถานีใหม่ |
| PUT | `/api/stations/:id` | แก้ข้อมูลสถานี |
| DELETE | `/api/stations/:id` | ลบสถานี |

### Chargers — Admin/Tech (3)
| Method | Path | หน้าที่ |
|--------|------|---------|
| POST | `/api/chargers` | เพิ่มตู้ชาร์จ |
| PUT | `/api/chargers/:id` | แก้ข้อมูลตู้ชาร์จ |
| PATCH | `/api/chargers/:id/status` | เปลี่ยนสถานะ (available/in_use/maintenance) |

### Tickets — Admin/Tech (4)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/tickets` | ดู ticket ทั้งหมด (admin เห็นทุกอัน, ช่างเห็นของตัวเอง) |
| PATCH | `/api/tickets/:id/assign` | assign ticket ให้ช่าง |
| PATCH | `/api/tickets/:id/status` | update สถานะ ticket |
| POST | `/api/tickets/:id/image` | อัพโหลดรูปประกอบ |

### Bookings — Admin only (1)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/bookings/all` | ดู booking ทุกคนในระบบ (admin view) |

### Dashboard Stats — Admin only (1)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/admin/stats` | ดึงสถิติรวม (จำนวน user, booking วันนี้, รายได้, ตู้มีปัญหา) |

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
