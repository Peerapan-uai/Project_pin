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

---

## HTTP Status Codes

| Status | ความหมาย | ใช้เมื่อ |
|--------|---------|---------|
| 200 | OK | สำเร็จทั่วไป (GET, PUT, DELETE, PATCH) |
| 201 | Created | สร้างข้อมูลใหม่สำเร็จ (POST) |
| 400 | Bad Request | ข้อมูลที่ส่งมาผิด/ไม่ครบ |
| 401 | Unauthorized | ไม่มี token หรือ token ไม่ถูกต้อง |
| 403 | Forbidden | มี token แต่ไม่มีสิทธิ์ (เช่น ไม่ใช่ admin) |
| 404 | Not Found | หาข้อมูลไม่เจอใน DB |
| 500 | Server Error | DB พัง หรือ query ผิดพลาด |

