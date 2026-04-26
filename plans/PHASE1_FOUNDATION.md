# Phase 1 — Foundation UX (~1.5 วัน)

> 6 features ที่ทำง่ายและเห็นผลทันที
> อ่าน [WALLET_FEATURES_INDEX.md](./WALLET_FEATURES_INDEX.md) ก่อน

---

## Schema Migration (รันใน phpMyAdmin ก่อนเริ่ม)

```sql
-- Feature 1+2: debt model
ALTER TABLE users
  ADD COLUMN outstanding_debt DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER wallet_balance;

-- Feature 7: overheat protection
ALTER TABLE chargers
  ADD COLUMN max_temperature_celsius DECIMAL(5,2) NOT NULL DEFAULT 60.00 AFTER temperature_celsius;

-- Feature 14: favorite stations
CREATE TABLE user_favorites (
  favorite_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  station_id  INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (favorite_id),
  UNIQUE KEY uk_user_station (user_id, station_id),
  CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_fav_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_favorites_user ON user_favorites(user_id);
```

→ **อย่าลืม update [backend/schema.sql](../backend/schema.sql)** ตามด้วย

---

## ☑ Feature 1 — เลือกวิธีจ่าย (Wallet / Card Modal) — 0.5d

### Goal
ตอนหยุดชาร์จ ให้ผู้ใช้เลือกเองว่าจ่ายด้วย wallet หรือบัตรเครดิต (เหมือน Starbucks) แทน auto-fallback เดิม

### Current behavior
[backend/routes/sessions.js:225-330](../backend/routes/sessions.js) auto: wallet → ถ้าไม่พอ → ตัดบัตร Omise → ถ้าไม่มีบัตร = pending

### Backend
**แก้** `PATCH /api/sessions/:id/stop` — เพิ่ม body params `payment_method` + `card_id`:

```js
const { energy_kwh, payment_method, card_id } = req.body;
// payment_method: 'wallet' | 'credit_card' | null (null = preview only)
```

**Logic ใหม่:**
- ถ้า `payment_method === 'wallet'` → ตัด wallet (ถ้าไม่พอ → 402 + return shortage)
- ถ้า `payment_method === 'credit_card'` → ใช้ `card_id` charge ผ่าน Omise (ถ้า fail → 402)
- ถ้าไม่ส่งมา → return preview total_cost ไม่ตัดเงิน (ให้ frontend ขึ้น modal เลือก)

**เพิ่ม endpoint ใหม่** `GET /api/sessions/:id/preview-cost`:
```js
// Return: { energy_kwh, total_cost, wallet_balance, saved_cards: [...] }
// ใช้ก่อนเปิด modal เพื่อโหลดข้อมูล
```

### Frontend
**ไฟล์**: [frontend/src/pages/user/ChargingPage.jsx](../frontend/src/pages/user/ChargingPage.jsx)

**Flow ใหม่:**
1. user กด "หยุดชาร์จ"
2. Frontend ยังไม่เรียก `/stop` ทันที — เรียก `/preview-cost` ก่อน
3. แสดง bottom sheet modal:
   ```
   ┌────────────────────────┐
   │ ยืนยันการชำระ ฿120.50    │
   ├────────────────────────┤
   │ ⦿ Wallet (฿500.00)     │ ← default ถ้าพอ
   │ ○ VISA •••1234         │
   │ ○ + บัตรใหม่           │
   ├────────────────────────┤
   │  [ ยืนยันจ่าย ฿120.50 ]  │
   └────────────────────────┘
   ```
4. ถ้า wallet ไม่พอ → disable option wallet + ขึ้น "ขาด ฿XX"
5. กดยืนยัน → POST `/stop` พร้อม `payment_method` + `card_id`

**Component:** สร้าง `<PaymentMethodModal />` reusable (เก็บใน `frontend/src/components/`)

### Test plan
- [ ] wallet พอ → ดี
- [ ] wallet ไม่พอ → option disabled, ใช้บัตรได้
- [ ] ไม่มีบัตรเซฟไว้ → ไม่ขึ้น option
- [ ] ใช้บัตรใหม่ → tokenize → charge → success
- [ ] cancel modal → session ยังอยู่ที่ charging (ยังไม่ stop)

---

## ☑ Feature 2 — Low Balance Banner + Notification (<100 บ.) — 0.25d

### Goal
เตือนผู้ใช้เมื่อ wallet < 100 บ. แต่**ไม่ popup ขัดจังหวะ** — แค่ banner + notification

### Backend
**แก้** ทุกที่ที่ deduct wallet (`POST /api/wallet/deduct`, `PATCH /api/sessions/:id/stop`):
```js
// หลัง commit transaction:
if (newBalance < 100 && newBalance > 0) {
  await pool.query(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES (?, 'ยอดเงินใกล้หมด', 'ยอดเงินในกระเป๋าเหลือ ฿XX กรุณาเติมเงินเพื่อใช้งานต่อเนื่อง', 'payment')`,
    [user_id]
  );
}
```

### Frontend
**ไฟล์ที่แก้:**
- [WalletPage.jsx](../frontend/src/pages/user/WalletPage.jsx) — เพิ่ม banner สีเหลืองเตือน (อยู่ใต้ frozen banner)
- หน้า Home/Dashboard — เพิ่ม banner เดียวกัน
- [ChargingPage.jsx](../frontend/src/pages/user/ChargingPage.jsx) — banner ใน warning area

**Banner design:**
```jsx
{balance < 100 && balance > 0 && (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 px-4 py-2 flex items-center gap-2">
    <FaExclamationTriangle className="text-yellow-500" />
    <p className="text-sm text-yellow-800">
      ยอดเงินใกล้หมด (฿{balance}) <button className="underline">เติมเงิน</button>
    </p>
  </div>
)}
```

### Test plan
- [ ] เติม 50 บ. → เห็น banner เหลือง
- [ ] เติมเพิ่มจน >= 100 บ. → banner หาย
- [ ] balance = 0 → ไม่แสดง banner (มี frozen banner แทน)
- [ ] notification เข้า table notifications เมื่อ deduct ทำให้ balance < 100

---

## ☑ Feature 3 — แสดงอุณหภูมิตู้ตอนชาร์จ — 0.25d

### Goal
แสดง `chargers.temperature_celsius` ในหน้า ChargingPage (real-time ขณะชาร์จ)

### Backend
[GET /api/sessions/:id/status](../backend/routes/sessions.js) — เพิ่ม `temperature_celsius` ใน SELECT (อยู่ใน chargers table แล้ว):

```sql
SELECT s.*, c.temperature_celsius, c.max_temperature_celsius, ...
FROM charging_sessions s
JOIN chargers c ON s.charger_id = c.charger_id
...
```

### Frontend
[ChargingPage.jsx](../frontend/src/pages/user/ChargingPage.jsx) — เพิ่มการ์ดข้างๆ ตอนชาร์จ:
```jsx
<div className="bg-white rounded-2xl p-3">
  <div className="flex items-center gap-2">
    <FaThermometerHalf className={temp > 50 ? 'text-orange-500' : 'text-blue-500'} />
    <span className="text-sm">{temp}°C</span>
  </div>
  <p className="text-xs text-gray-400">อุณหภูมิตู้</p>
</div>
```

### Mock temperature update
ระบบเราไม่มี OCPP จริง → mock ด้วย random walk:
- เพิ่ม cron job หรือ DB trigger update `temperature_celsius` ทุก 30 วิ ใน chargers ที่มี active session
- formula: `current_temp + random(-2, +3)` cap ที่ 25-70°C
- ทำเป็น `setInterval` ใน backend (server.js หรือ jobs/temperatureSimulator.js)

### Test plan
- [ ] เริ่มชาร์จ → temp อัปเดตทุก 30 วิ
- [ ] หยุดชาร์จ → temp คงที่ (ไม่อัปเดตต่อ)
- [ ] temp > 50°C → icon เปลี่ยนสีส้ม

---

## ☑ Feature 7 — Overheat Protection (>60°C ห้ามชาร์จ) — 0.25d

### Goal
ถ้า `chargers.temperature_celsius > max_temperature_celsius (60)` → ห้าม start session + แจ้ง maintenance

### Backend
[POST /api/sessions/start](../backend/routes/sessions.js) — เพิ่ม check **ก่อน** เริ่ม transaction:

```js
const [chargerRows] = await pool.query(
  `SELECT temperature_celsius, max_temperature_celsius FROM chargers WHERE charger_id = ?`,
  [charger_id]
);
const ch = chargerRows[0];
if (ch.temperature_celsius && ch.temperature_celsius > ch.max_temperature_celsius) {
  // auto create maintenance ticket
  await pool.query(
    `INSERT INTO maintenance_tickets (charger_id, reported_by, title, description, priority, status)
     VALUES (?, ?, ?, ?, 'high', 'reported')`,
    [charger_id, req.user.user_id, 'Charger overheating', `Temperature ${ch.temperature_celsius}°C exceeds max ${ch.max_temperature_celsius}°C`]
  );
  return res.status(503).json({
    message: `ตู้ร้อนเกิน (${ch.temperature_celsius}°C) ระบบไม่อนุญาตให้ชาร์จเพื่อความปลอดภัย แจ้งช่างซ่อมแล้ว`,
    code: 'CHARGER_OVERHEATED',
    current_temp: ch.temperature_celsius,
    max_temp: ch.max_temperature_celsius
  });
}
```

**ระหว่างชาร์จ (in-session check):** ใน `GET /api/sessions/:id/status` ถ้า temp > max → auto-stop session (เหมือน auto-stop เดิมแต่ trigger ต่าง):
```js
if (charger.temperature_celsius > charger.max_temperature_celsius) {
  // stop session, create ticket, notify
}
```

### Frontend
[ChargingPage.jsx](../frontend/src/pages/user/ChargingPage.jsx):
- จัดการ error 503 + code `CHARGER_OVERHEATED` → ขึ้น modal "ตู้นี้ร้อนเกิน เลือกตู้อื่น"
- ระหว่างชาร์จ ถ้า auto-stop จาก overheat → notification + redirect

### Test plan
- [ ] ตั้ง temp = 65°C ใน DB → start session → 503
- [ ] ตั้ง temp ขึ้นระหว่างชาร์จ → auto stop + ticket ถูกสร้าง
- [ ] notification "ตู้ร้อนเกิน" ส่งให้ user

---

## ☑ Feature 10 — Estimated Charge Time — 0.25d

### Goal
แสดง "อีก ~25 นาทีจะถึง 80%" ตอนชาร์จ

### Backend
[GET /api/sessions/:id/status](../backend/routes/sessions.js) — เพิ่ม calculation:

```js
// คำนวณ vehicle ที่ตรง connector type
const [vehicleRows] = await pool.query(
  `SELECT v.battery_capacity_kwh, v.battery_current_kwh
   FROM vehicles v JOIN chargers c ON c.connector_type = v.connector_type
   WHERE v.user_id = ? AND c.charger_id = ? LIMIT 1`,
  [user_id, charger_id]
);

const v = vehicleRows[0];
const currentKwh = v.battery_current_kwh + estimatedKwhAdded; // จาก session.start_time × power_kw
const targetKwh80 = v.battery_capacity_kwh * 0.8;
const targetKwh100 = v.battery_capacity_kwh;

const minutesTo80 = Math.max(0, ((targetKwh80 - currentKwh) / power_kw) * 60);
const minutesTo100 = Math.max(0, ((targetKwh100 - currentKwh) / power_kw) * 60);

return {
  ...session,
  estimated: {
    current_percentage: (currentKwh / v.battery_capacity_kwh * 100).toFixed(1),
    minutes_to_80: Math.ceil(minutesTo80),
    minutes_to_100: Math.ceil(minutesTo100),
  }
};
```

> **หมายเหตุ:** DC fast charge จริงไม่ linear (ช้าลงเมื่อ >80%) — เรา simplify ใช้ linear ก็พอสำหรับ project

### Frontend
[ChargingPage.jsx](../frontend/src/pages/user/ChargingPage.jsx) — เพิ่มการ์ดบอกเวลา:
```jsx
<div className="bg-white rounded-2xl p-3">
  <p className="text-xs text-gray-400">อีก {minutes_to_80} นาทีถึง 80%</p>
  <p className="text-xs text-gray-400">อีก {minutes_to_100} นาทีถึง 100%</p>
</div>
```

### Test plan
- [ ] รถ 50% → กำลังชาร์จด้วย DC 50kW battery 75kWh → ดูว่า estimate ใกล้เคียงจริง
- [ ] ใกล้ 80% → minutes_to_80 = 0
- [ ] ไม่มี vehicle ที่ตรง connector → ไม่ขึ้น estimate (graceful fail)

---

## ☑ Feature 14 — Favorite Stations — 0.25d

### Goal
ผู้ใช้กดหัวใจ ♡ → ปักหมุดสถานี → มีหน้า "สถานีโปรด"

### Backend
**Endpoint ใหม่ใน [routes/stations.js](../backend/routes/stations.js)** (หรือสร้าง [routes/favorites.js](../backend/routes/favorites.js)):

```js
// ดูสถานีโปรดของ user
GET /api/favorites
→ { favorites: [{ station_id, name, address, image, ... }] }

// ปักหมุด
POST /api/favorites
body: { station_id }
→ 201

// ลบ
DELETE /api/favorites/:station_id
→ 200

// ดูว่า station นี้ user ปักหมุดแล้วหรือยัง (ใช้ใน station detail page)
// → ใส่ใน GET /api/stations/:id โดย LEFT JOIN user_favorites
```

### Frontend
**ไฟล์ที่แก้:**
- หน้า station detail (`SearchPage` / `StationDetailPage`) — เพิ่มปุ่ม ♡ มุมขวาบน
- เพิ่มหน้าใหม่ [pages/user/FavoritesPage.jsx](../frontend/src/pages/user/FavoritesPage.jsx) — list สถานีโปรด
- เพิ่มลิงก์ใน [BottomNav.jsx](../frontend/src/components/BottomNav.jsx) หรือ Profile menu

**UI:**
```jsx
<button onClick={toggleFavorite}>
  {isFavorite ? <FaHeart className="text-red-500"/> : <FaRegHeart />}
</button>
```

### Test plan
- [ ] กด ♡ → ปักหมุด → เห็นในหน้า "สถานีโปรด"
- [ ] กดอีกครั้ง → ลบ
- [ ] ปักหมุดสถานีเดิม 2 ครั้ง → ไม่ duplicate (UNIQUE constraint)
- [ ] ลบสถานี (admin) → favorites ก็หายตาม (ON DELETE CASCADE)

---

## End of Phase 1

**ก่อนไป Phase 2:**
- [ ] ทุก feature ผ่าน test ทั้งหมด
- [ ] Commit เป็น 6 commits แยก (1 feature = 1 commit)
- [ ] Update memory ของ nem ว่า phase 1 เสร็จแล้ว
- [ ] บอก nem ให้ test 1 รอบสุดท้ายก่อนไปต่อ

→ ต่อ [PHASE2_SMART.md](./PHASE2_SMART.md)
