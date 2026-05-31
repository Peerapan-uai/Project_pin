# Context

โปรเจค **EV Charging Station Booking** — ระบบจอง charger + payment + real-time charging tracking.

## Language

**Booking** (`bookings` table)
การจองช่วงเวลาใช้ charger ในอนาคต — lifecycle: `pending → confirmed → active → completed / cancelled / expired`.
1 user สร้างได้หลาย booking, 1 booking ผูก 1 charger.
_Avoid_: reservation, slot, จอง (vague)

**Charging Session** (`charging_sessions` table)
Episode การ "จ่ายไฟ" จริงเมื่อ user check-in เสียบสาย — lifecycle: `charging → completed / failed / stopped`.
**1 Booking มีอย่างมาก 1 Charging Session** (FK `booking_id` NOT NULL).
_Avoid_: session (สับสน HTTP session), trip

**Station** (`stations` table)
สถานที่ตั้งทางกายภาพ (มี lat/lng) — parent ของ chargers.
_Avoid_: site, location, สาขา

**Charger** (`chargers` table)
เครื่องชาร์จเดี่ยว — child ของ station. **1 Station มีหลาย Chargers**.
_Avoid_: plug, port, slot, หัวชาร์จ

**Wallet** (`users.wallet_balance` + `wallet_transactions`)
ระบบเงินสด — top-up ด้วยเงินจริง (Omise) → หักจ่ายค่าชาร์จ. มี `wallet_frozen` lock + `outstanding_debt` แยก.
**คนละระบบกับ Point Balance** — Point ใช้แลกของ, Wallet ใช้จ่าย.
_Avoid_: balance (ambiguous), credit, point (คนละเรื่อง)

**Tariff** (`tariffs` table)
**กฎ**คำนวณราคา ต่อ charger ในแต่ละ period (peak / off-peak) — เป็น "กติกา" ไม่ใช่ "ราคา".
_Avoid_: price, rate, fee (สำหรับเรื่อง pricing rule)

## Flagged ambiguities

- **"session"** ในแชตทีม → หมายถึง **Charging Session** (ไม่ใช่ HTTP session)
- **"cancel / cancellation"** → 90% เกี่ยวกับ **Booking** (`status='cancelled'`), ไม่ใช่ Session (`status='stopped'`)
- **"start_time"** มีใน 2 tables เวลาคนละอย่าง:
  - `bookings.start_time` = user check-in
  - `charging_sessions.start_time` = เริ่มจ่ายไฟ
- **"point"** เฉยๆ → ต้องชัด: reward point (Point Balance) vs pricing point
- **"fee"** เฉยๆ → ต้องชัด: `idle_fee` / `no_show_fee` / `outstanding_debt` / tariff-derived
