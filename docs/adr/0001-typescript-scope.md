# TypeScript scope = JS-first, TS เฉพาะ safety-critical

Codebase ทั้งหมดเป็น JavaScript — เก็บไว้เป็น default เพราะ rewrite ทั้ง stack ไม่คุ้ม.
ใช้ TypeScript เฉพาะไฟล์ใหม่ที่ type ช่วย catch bug ก่อน prod (payment amount, wallet
balance, JWT payload shape), test ใหม่, และ shared utility/types — ใช้ `tsx` / `ts-node`
รันตรง ไม่ใส่ build pipeline.

**ห้าม:** convert ไฟล์ JS เดิมเป็น TS เพื่อความเท่ — ทำเฉพาะตอนมี reason จริง.

**Phase 2** (โปรเจคใหม่ของ nem): TS-first ทั้งโปรเจค — คนละ scope กับ ADR นี้.
