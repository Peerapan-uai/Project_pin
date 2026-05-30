# Backend — Claude rules

> Auto-loads when working on files under `backend/`. Inherits all rules from root [`CLAUDE.md`](../CLAUDE.md).

---

## 🚨 ห้ามทำเด็ดขาด (backend-specific)

1. **ห้าม import / re-import `schema.sql` ใหม่ทั้งไฟล์** — มี `DROP TABLE IF EXISTS` ทุกตาราง → ข้อมูลหายหมด
   - ถ้า schema เปลี่ยน → สร้าง knex migration (npx knex migrate:make <ชื่อ>) เท่านั้น

---

## 🔧 Migration Pattern (knex — ADR 0003)

**Pattern:** ใครแก้ schema = คนนั้นสร้าง knex migration file + commit เข้า git อีกฝั่ง 'git pull' ->'npm knex migrate:latest' - DB sync อัตโนมัติ

ตัวอย่าง: nem เพิ่ม column ใน 'chargers':

1. 'npm knex migrate:make add_power_kw_to_chargers'
2. เปิดไฟล์ที่สร้างใน 'migrations/' ->เขียน 'up' (เพิ่ม column) + 'down' (ลบ column)
3. 'npx knex migrate:latest' -> ทดสอบ
4. 'git add migrations/ && git commit'
5. lalla: 'git pull' -> 'npx knex migrate:latest' ✅

**ห้าม**

- สร้าง 'MIGRATION\_\*.sql' ส่งมือ -> ใช้ knex แทน (LALLA_MIGRATION.sql = deprecated)
- แก้ 'schema.sql' โดยไม่ทำ migration -> DB คนอื่นตามไม่ทัน
- ส่ง 'schema.sql' ทั้งไฟล์ให้รัน -> DROP TABLE -> ข้อมูลหาย

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

| ไฟล์ที่แก้                                   | ใช้ skill / agent                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `routes/payments.js`, `auth.js`, `wallet.js` | **security-reviewer** + `api-design` + `backend-patterns` (เกี่ยวข้องเงิน/auth → security ต้องผ่าน) |
| `routes/admin/*`                             | **security-reviewer** + `backend-patterns` (admin endpoint → RBAC check)                            |
| `routes/*.js` (อื่นๆ)                        | `api-design` + `backend-patterns` + `error-handling`                                                |
| `middleware/*.js`                            | `backend-patterns` + `security-review`                                                              |
| `schema.sql`, `migrations/*.js`              | `mysql-patterns` + `database-migrations`                                                            |
| `models/*.js`, `utils/*.js`                  | `backend-patterns`                                                                                  |
| `jobs/*.js`                                  | `backend-patterns` + `error-handling` (cron fail silently บ่อย — Grep หา empty catch)               |
| `package.json` (deps change)                 | **security-reviewer** (npm audit)                                                                   |
