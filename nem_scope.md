# งานของฉัน — User API (29 endpoints)

## ความรับผิดชอบหลัก
ฉันดูแล API ฝั่ง user ทั้งหมด ตั้งแต่สมัคร/login ไปจนถึงจอง ชาร์จ จ่ายเงิน และแจ้งปัญหา

---

## API ที่ฉันทำ

### Auth (3)
| Method | Path | หน้าที่ |
|--------|------|---------|
| POST | `/api/auth/register` | สมัครสมาชิก |
| POST | `/api/auth/login` | เข้าสู่ระบบ → return JWT |
| POST | `/api/auth/logout` | ออกจากระบบ |

### Profile (2)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/users/profile` | ดูโปรไฟล์ตัวเอง |
| PUT | `/api/users/profile` | แก้ชื่อ/เบอร์/รหัสผ่าน |

### Vehicles (5)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/vehicles` | ดูรถของตัวเอง |
| GET | `/api/vehicles/:id` | ดูรถคันเดียว |
| POST | `/api/vehicles` | เพิ่มรถ |
| PUT | `/api/vehicles/:id` | แก้ข้อมูลรถ |
| DELETE | `/api/vehicles/:id` | ลบรถ |

### Stations & Chargers (4) — อ่านอย่างเดียว
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/stations` | ดูสถานีทั้งหมด |
| GET | `/api/stations/:id` | ดูสถานีเดียว |
| GET | `/api/chargers/station/:id` | ดูตู้ชาร์จในสถานี |
| GET | `/api/chargers/:id` | ดูตู้ชาร์จตัวเดียว |

### Bookings (5)
| Method | Path | หน้าที่ |
|--------|------|---------|
| POST | `/api/bookings` | จองตู้ชาร์จ |
| GET | `/api/bookings` | ดูประวัติการจอง |
| GET | `/api/bookings/queue/:chargerId` | ดู queue |
| GET | `/api/bookings/:id` | ดูการจองเดียว |
| PATCH | `/api/bookings/:id/cancel` | ยกเลิกการจอง |

### Sessions (4)
| Method | Path | หน้าที่ |
|--------|------|---------|
| POST | `/api/sessions/start` | เริ่มชาร์จ |
| PATCH | `/api/sessions/:id/stop` | หยุดชาร์จ + คำนวณค่าใช้จ่าย |
| GET | `/api/sessions/history` | ดูประวัติการชาร์จ |
| GET | `/api/sessions/:id/status` | เช็คสถานะ session |

### Payments (3)
| Method | Path | หน้าที่ |
|--------|------|---------|
| POST | `/api/payments` | บันทึกการจ่ายเงิน |
| GET | `/api/payments/history` | ดูประวัติการจ่าย |
| GET | `/api/payments/:id` | ดูรายการจ่ายเดียว |

### Reviews (3)
| Method | Path | หน้าที่ |
|--------|------|---------|
| POST | `/api/reviews` | รีวิวสถานี |
| GET | `/api/reviews/station/:id` | ดูรีวิวของสถานี |
| DELETE | `/api/reviews/:id` | ลบรีวิวของตัวเอง |

### Tickets — แค่สร้าง (1)
| Method | Path | หน้าที่ |
|--------|------|---------|
| POST | `/api/tickets` | แจ้งปัญหา |

### Notifications (3)
| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/api/notifications` | ดูการแจ้งเตือน |
| PATCH | `/api/notifications/read-all` | อ่านทั้งหมด |
| PATCH | `/api/notifications/:id/read` | อ่านทีละอัน |

---

## ⚠️ ห้ามแตะเด็ดขาด — ของเพื่อน (lalla)

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

### Database
- ห้ามแก้ `schema.sql` หรือ table structure โดยไม่บอก lalla ก่อน
- ถ้าต้องการ column เพิ่ม → คุยกันก่อน แล้วให้ lalla แก้ schema

### จุดที่ระวังชนกัน
- `routes/tickets.js` — ฉันทำแค่ POST (สร้าง) lalla ทำที่เหลือ อย่าแก้ทั้งไฟล์
- `routes/bookings.js` — ฉันทำ user bookings lalla ทำ admin GET all อย่าแก้ทับกัน
- `middleware/auth.js` — ใช้ร่วมกัน ถ้าจะแก้ต้องบอกกันก่อน

---

## สิ่งที่ต้องรอเพื่อนก่อน

| รอสิ่งนี้ | เพราะ |
|-----------|-------|
| Table `users` | ต้องมีก่อนถึง register/login ได้ |
| Table `vehicles` | ต้องมีก่อนถึงเพิ่มรถได้ |
| Table `stations`, `chargers` | ต้องมีก่อนถึง query ได้ |
| Table `bookings`, `sessions` | ต้องมีก่อนถึงจองได้ |
| Table `notifications` | ต้องมีก่อนถึงดึง notification ได้ |

**สรุป: ต้องรอ schema จากเพื่อนก่อน แล้วค่อยเทสแต่ละ route**

---

## งาน Frontend ที่ต้องทำด้วย

หน้า user ทั้งหมดถูกสร้างไว้แล้ว แต่ยังใช้ mock data อยู่บางส่วน ต้องเชื่อมกับ API จริง:

| หน้า | สิ่งที่ต้องทำ |
|------|--------------|
| ProfilePage | ดึงข้อมูล user จริงจาก `/api/users/profile` |
| VehicleManagePage | CRUD ผ่าน `/api/vehicles` |
| BookingPage | POST จองจริงผ่าน `/api/bookings` |
| ChargingPage | เชื่อม session start/stop |
| PaymentPage | POST จ่ายเงินจริงผ่าน `/api/payments` |
| BookingHistoryPage | GET จาก `/api/bookings` |
| PaymentHistoryPage | GET จาก `/api/payments/history` |
| ReportIssuePage | POST ผ่าน `/api/tickets` |

---

## วิธีเทส API ของตัวเอง

1. รัน backend: `nodemon server.js`
2. เปิด Postman หรือ `http://localhost:5000/api-docs`
3. ทดสอบทีละ endpoint ตามลำดับ auth → vehicles → bookings → ...
