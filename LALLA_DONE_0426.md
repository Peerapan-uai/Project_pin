# งานที่ทำเสร็จ — 2026-04-26

## BE — backend/routes/spareParts.js

7 endpoints ครบ พร้อม bugfix 2 จุด:

| Method | Path | ใคร |
|--------|------|-----|
| GET | `/api/spare-parts` | admin + **technician** (แก้ bug: เดิม lock admin อย่างเดียว ช่างโหลดรายชื่ออะไหล่ไม่ได้) |
| POST | `/api/spare-parts` | admin |
| PUT | `/api/spare-parts/:id/stock` | admin |
| GET | `/api/spare-parts/requests/:ticketId` | admin/tech — **ย้ายขึ้นมาก่อน POST /request** (แก้ bug: Express match จากบนลงล่าง ถ้า /request อยู่ก่อน /requests/:ticketId จะถูก shadow) |
| POST | `/api/spare-parts/request` | tech |
| PATCH | `/api/spare-parts/request/:id/approve` | admin — ลด stock พร้อมกัน |
| PATCH | `/api/spare-parts/request/:id/reject` | admin — stock ไม่เปลี่ยน |

---

## FE — ReportIssuePage.jsx (user แจ้งปัญหา)

- ลบ `title` string และ `priority` state ออก
- เพิ่ม `issueType`, `customTitle`, `image`, `imagePreview` state
- dropdown เปลี่ยนจาก Thai string เป็น ISSUE_OPTIONS array (value = ENUM)
- ถ้าเลือก `other` → โผล่ช่อง input ระบุ title เพิ่ม
- เพิ่ม mandatory image upload + FileReader preview
- handleSubmit แก้เป็น async/await 2 calls: POST ticket → ได้ ticket_id → POST image
- **description บังคับเฉพาะ `safety`, `payment`, `other`** — type อื่นเป็น optional (UX: ช่องชัดเจนในตัวเองแล้ว)
- placeholder เปลี่ยนตาม issue type — บอก user ว่าต้องระบุอะไร
- label โชว์ `*` ถ้าบังคับ หรือ `(ไม่บังคับ)` ถ้าไม่บังคับ

## BE — bugfix POST /api/tickets/:id/image

- เพิ่ม `'user'` ใน roleCheck — เดิม lock แค่ admin/tech ทำให้ user แจ้งปัญหาแล้ว upload รูปไม่ได้ (403)

---

## FE — UpdateTicketPage.jsx (tech อัปเดตงานซ่อม)

เพิ่ม 3 ฟีเจอร์:

**1. Check-in / Check-out**
- ปุ่ม 2 ปุ่มใน blue box
- checkout disabled ถ้ายังไม่ได้ checkin
- โชว์เวลาและระยะเวลารวมเมื่อครบทั้งคู่

**2. Test Evidence Image**
- โชว์เฉพาะตอน `status === 'completed'`
- upload ไปที่ `/api/tickets/:id/test-image`
- มี textarea `testNotes` ส่งพร้อม PATCH status

**3. Part Request Form**
- dropdown อะไหล่ + input จำนวน + ปุ่มขอเบิก
- โหลด spare parts list จาก GET /api/spare-parts
- หลัง submit refresh รายการขอเบิกของ ticket นั้น
- badge status: รอ admin / อนุมัติ / ปฏิเสธ

---

## FE — TicketManagePage.jsx (admin จัดการแจ้งซ่อม)

เพิ่ม 3 จุด:

**1. Issue Type Badge**
- `ISSUE_LABEL` map แปลง ENUM → label + สี
- โชว์ข้าง StatusBadge บนทุก ticket card

**2. Priority Override**
- ใน TicketDetailPanel (expandable ด้านล่างการ์ด)
- `<select>` เปลี่ยน priority → PATCH /api/tickets/:id/priority
- disabled ถ้า issue_type = 'safety' + แสดง 🔒

**3. Part Requests Panel**
- โหลดอัตโนมัติเมื่อ expand ticket
- pending → ปุ่มอนุมัติ / ปฏิเสธ → PATCH approve/reject
- approved/rejected → badge สี

---

## FE — SparePartsPage.jsx (ใหม่)

- ตาราง parts ทั้งหมด เรียง category
- แถว `stock_qty <= min_stock` → highlight เหลือง + ⚠️
- warning banner นับจำนวน low stock
- ปุ่ม "ปรับสต็อก" → prompt() → PUT /:id/stock
- modal "เพิ่มอะไหล่" form ครบทุก field
- register route `/admin/spare-parts` ใน AppRouter.jsx แล้ว

---

# สิ่งที่ต้องทำต่อ (TODO)

## ข้อ 1 — Repair vs Replace Proposal ✅ BE เสร็จแล้ว

**schema.sql** — เพิ่ม table `repair_proposals` ครบ (CREATE + INDEX + AUTO_INCREMENT + FK)

**tickets.js** — เพิ่ม 3 endpoints + multer proposalStorage:
- `POST /api/tickets/:id/proposal` — tech ยื่นข้อเสนอ (repair/replace + ราคาประเมิน + เวลา + คำอธิบาย + รูป) + แจ้ง admin ทุกคน
- `GET /api/tickets/:id/proposals` — ดูข้อเสนอทั้งหมดของ ticket (JOIN tech_name + reviewed_by_name)
- `PATCH /api/tickets/proposals/:id/review` — admin อนุมัติ/ปฏิเสธ + แจ้ง tech

**FE เสร็จแล้ว ✅**

UpdateTicketPage — เพิ่ม section "ข้อเสนอ: ซ่อม หรือ เปลี่ยนตู้ใหม่":
- state: proposals, propRec, propRepairCost, propReplaceCost, propHours, propDesc, propImage
- โหลด proposals จาก GET /api/tickets/:id/proposals ใน useEffect
- handleSubmitProposal: POST multipart/form-data → refresh รายการ
- แสดงข้อเสนอที่ส่งไปแล้ว + badge status + admin_note
- form กรอก: dropdown ซ่อม/เปลี่ยน, ราคา 2 ช่อง, เวลา, คำอธิบาย, รูปหลักฐาน

TicketManagePage (TicketDetailPanel) — เพิ่ม proposals panel:
- state: proposals, adminNote, reviewingId
- โหลด proposals พร้อมกับ part requests ใน useEffect
- handleReviewProposal: PATCH /api/tickets/proposals/:id/review → refresh
- แสดงข้อเสนอแต่ละอัน + คำนวณ % ซ่อมเทียบตู้ใหม่ (กฎ 50%) → แนะนำอัตโนมัติ
- pending → ปุ่ม 3 ปุ่ม: อนุมัติซ่อม / อนุมัติเปลี่ยน / ปฏิเสธ + input admin_note

## ข้อ 2 — Dispatch Info สำหรับช่าง ✅ spec ใน LALLA_BE_DISPATCH.md
- BE: เพิ่ม `latitude`, `longitude`, `floor`, `connector_type`, `power_kw` ใน GET /api/tickets
- BE: เพิ่ม GET /api/tickets/:id/repair-history (ประวัติซ่อม 3 ครั้งล่าสุดของ charger นั้น)
- FE: แสดงข้อมูลครบใน TicketDetailPage (tech) + ปุ่มนำทาง GPS

## ข้อ 3 — Station Type ✅ spec ใน LALLA_BE_STATION_TYPE.md
- BE: เพิ่ม `station_type` ใน PUT /api/stations/:id และ POST /api/stations
- FE: เพิ่ม dropdown station_type ใน StationManagePage (form สร้าง/แก้ไข + badge ในตาราง)

## ข้อ 4 — Admin Dashboard ส่วนแจ้งซ่อม
- FE: DashboardPage — เพิ่ม ticket summary section แสดง breakdown ตาม priority + issue_type

## ข้อ 5 — สีตาม Priority บน Ticket Card
- FE: TicketManagePage — เพิ่ม left border สีตาม priority บนทุก ticket card
  - low → เขียว, medium → เหลือง, high → แดง, critical → แดงเข้ม

## ข้อ 6 — หลักฐานช่าง (Research สรุปแล้ว)
- Schema รองรับครบ: image (before) + repair_image (during/after) + test_evidence_image (test)
- FE: เพิ่ม label/hint ในแต่ละช่อง upload ใน UpdateTicketPage ว่าต้องถ่ายอะไร
- repair_notes ต้องกรอกภายใน 24 ชม. หลัง check_out — เพิ่ม warning ถ้ายังไม่กรอก

## ข้อ 7 — Tech Dashboard ดูอะไหล่
- BE: ✅ GET /api/spare-parts รองรับ technician แล้ว
- FE: TechDashboardPage — เพิ่ม section แสดงสต็อกอะไหล่ + link ไปเบิกใน ticket ที่ active