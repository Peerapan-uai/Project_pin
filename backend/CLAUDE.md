# Backend — Claude rules

> Auto-loads when working on files under `backend/`. Inherits all rules from root [`CLAUDE.md`](../CLAUDE.md).

---

## 🚨 ห้ามทำเด็ดขาด (backend-specific)

1. **ห้าม import / re-import `schema.sql` ใหม่ทั้งไฟล์** — มี `DROP TABLE IF EXISTS` ทุกตาราง → ข้อมูลหายหมด
   - ถ้า schema เปลี่ยน → ใช้ `ALTER TABLE` / `CREATE TABLE IF NOT EXISTS` เท่านั้น

---

## 🔧 Migration Pattern

**Pattern:** ใครแก้ schema = คนนั้นทำ migration script ส่งอีกฝั่งรัน.

ตัวอย่าง: nem เพิ่ม column ใน `chargers` → nem สร้าง `MIGRATION_<feature>.sql` (มีแค่ ALTER ที่เพิ่ม) → commit + บอก lalla รันใน phpMyAdmin.

**ห้าม:**
- แก้ `schema.sql` อย่างเดียวโดยไม่ทำ migration → DB ของอีกฝั่งจะตามไม่ทัน → endpoint pang
- ส่ง `schema.sql` ทั้งไฟล์ให้รัน → DROP TABLE → ข้อมูลหาย

**Reference:** `backend/LALLA_MIGRATION.sql` (ตัวอย่าง migration ที่ใช้กับ lalla)

---

## 🎨 Conventions (backend)

- **API:** REST + JWT auth (`bearerAuth` Swagger scheme)
- **DB transaction:** `BEGIN → COMMIT/ROLLBACK` ครอบ multi-table update
- **Wallet deduct:** ใช้ `SELECT ... FOR UPDATE` lock row ป้องกัน race condition
- **Wallet check:** ทุก endpoint ที่ deduct เงิน → ต้องเช็ค `users.wallet_frozen` + `outstanding_debt` ก่อน
- **Notification:** insert เข้า `notifications` table — `type` enum: `booking, charging, payment, maintenance, system, promotion`
- **Swagger doc:** ทุก endpoint ใหม่ต้องเพิ่ม Swagger comment (pattern ใน `routes/wallet.js`)

---

## 🗺️ File → Skill Mapping (backend)

| ไฟล์ที่แก้ | ใช้ skill / agent |
|---|---|
| `routes/payments.js`, `auth.js`, `wallet.js` | **security-reviewer** + `api-design` + `backend-patterns` (เกี่ยวข้องเงิน/auth → security ต้องผ่าน) |
| `routes/admin/*` | **security-reviewer** + `backend-patterns` (admin endpoint → RBAC check) |
| `routes/*.js` (อื่นๆ) | `api-design` + `backend-patterns` + `error-handling` |
| `middleware/*.js` | `backend-patterns` + `security-review` |
| `schema.sql`, `MIGRATION_*.sql` | `mysql-patterns` + `database-migrations` |
| `models/*.js`, `utils/*.js` | `backend-patterns` |
| `jobs/*.js` | `backend-patterns` + `error-handling` (cron fail silently บ่อย — Grep หา empty catch) |
| `package.json` (deps change) | **security-reviewer** (npm audit) |
