# Knex สำหรับ migration เท่านั้น + raw mysql2 สำหรับ query — ไม่ใช้ Prisma

Schema เคย sync ด้วยการส่งไฟล์ `.sql` ให้กันรันมือใน phpMyAdmin → desync บ่อย
(ลืมรัน / รันผิด → endpoint พังเพราะ `Unknown column`). adopt **Knex เป็น migration tool**
(versioned up/down ใน git, รัน `npx knex migrate:latest` คำสั่งเดียวให้ DB ตรงกันทั้งทีม).

**Query ยังเขียน raw mysql2 (`pool.query`) เหมือนเดิม — ไม่ใช้ knex query builder.**
ดังนั้น knex ใส่ "หมวกเดียว" คือ migration เท่านั้น.

## ทำไมไม่ Prisma (ทั้งที่ Prisma นิยมกว่า)

Prisma เป็นตัวเลือกที่ดีกว่าสำหรับโปรเจค greenfield + TypeScript จริง แต่ใน context นี้
ต้นทุนสูงเกินกำไร:

- **ไม่มี automated test** (PHASE_1 A.5 ยังเป็น `[~]`) → rewrite query เงิน/wallet/booking
  ทั้ง 17 routes ไปเป็น Prisma client โดยไม่มี regression test = เสี่ยงคำนวณเงินผิดเงียบๆ.
- **ADR 0001 ห้าม TypeScript** → จุดขายหลักของ Prisma (generated TS types) ใช้ไม่ได้
  เหลือแต่ความหนัก.
- raw SQL ที่เขียนอยู่แล้วใช้ต่อใน knex migration ได้ทันที (`knex.raw('ALTER TABLE ...')`).

## Consequences

- Source of truth ของ schema = **knex migrations** เท่านั้น. `schema.sql` (มี `DROP TABLE`)
  freeze เป็น baseline ก้อนแรก ห้ามแก้ต่อ; `LALLA_MIGRATION.sql` + manual MIGRATION pattern
  ใน `backend/CLAUDE.md` = deprecated.
- ต้องตกลงกับลัลลาให้เลิกเปิด phpMyAdmin แก้มือ — ไม่งั้น knex sync ไม่จริง.
- ถ้าวันหนึ่งย้ายไป TypeScript (ทบทวน ADR 0001) → ค่อยพิจารณา Prisma ใหม่.

**Related:** `PHASE_1_PROJECT.md` A.10 (knex setup) + A.3 (schema sync) + A.5 (test ก่อนกล้ารื้อ).
