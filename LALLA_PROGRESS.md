# งานที่ Lalla รับผิดชอบ — Ticket & Spare Parts System

> อ่านไฟล์นี้ก่อน แล้วไปอ่าน docs แต่ละไฟล์ตามลำดับ

---

## สรุปสิ่งที่ทำไปแล้ว

| ไฟล์ | สถานะ | รายละเอียด |
|------|--------|------------|
| `backend/schema.sql` | ✅ เสร็จ | clean dup + เพิ่ม issue_type, check_in/out, test_evidence, spare_parts, part_requests, station_type |
| `backend/utils/priorityCalculator.js` | ✅ เสร็จ | auto-priority จาก issue_type × station context, null-safe ratio |
| `backend/routes/tickets.js` | ✅ เสร็จ | POST + auto-priority, checkin/checkout/priority-override, test-image endpoint, test_notes ใน status |
| `backend/routes/spareParts.js` | ✅ เสร็จ | 7 endpoints ครบ — GET/POST parts, PUT stock, POST request, PATCH approve/reject, GET requests/:ticketId |
| `backend/server.js` | ✅ เสร็จ | register sparePartsRoutes แล้ว |

---

## งานที่ทำเสร็จ 2026-04-26

| ไฟล์ | สถานะ | รายละเอียด |
|------|--------|------------|
| `backend/routes/spareParts.js` | ✅ เสร็จ | 7 endpoints ครบ |
| `frontend/src/pages/user/ReportIssuePage.jsx` | ✅ เสร็จ | issue_type dropdown, mandatory image upload, 2-step submit |
| `frontend/src/pages/tech/UpdateTicketPage.jsx` | ✅ เสร็จ | check-in/out, test evidence image, part request form |
| `frontend/src/pages/admin/TicketManagePage.jsx` | ✅ เสร็จ | issue_type badge, priority override, part requests panel (expandable) |
| `frontend/src/pages/admin/SparePartsPage.jsx` | ✅ เสร็จ | ไฟล์ใหม่ — ตารางคลัง, low stock warning, ปรับสต็อก, modal เพิ่มอะไหล่ |
| `frontend/src/routes/AppRouter.jsx` | ✅ เสร็จ | register `/admin/spare-parts` route แล้ว |

## งานที่เหลือ

**ไม่มีแล้ว — งาน Ticket & Spare Parts ครบทุกส่วน ✅**

---

## DB Migration ที่รันแล้ว

```sql
-- เพิ่มใน maintenance_tickets
issue_type ENUM('safety','no_charge','payment','physical_damage','display','other')
check_in_at TIMESTAMP NULL
check_out_at TIMESTAMP NULL
test_evidence_image VARCHAR(500) NULL
test_notes TEXT NULL

-- เพิ่มใน stations
station_type ENUM('public','private_fleet','commercial') DEFAULT 'public'

-- ตารางใหม่
spare_parts (part_id, name, category, unit, stock_qty, min_stock, cost_per_unit)
part_requests (request_id, ticket_id, tech_id, part_id, qty_requested, qty_approved, status, approved_by)
```

---

## Priority Score Logic (สรุป)

```
issue_type base score:
  safety=5(lock critical), no_charge=4, payment=4,
  physical_damage=3, display=2, other=3

station multiplier:
  private_fleet → Math.max(score×1.5, 4)
  ตู้เหลือ <25% → ×1.4
  ตู้เหลือ <50% → ×1.2

repeat report (7วัน ≥2ครั้ง) → ×1.3

threshold: ≥5=critical, ≥3.5=high, ≥2=medium, else low
```

---

## API Endpoints ที่มีแล้วใน tickets.js

| Method | Path | ใครใช้ |
|--------|------|--------|
| POST | `/api/tickets` | user — สร้าง ticket (auto-priority) |
| GET | `/api/tickets` | all — ดู tickets |
| PATCH | `/api/tickets/:id/assign` | admin |
| PATCH | `/api/tickets/:id/unassign` | admin |
| PATCH | `/api/tickets/:id/status` | admin/tech |
| POST | `/api/tickets/:id/image` | admin/tech — upload repair_image |
| POST | `/api/tickets/:id/test-image` | admin/tech — upload test_evidence_image |
| PATCH | `/api/tickets/:id/checkin` | tech — เช็คอิน |
| PATCH | `/api/tickets/:id/checkout` | tech — เช็คเอาท์ |
| PATCH | `/api/tickets/:id/priority` | admin — override priority (safety lock) |