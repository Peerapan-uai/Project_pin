# Phase 3 — Advanced Features (~3 วัน)

> 3 features โหดสุด เก็บไว้ทำท้าย
> **ทำหลัง Phase 1 + 2 ผ่านแล้ว** — อ่าน [WALLET_FEATURES_INDEX.md](./WALLET_FEATURES_INDEX.md) ก่อน

---

## Schema Migration

```sql
-- Feature 9: Booking schedule (3 levels)
ALTER TABLE bookings
  ADD COLUMN scheduled_start TIMESTAMP NULL DEFAULT NULL AFTER booking_time,
  ADD COLUMN duration_min INT NOT NULL DEFAULT 60 AFTER scheduled_start,
  ADD COLUMN recurring_schedule_id INT UNSIGNED NULL DEFAULT NULL AFTER duration_min;

CREATE TABLE recurring_schedules (
  schedule_id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NOT NULL,
  charger_id   INT UNSIGNED NOT NULL,
  days_of_week SET('mon','tue','wed','thu','fri','sat','sun') NOT NULL,
  start_time   TIME NOT NULL,
  duration_min INT NOT NULL DEFAULT 60,
  active       TINYINT(1) NOT NULL DEFAULT 1,
  weeks_ahead  INT NOT NULL DEFAULT 4,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (schedule_id),
  CONSTRAINT fk_rs_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_rs_charger FOREIGN KEY (charger_id) REFERENCES chargers(charger_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- เพิ่ม FK ของ recurring_schedule_id หลัง create table
ALTER TABLE bookings
  ADD CONSTRAINT fk_bookings_recurring FOREIGN KEY (recurring_schedule_id)
    REFERENCES recurring_schedules(schedule_id) ON DELETE SET NULL;

CREATE TABLE booking_skip_dates (
  skip_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  schedule_id INT UNSIGNED NOT NULL,
  skip_date   DATE NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (skip_id),
  UNIQUE KEY uk_schedule_date (schedule_id, skip_date),
  CONSTRAINT fk_bsd_schedule FOREIGN KEY (schedule_id)
    REFERENCES recurring_schedules(schedule_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Feature 12: Idle fee tracking
ALTER TABLE charging_sessions
  ADD COLUMN full_charge_time TIMESTAMP NULL DEFAULT NULL AFTER end_time,
  ADD COLUMN idle_start_time  TIMESTAMP NULL DEFAULT NULL AFTER full_charge_time,
  ADD COLUMN idle_end_time    TIMESTAMP NULL DEFAULT NULL AFTER idle_start_time,
  ADD COLUMN idle_fee         DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER idle_end_time;
```

→ Update [backend/schema.sql](../backend/schema.sql) ตาม

---

## ☐ Feature 9 — Booking Schedule (3 levels) — 1.5d

### Goal
3 sub-features ต่อเนื่องในตัวเอง

### Sub-feature 9.1: One-time booking (date + time picker)

#### Backend
**Endpoint แก้** `POST /api/bookings`:
```js
body: {
  charger_id,
  scheduled_start: '2026-04-26T14:00:00',  // ISO 8601 (Asia/Bangkok)
  duration_min: 60                          // default 60
}
```

**Validation:**
- `scheduled_start` >= NOW + 5 นาที (อย่าจองเวลาผ่านมาแล้ว)
- `scheduled_start` <= NOW + 7 วัน (จองได้ 1 สัปดาห์ล่วงหน้า)
- duration_min ต้องเป็น 15/30/45/60/90/120
- เช็ค slot conflict: ไม่มี booking อื่น overlap ใน charger เดียวกัน

```sql
SELECT 1 FROM bookings WHERE charger_id = ?
  AND status IN ('pending','confirmed','active')
  AND NOT (scheduled_start + INTERVAL duration_min MINUTE <= ? OR scheduled_start >= ? + INTERVAL ? MINUTE)
LIMIT 1;
```

**Endpoint ใหม่** `GET /api/chargers/:id/available-slots?date=2026-04-26`:
```js
// Return available 15-min slots in that day
// e.g. [{ start: '14:00', end: '14:15', available: true }, ...]
```

#### Frontend
**ไฟล์** [pages/user/BookingPage.jsx](../frontend/src/pages/user/BookingPage.jsx) — refactor:
```
Step 1: เลือกตู้
  ↓
Step 2: เลือกวัน (calendar widget — react-day-picker หรือ self-built)
  ↓
Step 3: เลือก time slot (chips 15-min interval — สีต่างถ้า booked แล้ว)
  ↓
Step 4: เลือกระยะเวลา (15/30/60/90/120 นาที)
  ↓
Step 5: confirm
```

### Sub-feature 9.2: Recurring booking

#### Backend
**Endpoints ใหม่ใน [routes/recurringBookings.js](../backend/routes/recurringBookings.js)**:
```js
POST /api/recurring-bookings
body: {
  charger_id, days_of_week: ['mon','wed','fri'],
  start_time: '18:30', duration_min: 30, weeks_ahead: 4
}

GET /api/recurring-bookings  // list ของ user
PATCH /api/recurring-bookings/:id  // update active/skip
DELETE /api/recurring-bookings/:id

// Skip ครั้งเดียว
POST /api/recurring-bookings/:id/skip
body: { date: '2026-04-29' }
```

**Cron job** [backend/jobs/recurringBookingsGen.js](../backend/jobs/recurringBookingsGen.js) (รันทุกวัน เช้า):
```js
// สำหรับทุก recurring schedule active
//   ดู days_of_week → คำนวณวันที่ถัดไปใน 24 ชม.
//   ถ้าตรง + ไม่มีใน booking_skip_dates → INSERT bookings พร้อม recurring_schedule_id
//   ใส่ status = 'confirmed', scheduled_start, duration_min
```

#### Frontend
**หน้าใหม่** [pages/user/RecurringSchedulePage.jsx](../frontend/src/pages/user/RecurringSchedulePage.jsx):
- List recurring schedules
- Toggle active
- ปุ่ม "ไม่ไปวันนี้" (สำหรับ booking ที่ generate มาจาก recurring)

**Form สร้าง schedule (modal):**
```
☑ จันทร์ ☐ อังคาร ☑ พุธ ☐ พฤหัส ☑ ศุกร์ ☐ เสาร์ ☐ อาทิตย์
เวลา: [18:30]
ระยะเวลา: [30 นาที]
ทำซ้ำ: [4] สัปดาห์
```

### Sub-feature 9.3: Smart suggestion popup

#### Backend
**Endpoint ใหม่** `GET /api/bookings/suggest-recurring`:
```js
// หา booking 5 ครั้งล่าสุดของ user
// ถ้า ≥3 ครั้งตรงกัน (charger_id + day_of_week + start_hour ใกล้กัน) → return suggestion
const [recent] = await pool.query(`
  SELECT charger_id, DAYNAME(scheduled_start) as day, HOUR(scheduled_start) as hour, COUNT(*) as cnt
  FROM bookings
  WHERE user_id = ? AND status IN ('completed','active')
    AND scheduled_start > DATE_SUB(NOW(), INTERVAL 4 WEEK)
  GROUP BY charger_id, day, hour
  HAVING cnt >= 3
`, [user_id]);

return { suggestions: recent };
```

#### Frontend
**[BookingPage.jsx](../frontend/src/pages/user/BookingPage.jsx)** หรือ Home — call endpoint นี้ตอน mount → ถ้ามี suggestion → ขึ้น popup:
```
┌──────────────────────────────────────────┐
│ 💡 เห็นว่าคุณจองทุกวัน จ./พ./ศ. 18:30   │
│    อยากให้ล็อกประจำมั้ย?                │
│  [ ยังก่อน ]   [ ล็อกเลย ]              │
└──────────────────────────────────────────┘
```
กด "ล็อกเลย" → POST `/recurring-bookings` ด้วย default values จาก pattern

### Test plan
- [ ] 9.1: จองวันพรุ่งนี้ 14:00 → booking record มี scheduled_start ถูกต้อง
- [ ] 9.1: จองทับ slot คนอื่น → 409 conflict
- [ ] 9.1: เลือกเวลาผ่านมา → 400
- [ ] 9.2: สร้าง recurring จันทร์/พุธ/ศุกร์ → cron generate booking 4 สัปดาห์ × 3 = 12 bookings
- [ ] 9.2: skip 1 วัน → วันนั้นไม่ generate
- [ ] 9.3: จอง pattern ตรงกัน 3 ครั้ง → popup ขึ้น
- [ ] 9.3: pattern ไม่ตรง → ไม่มี popup
- [ ] integrate กับ #11 cancellation: ยกเลิก booking ที่มาจาก recurring → ไม่กระทบ recurring schedule

---

## ☐ Feature 12 — Idle Fee + State Machine + Debt Model — 1d

### Goal
**ตู้ที่ `idle_fee_enabled = 1`** + ชาร์จเสร็จแล้ว + มีคนจองคิวต่อไป → 5 บ./นาทีหลัง grace 5 นาที (Tesla logic)

### Charger State Machine

```
                  start session
available  ─────────────────────►  charging
   ▲                                    │
   │                                    │ % >= 100
   │                                    ▼
   │                                idle_pending  (มีคิวรอ + ยังเสียบ)
   │                                    │
   │                                    │ user "ถอดสาย" หรือ no-queue
   └────────────────────────────────────┘
```

> ใช้ `chargers.status` field เดิม (เพิ่ม value 'idle_pending') หรือใช้ logic implicit จาก `charging_sessions.full_charge_time IS NOT NULL AND end_time IS NULL`

ผมแนะนำ **implicit** (ไม่เพิ่ม enum value ใหม่) — ใช้ field timestamps ใน sessions แทน

### Backend logic

**1. Detect "ชาร์จเสร็จ" + "มีคิวรอ":**
ใน [GET /api/sessions/:id/status](../backend/routes/sessions.js) — เพิ่ม check:
```js
const reachedFull = estimatedPercent >= 100;
const [queueRows] = await pool.query(`
  SELECT booking_id FROM bookings
  WHERE charger_id = ? AND status IN ('pending','confirmed')
    AND scheduled_start <= DATE_ADD(NOW(), INTERVAL 30 MINUTE)
  ORDER BY scheduled_start ASC LIMIT 1
`, [session.charger_id]);
const hasQueue = queueRows.length > 0;

if (reachedFull && hasQueue && session.charger.idle_fee_enabled) {
  // ตั้ง full_charge_time ถ้ายังไม่ตั้ง
  if (!session.full_charge_time) {
    await pool.query(`UPDATE charging_sessions SET full_charge_time = NOW() WHERE session_id = ?`, [session.session_id]);
  }
}
```

**2. คำนวณ idle fee สะสม:**
```js
if (session.full_charge_time && !session.end_time) {
  const fullChargeTime = new Date(session.full_charge_time);
  const now = new Date();
  const totalIdleMins = (now - fullChargeTime) / 60000;
  const billableMins = Math.max(0, totalIdleMins - 5); // grace 5 นาที
  const idleFee = billableMins * 5;
  // return ใน response → frontend แสดง running idle fee
  response.idle_fee_running = idleFee;
  response.idle_minutes = Math.floor(billableMins);
}
```

**3. ตอน user "ถอดสาย" (เพิ่มปุ่มใหม่):**

**Endpoint ใหม่** `POST /api/sessions/:id/unplug`:
```js
// คำนวณ idle fee ครั้งสุดท้าย → commit
const billableMins = Math.max(0, (now - fullChargeTime) / 60000 - 5);
const idleFee = Math.round(billableMins * 5 * 100) / 100;

await conn.beginTransaction();
await conn.query(`UPDATE charging_sessions SET idle_end_time = NOW(), idle_fee = ?, end_time = NOW(), status = 'completed' WHERE session_id = ?`, [idleFee, id]);
await conn.query(`UPDATE chargers SET status = 'available' WHERE charger_id = ?`, [session.charger_id]);

if (idleFee > 0) {
  // ใช้ chargeFeeOrAddDebt helper จาก Phase 2 #11
  await chargeFeeOrAddDebt(user_id, idleFee, `idle_${id}`);
}
await conn.commit();
```

**4. Auto-unplug ถ้าเกิน threshold:**
Cron job [backend/jobs/idleFeeAutoStop.js](../backend/jobs/idleFeeAutoStop.js) (ทุก 1 นาที):
```js
// หา sessions ที่ full_charge_time + 60 mins < NOW + ยังไม่ end → force unplug
// + แจ้งเตือน user "session ถูกปิดอัตโนมัติเพราะคุณไม่มาถอดสาย"
```

### Frontend
**[ChargingPage.jsx](../frontend/src/pages/user/ChargingPage.jsx)** — แสดง idle fee running:
```jsx
{session.full_charge_time && !session.end_time && (
  <div className="bg-orange-50 border-l-4 border-orange-400 p-3">
    <p className="font-bold text-orange-800">⚠️ ชาร์จเสร็จแล้ว มีคนจองคิวต่อ</p>
    <p className="text-sm">กรุณาถอดสายภายใน {grace} นาที</p>
    {idleMinutes > 0 && (
      <p className="text-orange-600 font-bold">Idle fee: ฿{idle_fee_running.toFixed(2)} ({idleMinutes} นาที)</p>
    )}
    <button onClick={handleUnplug} className="mt-2 bg-orange-500 text-white py-2 px-4 rounded">
      ถอดสาย — สิ้นสุดการใช้งาน
    </button>
  </div>
)}
```

### Test plan
- [ ] charger A idle_fee_enabled=1, ชาร์จถึง 100%, **ไม่มีคิว** → ไม่จับเวลา idle (เป็น 0)
- [ ] charger A, 100%, **มีคิว** → grace 5 นาที, นาทีที่ 6 → idle_fee = 5 บ.
- [ ] นาทีที่ 10 → idle_fee = 25 บ.
- [ ] กดถอดสาย → commit ตัด wallet
- [ ] wallet ไม่พอ → debt += idle_fee
- [ ] ไม่ถอดเลย 60 นาที → cron force unplug + ตัดเงิน
- [ ] charger B idle_fee_enabled=0 → ไม่จับเวลา ไม่ว่าจะมีคิวหรือไม่

---

## ☐ Feature 13 — Trip Planning (Google Maps) — 1d

### Goal
ผู้ใช้บอกปลายทาง → ระบบดูระยะ + battery → แนะนำว่าต้องชาร์จ + ที่ไหน

### Constants
- **Consumption rate fixed:** 0.18 kWh/km (ค่าเฉลี่ย EV ไทย)
- **Safety margin:** 20% (เผื่อรถติด, hill, AC)
- **Max deviation:** 5 km จากเส้นทางหลัก

### Logic
```
1. user input: ปลายทาง (place name หรือ pin บนแผนที่)
2. Google Directions API → ระยะทาง km, polyline
3. range = battery_current_kwh / 0.18 × 0.8  (× safety margin)
4. ถ้า distance <= range → "ไปได้ ไม่ต้องชาร์จ"
5. ถ้า distance > range:
   a. คำนวณจุดที่แบตจะหมด = polyline[i] when cumulative_distance >= range × 0.85
   b. query stations WHERE distance_to_point < 5km AND has connector match
   c. order by distance to point
   d. return top 3 stations
6. user เลือก station → จอง slot ตรงเวลาที่จะถึง (estimated_arrival_time)
```

### Backend
**Endpoint ใหม่ใน [routes/tripPlan.js](../backend/routes/tripPlan.js)**:
```js
POST /api/trip-plan
body: {
  destination: { lat: 13.74, lng: 100.53 },   // หรือ address text
  vehicle_id: 1
}

→ {
  distance_km: 45.2,
  range_km: 60.5,
  needs_charging: false,
  estimated_arrival: '2026-04-26T15:30:00',
}

หรือ ถ้า needs_charging:
{
  distance_km: 120.5,
  range_km: 60.5,
  needs_charging: true,
  charging_point: { lat, lng, after_km: 51.4 },
  suggested_stations: [
    { station_id, name, distance_from_path_km: 0.8, available_chargers: 3, ... },
    ...
  ]
}
```

**ใช้ Google Maps Directions API:**
```js
const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
const res = await fetch(url);
const data = await res.json();
const route = data.routes[0];
const distanceKm = route.legs[0].distance.value / 1000;
const polyline = route.overview_polyline.points; // encoded
```

**หา stations ใกล้จุด:**
```sql
SELECT station_id, name, address, latitude, longitude,
  ( 6371 * acos( cos(radians(?)) * cos(radians(latitude))
    * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)) ) ) AS distance_km
FROM stations WHERE status = 'active'
HAVING distance_km < 5
ORDER BY distance_km ASC LIMIT 5;
```
(Haversine formula — query ตรงๆ ใน MySQL)

**Polyline decode:**
ใช้ library `@googlemaps/polyline-codec`:
```js
const points = decode(polyline);  // [[lat, lng], ...]
// หา point ที่ cumulative distance >= range_km × 0.85
```

### Frontend
**หน้าใหม่หรือเพิ่มใน [SearchPage.jsx](../frontend/src/pages/user/SearchPage.jsx)**:
```
[ปลายทาง: ____________ 🔍]      ← input ปลายทาง
[คำนวณเส้นทาง]

┌────────────────────────┐
│ ระยะทาง: 120.5 km       │
│ Range ปัจจุบัน: 60.5 km │
│ ⚠️ ต้องชาร์จระหว่างทาง │
└────────────────────────┘

แนะนำสถานี:
┌────────────────────────┐
│ 1. EA Anywhere ปลื้มสุข │
│    ห่างจากเส้นทาง 0.8km │
│    ตู้ว่าง 3/4         │
│    [ จองตู้นี้ ]        │
└────────────────────────┘
```

### Test plan
- [ ] ไกล้ → "ไปได้ ไม่ต้องชาร์จ"
- [ ] ไกล + แบตเต็ม → ไม่ต้องชาร์จ
- [ ] ไกล + แบตเหลือน้อย → แสดง suggested stations
- [ ] ไม่มี station ในรัศมี 5km จากจุดแบตหมด → return empty list + แจ้งเตือน
- [ ] Google API fail (network) → graceful error

---

## ⚠️ Final Steps

หลัง Phase 3 เสร็จ:
- [ ] Update memory ของ nem ทั้งหมด (project_status, schema_sync_warning, etc.)
- [ ] Document feature ใน [nem_scope.md](../nem_scope.md)
- [ ] อัปเดต [backend/schema.sql](../backend/schema.sql) ครั้งสุดท้าย → push ให้ lalla
- [ ] Test integration ทั้ง 14 features
- [ ] บอก nem ให้ test สอน flow ทั้งหมด end-to-end

---

## ❤️ Note from Opus to Sonnet

เริ่ม **Feature 1 ก่อน** อย่ารวบรวบทำหลายอันพร้อมกัน
ทุก feature → bbb สร้าง branch แยกถ้าเป็นไปได้ → test → merge เข้า master
ถ้า user (nem) บอกอะไรขัดกับ plan นี้ → **ถาม nem ก่อนแก้ plan**
ห้ามตัดสินใจเปลี่ยน scope เอง

Good luck — let's ship it! 🚀
