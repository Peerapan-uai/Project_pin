# Omise Payment Integration — Research Summary (2025)

> หาข้อมูลไว้ก่อนนอน อ่านก่อนลงมือทำ
> หมายเหตุ: Omise เปลี่ยนชื่อเป็น "Opn Payments" แล้ว แต่ API/SDK ยังใช้ชื่อ omise ทั้งหมด

---

## 1. PromptPay QR — Flow ทั้งหมด

```
[React]                    [Express Backend]              [Omise API]
  |                               |                            |
  |-- POST /api/payments/promptpay ->                          |
  |                               |-- POST /charges ---------->|
  |                               |   source[type]=promptpay  |
  |                               |<-- charge + QR URL -------|
  |<--- { chargeId, qrImage } ----|                            |
  |                               |                            |
  | [แสดง QR ให้ user สแกน]       |                            |
  |                               |                            |
  | [Poll status ทุก 3 วิ] ------->|-- GET /charges/:id ------>|
  |<-- { status: "pending" } -----|                            |
  |                               |                            |
  |   [User สแกนจ่าย]             |                            |
  |                               |<-- webhook charge.complete |
  |<-- { status: "successful" } --|                            |
```

**จุดสำคัญ:**
- Amount ใช้ **satang** (1 บาท = 100 satang) — ผิดตรงนี้บ่อยมาก
- QR code หมดอายุใน 24 ชั่วโมง
- PromptPay **คืนเงินไม่ได้** ผ่าน Omise → ต้องวางแผน policy ไว้ก่อน

---

## 2. Backend — สร้าง PromptPay Charge

```bash
npm install omise
```

```js
// routes/payments.js (backend)
const omise = require('omise')({
  secretKey: process.env.OMISE_SECRET_KEY,
  omiseVersion: '2019-05-29'  // pin version ไว้เสมอ
});

router.post('/promptpay', authMiddleware, async (req, res) => {
  const { amount } = req.body;  // amount เป็นบาท เช่น 200

  const charge = await omise.charges.create({
    amount: amount * 100,        // ← แปลงเป็น satang!
    currency: 'THB',
    source: { type: 'promptpay' },
    description: `EV Charging - User ${req.user.id}`,
    metadata: { userId: req.user.id, bookingId: req.body.bookingId }
  });

  // QR image ต้องดึงผ่าน backend (ต้องใช้ secret key)
  const qrUrl = charge.source.scannable_code.image.download_uri;
  const imgResponse = await axios.get(qrUrl, {
    auth: { username: process.env.OMISE_SECRET_KEY, password: '' },
    responseType: 'arraybuffer'
  });
  const base64 = Buffer.from(imgResponse.data).toString('base64');

  res.json({
    chargeId: charge.id,
    qrImage: `data:image/png;base64,${base64}`,  // ส่งไป React แบบ base64
    expiresAt: charge.expires_at
  });
});

// Polling endpoint
router.get('/charges/:chargeId/status', authMiddleware, async (req, res) => {
  const charge = await omise.charges.retrieve(req.params.chargeId);
  res.json({ status: charge.status, paid: charge.paid });
});
```

---

## 3. Frontend — แสดง QR + Polling

```jsx
// PaymentPage.jsx

function PromptPaySection({ sessionId, amount }) {
  const [qrImage, setQrImage] = useState(null);
  const [chargeId, setChargeId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | pending | successful | failed
  const pollingRef = useRef(null);

  const createCharge = async () => {
    setStatus('loading');
    const res = await fetch('/api/payments/promptpay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount, bookingId: sessionId })
    });
    const data = await res.json();
    setQrImage(data.qrImage);
    setChargeId(data.chargeId);
    setStatus('pending');
  };

  // เริ่ม polling หลังได้ chargeId
  useEffect(() => {
    if (!chargeId || status !== 'pending') return;

    const poll = async () => {
      const res = await fetch(`/api/payments/charges/${chargeId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.status !== 'pending') {
        setStatus(data.status); // 'successful' หรือ 'failed'
        return;
      }
      pollingRef.current = setTimeout(poll, 3000); // รอ 3 วิ แล้ว poll ใหม่
    };

    pollingRef.current = setTimeout(poll, 3000);
    return () => clearTimeout(pollingRef.current);
  }, [chargeId, status]);

  return (
    <div>
      {status === 'idle' && (
        <button onClick={createCharge}>สร้าง QR Code PromptPay</button>
      )}
      {status === 'loading' && <p>กำลังสร้าง QR...</p>}
      {status === 'pending' && qrImage && (
        <div>
          <img src={qrImage} alt="PromptPay QR" style={{ width: 256 }} />
          <p>สแกนผ่าน mobile banking แล้วรอระบบยืนยัน...</p>
        </div>
      )}
      {status === 'successful' && <p style={{ color: 'green' }}>ชำระเงินสำเร็จ!</p>}
      {status === 'failed' && <p style={{ color: 'red' }}>ชำระเงินไม่สำเร็จ</p>}
    </div>
  );
}
```

---

## 4. Credit/Debit Card — Tokenization Flow

```
[React (Omise.js)] → สร้าง token จาก card number → [Omise Server]
                                                          ↓
                                                    tokn_test_xxx
                                                          ↓
[React] → ส่ง tokenId ไป Backend → [Express] → สร้าง charge ด้วย token
```

**Public key อยู่ใน frontend ได้** / **Secret key อยู่ใน backend เท่านั้น**

```jsx
// Frontend — ฟอร์มบัตร
// npm install use-omise
import { useOmise } from 'use-omise';

function CardForm({ amount, onSuccess }) {
  const { loading, createTokenPromise } = useOmise({
    publicKey: import.meta.env.VITE_OMISE_PUBLIC_KEY,
  });

  const [card, setCard] = useState({
    name: '', number: '', expiration_month: '', expiration_year: '', security_code: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await createTokenPromise('card', card);
    // token.id = "tokn_test_xxx"

    const res = await fetch('/api/payments/card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${yourToken}` },
      body: JSON.stringify({ tokenId: token.id, amount })
    });
    const result = await res.json();
    if (result.paid) onSuccess(result);
  };

  // ... render form inputs
}
```

```js
// Backend — รับ token แล้วสร้าง charge
router.post('/card', authMiddleware, async (req, res) => {
  const { tokenId, amount } = req.body;

  const charge = await omise.charges.create({
    amount: amount * 100,  // satang!
    currency: 'THB',
    card: tokenId,         // tokn_test_xxx
    capture: true,
  });

  res.json({ paid: charge.paid, chargeId: charge.id, status: charge.status });
});
```

---

## 5. Test Cards (Sandbox)

| Brand | Card Number | ผลลัพธ์ |
|---|---|---|
| Visa | `4242 4242 4242 4242` | สำเร็จ |
| Mastercard | `5555 5555 5555 4444` | สำเร็จ |
| Visa | `4111 1111 1114 0011` | Insufficient funds |
| Visa | `4111 1111 1113 0012` | Stolen card |

- Expiry: วันไหนก็ได้ที่ยังไม่หมด
- CVV: 3 หลักอะไรก็ได้

**ทดสอบ PromptPay:** ไม่มี card number → ไปที่ Omise Dashboard > Charges > กด "Successful" มือ หรือ "Failed"

---

## 6. Webhook — รับแจ้งเตือนเมื่อจ่ายสำเร็จ

```js
// ต้อง register webhook URL ใน dashboard.omise.co ก่อน
// ใช้ ngrok ตอน dev: ngrok http 5000

app.post('/webhooks/omise',
  express.raw({ type: '*/*' }),  // ← ต้องใช้ raw ไม่ใช่ json!
  async (req, res) => {
    res.sendStatus(200);  // ← ตอบ 200 ทันที ก่อน process

    const event = JSON.parse(req.body.toString());
    if (event.key === 'charge.complete') {
      const charge = event.data;
      if (charge.status === 'successful') {
        // อัปเดต DB, ปล่อยตู้ชาร์จ, ส่ง notification ฯลฯ
        await db.execute(
          'UPDATE payments SET status = ? WHERE charge_id = ?',
          ['paid', charge.id]
        );
      }
    }
  }
);
```

**⚠️ ใส่ webhook route ก่อน `app.use(express.json())`** ไม่งั้น body จะถูก parse ไปแล้ว signature check fail

---

## 7. Gotchas ที่จะเจอแน่นอน

| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| `amount` ผิด | ใส่เป็นบาทแทน satang | คูณด้วย 100 เสมอ |
| QR ดึงไม่ได้จาก frontend | download_uri ต้องใช้ secret key | proxy ผ่าน backend |
| Webhook signature fail | body ถูก parse เป็น JSON แล้ว | ใช้ `express.raw()` สำหรับ route นี้ |
| Double-process webhook | handler ช้า → Omise retry | ตอบ 200 ก่อน แล้วค่อย process async |
| OmiseCard.open โดน block | ad blocker / popup blocker | ใช้ custom form + createToken แทน |
| PromptPay คืนเงินไม่ได้ | ข้อจำกัดของ PromptPay | วางแผน cancellation policy ก่อน |
| Webhook secret decode ผิด | ต้อง decode base64 | `Buffer.from(secret, 'base64')` |

---

## 8. ค่าธรรมเนียม (ประมาณ 2025)

| วิธีจ่าย | ค่าธรรมเนียม |
|---|---|
| PromptPay | ~1.65% |
| บัตรเครดิต/เดบิต (ไทย) | ~3.65% |
| ผ่อนชำระ | แล้วแต่ธนาคาร |

ตัวอย่าง: ชาร์จรถ ฿200 → PromptPay เสียค่าธรรมเนียม ฿3.30 / บัตรเครดิต เสีย ฿7.30

---

## 9. Environment Variables ที่ต้องตั้ง

```bash
# .env (backend)
OMISE_SECRET_KEY=skey_test_xxx
OMISE_WEBHOOK_SECRET=xxx

# .env (frontend)
VITE_OMISE_PUBLIC_KEY=pkey_test_xxx
```

---

## Quick Checklist ก่อนเริ่มทำ

- [ ] สมัคร Omise ที่ dashboard.omise.co (ฟรี)
- [ ] เอา test public key + secret key มา
- [ ] `npm install omise` (backend)
- [ ] `npm install use-omise` (frontend, optional)
- [ ] ใส่ env vars ทั้ง backend และ frontend
- [ ] สร้าง promptpay endpoint → return chargeId + qrImage (base64)
- [ ] สร้าง polling endpoint GET /charges/:id/status
- [ ] สร้าง card endpoint รับ tokenId → สร้าง charge
- [ ] ตั้ง webhook route (ใช้ express.raw, ตอบ 200 ก่อน)
- [ ] Register webhook URL ใน dashboard (ใช้ ngrok ตอน dev)
- [ ] ทดสอบ card ด้วย `4242 4242 4242 4242`
- [ ] ทดสอบ PromptPay โดย manually confirm ใน dashboard
