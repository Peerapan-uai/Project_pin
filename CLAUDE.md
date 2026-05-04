# CLAUDE.md — Project Context for Claude Code

> ไฟล์นี้ Claude อ่านอัตโนมัติเมื่อเปิด Claude Code ในโฟลเดอร์ project
> Update เมื่อ workflow / decision / convention เปลี่ยน

---

## 📌 Project Overview

**EV Charging Station Booking** — โปรเจคมหาลัย CSI401 ที่กำลังปั้นเป็น production-grade portfolio
- Tech stack: React (Vite) + Node.js (Express) + MySQL + MongoDB (logging) + Omise (payment) + Google Maps
- Stack ห้ามใช้ TypeScript ใน scope ปัจจุบัน — ใช้ JavaScript ตลอด project
- 150 endpoints / 42 frontend pages / 27 tables ใน schema.sql

## 👥 ทีม (2 คน)

| คน | รับผิดชอบ |
|---|---|
| **nem** (Peerapan) | user-side — 17 backend routes (114 endpoints), 20 user pages |
| **lalla** | admin/tech — admin/* routes (34 endpoints), 15 admin pages, 5 tech pages, DB schema, spare parts inventory + repair proposals workflow |

---

## 🚨 ห้ามทำเด็ดขาด

1. **ห้าม import / re-import schema.sql ใหม่ทั้งไฟล์** — มี `DROP TABLE IF EXISTS` ทุกตาราง → ข้อมูลหายหมด
   - ถ้า schema เปลี่ยน → ใช้ ALTER TABLE / CREATE TABLE IF NOT EXISTS เท่านั้น
2. **ห้าม commit `.env`** — มี secret (Omise key, JWT secret, DB password)
3. **ห้าม `git push --force` ที่ master** — เขียนทับ commit คนอื่น
4. **ห้าม `git add .`** — เผลอติด `.env` / `node_modules`
5. **ห้ามแก้ code ของอีกคน** โดยไม่ตกลง — nem ห้ามแก้ `routes/admin/*` / `routes/spareParts.js`, lalla ห้ามแก้ user-side routes
6. **ห้าม mock**ทุกอย่าง — nem ต้องการของจริง

---

## 🔧 Migration Pattern (สำคัญ)

**Pattern ของ project นี้:** ใครแก้ schema = คนนั้นทำ migration script ส่งอีกฝั่งรัน

ตัวอย่าง: nem เพิ่ม column ใน `chargers` → nem สร้าง `MIGRATION_<feature>.sql` (มีแค่ ALTER ที่เพิ่ม) → commit + บอก lalla รันใน phpMyAdmin

**ห้าม:**
- แก้ schema.sql อย่างเดียวโดยไม่ทำ migration → DB ของอีกฝั่งจะตามไม่ทัน → endpoint pang
- ส่ง schema.sql ทั้งไฟล์ให้รัน → DROP TABLE → ข้อมูลหาย

**Reference:** `backend/LALLA_MIGRATION.sql` (nem ทำให้ lalla รันตอน Phase 1+2+3)

**Status ปัจจุบัน (2026-05-04):** lalla เพิ่ม 3 tables ใน schema.sql (`spare_parts`, `part_requests`, `repair_proposals`) แต่ยังไม่ส่ง migration → DB ของ nem ขาด 3 tables นี้ → endpoint /api/spare-parts pang

---

## 🌿 Git Workflow

**ปัจจุบัน:** ทั้งคู่ใช้ git แบบมือใหม่ — push master ตรง, commit message เป็นชื่อตัวเอง (`nem` / `lalla` / `สฟสสฟ`)

**ตกลงกัน:** เปลี่ยนเป็น feature branch + PR (กำลังทยอย adopt)

```
master (ห้ามแตะตรง — merge ผ่าน PR เท่านั้น)
  ↑
feature/<scope>-<desc>   (branch ของแต่ละงาน)
```

**Conventional commit format:**
```
feat(scope): add new feature
fix(scope): fix bug description
chore: cleanup / config
docs: documentation
refactor: refactor without behavior change
test: add/update tests
```

**Claude ควร:** ก่อนรัน git command ใดๆ ให้ nem หรือ lalla — **อธิบาย** คำสั่งทำอะไร / ทำไมเลือกอันนี้ / revert ยังไง — ทั้งคู่เป็นมือใหม่อยากเรียนจริง

---

## 🧪 Test Pattern

ใช้ **manual test checklist** (ยังไม่มี unit test/integration test framework)
- File: `TEST_CHECKLIST.md` ที่ root project
- 14 features ของ nem มี checklist ละเอียด — กดตามทีละข้อ + verify DB
- ถ้าทำ feature ใหม่ → เพิ่ม test step ใน checklist

---

## 📁 Project Structure

```
Project/
├── backend/
│   ├── config/        — db.js (MySQL pool), mongodb.js (Mongoose connect)
│   ├── jobs/          — 7 cron jobs (expire bookings/payments, idle fee auto-stop, ฯลฯ)
│   ├── middleware/    — auth (JWT), logger (Mongo + body), roleCheck
│   ├── models/        — Log.js (Mongoose schema)
│   ├── routes/        — 17 ไฟล์ user-side
│   │   └── admin/     — 6 ไฟล์ admin-side (lalla)
│   ├── utils/         — chargeFeeOrAddDebt, getTariff, priorityCalculator
│   ├── uploads/       — multer destination
│   ├── schema.sql     — phpMyAdmin dump format (source of truth)
│   ├── data.sql       — schema + seed data (เก่ากว่า schema.sql, ขาด 3 tables ของ lalla)
│   ├── LALLA_MIGRATION.sql — migration ตัวอย่าง
│   └── server.js      — Express + Swagger + cron startup
├── frontend/
│   └── src/pages/
│       ├── user/      — 20 หน้า (nem)
│       ├── admin/     — 15 หน้า (lalla)
│       ├── tech/      — 5 หน้า (lalla)
│       └── shared/    — LoginPage, RegisterPage
├── plans/             — feature plans (PHASE1/2/3, WALLET_INDEX)
├── PHASE_1_PROJECT.md — current production hardening plan (cleanup→test→deploy→WebSocket→AWS→Capacitor)
├── TEST_CHECKLIST.md  — manual test 14 features
├── docker-compose.yml — mysql + phpmyadmin + mongodb + mongo-express
└── .gitignore
```

---

## 🎨 Conventions

- **ภาษา:** comment / error message ใช้ **ไทย** (user-facing) + **English** (technical)
- **API:** REST + JWT auth (`bearerAuth` Swagger scheme)
- **DB transaction:** `BEGIN → COMMIT/ROLLBACK` ครอบ multi-table update
- **Wallet deduct:** ใช้ `SELECT ... FOR UPDATE` lock row ป้องกัน race condition
- **Wallet check:** ทุก endpoint ที่ deduct เงิน → ต้องเช็ค `users.wallet_frozen` + `outstanding_debt` ก่อน
- **Notification:** insert เข้า `notifications` table — type enum: `booking, charging, payment, maintenance, system, promotion`
- **Frontend:** React + Tailwind + react-icons (FaXxx)
- **Modal style:** Bottom sheet — `absolute inset-0 bg-black/50 z-[60] flex items-end` → child `bg-white w-full rounded-t-3xl`
- **Swagger doc:** ทุก endpoint ใหม่ต้องเพิ่ม Swagger comment (pattern ใน `routes/wallet.js`)

---

## 🎯 Phase 1 Plan ปัจจุบัน (2026-05-04)

ปั้นโปรเจคเป็น production-grade portfolio (deploy URL จริง + real-time + monitoring + security)

**ลำดับงาน:**
```
1. ✅ Cleanup files (commit dda6516)
2. ✅ CLAUDE.md (this file — commit ec08ce4 area)
3. ✅ TEST_CHECKLIST.md (commit ec08ce4)
4. Fix Omise webhook signature (payments.js 3 TODO)
5. Fix logger password leak (middleware/logger.js)
6. npm audit fix
7. Add Helmet
8. stations.js 4 TODO (station stats — nem)
9. Git workflow setup (feature branch + PR + branch protection)
10. Deploy Vercel + Railway → portfolio URL
11. WebSocket — admin↔tech chat + real-time charger status
12. AWS migration
13. Capacitor wrap → .apk
```

**TODO ที่รอ lalla:**
- Migration script 3 tables (spare_parts, part_requests, repair_proposals)
- 14 admin TODO (admin/notifications.js 7 + admin/reports.js 3 + admin/wallet.js 4)

**Decisions:**
- Omise คงไว้ test mode + เน้น security/logic ให้แน่น (ไม่ live mode ตอนนี้)
- Capacitor ทำหลัง deploy AWS (web URL = portfolio หลัก, .apk = bonus)
- Mongo logger: patch ของเดิม (filter password + เพิ่ม Winston file fallback) ไม่ rewrite

---

## 🔴 Known Security Issues (ต้อง fix ก่อน live deploy)

1. **Logger เก็บ password plain text** — `middleware/logger.js:17` save body ทุก POST รวม `/auth/login`
2. **Omise webhook ไม่ verify signature** — `routes/payments.js:38, 75, 655`
3. **`docker-compose.yml` มี credentials plaintext** tracked ใน git
4. **ไม่มี Helmet** (no HSTS / CSP / X-Frame-Options)
5. **CORS hardcode localhost** — `server.js:53`
6. **npm audit:** 4 vulnerabilities (1 mod + 3 high) — `cd backend && npm audit fix`

---

## 📚 Reference Files

- `PHASE_1_PROJECT.md` — production hardening plan (เนื้อหาเต็ม)
- `plans/WALLET_FEATURES_INDEX.md` — 14 features master plan
- `plans/PHASE1_FOUNDATION.md`, `PHASE2_SMART.md`, `PHASE3_ADVANCED.md` — feature details
- `TEST_CHECKLIST.md` — manual test checklist
- `backend/schema.sql` — current DB schema (source of truth)
