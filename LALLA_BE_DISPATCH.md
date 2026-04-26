# BE — Dispatch Info สำหรับช่าง (ข้อ 2)

> ข้อมูลที่แอดมินให้ช่างตอนลงพื้นที่:
> สถานที่ + พิกัด GPS · รหัสตู้/หัวชาร์จ · รายละเอียดปัญหา · ความเร่งด่วน · ประวัติซ่อมล่าสุด

---

## ไฟล์ที่แก้ — `backend/routes/tickets.js`

### การเปลี่ยนแปลงที่ 1 — GET /api/tickets เพิ่ม fields

ปัจจุบัน SELECT ได้: `charger_name, station_name, station_address`  
ขาด: `latitude, longitude, floor, connector_type, power_kw`

**แก้ query ในทั้ง 2 branch (admin/tech และ user):**

```js
// เปลี่ยน SELECT ส่วน columns เพิ่ม:
s.latitude,
s.longitude,
s.floor AS station_floor,
c.connector_type,
c.power_kw
```

Query เต็มหลังแก้ (admin/tech branch):

```js
query = `
  SELECT t.*,
         CONCAT(u.first_name, ' ', u.last_name) AS reporter_name,
         CONCAT(tech.first_name, ' ', tech.last_name) AS assigned_to_name,
         c.charger_name,
         c.connector_type,
         c.power_kw,
         s.name AS station_name,
         s.address AS station_address,
         s.latitude,
         s.longitude,
         s.floor AS station_floor
  FROM maintenance_tickets t
  JOIN users u ON t.reported_by = u.user_id
  LEFT JOIN users tech ON t.assigned_to = tech.user_id
  LEFT JOIN chargers c ON t.charger_id = c.charger_id
  LEFT JOIN stations s ON c.station_id = s.station_id
  ORDER BY t.created_at DESC
`
```

---

### การเปลี่ยนแปลงที่ 2 — GET /api/tickets/:id/repair-history (endpoint ใหม่)

ดึงประวัติซ่อม 3 ครั้งล่าสุดของ charger เดียวกัน (ไม่รวม ticket ปัจจุบัน)

```js
router.get('/:id/repair-history', auth, roleCheck('admin', 'technician'), async (req, res) => {
  // หา charger_id ของ ticket นี้ก่อน
  const [[ticket]] = await pool.query(
    `SELECT charger_id FROM maintenance_tickets WHERE ticket_id = ?`,
    [req.params.id]
  )
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
  if (!ticket.charger_id) return res.json({ history: [] })

  const [rows] = await pool.query(`
    SELECT t.ticket_id,
           t.issue_type,
           t.title,
           t.priority,
           t.status,
           t.created_at,
           t.completed_at,
           t.repair_notes,
           CONCAT(tech.first_name, ' ', tech.last_name) AS tech_name
    FROM maintenance_tickets t
    LEFT JOIN users tech ON t.assigned_to = tech.user_id
    WHERE t.charger_id = ?
      AND t.ticket_id != ?
      AND t.status = 'completed'
    ORDER BY t.completed_at DESC
    LIMIT 3
  `, [ticket.charger_id, req.params.id])

  res.json({ history: rows })
})
```

---

## สรุป endpoints

| Method | Path | ใคร | การเปลี่ยนแปลง |
|--------|------|-----|----------------|
| GET | `/api/tickets` | admin/tech | เพิ่ม `latitude`, `longitude`, `station_floor`, `connector_type`, `power_kw` ใน response |
| GET | `/api/tickets/:id/repair-history` | admin/tech | **ใหม่** — ประวัติซ่อมล่าสุด 3 ครั้งของ charger นั้น |

---

## สิ่งที่ต้องทำ FE (บันทึกไว้ ไม่ใช่งานไฟล์นี้)

**TicketDetailPage** (หน้าที่ช่างเห็นก่อนรับงาน):
- section "ข้อมูลสถานที่" — แสดง address + floor + ปุ่ม "นำทาง" → `https://maps.google.com/?q={lat},{lng}`
- section "ข้อมูลตู้" — charger_id, charger_name, connector_type, power_kw
- section "ปัญหา" — issue_type badge + priority badge + description
- section "ประวัติซ่อม" — GET /api/tickets/:id/repair-history แสดง 3 รายการล่าสุด (วันที่, ปัญหา, ช่างที่ซ่อม, repair_notes ย่อ)