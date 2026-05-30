# Mongo logger: patch existing — ไม่ rewrite เป็น Winston-only

Current logger (`backend/middleware/logger.js`) save body ทุก POST รวม `/auth/login` →
password plain text ใน Mongo (Known Security Issue #1).

เลือก **patch** ของเดิม: filter sensitive fields (password, token, card) + เพิ่ม Winston
file rotation เป็น fallback. ไม่ rewrite เป็น Winston-only เพราะยังต้องการ Mongo log
สำหรับ analytics + เปลี่ยน schema กระทบ existing queries.

**Trade-off:** patch = เสี่ยงต่ำ, รักษา Mongo value. Rewrite = สะอาดกว่า แต่ต้อง migrate
log history + เขียน analytics queries ใหม่.

**Related:** `PHASE_1_PROJECT.md` A.6 (implement) + D.2 (Hybrid Winston+Mongo setup).
