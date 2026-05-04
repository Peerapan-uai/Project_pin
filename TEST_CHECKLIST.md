# TEST_CHECKLIST — 14 Features (User-side)

> Test ก่อน demo / deploy / apply intern
> วิธีใช้: เปิดแอพ → ทำตามทีละข้อ → tick `[x]` ที่ผ่าน → comment ที่พัง

---

## 🔧 Setup ก่อนเริ่ม

```
[ ] Backend run: cd backend && npm run dev (port 5000)
[ ] Frontend run: cd frontend && npm run dev (port 5173)
[ ] Docker: mysql + mongodb container UP (docker ps)
[ ] เตรียม user 2 คน:
    - User A: wallet 500฿, ไม่มี debt
    - User B: wallet 10฿, มี debt 50฿ (test ใส่ DB ตรงๆ)
[ ] เตรียม charger:
    - Charger 1: status=available, temperature=normal
    - Charger 2: status=available (สำหรับ test queue)
    - Charger 3: temperature_celsius=65 (overheat test)
[ ] เตรียม station favorite-able อย่างน้อย 3 อัน
```

**DB verify command:** `docker exec ev_charger_mysql mysql -uadmin -padmin ev_charger -e "<SQL>"`

---

# 🟢 Phase 1: Foundation UX (6 features)

## Feature 1: เลือกวิธีจ่าย

```
[ ] Login User A → BookingPage → กดจอง charger 1
[ ] เห็น modal เลือกวิธีจ่าย (wallet / promptpay / credit card)
[ ] เลือก wallet → confirm → booking สำเร็จ
[ ] WalletPage: ยอดลดตามจริง
[ ] DB verify:
    SELECT * FROM bookings WHERE user_id=A ORDER BY booking_id DESC LIMIT 1;
    → row ใหม่
    SELECT * FROM payments WHERE user_id=A ORDER BY payment_id DESC LIMIT 1;
    → method='wallet', status='paid'

Edge:
[ ] User B (wallet 10฿) จอง 50฿ → wallet ไม่พอ → error "ยอดไม่พอ"
[ ] User B → เปลี่ยนเป็น promptpay → ได้ QR
```

## Feature 2: Low balance banner

```
[ ] User B (wallet 10฿) login → HomePage / WalletPage
[ ] เห็น banner สีส้ม/แดง: "ยอดเงินต่ำกว่า 100฿"
[ ] กด banner → redirect WalletPage เพื่อเติมเงิน
[ ] User B เติมเงิน 200฿ → banner หาย (refresh page)
[ ] User A (wallet 500฿) → ไม่มี banner

DB verify:
SELECT user_id, wallet_balance FROM users WHERE user_id IN (A, B);
```

## Feature 3: แสดงอุณหภูมิตู้

```
[ ] User A → ChargerDetailPage charger 1 → เห็น "อุณหภูมิ XX°C"
[ ] เริ่มชาร์จ → ChargingPage → เห็น temperature update (refresh ทุก ~5-10 sec)
[ ] DB verify:
    SELECT temperature_celsius FROM chargers WHERE charger_id=1;
    → ค่ามี และเปลี่ยนได้ (cron temperatureSimulator update)
```

## Feature 7: Overheat protection (>60°C)

```
[ ] User A → จอง charger 3 (temp=65) → กดเริ่มชาร์จ
[ ] Error: "อุณหภูมิตู้สูงเกิน ห้ามชาร์จ" (หรือ similar)
[ ] DB verify: ไม่มี row ใหม่ใน charging_sessions
[ ] อัพเดท charger 3 ให้ temp=50 → ชาร์จได้

DB set test:
UPDATE chargers SET temperature_celsius=65 WHERE charger_id=3;
```

## Feature 10: Estimated charge time (ETA)

```
[ ] User A → ChargerDetailPage → เลือก kWh เป้าหมาย
[ ] เห็น "ใช้เวลาประมาณ XX นาที / ชั่วโมง"
[ ] เปลี่ยน kWh → ETA update
[ ] เริ่มชาร์จ → ChargingPage แสดง "เหลืออีก XX นาที"
[ ] รอ 5 นาที → ETA ลดลงตามจริง
```

## Feature 14: Favorite stations

```
[ ] User A → SearchPage / StationDetailPage
[ ] กด ♡ → กลายเป็น ❤️ (filled)
[ ] FavoritesPage → เห็น station ที่เพิ่ง favorite
[ ] กด ❤️ ซ้ำ → unfavorite → หายจาก list
[ ] DB verify:
    SELECT * FROM user_favorites WHERE user_id=A;
    → row หาย/มีตามการกด
```

---

# 🟡 Phase 2: Smart Features (5 features)

## Feature 4: Auto-stop Hybrid

```
[ ] Mode A (default — auto stop ที่ 100%):
    [ ] User A เริ่มชาร์จ charger 1
    [ ] รอจน battery_pct = 100 (หรือ manual update DB เพื่อ test เร็ว)
    [ ] Session ปิดอัตโนมัติ ภายใน ≤1 นาที (cron idleFeeAutoStop)
    [ ] DB verify: charging_sessions.status='completed', end_time มีค่า

[ ] Mode B (admin toggle — เก็บ idle fee แทน):
    [ ] Admin set chargers.idle_fee_enabled=1
    [ ] User A ชาร์จจน 100% → session ไม่ปิด → เข้า idle state
    [ ] (ดู Feature 12 idle fee ต่อ)

DB test set:
UPDATE charging_sessions SET battery_pct=100 WHERE session_id=X;
UPDATE chargers SET idle_fee_enabled=1 WHERE charger_id=1;
```

## Feature 5: Notification 80% / 100%

```
[ ] User A เริ่มชาร์จ
[ ] manual update battery_pct=80 → เปิด NotificationsPage
[ ] เห็น notif ใหม่: "ชาร์จถึง 80%"
[ ] manual update battery_pct=100
[ ] เห็น notif ใหม่: "ชาร์จเต็มแล้ว"
[ ] DB verify:
    SELECT * FROM notifications WHERE user_id=A AND type='charging' ORDER BY created_at DESC LIMIT 5;
```

## Feature 6: Reward points

```
[ ] User A จ่ายค่าชาร์จ 100฿ ผ่าน wallet
[ ] PointsPage → เห็น point เพิ่ม +100 แต้ม
[ ] DB verify:
    SELECT current_balance FROM point_balances WHERE user_id=A;
    SELECT * FROM point_transactions WHERE user_id=A ORDER BY created_at DESC;

Redeem:
[ ] PointsPage → กดแลก 100 แต้ม = 10฿ ส่วนลด
[ ] BookingPage ครั้งหน้า → toggle "ใช้แต้ม" → เห็นยอดลด 10฿
[ ] หลัง pay → point_balances ลดลง 100, wallet หัก amount-10

Edge:
[ ] User A (มี 50 แต้ม) กดแลก 100 → error "แต้มไม่พอ"
```

## Feature 8: TOU pricing (off-peak)

```
[ ] กลางวัน (10:00-21:00):
    [ ] User A จอง charger → เห็นราคา peak (เช่น 5฿/kWh)
[ ] กลางคืน (22:00-09:00):
    [ ] เปลี่ยนเวลา server หรือ test เวลาจริง
    [ ] User A จอง → เห็นราคา off-peak ลด ~30% (เช่น 3.5฿/kWh)
    [ ] เห็น label "ช่วง off-peak ลด 30%"
[ ] DB verify:
    SELECT * FROM tariffs;
    → มี row peak/off-peak
```

## Feature 11: Cancellation + No-show fee 20฿

```
[ ] User A จอง charger 1 → ยกเลิกก่อน start_time มากกว่า 30 นาที
    → คืนเงินเต็ม
    → DB: payments.status='refunded', wallet_balance เพิ่ม

[ ] User A จอง → ยกเลิกหลัง start_time ผ่านไป (ไม่ไป)
    → cron noShowChecker หัก 20฿ จาก wallet
    → DB: wallet_transactions มี type='no_show_fee', amount=-20
    → ถ้า wallet ไม่พอ → outstanding_debt += 20

[ ] User B (debt 50฿) จองครั้งใหม่ → blocked
    → error "มียอดค้างชำระ ${debt}฿ กรุณาเคลียร์ก่อน"
```

---

# 🔴 Phase 3: Advanced (3 features)

## Feature 9: Booking schedule (3 levels)

### Level 1: One-time
```
[ ] User A → BookingPage → เลือกเวลา/วัน → จอง
[ ] DB: bookings.scheduled_start, duration_min มีค่า
```

### Level 2: Recurring
```
[ ] User A → RecurringSchedulePage → ตั้ง "ทุกจันทร์ 18:00 1 ชม."
[ ] บันทึก
[ ] DB verify:
    SELECT * FROM recurring_schedules WHERE user_id=A;
[ ] รอ cron recurringBookingsGen (ทุก 24 ชม. หรือ trigger manual)
[ ] วันจันทร์หน้า → bookings ใหม่ generate อัตโนมัติ
[ ] เพิ่ม skip date "จันทร์หน้านี้" → DB booking_skip_dates
[ ] วันจันทร์นั้น → ไม่มี booking generate
```

### Level 3: Smart suggestion (optional)
```
[ ] HomePage → เห็น suggestion: "คุณมักจองทุกศุกร์ — สร้าง recurring?"
[ ] (ถ้า implement แล้ว — ถ้าไม่ skip)
```

## Feature 12: Idle fee Tesla-style + debt

```
Setup: User A ชาร์จเสร็จ 100%, charger 1 idle_fee_enabled=1, มี User C จองคิวต่อ

[ ] ครั้งที่ 1: ชาร์จเสร็จ + ไม่มีคิวต่อ
    → ไม่เก็บ idle fee
    → DB: charging_sessions.idle_fee=0

[ ] ครั้งที่ 2: ชาร์จเสร็จ + มี User C จองคิวต่อ
    → 5 นาทีแรก grace ฟรี
    → นาทีที่ 6+ คิด 5฿/นาที
    → cron idleFeeAutoStop หักจาก wallet ตามนาที
    → DB: idle_fee_charges row ใหม่, charging_sessions.idle_fee > 0

[ ] ถ้า wallet ไม่พอ → outstanding_debt เพิ่ม
    → ChargingPage / WalletPage เห็น banner "ค้างชำระ"
    → Login ครั้งหน้า → block start session ใหม่จนกว่าจ่าย

DB query:
SELECT idle_start_time, idle_fee FROM charging_sessions WHERE session_id=X;
SELECT outstanding_debt, wallet_frozen FROM users WHERE user_id=A;
```

## Feature 13: Trip planning (Google Maps)

```
[ ] User A → TripPlanningPage / ฟีเจอร์ใน Map
[ ] กรอก: ต้นทาง → ปลายทาง → ระยะทาง XX กม.
[ ] ระบบคำนวณ:
    - kWh ที่ต้องใช้ = ระยะ × 0.18
    - ต้องชาร์จระหว่างทางมั้ย (ตาม battery%)
    - แนะนำ station บนเส้นทาง
[ ] เห็น Google Maps polyline + station markers
[ ] กด station → ดูรายละเอียด + จอง

Edge:
[ ] รถแบตเต็ม (100%) + ระยะใกล้ → "ไม่ต้องแวะชาร์จ"
[ ] รถแบตน้อย (10%) + ระยะไกล → "แนะนำ X stations"
```

---

## ✅ Test ครบแล้ว → ทำต่อ
- [ ] ทุก feature ผ่าน → commit `test: verify 14 features manual checklist`
- [ ] เจอ bug → list ใน issue ของ project / ในไฟล์นี้ section "Known Bugs"

## 🐛 Known Bugs (เขียนตอน test)

```
Feature X:
- bug: ...
- repro: ...
- expected: ...
```
