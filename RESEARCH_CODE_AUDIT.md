# Code Audit — สถานะปัจจุบันของ 4 หน้า

> อ่านก่อนลงมือทำ — รู้ว่าแต่ละหน้ามีอะไรแล้ว ขาดอะไร

---

## 1. ChargingPage.jsx — ✅ ทำไปแล้วเยอะ

**API ที่เรียก:**
- `GET /api/sessions/:id/status` — poll ทุก 10 วิ
- `PATCH /api/sessions/:id/stop` — หยุดชาร์จ

**มีแล้ว:**
- timer แสดง HH:MM:SS (1s interval)
- แสดง kW, kWh (ประมาณ), ค่าไฟ (ประมาณ)
- ปุ่ม Stop Charging
- 2 interval refs (10s poll + 1s tick) — pattern ถูกต้องแล้ว

**ขาด:**
- ไม่แสดง error ให้ user เห็น (catch ไม่มี UI)
- ไม่มี retry ถ้า API fail

---

## 2. BookingPage.jsx — ✅ เกือบครบ

**API ที่เรียก:**
- `GET /api/chargers/:id`
- `GET /api/vehicles`
- `GET /api/stations/:id`
- `POST /api/bookings`

**มีแล้ว:**
- เลือก vehicle, duration
- คำนวณ kWh + ค่าไฟประมาณ
- success modal redirect 2 วิ

**ขาด:**
- ปุ่ม 🔧 แจ้งปัญหา (pre-fill charger_id ไปที่ ReportIssuePage)
- ไม่ validate ว่า user มีรถหรือยัง

---

## 3. PaymentPage.jsx — ⚠️ Mock ทั้งหมด ต้องทำใหม่

**API ที่เรียก:**
- `GET /api/sessions/:id/status` (ถ้าไม่มี state จาก ChargingPage)
- `POST /api/payments`

**สถานะปัจจุบัน — MOCK ทั้งหมด:**
- QR code = ดึงจาก `api.qrserver.com` แบบ fake (ไม่ใช่ PromptPay จริง)
- บัตรเครดิต = form ที่ค่าทุกอย่าง hardcode readonly (`4242 4242...`)
- ไม่มี Omise เลย

**ต้องทำใหม่:**
- PromptPay → Omise create charge → QR จริง
- บัตร → Omise.js tokenize → backend charge

---

## 4. ReportIssuePage.jsx — ✅ ทำงานได้ แต่มีช่องว่าง

**API ที่เรียก:**
- `GET /api/stations`
- `GET /api/chargers/station/:id`
- `POST /api/tickets`

**มีแล้ว:**
- เลือก station → โหลด charger dropdown
- กรอก title + description
- submit สร้าง ticket

**ขาด:**
- ไม่รับ `charger_id` จาก BookingPage (ต้องเลือกเอง)
- priority ไม่มี UI (มีแค่ state)
- ไม่มี ticket number ใน success message

---

## สรุป — งานที่เหลือเรียงตามความสำคัญ

| งาน | หน้า | ความยาก | หมายเหตุ |
|---|---|---|---|
| ปุ่ม 🔧 แจ้งปัญหา | BookingPage | ง่าย | navigate ไป ReportIssuePage พร้อม charger_id |
| รับ charger_id จาก route state | ReportIssuePage | ง่าย | เช็ค location.state ถ้ามีให้ pre-fill |
| Omise PromptPay จริง | PaymentPage | ปานกลาง | ต้องมี backend endpoint ใหม่ |
| Omise credit card จริง | PaymentPage | ปานกลาง | Omise.js tokenize |
| Auto-notify technician | tickets route | ง่าย | bulk INSERT notifications |
| Error UI ใน ChargingPage | ChargingPage | ง่าย | แค่แสดง error state |
