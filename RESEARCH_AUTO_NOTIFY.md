# Auto-Notify Technician เมื่อสร้าง Ticket — Research Summary

> ตาราง tickets จริงในโปรเจกต์นี้ชื่อ `maintenance_tickets` ไม่ใช่ `tickets`

---

## 1. Bulk INSERT ใน mysql2

```js
// แบบที่ดีที่สุด — flatMap + joined placeholders
const placeholders = technicians.map(() => '(?, ?, 0)').join(', ');
const flatValues = technicians.flatMap(t => [t.user_id, message]);

await conn.query(
  `INSERT INTO notifications (user_id, message, is_read) VALUES ${placeholders}`,
  flatValues
);
// ผลลัพธ์: INSERT INTO notifications ... VALUES (1,'msg',0),(2,'msg',0),(3,'msg',0)
```

**ทำไมไม่ใช้ loop:**
- 50 technicians = 50 round-trips = ช้ามาก
- Bulk INSERT = 1 round-trip เสมอ ไม่ว่าจะกี่คน

---

## 2. Transaction Pattern (mysql2 pool)

```js
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();

  // ... queries ทั้งหมด ใช้ conn.query() ...

  await conn.commit();
} catch (error) {
  await conn.rollback();
  throw error;
} finally {
  conn.release(); // ← ต้องอยู่ใน finally เสมอ ไม่งั้น connection leak!
}
```

**ทำไมต้อง transaction:**
- ถ้า ticket INSERT สำเร็จ แต่ notification INSERT fail → ช่างไม่รู้เรื่อง silent bug
- ถ้าใช้ transaction → rollback ทั้งคู่ user ได้ 500 แล้ว retry ได้

**⚠️ pool มีแค่ 10 connections** — ถ้า `conn.release()` ไม่อยู่ใน `finally` แล้ว error → connection leak → server hang

---

## 3. Code สมบูรณ์ — แทนที่ POST /api/tickets

```js
// backend/routes/tickets.js
router.post('/', auth, async (req, res) => {
  const { title, description, charger_id, priority } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. สร้าง ticket
    const [result] = await conn.query(
      `INSERT INTO maintenance_tickets (reported_by, title, description, charger_id, priority, status)
       VALUES (?, ?, ?, ?, ?, 'reported')`,
      [req.user.user_id, title, description, charger_id || null, priority || 'medium']
    );
    const ticket_id = result.insertId;

    // 2. ดึง technician ทั้งหมด
    const [technicians] = await conn.query(
      `SELECT user_id FROM users WHERE role = 'technician'`
    );

    // 3. Bulk INSERT notifications
    if (technicians.length > 0) {
      const chargerLabel = charger_id ? `ตู้ #${charger_id}` : 'ไม่ระบุตู้';
      const message = `มีการแจ้งปัญหาใหม่: ${description} - ${chargerLabel} (Ticket #${ticket_id})`;

      const placeholders = technicians.map(() => '(?, ?, 0)').join(', ');
      const flatValues = technicians.flatMap(t => [t.user_id, message]);

      await conn.query(
        `INSERT INTO notifications (user_id, message, is_read) VALUES ${placeholders}`,
        flatValues
      );
    }

    await conn.commit();
    return res.status(201).json({ message: 'Support ticket created successfully.', ticket_id });

  } catch (error) {
    await conn.rollback();
    console.error('Create ticket error:', error);
    return res.status(500).json({ message: 'Server error creating ticket.' });
  } finally {
    conn.release();
  }
});
```

---

## 4. Notification Message Format

```
มีการแจ้งปัญหาใหม่: {description} - ตู้ #{charger_id} (Ticket #{ticket_id})
```

ตัวอย่าง:
> `มีการแจ้งปัญหาใหม่: ตู้ชาร์จไม่ทำงาน - ตู้ #42 (Ticket #187)`

ใส่ ticket_id ไว้ด้วย เพื่อให้ frontend ของช่างกด deep-link ไปหน้า ticket ได้

---

## ⚠️ หมายเหตุ: ชื่อ table จริง

ตาราง ticket ในโปรเจกต์นี้ชื่อ **`maintenance_tickets`** ไม่ใช่ `tickets`  
ตรวจสอบ column ใน `maintenance_tickets` ก่อน insert ว่าตรงกับ `reported_by, title, description, charger_id, priority, status` หรือเปล่า
