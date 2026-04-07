# Payment System Architecture — Flow Diagrams

---

## High-Level System Architecture

```
┌──────────────┐    ┌────────────────┐    ┌──────────────┐
│              │    │                │    │              │
│  Frontend    │◄──►│  Backend API   │◄──►│  Database    │
│  (React)     │    │  (Node.js)     │    │  (MySQL)     │
│              │    │                │    │              │
└──────────────┘    └────────────────┘    └──────────────┘
       │                    │                      │
       │                    │                      │
  User Input          Business Logic         Data Storage
  + Display           + Validation
                      + Integration
```

---

## PromptPay QR Payment Flow

```
TIMELINE: T+0 to T+30 seconds

T+0:   User selects PromptPay → Click "Generate QR"
        ↓
T+1:   Frontend POST /api/payments/qr
        ↓
T+2:   Backend validates session + creates payment (pending)
        ↓
T+3:   Backend calls PromptPay API
        ↓
T+4:   PromptPay returns QR code (base64)
        ↓
T+5:   Frontend shows QR + timer (600 sec)
        ↓
T+6:   Frontend starts polling GET /status (every 3-5 sec)
        ↓
T+15:  User opens Mobile Banking → Scans QR
        ↓
T+20:  User enters PIN + confirms
        ↓
T+21:  Bank processes → Transfer money
        ↓
T+22:  Bank sends POST /webhook/promptpay
        ↓
T+23:  Backend verifies signature + updates DB
        ↓
T+24:  Frontend detects status='completed'
        ↓
T+25:  Show "Success ✓" → Redirect dashboard
        ↓
        DB: payment.status = 'completed'
            payment.paid_at = NOW()
```

---

## Credit Card (Omise) Payment Flow

```
Case A: Non-3D (Immediate Success)
┌────────────────────────────────────────┐
│ User → Card Form → Tokenize (Omise.js) │
│ Frontend POST /api/payments/charge      │
│ Backend → Omise API                     │
│ Omise returns: status='successful'      │
│ Backend UPDATE status='completed'       │
│ Frontend shows "Success ✓"              │
│ DB updated immediately                  │
└────────────────────────────────────────┘

Case B: 3D Secure (Required)
┌────────────────────────────────────────┐
│ User → Card Form → Tokenize            │
│ Frontend POST /api/payments/charge      │
│ Backend → Omise API                     │
│ Omise returns: status='pending' +       │
│                authorize_uri            │
│ Frontend redirect to 3D page            │
│ User enters OTP from bank               │
│ Bank webhook confirms                   │
│ Backend UPDATE status='completed'       │
│ Frontend detects + shows "Success ✓"    │
└────────────────────────────────────────┘

Case C: Card Decline
┌────────────────────────────────────────┐
│ User → Card Form → Tokenize            │
│ Frontend POST /api/payments/charge      │
│ Backend → Omise API                     │
│ Omise returns: status='failed' +        │
│                failure_code             │
│ Backend UPDATE status='failed'          │
│ Frontend show error message             │
│ User can retry with different card      │
└────────────────────────────────────────┘
```

---

## Admin Refund Flow

```
┌────────────────────────────────────────┐
│ Admin views payment dashboard           │
│ Click [Refund] button                   │
│ Show refund form                        │
│ Admin enters reason                     │
│ Click [Process Refund]                  │
│ ↓                                       │
│ Frontend PATCH /api/payments/{id}/refund│
│ ↓                                       │
│ Backend creates refund record           │
│ Backend calls Omise refund API          │
│ Omise confirms refund                   │
│ Backend UPDATE payment.status='refunded'│
│ Backend sends notification to user      │
│ ↓                                       │
│ Frontend shows "Refund successful ✓"   │
│ DB: payment.status = 'refunded'         │
│     refund.status = 'successful'        │
└────────────────────────────────────────┘
```

---

## Status State Machine

```
            ┌──────────┐
            │  INIT    │
            └────┬─────┘
                 │ Create payment
                 ▼
         ┌──────────────┐
         │   PENDING    │ (waiting for webhook/user action)
         └──────┬───────┘
                │
        ┌───────┼────────┬───────────┐
        │       │        │           │
   [Webhook] [Timeout] [3D OK]  [Card Decline]
        │       │        │           │
        ▼       ▼        ▼           ▼
    ┌──────────────────────────┐
    │      COMPLETED ✓         │ (payment success)
    │   OR FAILED             │ (timeout/decline)
    └──────────┬──────────────┘
               │ (if completed)
               │ Admin refund
               ▼
            ┌─────────┐
            │ REFUNDED│ (refund success)
            └─────────┘

Valid Transitions:
✓ pending → completed
✓ pending → failed
✓ completed → refunded

Invalid Transitions:
✗ completed → pending
✗ failed → completed
✗ refunded → anything
```

---

## API Endpoints Map

```
USER ENDPOINTS (nem)
├─ POST /api/payments          → Create payment
├─ GET /api/payments/history   → View history
└─ GET /api/payments/{id}      → View single

PAYMENT PROCESSING (NEW)
├─ POST /api/payments/qr       → Generate QR (PromptPay)
├─ POST /api/payments/charge   → Charge card (Omise)
├─ GET /api/payments/{id}/status → Check status
└─ POST /api/payments/{id}/confirm → User confirm

WEBHOOKS (NEW)
├─ POST /api/payments/webhook/promptpay  → Bank webhook
└─ POST /api/payments/webhook/omise      → Omise webhook

ADMIN (lalla)
├─ GET /api/payments/admin/all           → View all
├─ GET /api/payments/admin/{id}          → View detail
├─ PATCH /api/payments/{id}/refund       → Refund
├─ GET /api/payments/admin/refunds       → Refund history
└─ GET /api/payments/admin/stats         → Statistics

CRON JOBS (INTERNAL)
├─ Every 1 min: Cleanup pending (timeout)
├─ Every 5 min: Retry failed webhooks
└─ Every 10 min: Sync status with provider
```

---

## Database Schema Changes

```
PAYMENTS TABLE (existing) → Add 7 columns:
┌──────────────────────────────────────────┐
│ payment_id (PK)                          │
│ session_id (FK)                          │
│ user_id (FK)                             │
│ amount                                   │
│ method (promptpay/credit_card/wallet)    │
│ status (pending/completed/failed/refunded)│
│ transaction_ref                          │
│ paid_at                                  │
│ ──────────────────────────────────────── │
│ [NEW] created_at (TIMESTAMP)             │
│ [NEW] updated_at (TIMESTAMP)             │
│ [NEW] omise_charge_id (VARCHAR)          │
│ [NEW] promptpay_ref (VARCHAR)            │
│ [NEW] failure_reason (VARCHAR)           │
│ [NEW] webhook_received (BOOLEAN)         │
│ [NEW] UNIQUE (transaction_ref)           │
└──────────────────────────────────────────┘

REFUNDS TABLE (NEW, optional):
┌──────────────────────────────────────────┐
│ refund_id (PK)                           │
│ payment_id (FK)                          │
│ user_id (FK)                             │
│ amount                                   │
│ reason                                   │
│ refund_status (pending/successful/failed)│
│ omise_refund_id                          │
│ created_at                               │
│ completed_at                             │
└──────────────────────────────────────────┘

WEBHOOK_LOGS TABLE (NEW, optional - for debugging):
┌──────────────────────────────────────────┐
│ log_id (PK)                              │
│ webhook_type (promptpay/omise)           │
│ payment_id (FK, optional)                │
│ signature_ok (BOOLEAN)                   │
│ raw_payload (JSON)                       │
│ processed_at (TIMESTAMP)                 │
└──────────────────────────────────────────┘
```

---

## Error Handling Strategy

```
TIMEOUT HANDLING
├─ QR expires: 10 minutes
├─ Card 3D: 15 minutes
├─ Pending: 15 minutes (after creation)
└─ Cron job (every 1 min) marks as 'failed'

WEBHOOK RETRY
├─ First attempt: immediate
├─ Failed? 
│  ├─ Wait 5 sec, retry (x2 more)
│  ├─ Still failing? Mark as failed
│  └─ Alert admin
└─ Log all attempts

SIGNATURE VERIFICATION
├─ PromptPay: HMAC-SHA256(payload, secret)
├─ Omise: HMAC-SHA256(payload, secret)
├─ Invalid? Return 401 Unauthorized
└─ Log security incident

IDEMPOTENCY
├─ UNIQUE constraint on transaction_ref
├─ Check webhook_received flag
├─ If already processed → return 200 OK
└─ Don't double-process

DOUBLE CHARGE PREVENTION
├─ UNIQUE constraint on (session_id, method)
├─ Check if payment exists before creation
├─ Return 400 if duplicate
└─ Use transaction lock (FOR UPDATE)
```

---

**Total API Endpoints:** 14 HTTP + 3 Cron = 17 endpoints  
**Database Changes:** 7 new columns + 2 new tables  
**Files to create:** ~5 backend route files + 3 cron jobs + 2 frontend pages

