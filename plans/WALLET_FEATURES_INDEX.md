# Wallet & Booking Features — Master Plan

> **เขียนโดย Opus (4.7) สำหรับ Sonnet ทำต่อ**
> วันที่: 2026-04-25
> Scope: 14 features เพิ่มเติมเข้าระบบ EV Charger ของ nem

---

## ⚠️ อ่านก่อนเริ่ม (สำคัญ)

1. **ทำทีละ feature + test ก่อนไปต่อ** อย่ารวบรวบทำทีเดียว — เละแน่
2. **อ่าน Phase ที่กำลังทำเท่านั้น** ไม่ต้องโหลดทุก phase พร้อมกัน (ประหยัด token)
3. **Schema ปัจจุบัน** อยู่ใน [backend/schema.sql](../backend/schema.sql) (phpMyAdmin dump format) — อ่านก่อนเขียน ALTER/CREATE
4. **Seed ใหม่** อยู่ใน [backend/seed.sql](../backend/seed.sql) — ดู sample data ที่นี่
5. ทุก ALTER TABLE / CREATE TABLE ใหม่ → **ต้อง update [schema.sql](../backend/schema.sql) ด้วย** ไม่งั้น lalla DB ตามไม่ทัน
6. ใช้ JavaScript (ไม่ใช่ TypeScript) — nem ใช้ JS ตลอด project

---

## Decision Log (สิ่งที่ nem + Opus ตกลงกันแล้ว)

| ประเด็น | ข้อตกลง |
|---|---|
| Wallet model | Starbucks-like (เติมแล้วเก็บใน `users.wallet_balance`) — มีอยู่แล้ว |
| Idle fee model | **Tesla-style** — เก็บเฉพาะเมื่อ "ชาร์จเสร็จ + มีคนจองคิวต่อไป" |
| Idle fee grace | 5 นาทีแรกฟรี (Tesla = 5 นาที) |
| Auto-stop | Hybrid — A=auto stop ที่ 100% (default), B=admin toggle ให้เก็บ idle fee |
| ไม่จ่ายได้ → debt model (B2) | บันทึก `users.outstanding_debt` → block start session ครั้งหน้าจนกว่าจะเคลียร์ |
| Reward points | 1 บาท = 1 แต้ม, 100 แต้ม = ส่วนลด 10 บ., หมดอายุ 2 ปี |
| TOU pricing | Off-peak (22:00-09:00) ลด ~30% |
| Booking schedule | 3 levels: one-time → recurring → smart suggestion |
| No-show fee | 20 บ. (wallet → card → debt) |
| Trip planning | ใช้ Google Maps API (มีอยู่แล้ว) + consumption rate fixed 0.18 kWh/km |
| Charge curve graph | **ไม่ทำ** — ระบบจริงไม่ใช้ |
| Push notification (FCM) | **ไม่ทำ phase นี้** — in-app พอ |

---

## Feature List (14 อัน)

### 🟢 Phase 1: Foundation UX (~1.5 วัน)
> ของง่าย เห็นผลทันที ทำก่อน → [PHASE1_FOUNDATION.md](./PHASE1_FOUNDATION.md)

| # | Feature | เวลา |
|---|---|---|
| 1 | เลือกวิธีจ่าย (modal wallet/บัตร) | 0.5d |
| 2 | Low balance banner + notif (<100 บ.) | 0.25d |
| 3 | แสดงอุณหภูมิตู้ตอนชาร์จ | 0.25d |
| 7 | Overheat protection (>60°C ห้ามชาร์จ) | 0.25d |
| 10 | Estimated charge time | 0.25d |
| 14 | Favorite stations (♡ ปักหมุด) | 0.25d |

### 🟡 Phase 2: Smart features (~2 วัน)
> งานกลางๆ มี logic ซับซ้อนขึ้น → [PHASE2_SMART.md](./PHASE2_SMART.md)

| # | Feature | เวลา |
|---|---|---|
| 4 | Auto-stop Hybrid (A default + B admin toggle) | 0.5d |
| 5 | แจ้งเตือน 80% / 100% ตอนชาร์จ | 0.5d |
| 6 | Reward points (earn + redeem + UI) | 0.75d |
| 8 | TOU pricing (off-peak discount) | 0.25d |
| 11 | Cancellation + No-show 20 บ. | 0.5d |

### 🔴 Phase 3: Advanced (~3 วัน)
> โหดสุด เก็บไว้ท้าย ทำตอน phase 1+2 stable แล้ว → [PHASE3_ADVANCED.md](./PHASE3_ADVANCED.md)

| # | Feature | เวลา |
|---|---|---|
| 9 | Booking schedule (3 levels) | 1.5d |
| 12 | Idle fee + state machine + debt model | 1d |
| 13 | Trip planning (Google Maps) | 1d |

**รวม ~6.5 วัน**

---

## Schema Impact Summary

ตารางใหม่ที่จะเพิ่ม (ทั้ง 3 phases):
- `user_favorites` — phase 1
- `point_balances` — phase 2
- `point_transactions` — phase 2
- `tariffs` — phase 2 (TOU)
- `recurring_schedules` — phase 3
- `idle_fee_charges` — phase 3

Column ใหม่ใน table เดิม:
- `users.outstanding_debt DECIMAL(10,2) DEFAULT 0` — phase 1 (รองรับ debt model)
- `chargers.max_temperature_celsius DECIMAL(5,2) DEFAULT 60` — phase 1
- `chargers.idle_fee_enabled TINYINT(1) DEFAULT 0` — phase 2
- `bookings.scheduled_start TIMESTAMP NULL` — phase 3
- `bookings.duration_min INT DEFAULT 60` — phase 3
- `bookings.recurring_schedule_id INT UNSIGNED NULL` — phase 3
- `charging_sessions.idle_start_time TIMESTAMP NULL` — phase 3
- `charging_sessions.idle_fee DECIMAL(10,2) DEFAULT 0` — phase 3

---

## Workflow ของ Sonnet

สำหรับแต่ละ feature:
1. อ่าน task ใน Phase นั้นๆ
2. เช็ค schema ปัจจุบันก่อน — query DB หรืออ่าน [backend/schema.sql](../backend/schema.sql)
3. รัน ALTER TABLE / CREATE TABLE ใน phpMyAdmin (ถ้ามี)
4. แก้ backend route + เพิ่ม endpoint ใหม่
5. แก้ frontend page + เพิ่ม UI
6. **Test กับ user (nem) ก่อนไปอันต่อไป** — บอก nem ว่า "feature X ทำเสร็จแล้ว ลอง test ที่หน้า Y"
7. update checkbox ใน Phase file ที่ทำ
8. ถ้า test ผ่าน → commit + ไปอันถัดไป

---

## Convention ของ project นี้

- ภาษาคอมเม้น/error message: **ไทย** (user-facing) + **English** (technical)
- API: REST + auth ด้วย `bearerAuth` (JWT)
- DB transaction: `BEGIN → COMMIT/ROLLBACK` ครอบทุก multi-table update
- Notification: insert เข้า `notifications` table (มี type enum: `booking, charging, payment, maintenance, system, promotion`)
- Wallet deduct: ใช้ `FOR UPDATE` lock row ป้องกัน race condition
- Frontend: React + Tailwind + react-icons (FaXxx)
- Modal style: Bottom sheet (`absolute inset-0 bg-black/50 z-[60] flex items-end` → child `bg-white w-full rounded-t-3xl`)

---

## ⚠️ ห้ามลืม

- **ห้ามแก้ Code ของ lalla** (admin/tech routes) โดยไม่ตกลงก่อน
- **ห้ามแก้ schema** โดยไม่ update [schema.sql](../backend/schema.sql) ตาม
- ทุก feature ใหม่ → เพิ่ม **Swagger doc** ใน route file (มี pattern ใน [routes/wallet.js](../backend/routes/wallet.js))
- ทุก endpoint ที่ deduct เงิน → **ต้องเช็ค `wallet_frozen` ก่อน**
