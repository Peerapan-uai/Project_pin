# API Responsibilities — EV Charger Project

> สรุปว่าใครรับผิดชอบ API อะไรบ้าง (unique endpoints เท่านั้น ไม่นับซ้ำ)
> อัปเดตล่าสุด: 2026-04-10

| สมาชิก | จำนวน endpoints |
|--------|----------------|
| nem    | 48             |
| lalla  | 42             |
| **รวมทั้งระบบ** | **90** |

---

## nem — 48 endpoints

### Auth (3)
| # | Method | Path | หน้าที่ |
|---|--------|------|---------|
| 1 | POST | `/api/auth/register` | สมัครสมาชิก |
| 2 | POST | `/api/auth/login` | เข้าสู่ระบบ (return JWT) |
| 3 | POST | `/api/auth/logout` | ออกจากระบบ |

### Profile (3)
| # | Method | Path | หน้าที่ |
|---|--------|------|---------|
| 4 | GET | `/api/users/profile` | ดูโปรไฟล์ตัวเอง |
| 5 | PUT | `/api/users/profile` | แก้ชื่อ/เบอร์/รหัสผ่าน |
| 6 | DELETE | `/api/users/profile` | ลบ account ตัวเอง |

### Vehicles (5)
| # | Method | Path | หน้าที่ |
|---|--------|------|---------|
| 7 | GET | `/api/vehicles` | ดูรถของตัวเอง |
| 8 | GET | `/api/vehicles/:id` | ดูรถคันเดียว |
| 9 | POST | `/api/vehicles` | เพิ่มรถ |
| 10 | PUT | `/api/vehicles/:id` | แก้ข้อมูลรถ |
| 11 | DELETE | `/api/vehicles/:id` | ลบรถ |

### Stations & Chargers — อ่านอย่างเดียว (4)
| # | Method | Path | หน้าที่ |
|---|--------|------|---------|
| 12 | GET | `/api/stations` | ดูสถานีทั้งหมด |
| 13 | GET | `/api/stations/:id` | ดูสถานีเดียว + ตู้ชาร์จ |
| 14 | GET | `/api/chargers/station/:id` | ดูตู้ชาร์จในสถานี |
| 15 | GET | `/api/chargers/:id` | ดูตู้ชาร์จตัวเดียว |

### Bookings (5)
| # | Method | Path | หน้าที่ |
|---|--------|------|---------|
| 16 | POST | `/api/bookings` | จองตู้ชาร์จ |
| 17 | GET | `/api/bookings` | ดูประวัติการจองของตัวเอง |
| 18 | GET | `/api/bookings/queue/:chargerId` | ดู queue |
| 19 | GET | `/api/bookings/:id` | ดูการจองเดียว |
| 20 | PATCH | `/api/bookings/:id/cancel` | ยกเลิกการจอง |

### Sessions (4)
| # | Method | Path | หน้าที่ |
|---|--------|------|---------|
| 21 | POST | `/api/sessions/start` | เริ่มชาร์จ |
| 22 | PATCH | `/api/sessions/:id/stop` | หยุดชาร์จ + คำนวณค่าใช้จ่าย |
| 23 | GET | `/api/sessions/history` | ดูประวัติการชาร์จ |
| 24 | GET | `/api/sessions/:id/status` | เช็คสถานะ session |

### Payments (14)
| # | Method | Path | หน้าที่ |
|---|--------|------|---------|
| 25 | POST | `/api/payments` | บันทึกการจ่ายเงิน |
| 26 | GET | `/api/payments/history` | ดูประวัติการจ่ายทั้งหมด |
| 27 | GET | `/api/payments/:id` | ดูรายการจ่ายเดียว |
| 28 | POST | `/api/payments/qr` | generate PromptPay QR Code |
| 29 | POST | `/api/payments/charge` | จ่ายด้วยบัตรเครดิต/เดบิต (Omise) |
| 30 | PATCH | `/api/payments/:id/confirm` | user confirm ว่าสแกน QR จ่ายแล้ว |
| 31 | GET | `/api/payments/:id/status` | check สถานะ payment |
| 32 | POST | `/api/payments/webhook/omise` | รับ webhook จาก Omise |
| 33 | POST | `/api/payments/webhook/promptpay` | รับ webhook จากธนาคาร |
| 34 | GET | `/api/payments/admin/all` | admin ดูรายการจ่ายทั้งหมด |
| 35 | GET | `/api/payments/admin/:id` | admin ดูรายการจ่ายเดียว |
| 36 | POST | `/api/payments/:id/refund` | admin คืนเงิน |
| 37 | GET | `/api/payments/:id/refunds` | ดูประวัติการคืนเงิน |
| 38 | DELETE | `/api/payments/:id/cancel` | admin ยกเลิก payment ที่ pending |

### Reviews (3)
| # | Method | Path | หน้าที่ |
|---|--------|------|---------|
| 39 | POST | `/api/reviews` | รีวิวสถานี |
| 40 | GET | `/api/reviews/station/:id` | ดูรีวิวของสถานี |
| 41 | DELETE | `/api/reviews/:id` | ลบรีวิวของตัวเอง |

### Tickets — user (1)
| # | Method | Path | หน้าที่ |
|---|--------|------|---------|
| 42 | POST | `/api/tickets` | แจ้งปัญหา + auto-notify ช่าง |

### Notifications — user (3)
| # | Method | Path | หน้าที่ |
|---|--------|------|---------|
| 43 | GET | `/api/notifications` | ดูการแจ้งเตือน |
| 44 | PATCH | `/api/notifications/read-all` | อ่านทั้งหมด |
| 45 | PATCH | `/api/notifications/:id/read` | อ่านทีละอัน |

### Wallet (3)
| # | Method | Path | หน้าที่ |
|---|--------|------|---------|
| 46 | GET | `/api/wallet/balance` | ดูยอด wallet + 10 รายการล่าสุด |
| 47 | POST | `/api/wallet/topup` | เติมเงิน wallet (promptpay/credit_card) |
| 48 | POST | `/api/wallet/deduct` | ตัดเงินจาก wallet ตอนชาร์จเสร็จ |

---

## lalla — 42 endpoints

### Users — Admin (4)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 1 | GET | `/api/users` | ดู user ทั้งหมดในระบบ | ✅ |
| 2 | PATCH | `/api/users/:id/ban` | ban/unban user | ✅ |
| 3 | POST | `/api/users/technician` | สร้าง account ช่าง | ✅ |
| 4 | PUT | `/api/users/:id` | admin แก้ไขข้อมูล user/ช่าง | ✅ |

### Stations — Admin (3)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 5 | POST | `/api/stations` | เพิ่มสถานีใหม่ | ✅ |
| 6 | PUT | `/api/stations/:id` | แก้ข้อมูลสถานี | ✅ |
| 7 | DELETE | `/api/stations/:id` | ลบสถานี | ✅ |

### Chargers — Admin/Tech (5)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 8 | GET | `/api/chargers` | ดูตู้ชาร์จทั้งหมด (admin) | ✅ |
| 9 | POST | `/api/chargers` | เพิ่มตู้ชาร์จ | ✅ |
| 10 | PUT | `/api/chargers/:id` | แก้ข้อมูลตู้ชาร์จ | ✅ |
| 11 | PATCH | `/api/chargers/:id/status` | เปลี่ยนสถานะตู้ชาร์จ | ✅ |
| 12 | DELETE | `/api/chargers/:id` | ลบตู้ชาร์จ | ✅ |

### Tickets — Admin/Tech (4)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 13 | GET | `/api/tickets` | ดู ticket ทั้งหมด | ✅ |
| 14 | PATCH | `/api/tickets/:id/assign` | assign ticket ให้ช่าง | ✅ |
| 15 | PATCH | `/api/tickets/:id/status` | update สถานะ ticket | ✅ |
| 16 | POST | `/api/tickets/:id/image` | อัพโหลดรูป repair_image | ✅ |

### Bookings — Admin (2)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 17 | GET | `/api/bookings/all` | ดู booking ทุกคน (admin view) | ✅ |
| 18 | PATCH | `/api/bookings/:id/admin-cancel` | admin ยกเลิก booking | ✅ |

### Sessions — Admin (1)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 19 | GET | `/api/sessions/all` | ดู charging session ทุกคน | ✅ |

### Dashboard Stats (1)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 20 | GET | `/api/admin/stats` | สถิติ dashboard | ✅ |

### Nearby Stations (1)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 21 | GET | `/api/stations/nearby` | หาสถานีใกล้เคียง (Haversine) | ✅ |

### Admin Logs (2)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 22 | GET | `/api/admin/logs` | ดู log ทั้งหมด | ✅ |
| 23 | GET | `/api/admin/logs/:type` | filter log ตาม type | ✅ |

### Admin Wallet (6)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 24 | GET | `/api/admin/users/:id/wallet` | ดูยอด + ประวัติ wallet ของ user | ⏳ |
| 25 | GET | `/api/admin/wallet/transactions` | ดู transactions ทั้งหมดทุก user | ⏳ |
| 26 | GET | `/api/admin/wallet/transactions/:txnId` | ดู transaction เดียว | ⏳ |
| 27 | POST | `/api/admin/users/:id/wallet/adjust` | คืนเงิน/ปรับยอด | ⏳ |
| 28 | PATCH | `/api/admin/users/:id/wallet/freeze` | freeze/unfreeze wallet | ⏳ |
| 29 | GET | `/api/admin/wallet/summary` | dashboard wallet รวมทั้งระบบ | ⏳ |

### Stations Stats (1)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 30 | GET | `/api/stations/:id/stats` | สถิติของสถานี | ⏳ |

### Admin Reports (5)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 31 | GET | `/api/admin/reports/revenue` | รายได้รายวัน/เดือน/ปี | ⏳ |
| 32 | GET | `/api/admin/reports/usage` | สถิติการใช้งาน charger | ⏳ |
| 33 | GET | `/api/admin/reports/stations` | สถิติแยกตามสถานี | ⏳ |
| 34 | GET | `/api/admin/reports/comparison` | เปรียบเทียบ vs เดือน/ปีที่แล้ว | ⏳ |
| 35 | POST | `/api/admin/reports/export` | export report เป็น CSV/PDF | ⏳ |

### PDF Invoice (1)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 36 | GET | `/api/admin/payments/:id/invoice` | export ใบเสร็จ PDF | ⏳ |

### Notification Admin (5)
| # | Method | Path | หน้าที่ | สถานะ |
|---|--------|------|---------|-------|
| 37 | POST | `/api/notifications/broadcast` | ส่ง notification ถึงทุกคน | ⏳ |
| 38 | POST | `/api/notifications/targeted` | ส่งเฉพาะกลุ่ม | ⏳ |
| 39 | POST | `/api/notifications/schedule` | ตั้งเวลาส่ง notification | ⏳ |
| 40 | GET | `/api/notifications/analytics` | สถิติ delivery/read rate | ⏳ |
| 41 | GET | `/api/users/:id` | admin ดู user รายคน + ประวัติ | ⏳ |

---

## Background Jobs (ไม่นับเป็น endpoint แต่ nem ดูแล)
| ไฟล์ | หน้าที่ |
|------|---------|
| `jobs/expireBookings.js` | หมดอายุ booking อัตโนมัติ (ทุก 1 นาที) |
| `jobs/expirePayments.js` | หมดอายุ payment อัตโนมัติ (ทุก 1 นาที) |

## Shared (ใช้ร่วมกัน — ถ้าจะแก้ต้องบอกกันก่อน)
| ไฟล์ | หมายเหตุ |
|------|---------|
| `middleware/auth.js` | JWT authentication |
| `server.js` | mount routes ทั้งหมด |
| `schema.sql` | database schema reference |
