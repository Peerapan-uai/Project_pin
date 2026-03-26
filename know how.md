## HTTP Protocol

req.body     // ข้อมูลที่แนบมาใน request (make, model, year...)
req.params   // ค่าใน URL เช่น /vehicles/:id → req.params.id
req.headers  // header เช่น Authorization: Bearer token
req.user     // user info ที่ auth middleware แนบไว้

---

## HTTP Methods

| Method | ใช้ทำอะไร      | ตัวอย่าง |
| GET |     ดึงข้อมูล      | ดูรถ, ดูโปรไฟล์ |
| POST |  สร้างข้อมูลใหม่   | เพิ่มรถ, สมัครสมาชิก |
| PUT |   แก้ข้อมูลทั้งก้อน  | แก้ข้อมูลรถทุก field |
| PATCH | แก้ข้อมูลบางส่วน | เปลี่ยนแค่สถานะ |
| DELETE | ลบข้อมูล         | ลบรถ |

---

## HTTP Status Codes

| Status | ความหมาย | ใช้เมื่อ |
|--------|---------|---------|
| 200 | OK | สำเร็จทั่วไป (GET, PUT, DELETE, PATCH) |
| 201 | Created | สร้างข้อมูลใหม่สำเร็จ (POST) |
| 400 | Bad Request | ข้อมูลที่ส่งมาผิด/ไม่ครบ |
| 401 | Unauthorized | ไม่มี token หรือ token ไม่ถูกต้อง |
| 403 | Forbidden | มี token แต่ไม่มีสิทธิ์ (เช่น ไม่ใช่ admin) |
| 404 | Not Found | หาข้อมูลไม่เจอใน DB |
| 500 | Server Error | DB พัง หรือ query ผิดพลาด |

---

## Endpoints ที่ nem รับผิดชอบ (34 endpoints)

### Auth
| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| POST | /api/auth/register | สมัครสมาชิก |
| POST | /api/auth/login | ล็อกอิน รับ JWT token |
| POST | /api/auth/logout | ล็อกเอาท์ (client ลบ token เอง) |

### Users (ฝั่ง user เอง)
| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | /api/users/profile | ดูโปรไฟล์ตัวเอง |
| PUT | /api/users/profile | แก้ชื่อ เบอร์ รหัสผ่าน |

### Stations (ดูอย่างเดียว)
| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | /api/stations | ดูสถานีทั้งหมด (filter ด้วย connector_type ได้) |
| GET | /api/stations/:id | ดูสถานีเดี่ยว + charger ในสถานี |

### Chargers (ดูอย่างเดียว)
| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | /api/chargers/station/:stationId | ดู charger ทั้งหมดของสถานีนั้น |
| GET | /api/chargers/:id | ดู charger เดี่ยว |

### Vehicles
| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | /api/vehicles | ดูรถทั้งหมดของตัวเอง |
| GET | /api/vehicles/:id | ดูรถคันเดียว |
| POST | /api/vehicles | เพิ่มรถ |
| PUT | /api/vehicles/:id | แก้ข้อมูลรถ |
| DELETE | /api/vehicles/:id | ลบรถ |

### Bookings
| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| POST | /api/bookings | จองตู้ชาร์จ |
| GET | /api/bookings | ดูการจองทั้งหมดของตัวเอง |
| GET | /api/bookings/queue/:chargerId | ดูคิวการจองของตู้ชาร์จนั้น |
| GET | /api/bookings/:id | ดูการจองเดี่ยว |
| PATCH | /api/bookings/:id/cancel | ยกเลิกการจอง |

### Sessions (การชาร์จ)
| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| POST | /api/sessions/start | เริ่มชาร์จ |
| PATCH | /api/sessions/:id/stop | หยุดชาร์จ + คำนวณค่าไฟ |
| GET | /api/sessions/history | ดูประวัติการชาร์จ |
| GET | /api/sessions/:id/status | ดูสถานะ session ปัจจุบัน |

### Payments
| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| POST | /api/payments | จ่ายเงิน (หลังชาร์จเสร็จ) |
| GET | /api/payments/history | ดูประวัติการจ่ายเงิน |
| GET | /api/payments/:id | ดูใบเสร็จเดี่ยว |

### Reviews
| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| POST | /api/reviews | เขียนรีวิวสถานี |
| GET | /api/reviews/station/:stationId | ดูรีวิวทั้งหมดของสถานี + คะแนนเฉลี่ย |
| DELETE | /api/reviews/:id | ลบรีวิวของตัวเอง |

### Notifications
| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| GET | /api/notifications | ดูการแจ้งเตือนทั้งหมด |
| PATCH | /api/notifications/read-all | mark ทั้งหมดว่าอ่านแล้ว |
| PATCH | /api/notifications/:id/read | mark อันเดียวว่าอ่านแล้ว |

### Tickets (ฝั่ง user)
| Method | Endpoint | หน้าที่ |
|--------|----------|--------|
| POST | /api/tickets | แจ้งปัญหาตู้ชาร์จ |
| GET | /api/tickets | ดู ticket ที่ตัวเองแจ้ง |

