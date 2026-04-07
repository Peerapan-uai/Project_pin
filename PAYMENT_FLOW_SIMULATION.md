# Payment Flow Simulation — ระบบการชำระเงิน EV Charger App

**วันที่อัปเดต:** 2026-04-02  
**สถาบัน:** ใช้ร่วมกันในเอกสารนำเสนออาจารย์  

---

## 1. Scenario 1: User จ่ายเงินด้วย PromptPay QR Code

### ขั้นตอนการไหลของ User

```
1. User เสร็จชาร์จแล้ว → session.status = 'completed'
   → เข้าหน้า PaymentPage

2. PaymentPage แสดงราคา = session.energy_kwh × charger.price_per_kwh

3. User เลือก "PromptPay QR Code" payment method

4. FRONTEND → [Backend API #1] POST /api/payments/qr
   {
     "session_id": 5,
     "method": "promptpay"
   }
   ↓
   Backend ตรวจสอบ session.status = 'completed'
   ↓
   Backend สร้าง Payment record:
   {
     payment_id: 101,
     session_id: 5,
     user_id: 3,
     amount: 325.00,
     method: 'promptpay',
     status: 'pending',
     transaction_ref: 'TXN1743667200000123',
     paid_at: NULL
   }
   ↓
   Backend เรียก PromptPay API เพื่อ generate QR code
   ↓
   PromptPay API ตอบกลับ QR code (base64) + expiry time
   ↓
   Backend Response → Frontend: QR code + timer

5. Frontend แสดง QR Code ให้ user สแกน
   → Timer นับถอยหลัง 10 นาที

6. User เปิด Mobile Banking App → สแกน QR
   → ใส่ PIN → Confirm Payment
   → ธนาคาร Transfer เงิน 325.00 บาท ไปยัง account ร้าน

7. [Backend API #2] WEBHOOK from Bank
   - PromptPay Webhook → POST /api/payments/webhook/promptpay
   {
     "transactionId": "...",
     "ref1": "TXN1743667200000123",
     "amount": 325.00,
     "status": "success",
     "timestamp": 1743667245
   }
   → Backend verify webhook signature
   → Backend UPDATE payments SET status='completed', paid_at=NOW()
   → Frontend get notification (real-time ด้วย WebSocket)

8. DB Update:
   payments.status = 'completed'
   payments.paid_at = NOW()

9. Frontend แสดง "สำเร็จ ✓" → redirect ไป Dashboard
```

### API Endpoints ที่ต้องมี
1. **POST /api/payments/qr** — Generate QR code
2. **POST /api/payments/webhook/promptpay** — Webhook from bank
3. **GET /api/payments/{payment_id}/status** — Check status (polling)

---

## 2. Scenario 2: User จ่ายเงินด้วยบัตรเครดิต/เดบิต (Omise)

### ขั้นตอนการไหลของ User

```
1. User เลือก "บัตรเครดิต/เดบิต" payment method

2. Frontend แสดง Omise card form:
   - เลขบัตร
   - ชื่อบัตร
   - วว/ปป
   - CVV

3. Frontend ใช้ Omise.js library → tokenize card
   → Get token: tokn_test_5m...

4. FRONTEND → [Backend API #1] POST /api/payments/charge
   {
     "session_id": 5,
     "method": "credit_card",
     "token": "tokn_test_5m...",
     "amount": 325.00
   }

5. Backend ตรวจสอบ:
   - session.status = 'completed'?
   - payment record ยังไม่มี?
   - amount > 0?
   ↓
   Backend สร้าง Payment record
   ↓
   Backend เรียก Omise API → charge card

6. Omise ตอบกลับ 3 กรณี:
   
   **Case A: Non-3D Success (ทันที)**
   {
     "id": "chrg_test_5m...",
     "status": "successful"
   }
   → Backend UPDATE status='completed'
   → Frontend show "สำเร็จ ✓"
   
   **Case B: 3D Secure Required**
   {
     "id": "chrg_test_5m...",
     "status": "pending",
     "authorize_uri": "https://..."
   }
   → Frontend redirect to 3D page
   → User enters OTP
   → [Backend API #2] Webhook from Omise confirms

   **Case C: Card Declined**
   {
     "id": "chrg_test_5m...",
     "status": "failed",
     "failure_reason": "insufficient_fund"
   }
   → Backend UPDATE status='failed'
   → Frontend show error message
```

### API Endpoints ที่ต้องมี
1. **POST /api/payments/charge** — Charge credit card
2. **POST /api/payments/webhook/omise** — Webhook from Omise
3. **GET /api/payments/{payment_id}/status** — Check status (polling)

---

## 3. Scenario 3: User เปลี่ยนใจ / Transaction Failed / Refund

### 3.1 Payment Pending เกินเวลา (QR expire / Card timeout)
```
- QR valid เพียง 10 นาที
- Card 3D valid 15 นาที
- ถ้าเวลา ผ่าน → Backend Cron Job mark as 'failed'
- Send notification: "ไม่สำเร็จ: หมดเวลา"
```

### 3.2 Card Decline
```
- Omise API return status='failed'
- Backend UPDATE status='failed' + failure_reason
- Frontend show error: "บัตรมีเงินไม่พอ"
- User can retry
```

### 3.3 Admin Refund
```
Admin action:
- [Admin API] PATCH /api/payments/{id}/refund
  {
    "reason": "User request refund"
  }
↓
Backend:
- Check payment.status = 'completed'
- Create refund record
- Call Omise refund API (if credit card)
- UPDATE payment.status = 'refunded'
- Send notification to user: "คืนเงิน {amount} บาทแล้ว"
```

---

## 4. Status Transitions

```
PENDING ──→ COMPLETED ──→ REFUNDED
  ↓
FAILED (timeout / decline / cancel)

Invalid transitions:
- completed → pending ✗
- failed → completed ✗
- refunded → anything ✗
```

---

## 5. Database ต้องเก็บ

### Payments Table Columns (ต้องเพิ่ม):
```sql
- created_at         TIMESTAMP       -- เวลาสร้าง (สำหรับ timeout)
- updated_at         TIMESTAMP       -- เวลาแก้ไขล่าสุด
- omise_charge_id    VARCHAR(100)    -- Charge ID จาก Omise
- promptpay_ref      VARCHAR(100)    -- Ref จาก PromptPay
- failure_reason     VARCHAR(255)    -- สาเหตุไม่สำเร็จ
- webhook_received   BOOLEAN         -- ได้รับ webhook แล้ว? (ป้องกัน double process)

Indexes:
- UNIQUE (transaction_ref)          -- ป้องกัน double charge
- INDEX (status, created_at)        -- ใช้ cleanup cron
- INDEX (user_id)                   -- ใช้ history query
```

### Refunds Table (Optional):
```sql
CREATE TABLE refunds (
  refund_id, payment_id, user_id, amount, reason,
  refund_status, omise_refund_id, created_at, completed_at
);
```

---

## 6. API Endpoints — Complete List

### Endpoints ที่ต้องสร้างใหม่ (14 ตัว):

**Payment Processing:**
1. POST /api/payments/qr — Generate PromptPay QR
2. POST /api/payments/charge — Charge credit card (Omise)
3. GET /api/payments/{payment_id}/status — Get payment status
4. POST /api/payments/{payment_id}/confirm — User confirm

**Webhooks:**
5. POST /api/payments/webhook/promptpay — PromptPay webhook
6. POST /api/payments/webhook/omise — Omise webhook

**Admin:**
7. GET /api/payments/admin/all — View all payments
8. GET /api/payments/admin/{id} — View payment detail
9. PATCH /api/payments/{id}/refund — Admin refund
10. GET /api/payments/admin/refunds — Refund history
11. GET /api/payments/admin/stats — Payment statistics

**Internal/Cron:**
12. Cleanup pending payments (every 1 min)
13. Retry failed webhooks (every 5 min)
14. Sync payment status (every 10 min)

---

## 7. Backend Logic - ตัวอย่าง Pseudocode

### POST /api/payments/qr
```javascript
async function createPromptPayQR(req, res) {
  // 1. Validate session
  // 2. Check duplicate payment
  // 3. Generate transaction_ref
  // 4. Create payment record (status='pending')
  // 5. Call PromptPay API
  // 6. Store promptpay_ref in DB
  // 7. Return QR code
}
```

### POST /api/payments/charge
```javascript
async function chargeCard(req, res) {
  // 1. Validate session
  // 2. Check duplicate payment
  // 3. Generate transaction_ref
  // 4. Create payment record
  // 5. Call Omise API
  // 6. Handle 3 response cases
  // 7. Create notification
}
```

### POST /api/payments/webhook/promptpay
```javascript
async function handlePromptPayWebhook(req, res) {
  // 1. Verify signature (HMAC-SHA256)
  // 2. Find payment by transaction_ref
  // 3. Check webhook_received flag (idempotency)
  // 4. Update payment status
  // 5. Create notification
  // 6. Return 200 OK
}
```

### Cron: Cleanup Pending Payments
```javascript
async function cleanupPendingPayments() {
  // Run every 1 minute
  // Find payments WHERE status='pending' AND created_at < NOW()-15min
  // UPDATE status='failed', failure_reason='timeout'
  // Send notification to user
}
```

---

## 8. ปัญหาที่ต้องจัดการ

| ปัญหา | วิธีแก้ |
|------|--------|
| Double charge | UNIQUE constraint + idempotency check |
| Webhook tampering | HMAC-SHA256 signature verification |
| Webhook arrives twice | webhook_received flag + row lock |
| QR/Card timeout | Cron job cleanup + timer on frontend |
| Webhook never arrives | Polling + cron retry |
| Payment lost | Database transaction + logging |

---

## 9. Testing Checklist

- [ ] PromptPay QR flow (complete)
- [ ] Credit Card flow (non-3D)
- [ ] Credit Card flow (3D Secure)
- [ ] Card Decline
- [ ] Payment timeout
- [ ] Admin Refund
- [ ] Webhook signature verification
- [ ] Idempotency (no double charge)
- [ ] Error messages

---

**สรุป:** ระบบต้อง 14 API endpoints + 3 cron jobs + 7 DB columns + หลายแบบ validation/security measures

ใช้เอกสารนี้นำเสนออาจารย์ได้เลย!
