# Payment System Documentation — Index & Quick Start

**วันที่:** 2026-04-02  
**สำหรับ:** นำเสนออาจารย์ + Implementation Reference  
**ผู้จัดเตรียม:** lalla  

---

## 📚 Documentation Files

เอกสารประกอบการจำลองและวิเคราะห์ระบบการชำระเงิน ประกอบด้วย 4 ไฟล์:

### 1. **PAYMENT_SUMMARY.txt** ⭐ START HERE
   **ประเภท:** Executive Summary  
   **ขนาด:** 11 KB (317 บรรทัด)  
   **อ่านเวลา:** 10-15 นาที  
   
   **เนื้อหา:**
   - Overview ของระบบ
   - 17 API endpoints รวม
   - 3 Payment flows สำคัญ
   - Database changes
   - Security measures
   - Timeline estimate
   - Checklist ทั้งหมด
   
   **สำหรับใคร:** ผู้บริหาร, อาจารย์, หรือใครที่ต้องการภาพรวมอย่างรวดเร็ว

---

### 2. **PAYMENT_FLOW_SIMULATION.md** 📊 DETAILED GUIDE
   **ประเภท:** Detailed Technical Specification  
   **ขนาด:** 9.6 KB (337 บรรทัด)  
   **อ่านเวลา:** 30-45 นาที  
   
   **เนื้อหา:**
   - Scenario 1: PromptPay QR Code (step-by-step)
   - Scenario 2: Credit Card (Omise) — 3 cases
   - Scenario 3: Refund & Error Handling
   - API endpoint descriptions
   - Database schema SQL
   - Pseudocode for backend logic
   - Error scenarios
   - Testing checklist
   
   **สำหรับใคร:** Developers, Software Architects, QA Engineers

---

### 3. **PAYMENT_ARCHITECTURE.md** 🎨 VISUAL GUIDE
   **ประเภท:** Architecture Diagrams & Flows  
   **ขนาด:** 11 KB (295 บรรทัด)  
   **อ่านเวลา:** 20-30 นาที  
   
   **เนื้อหา:**
   - High-level system architecture diagram
   - PromptPay QR payment flow (timeline)
   - Credit Card payment flow (3 cases)
   - Admin refund flow
   - Status state machine
   - API endpoints map
   - Database schema visualization
   - Error handling strategy
   
   **สำหรับใคร:** Visual learners, Project Managers, System Architects

---

### 4. **PAYMENT_README.md** (this file) 📖 INDEX
   **ประเภท:** Documentation Index & Navigation  
   **ขนาด:** เล็ก  
   
   **เนื้อหา:**
   - File index & descriptions
   - Quick reference guide
   - How to use these documents
   - Key sections map
   
   **สำหรับใคร:** ทุกคน (navigation guide)

---

## 🎯 How to Use These Documents

### สำหรับการนำเสนออาจารย์

**Step 1:** Start with `PAYMENT_SUMMARY.txt`
- ให้ภาพรวม 17 API endpoints
- แสดง 3 payment flows สำคัญ
- Timeline estimate
- Checklist เพื่อให้ครบถ้วน

**Step 2:** Dive into `PAYMENT_FLOW_SIMULATION.md` (if asked for details)
- Step-by-step pseudocode
- Database schema changes
- Security measures
- Testing scenarios

**Step 3:** Use `PAYMENT_ARCHITECTURE.md` (for visual explanation)
- Diagram แสดง payment flow
- State machine
- System architecture
- Error handling

---

### สำหรับ Implementation (Developers)

**Step 1:** Read `PAYMENT_FLOW_SIMULATION.md`
- Understand 3 main scenarios
- Review pseudocode
- Check database schema

**Step 2:** Review `PAYMENT_ARCHITECTURE.md`
- Understand system flow
- Check state transitions
- Error handling

**Step 3:** Implement in order:
1. Database setup (ALTER TABLE + new tables)
2. Environment variables (.env)
3. Backend APIs (14 endpoints)
4. Cron jobs (3 tasks)
5. Frontend (payment pages)
6. Testing (unit + integration + E2E)

---

### สำหรับ QA / Testing

**Step 1:** Review `PAYMENT_SUMMARY.txt`
- Understand 17 API endpoints
- Check testing checklist

**Step 2:** Detailed test cases from `PAYMENT_FLOW_SIMULATION.md`
- Scenario 1: PromptPay QR
- Scenario 2: Credit Card (3 cases)
- Scenario 3: Refund
- Error handling

**Step 3:** Create test plan:
- Unit tests for utilities
- Integration tests (APIs + DB)
- E2E tests (full flow)
- Real API testing (Omise/PromptPay test account)

---

## 📋 Quick Reference

### 17 API Endpoints at a Glance

```
PAYMENT PROCESSING (ต้องสร้างใหม่ 4 ตัว):
  POST   /api/payments/qr                  — PromptPay QR generate
  POST   /api/payments/charge              — Credit card charge
  GET    /api/payments/{id}/status         — Status check
  POST   /api/payments/{id}/confirm        — User confirm

WEBHOOKS (ต้องสร้างใหม่ 2 ตัว):
  POST   /api/payments/webhook/promptpay   — PromptPay/Bank
  POST   /api/payments/webhook/omise       — Omise

ADMIN (ต้องสร้างใหม่ 5 ตัว):
  GET    /api/payments/admin/all           — View all
  GET    /api/payments/admin/{id}          — View detail
  PATCH  /api/payments/{id}/refund         — Admin refund
  GET    /api/payments/admin/refunds       — Refund history
  GET    /api/payments/admin/stats         — Statistics

EXISTING (nem's responsibility 3 ตัว):
  POST   /api/payments                     — Create
  GET    /api/payments/history             — History
  GET    /api/payments/{id}                — Single

CRON JOBS (ต้องสร้างใหม่ 3 ตัว):
  Every 1 min  → Cleanup pending (timeout)
  Every 5 min  → Retry failed webhooks
  Every 10 min → Sync status
```

### Database Changes

```
ALTER TABLE payments ADD:
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
  - omise_charge_id (VARCHAR)
  - promptpay_ref (VARCHAR)
  - failure_reason (VARCHAR)
  - webhook_received (BOOLEAN)
  - UNIQUE(transaction_ref)

NEW TABLES:
  - refunds (track refund history)
  - webhook_logs (debug webhooks)
```

### Security Checklist

```
✓ HMAC-SHA256 signature verification (PromptPay + Omise)
✓ Double charge prevention (UNIQUE constraint)
✓ Webhook idempotency (webhook_received flag)
✓ Timeout handling (Cron job cleanup)
✓ Card data protection (Omise tokenization)
✓ Webhook retry logic (max 3x with backoff)
✓ Error logging + monitoring
✓ PCI DSS compliance
```

---

## 🚀 Implementation Timeline

| Phase | Hours | Status |
|-------|-------|--------|
| Database | 1-2 | TODO |
| Environment | 1 | TODO |
| Backend APIs | 12-16 | TODO |
| Cron Jobs | 4-6 | TODO |
| Frontend | 8-10 | TODO |
| Testing | 8-12 | TODO |
| Documentation | 4-6 | TODO |
| Deployment | 4-6 | TODO |
| **TOTAL** | **42-58 hrs** | **1-2 weeks** |

---

## 📊 3 Main Payment Flows

### Flow 1: PromptPay QR Code
```
User Select PromptPay
  → Frontend POST /api/payments/qr
  → Backend create payment + call PromptPay API
  → Frontend show QR + timer (10 min)
  → User scans QR + transfer via Mobile Banking
  → Bank send webhook
  → Backend verify + update status
  → Frontend show success
  
Time: 15-30 seconds
```

### Flow 2: Credit Card (Omise)
```
User Select Credit Card
  → Frontend tokenize card
  → Frontend POST /api/payments/charge
  → Backend call Omise API
  → 3 Cases:
     ├─ Non-3D Success: immediate
     ├─ 3D Required: redirect to 3D page
     └─ Card Decline: show error
  
Time: 5-10 sec (non-3D) or 2-5 min (3D)
```

### Flow 3: Admin Refund
```
Admin Click Refund
  → Show refund form
  → Admin enter reason
  → Frontend PATCH /api/payments/{id}/refund
  → Backend call Omise refund API
  → Update payment status
  → Send notification to user
  
Time: 30-60 seconds
```

---

## ⚠️ Common Questions

**Q: How many endpoints do we need?**  
A: 17 total (14 new HTTP + 3 Cron jobs)

**Q: How long will it take?**  
A: 42-58 hours (~1-2 weeks of active development)

**Q: Is it secure?**  
A: Yes! HMAC-SHA256 signature verification + idempotency + timeout handling + PCI DSS compliant

**Q: What if webhook fails?**  
A: Cron job retries up to 3 times, with exponential backoff

**Q: What if user makes duplicate payment?**  
A: UNIQUE constraint on transaction_ref prevents double charge

**Q: What about 3D Secure?**  
A: Fully supported - frontend redirects to 3D page, backend waits for webhook

**Q: Can admin refund payments?**  
A: Yes! PATCH /api/payments/{id}/refund endpoint with Omise refund API integration

---

## 📁 File Map

```
Project_pin/
├── PAYMENT_README.md          ← You are here (index)
├── PAYMENT_SUMMARY.txt        ← START HERE (overview)
├── PAYMENT_FLOW_SIMULATION.md ← Detailed flows + pseudocode
├── PAYMENT_ARCHITECTURE.md    ← Diagrams + visual guide
│
├── backend/
│   ├── routes/
│   │   ├── payments.js        ← Existing (nem)
│   │   │                       ← Add: qr, charge, webhooks, admin (lalla)
│   │   ├── webhooks.js        ← NEW (optional separate file)
│   │   └── ...
│   ├── cron/
│   │   ├── cleanupPendingPayments.js   ← NEW
│   │   ├── retryWebhooks.js            ← NEW
│   │   └── syncPaymentStatus.js        ← NEW
│   ├── utils/
│   │   ├── paymentUtils.js    ← NEW (signature verification, etc.)
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.js            ← Existing
│   │   ├── roleCheck.js       ← Existing
│   │   └── ...
│   ├── config/
│   │   └── db.js              ← Existing
│   ├── .env                   ← Add: OMISE keys, PROMPTPAY keys, etc.
│   ├── schema.sql             ← Add: 7 columns, 2 new tables
│   └── server.js              ← Add: cron job initialization
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── user/
│   │   │   │   ├── PaymentPage.jsx         ← NEW (nem)
│   │   │   │   └── PaymentHistoryPage.jsx  ← NEW (nem)
│   │   │   ├── admin/
│   │   │   │   └── PaymentsPage.jsx        ← NEW (lalla)
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── PaymentMethodSelector.jsx   ← NEW
│   │   │   ├── PromptPayQRForm.jsx         ← NEW
│   │   │   ├── OmiseCardForm.jsx           ← NEW
│   │   │   └── admin/
│   │   │       └── RefundModal.jsx         ← NEW
│   │   └── ...
│   ├── public/
│   │   └── index.html         ← Add: <script src="https://cdn.omise.co/omise.js">
│   └── .env                   ← Add: REACT_APP_OMISE_PUBLIC_KEY
│
└── docs/
    ├── PAYMENT_*.md           ← Documentation files
    └── ...
```

---

## ✅ Before You Start

**Confirm with team:**
- [ ] Database schema changes approved
- [ ] API design finalized
- [ ] Security measures accepted
- [ ] Timeline is realistic
- [ ] Resources allocated

**Prepare:**
- [ ] Omise test account (get test keys)
- [ ] PromptPay test credentials
- [ ] Development environment set up
- [ ] MySQL/phpMyAdmin ready

**Team roles:**
- [ ] nem: Frontend + user endpoints
- [ ] lalla: Backend + admin endpoints + database
- [ ] Together: Testing + documentation

---

## 📞 Support & Resources

**External APIs:**
- Omise API: https://www.omise.co/api
- PromptPay API: https://www.promptpay.io
- Webhook Best Practices: https://zapier.com/engineering/webhook-best-practices/

**Technologies:**
- Node.js/Express: Backend framework
- React: Frontend framework
- MySQL: Database
- node-cron: Cron job scheduler
- crypto: HMAC-SHA256 signature

---

## 🎓 Key Learnings

### Technical Concepts
- Asynchronous payment processing
- Webhook handling & retry logic
- Database transactions & idempotency
- HMAC-SHA256 signature verification
- State machine for payment status

### Best Practices
- Security: Never store card data
- Reliability: Webhook retry + polling + cron verification
- Monitoring: Log all operations + alerts
- Testing: Unit + Integration + E2E tests

---

## 📈 Success Metrics

- [ ] All 17 endpoints working
- [ ] 0 duplicate charges
- [ ] 99%+ webhook delivery rate
- [ ] < 5% payment failure rate
- [ ] All security tests passing
- [ ] < 30 second payment time

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-02 | Initial documentation |

---

**ใช้เอกสารชุดนี้นำเสนออาจารย์ได้เลย!**

หากมีคำถาม:
1. ตรวจสอบ PAYMENT_SUMMARY.txt สำหรับภาพรวม
2. ตรวจสอบ PAYMENT_FLOW_SIMULATION.md สำหรับรายละเอียด
3. ตรวจสอบ PAYMENT_ARCHITECTURE.md สำหรับ diagrams

🚀 Ready to implement!
