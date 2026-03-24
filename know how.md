## HTTP Protocol

req.body     // ข้อมูลที่แนบมาใน request (make, model, year...)
req.params   // ค่าใน URL เช่น /vehicles/:id → req.params.id
req.headers  // header เช่น Authorization: Bearer token
req.user     // user info ที่ auth middleware แนบไว้

---

## HTTP Methods

| Method | ใช้ทำอะไร      | ตัวอย่าง |
| GET |     ดึงข้อมูล      | ดูรถ, ดูโปรไฟล์ |
| POST |  สร้างข้อมูลใหม่   | เพิ่มรถ, สมัครสมาชิก |
| PUT |   แก้ข้อมูลทั้งก้อน  | แก้ข้อมูลรถทุก field |
| PATCH | แก้ข้อมูลบางส่วน | เปลี่ยนแค่สถานะ |
| DELETE | ลบข้อมูล         | ลบรถ |