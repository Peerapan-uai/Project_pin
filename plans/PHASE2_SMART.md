# Phase 2 — Smart Features (~2 วัน)

> 5 features ที่มี logic ซับซ้อนขึ้น
> **ทำหลัง Phase 1 ผ่านหมดแล้ว** — อ่าน [WALLET_FEATURES_INDEX.md](./WALLET_FEATURES_INDEX.md) ก่อน

---

## Schema Migration

```sql
-- Feature 4: Auto-stop hybrid + Feature 12 idle fee toggle (ใส่ตอนนี้เพื่อ phase 3 ใช้ต่อได้)
ALTER TABLE chargers
  ADD COLUMN idle_fee_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER status;

-- Feature 6: Reward points
CREATE TABLE point_balances (
  user_id    INT UNSIGNED NOT NULL,
  balance    INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_pb_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE point_transactions (
  txn_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  amount     INT NOT NULL,
  type       ENUM('earn','redeem','expire','adjust') NOT NULL,
  ref        VARCHAR(100) DEFAULT NULL,
  expires_at DATE DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (txn_id),
  CONSTRAINT fk_pt_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_pt_user ON point_transactions(user_id, created_at);
CREATE INDEX idx_pt_expires ON point_transactions(expires_at);

-- Feature 8: TOU pricing
CREATE TABLE tariffs (
  tariff_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  charger_id  INT UNSIGNED NOT NULL,
  period      ENUM('on_peak','off_peak') NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  price_per_kwh DECIMAL(6,2) NOT NULL,
  PRIMARY KEY (tariff_id),
  CONSTRAINT fk_tariff_charger FOREIGN KEY (charger_id) REFERENCES chargers(charger_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_tariffs_charger ON tariffs(charger_id, period);

-- Feature 11: Cancellation fee tracking (ใช้ payments table เดิม + เพิ่ม booking columns)
ALTER TABLE bookings
  ADD COLUMN cancelled_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN no_show_fee_charged DECIMAL(10,2) DEFAULT 0;
```

→ Update [backend/schema.sql](../backend/schema.sql) ตาม

---

## ☐ Feature 4 — Auto-stop Hybrid (A default + B admin toggle) — 0.5d

### Goal
- **Mode A (default):** ชาร์จถึง 100% → auto stop ปกติ
- **Mode B (admin toggle ที่ `chargers.idle_fee_enabled = 1`):** ถึง 100% **ไม่ stop** ทันที — รอดูว่ามีคนจองคิวต่อมั้ย → trigger idle fee ใน Phase 3 (#12)

> Phase 2 ทำแค่ trigger ที่ 100% — ส่วน idle fee ตัดเงินจริงๆ ทำใน Phase 3

### Backend
[GET /api/sessions/:id/status](../backend/routes/sessions.js) — แก้ logic auto-stop เดิม:

```js
// เดิม: stop เมื่อ wallet ใกล้หมด
// ใหม่: stop เมื่อ
//   (a) charger.idle_fee_enabled = 0 + estimated 100% → auto stop
//   (b) charger.idle_fee_enabled = 1 + estimated 100% → ตั้ง flag waiting for unplug (อย่า stop)
//   (c) wallet ใกล้หมด → stop เหมือนเดิม

const estimatedPercent = (currentKwh / v.battery_capacity_kwh) * 100;
const reachedFull = estimatedPercent >= 100;

if (reachedFull && !charger.idle_fee_enabled) {
  // Mode A: auto stop
  // ... (ใช้ logic stop เดิม)
}
// Mode B: ปล่อยให้ session อยู่ที่ status='charging' แต่ % = 100 — Phase 3 idle fee จะหยิบไปใช้
```

### Admin endpoint
**เพิ่ม** `PATCH /api/admin/chargers/:id/idle-fee` (ให้ lalla ทำหรือ nem ทำเอง):
```js
body: { enabled: 0|1 }
→ UPDATE chargers SET idle_fee_enabled = ? WHERE charger_id = ?
```

### Frontend
- หน้า admin `WalletManagePage` หรือ `ChargersAdminPage` — เพิ่ม toggle "Idle fee" ในแต่ละ charger
- หน้า user [ChargingPage](../frontend/src/pages/user/ChargingPage.jsx) — แสดง message ต่างกัน:
  - Mode A 100% → "ชาร์จเสร็จแล้ว ระบบหยุดอัตโนมัติ"
  - Mode B 100% → "ชาร์จเสร็จแล้ว กรุณาถอดสายภายใน 5 นาที (idle fee อาจถูกเรียกเก็บ)"

### Test plan
- [ ] charger A: idle_fee_enabled=0, ชาร์จถึง 100% → auto stop
- [ ] charger B: idle_fee_enabled=1, ชาร์จถึง 100% → session ยัง active, % = 100
- [ ] toggle จาก admin → flag เปลี่ยนใน DB

---

## ☐ Feature 5 — แจ้งเตือน 80% / 100% — 0.5d

### Goal
ตอนชาร์จ ถ้าข้าม threshold 80% หรือ 100% → ขึ้น in-app notification

### Strategy
**Frontend polling** (ไม่ใช่ backend cron) — เพราะ user อยู่กับแอปอยู่แล้ว ประหยัด server resource

### Backend
**Endpoint ใหม่** `POST /api/sessions/:id/notify-milestone`:
```js
body: { milestone: 80 | 100 }
// idempotent: เช็คใน notifications table ก่อน insert ว่าส่งไปแล้วยัง (ดู ref column)
const [existing] = await pool.query(
  `SELECT 1 FROM notifications
   WHERE user_id = ? AND type = 'charging' AND message LIKE ?
   AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
  [user_id, `%session_${id}_${milestone}%`]
);
if (existing.length === 0) {
  await pool.query(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES (?, ?, ?, 'charging')`,
    [user_id, `ชาร์จถึง ${milestone}%`, `session_${id}_${milestone}: รถของคุณชาร์จถึง ${milestone}% แล้ว`]
  );
}
```

### Frontend
[ChargingPage.jsx](../frontend/src/pages/user/ChargingPage.jsx) — เพิ่ม polling logic:

```js
useEffect(() => {
  if (sessionStatus !== 'charging') return;
  const interval = setInterval(async () => {
    const res = await api.get(`/api/sessions/${sessionId}/status`);
    const newPercent = res.data.estimated?.current_percentage || 0;

    // ข้าม 80% threshold
    if (lastPercent < 80 && newPercent >= 80) {
      await api.post(`/api/sessions/${sessionId}/notify-milestone`, { milestone: 80 });
      // ขึ้น browser notification (ถ้า user permit)
      if (Notification.permission === 'granted') {
        new Notification('ชาร์จถึง 80%', { body: 'รถของคุณชาร์จถึง 80% แล้ว' });
      }
    }
    // ข้าม 100%
    if (lastPercent < 100 && newPercent >= 100) {
      // ... เหมือนกัน
    }
    setLastPercent(newPercent);
  }, 30000); // 30 วิ
  return () => clearInterval(interval);
}, [sessionStatus]);
```

**ขออนุญาต Notification:**
ใส่ใน mounting:
```js
useEffect(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, []);
```

### Test plan
- [ ] ชาร์จจาก 50% → ข้าม 80% → notification ขึ้น
- [ ] ข้าม 100% → notification ขึ้น
- [ ] reload page ระหว่างชาร์จ → ไม่ส่งซ้ำ (idempotent check ใน backend)
- [ ] User block notification permission → ไม่ error (graceful)

---

## ☐ Feature 6 — Reward Points — 0.75d

### Goal
- 1 บาท = 1 แต้ม (earn ตอนจ่ายค่าชาร์จ)
- 100 แต้ม = ส่วนลด 10 บ. ในการชาร์จครั้งถัดไป
- หมดอายุ 2 ปี (FIFO redeem)

### Backend
**Endpoints ใหม่ใน [routes/points.js](../backend/routes/points.js)** (สร้างไฟล์ใหม่):

```js
GET /api/points/balance
→ { balance: 350, transactions: [{ type, amount, ref, created_at, expires_at }, ...] }

POST /api/points/redeem
body: { points: 100 } // ต้องเป็นทวีคูณของ 100
→ { discount_amount: 10, new_balance: 250, redeem_token: 'RDM_xxx' }
// redeem_token = ใช้ตอน stop session เพื่อ apply ส่วนลด
```

**Earn logic:**
แก้ใน [sessions.js stop](../backend/routes/sessions.js) หลัง payment commit:
```js
// earn 1 แต้มต่อ 1 บาท
const earnedPoints = Math.floor(totalCost);
const expiresAt = new Date();
expiresAt.setFullYear(expiresAt.getFullYear() + 2);

await pool.query(
  `INSERT INTO point_balances (user_id, balance) VALUES (?, ?)
   ON DUPLICATE KEY UPDATE balance = balance + ?`,
  [user_id, earnedPoints, earnedPoints]
);
await pool.query(
  `INSERT INTO point_transactions (user_id, amount, type, ref, expires_at)
   VALUES (?, ?, 'earn', ?, ?)`,
  [user_id, earnedPoints, `session_${id}`, expiresAt]
);
```

**Apply discount logic:**
แก้ใน [sessions.js stop](../backend/routes/sessions.js) — รับ body param `redeem_token`:
```js
const { redeem_token } = req.body;
let discount = 0;
if (redeem_token) {
  // ดึง pending redeem (เก็บใน point_transactions WHERE type='redeem' AND ref=redeem_token)
  const [redeemRows] = await conn.query(
    `SELECT amount FROM point_transactions WHERE ref = ? AND user_id = ? AND type = 'redeem'`,
    [redeem_token, user_id]
  );
  if (redeemRows.length > 0) {
    discount = Math.abs(redeemRows[0].amount) / 10; // 100 แต้ม = 10 บ.
    totalCost -= discount;
  }
}
```

**Expire job (cron):**
สร้าง [backend/jobs/pointsExpire.js](../backend/jobs/pointsExpire.js) รัน daily:
```js
// หา transactions ที่ expires_at < today AND type='earn' AND ยังไม่ใช้
// → INSERT type='expire' amount=-X
// → UPDATE point_balances ลด balance
```

### Frontend
**หน้าใหม่** [pages/user/PointsPage.jsx](../frontend/src/pages/user/PointsPage.jsx):
- แสดงยอดแต้ม + history (earn / redeem / expire)
- ปุ่ม "แลกส่วนลด" → modal เลือกว่าจะแลกกี่ 100s

**[ChargingPage.jsx](../frontend/src/pages/user/ChargingPage.jsx)** — ตอน confirm payment (จาก Phase 1 #1):
```jsx
{points >= 100 && (
  <div className="border-t pt-3">
    <label>
      <input type="checkbox" onChange={togglePoints} />
      ใช้ {pointsToRedeem} แต้ม (ลด ฿{pointsToRedeem/10})
    </label>
  </div>
)}
```

### Test plan
- [ ] จ่าย 120 บ. → ได้ 120 แต้ม
- [ ] แลก 100 แต้ม → ลด 10 บ. ในรอบถัดไป
- [ ] แลกเกินยอด → 400 error
- [ ] redeem แล้วยกเลิก → token expire (ไม่ใช้แล้ว → balance คืน)
- [ ] cron expire → แต้มเก่าหายหลัง 2 ปี

---

## ☐ Feature 8 — Time-of-Use (TOU) Pricing — 0.25d

### Goal
ราคาค่าชาร์จเปลี่ยนตามเวลา — off-peak (22:00-09:00) ลดประมาณ 30%

### Insight (ของจริง)
- MEA TOU residential: on-peak 5.79 บ./kWh, off-peak 2.63 บ./kWh
- แต่ EV charging ส่วนใหญ่ขายแบบ flat (เช่น EA Anywhere)
- ถ้าจะทำ TOU → สำหรับ project mock ก็ลด 30% ก็พอ

### Backend
**Seed tariffs** ตอน setup:
```sql
-- สำหรับทุก charger ตั้ง 2 periods
INSERT INTO tariffs (charger_id, period, start_time, end_time, price_per_kwh)
SELECT charger_id, 'on_peak', '09:00:00', '22:00:00', price_per_kwh FROM chargers;

INSERT INTO tariffs (charger_id, period, start_time, end_time, price_per_kwh)
SELECT charger_id, 'off_peak', '22:00:00', '09:00:00', ROUND(price_per_kwh * 0.7, 2) FROM chargers;
```

**Helper function** [backend/utils/getTariff.js](../backend/utils/getTariff.js):
```js
async function getCurrentPrice(charger_id) {
  const now = new Date();
  const hh = now.getHours();
  const period = (hh >= 22 || hh < 9) ? 'off_peak' : 'on_peak';
  const [rows] = await pool.query(
    `SELECT price_per_kwh FROM tariffs WHERE charger_id = ? AND period = ?`,
    [charger_id, period]
  );
  return rows[0]?.price_per_kwh || null;
}
```

**ใช้แทน `chargers.price_per_kwh`** ใน [sessions.js stop](../backend/routes/sessions.js):
```js
const currentPrice = await getCurrentPrice(session.charger_id);
const totalCost = energy_kwh * currentPrice;
```

### Frontend
- [SearchPage.jsx](../frontend/src/pages/user/SearchPage.jsx) / station detail — แสดงราคาทั้ง 2 periods + badge "ตอนนี้ off-peak ลด 30%"
- [ChargingPage.jsx](../frontend/src/pages/user/ChargingPage.jsx) — แสดงราคาที่ใช้จริงตอนนี้

### Test plan
- [ ] เปลี่ยน server time เป็น 23:00 → ราคาลด 30%
- [ ] กลับเป็น 14:00 → ราคาเต็ม
- [ ] charger ไม่มี tariff record → fallback ใช้ `chargers.price_per_kwh`

---

## ☐ Feature 11 — Cancellation + No-show 20 บ. — 0.5d

### Goal
- ยกเลิกก่อน scheduled_start 1 ชม. = ฟรี
- ยกเลิกใน 1 ชม. = หัก 20 บ.
- ไม่มาเลย เกิน 15 นาทีจาก scheduled_start = no-show หัก 20 บ.

### Dependency
ต้องทำ Feature #9 (Phase 3) ก่อนเพื่อมี `bookings.scheduled_start` —
**Workaround สำหรับ Phase 2:** ใช้ `bookings.booking_time` เป็น scheduled_start ชั่วคราว (จองทันใด ทำงานทันที)

### Backend
**Endpoint แก้** `DELETE /api/bookings/:id` (cancel):
```js
const [b] = await pool.query(`SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?`, [id, user_id]);
if (b.length === 0) return res.status(404)...;
if (b[0].status !== 'pending' && b[0].status !== 'confirmed') {
  return res.status(400).json({ message: 'ยกเลิกได้เฉพาะ booking ที่ยังไม่เริ่ม' });
}

const scheduledStart = new Date(b[0].scheduled_start || b[0].booking_time);
const minsToStart = (scheduledStart - new Date()) / 60000;

let fee = 0;
if (minsToStart < 60 && minsToStart > 0) {
  fee = 20; // ยกเลิกใน 1 ชม. = หัก 20
}

if (fee > 0) {
  await chargeFeeOrAddDebt(user_id, fee, `cancel_${id}`);
}

await pool.query(`UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), no_show_fee_charged = ? WHERE booking_id = ?`, [fee, id]);
```

**Cron job ใหม่** [backend/jobs/noShowChecker.js](../backend/jobs/noShowChecker.js) (รันทุก 5 นาที):
```js
// หา bookings status='confirmed' AND scheduled_start < NOW() - 15 minutes AND no related charging_session
const [rows] = await pool.query(`
  SELECT b.* FROM bookings b
  LEFT JOIN charging_sessions s ON s.booking_id = b.booking_id
  WHERE b.status = 'confirmed'
    AND b.scheduled_start < DATE_SUB(NOW(), INTERVAL 15 MINUTE)
    AND s.session_id IS NULL
`);

for (const b of rows) {
  await chargeFeeOrAddDebt(b.user_id, 20, `noshow_${b.booking_id}`);
  await pool.query(`UPDATE bookings SET status = 'expired', no_show_fee_charged = 20 WHERE booking_id = ?`, [b.booking_id]);
  await pool.query(`UPDATE chargers SET status = 'available' WHERE charger_id = ?`, [b.charger_id]);
  // notify
}
```

**Helper [backend/utils/chargeFeeOrAddDebt.js](../backend/utils/chargeFeeOrAddDebt.js)** (B2 debt model):
```js
async function chargeFeeOrAddDebt(user_id, amount, ref) {
  const [u] = await pool.query(`SELECT wallet_balance, omise_customer_id FROM users WHERE user_id = ? FOR UPDATE`, [user_id]);
  if (u[0].wallet_balance >= amount) {
    // หัก wallet
    await pool.query(`UPDATE users SET wallet_balance = wallet_balance - ? WHERE user_id = ?`, [amount, user_id]);
    await pool.query(`INSERT INTO wallet_transactions (user_id, amount, type, ref) VALUES (?, ?, 'deduct', ?)`, [user_id, amount, ref]);
    return 'wallet';
  } else if (u[0].omise_customer_id) {
    // ลองหักบัตร
    try { /* Omise charge */ return 'card'; } catch { /* fall through */ }
  }
  // หักไม่ได้ → เพิ่ม debt
  await pool.query(`UPDATE users SET outstanding_debt = outstanding_debt + ? WHERE user_id = ?`, [amount, user_id]);
  return 'debt';
}
```

**Block start session ถ้ามี debt:**
[POST /api/sessions/start](../backend/routes/sessions.js) — เพิ่ม check:
```js
if (userRows[0].outstanding_debt > 0) {
  return res.status(402).json({
    message: `คุณมียอดค้างชำระ ฿${userRows[0].outstanding_debt} กรุณาเคลียร์ก่อนเริ่มชาร์จ`,
    code: 'OUTSTANDING_DEBT',
    debt: userRows[0].outstanding_debt
  });
}
```

**Endpoint ชำระ debt** `POST /api/wallet/pay-debt`:
```js
// หัก wallet เคลียร์ debt → UPDATE users SET outstanding_debt = 0, wallet_balance = wallet_balance - debt
```

### Frontend
- [BookingPage.jsx](../frontend/src/pages/user/BookingPage.jsx) — ปุ่ม "ยกเลิก" → ขึ้น modal warning ถ้าจะหักเงิน
- หน้า profile / wallet — แสดง outstanding_debt + ปุ่ม "ชำระยอดค้าง"

### Test plan
- [ ] ยกเลิกก่อน 1 ชม. → ฟรี
- [ ] ยกเลิกใน 30 นาที → หัก 20 บ.
- [ ] ไม่มาเลย 15 นาที → cron mark expired + หัก 20 บ.
- [ ] wallet ไม่พอ → debt += 20
- [ ] มี debt → start session ใหม่ blocked
- [ ] ชำระ debt → unblock

---

## End of Phase 2

**ก่อนไป Phase 3:**
- [ ] ทุก feature ผ่าน test
- [ ] Cron jobs ทำงานจริง (test ด้วย scheduled time แทนรอจริง)
- [ ] Update [backend/schema.sql](../backend/schema.sql) ครบ
- [ ] บอก nem ให้ test integration กับ Phase 1

→ ต่อ [PHASE3_ADVANCED.md](./PHASE3_ADVANCED.md)
