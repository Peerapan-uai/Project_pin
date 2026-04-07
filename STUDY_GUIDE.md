# Study Guide — EV Charger Project
> อัปเดต: 2026-04-04 | เหลือ 4 วัน (ต้องเสร็จภายใน 8 เม.ย.)
> ข้อมูลทุกอย่างในนี้ verified จาก GitHub issues / npm / official docs จริงๆ

---

## สถานะงานที่เหลือ

### เนม
| งาน | สถานะ |
|-----|-------|
| Payment — PromptPay QR | ⏳ |
| Payment — บัตรเครดิต Omise | ⏳ |
| Auto-notify ช่างตอนสร้าง ticket | ⏳ |
| ChargingPage polling real-time | ⏳ |

### ลัลลา
| งาน | สถานะ |
|-----|-------|
| Admin report export (CSV) | ⏳ อยากทำ |
| PDF invoice | ⏳ อยากทำ |
| Notification broadcast/targeted | ⏳ อยากทำ |

---

## ส่วนที่ 1 — เนมต้องอ่าน

---

### 1.1 React Lifecycle (สำคัญที่สุด)

**ทำไมถึงเจอปัญหา:** React **unmount** component ทุกครั้งที่กดเปลี่ยนหน้า → state/ref ทุกอย่างหายหมด → mount ใหม่เมื่อกลับมา

```
กดไปหน้าอื่น → SearchPage unmount → GPS watch / interval ทั้งหมดควรหยุด
กลับมา       → SearchPage mount ใหม่ → state เริ่มใหม่ทั้งหมด
```

**สิ่งที่ต้อง cleanup เสมอ:**
```js
useEffect(() => {
  const interval = setInterval(poll, 5000)
  const watchId = navigator.geolocation.watchPosition(...)

  return () => {
    clearInterval(interval)                      // ← ขาดนี้ interval ยังรันค้าง
    navigator.geolocation.clearWatch(watchId)    // ← ขาดนี้ GPS ยังส่งข้อมูลมาเรื่อยๆ
  }
}, [])
```

**อ่านเพิ่ม:** "React useEffect cleanup" / "React component lifecycle"

---

### 1.2 useRef vs useState

> ถามตัวเองว่า: "ถ้าค่านี้เปลี่ยน ฉันอยาก UI update ไหม?"
> ใช่ → `useState` | ไม่ → `useRef`

```js
const [count, setCount] = useState(0)   // เปลี่ยนแล้ว UI re-render
const watchIdRef = useRef(null)          // เปลี่ยนแต่ UI ไม่ re-render
const mapRef = useRef(null)              // ใช้กับ DOM element หรือ library instance
```

**อ่านเพิ่ม:** "React useRef vs useState difference"

---

### 1.3 Stale Closure

callback ใน `setInterval` / `watchPosition` บางทีเห็นค่า state เก่า:

```js
// BUG — count ติดอยู่ที่ 0 ตลอด
setInterval(() => { setCount(count + 1) }, 1000)

// แก้: functional update
setInterval(() => { setCount(prev => prev + 1) }, 1000)
```

**อ่านเพิ่ม:** "React stale closure fix"

---

### 1.4 Payment — PromptPay QR

**แพ็คเกจ:**
```bash
npm install promptpay-qr qrcode
```

**Status (verified):** Stable — `dtinth/promptpay-qr` มี 0 bug reports เปิดอยู่  
ใช้ EMVCo standard ของ BoT → ทุกแอพธนาคารไทยรองรับ

**Gotcha ที่ต้องรู้:**
- ปัดเศษก่อนส่งเข้า library เสมอ: `Math.round(amount * 100) / 100`
- Floating point เช่น `100.1 + 100.2 = 200.29999...` ถ้าส่งเข้าตรงๆ อาจพัง

**Backend code:**
```js
const generatePayload = require('promptpay-qr')
const QRCode = require('qrcode')

// ใน POST /api/payments/qr
const amount = Math.round(Number(req.body.amount) * 100) / 100  // ปัดเศษก่อนเสมอ
const payload = generatePayload(process.env.PROMPTPAY_ID, { amount })
const qr_image = await QRCode.toDataURL(payload)   // base64 PNG

res.json({ qr_image, amount })
```

**Frontend:**
```jsx
<img src={qr_image} alt="PromptPay QR" className="w-48 h-48 mx-auto" />
```

**⚠️ ความจริงที่ต้องรู้:** PromptPay ไม่มี webhook จริงๆ ธนาคารไม่ส่ง notification มาหา server เรา  
→ ต้องให้ user กด "ฉันจ่ายแล้ว" เอง ซึ่งโอเคสำหรับโปรเจคนี้

**.env:**
```
PROMPTPAY_ID=0812345678
```

---

### 1.5 Payment — บัตรเครดิต (Omise)

**แพ็คเกจ:**
```bash
npm install omise   # backend เท่านั้น
# frontend ใช้ CDN <script> ไม่ต้อง install
```

**⚠️ Gotcha ที่สำคัญมาก (GitHub issue #64):**  
`omise` package ใช้ Node.js `https` module ตรงๆ  
**ห้าม import ใน React/Vite เด็ดขาด** จะ error ทันที  
→ ทุก Omise call ต้องอยู่ใน Express route เท่านั้น

**สมัคร Omise:** [dashboard.omise.co](https://dashboard.omise.co) → Settings → API Keys  
ได้ 2 key: `pkey_test_...` (frontend ได้) และ `skey_test_...` (backend เท่านั้น ห้ามโชว์)

**⚠️ Gotcha CDN race condition (verified):**  
`window.Omise` จะเป็น undefined ถ้า component render ก่อนที่ CDN โหลดเสร็จ  
ต้องรอ `onload` callback ก่อนเสมอ:

```jsx
useEffect(() => {
  const script = document.createElement('script')
  script.src = 'https://cdn.omise.co/omise.js'
  script.async = true
  script.onload = () => window.Omise.setPublicKey(import.meta.env.VITE_OMISE_PUBLIC_KEY)
  document.body.appendChild(script)
  return () => document.body.removeChild(script)
}, [])
```

**Flow:**
```
1. Frontend: Omise.js สร้าง token จากเลขบัตร (บัตรจริงไม่ผ่าน server เรา)
2. Frontend: ส่ง token ไป POST /api/payments/charge
3. Backend: สร้าง charge ผ่าน Omise API ด้วย secret key
4. Omise ตอบกลับว่า successful/failed
```

**Backend:**
```js
const Omise = require('omise')({ secretKey: process.env.OMISE_SECRET_KEY })

const charge = await Omise.charges.create({
  amount: Math.round(amount * 100),   // หน่วย satang (1 บาท = 100 satang)
  currency: 'thb',
  card: token,                         // token จาก Omise.js frontend
})
const success = charge.status === 'successful'
```

**Test Cards:**
| เลขบัตร | ผล |
|---------|-----|
| `4242 4242 4242 4242` | สำเร็จ |
| `4111 1111 1111 1111` | ล้มเหลว |

**.env:**
```
OMISE_SECRET_KEY=skey_test_...
VITE_OMISE_PUBLIC_KEY=pkey_test_...
```

---

### 1.6 Webhook + ngrok

Webhook = Omise ส่ง request มาหา server เราเองตอนมี event  
ngrok สร้าง public URL → forward มายัง localhost

```bash
brew install ngrok
ngrok config add-authtoken YOUR_TOKEN   # สมัคร ngrok.com ฟรี
ngrok http 5001                          # เปิด tunnel
```

ได้ URL เช่น: `https://abc123.ngrok-free.app`  
ใส่ใน Omise Dashboard → Webhooks → `https://abc123.ngrok-free.app/api/payments/webhook/omise`

ดู request/response แบบ real-time: `http://localhost:4040`

**⚠️ URL เปลี่ยนทุกครั้งที่ restart ngrok (free tier) → ต้องไปอัปเดตใน Omise Dashboard ใหม่ทุกครั้ง**

---

## ส่วนที่ 2 — ลัลลาต้องอ่าน

---

### 2.1 CSV Export

**⚠️ Gotcha สำคัญ (verified):**  
`json2csv` เวอร์ชันเก่า (v5) ถูก deprecated แล้ว ถ้า `npm install json2csv` จะได้ของเก่า  
→ ต้อง install `@json2csv/node` แทน:

```bash
npm install @json2csv/node
```

**Thai + Excel:** ต้องมี `withBOM: true` ไม่งั้น Excel เปิดแล้วภาษาไทยพัง:

```js
const { AsyncParser } = require('@json2csv/node')

router.get('/admin/reports/export', auth, roleCheck('admin'), async (req, res) => {
  const [rows] = await pool.query(`
    SELECT p.transaction_ref, u.first_name, u.last_name,
           p.amount, p.method, p.status, p.paid_at,
           st.name AS station_name
    FROM payments p
    JOIN users u ON p.user_id = u.user_id
    JOIN charging_sessions s ON p.session_id = s.session_id
    JOIN chargers c ON s.charger_id = c.charger_id
    JOIN stations st ON c.station_id = st.station_id
  `)

  const opts = { withBOM: true }   // ← สำคัญมากสำหรับ Excel + ภาษาไทย
  const parser = new AsyncParser(opts)

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="payments.csv"')

  parser.parse(rows).pipe(res)
})
```

---

### 2.2 PDF Export — เลือก Puppeteer แทน pdfkit

**⚠️ ทำไมไม่ใช้ pdfkit (verified จาก GitHub issue #832 เปิดมาตั้งแต่ 2018):**  
pdfkit ไม่มี text shaping engine สำหรับ complex script  
ภาษาไทยมี vowel stacking (ตัวสระอยู่เหนือ/ใต้พยัญชนะ) → pdfkit วางตำแหน่งผิด เกยกัน บางตัวหาย  
THSarabunNew.ttf ช่วยได้บ้างแต่ไม่แก้ปัญหา root cause

→ ใช้ **Puppeteer** แทน (headless Chrome → Thai ถูกต้อง 100%)

```bash
npm install puppeteer   # ดาวน์โหลด Chromium ~300MB
```

```js
const puppeteer = require('puppeteer')

router.get('/admin/payments/:id/invoice', auth, roleCheck('admin'), async (req, res) => {
  const [rows] = await pool.query(
    'SELECT p.*, u.first_name, u.last_name FROM payments p JOIN users u ON p.user_id = u.user_id WHERE p.payment_id = ?',
    [req.params.id]
  )
  const p = rows[0]

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()

  await page.setContent(`
    <html>
      <head>
        <meta charset="UTF-8">
        <style>body { font-family: 'Sarabun', sans-serif; padding: 40px; }</style>
      </head>
      <body>
        <h1>ใบเสร็จการชาร์จ</h1>
        <p>Transaction: ${p.transaction_ref}</p>
        <p>จำนวน: ${p.amount} บาท</p>
        <p>สถานะ: ${p.status}</p>
      </body>
    </html>
  `, { waitUntil: 'networkidle0' })

  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  await browser.close()

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${p.transaction_ref}.pdf"`)
  res.send(pdf)
})
```

**⚠️ Tradeoff:** Puppeteer หนัก (~300MB) และช้ากว่า pdfkit แต่ Thai ถูกต้อง  
สำหรับโปรเจคนี้ที่ server รันบน local → โอเค

---

## ส่วนที่ 3 — ทั้งคู่ต้องรู้

---

### 3.1 @react-google-maps/api — ปัญหาที่ต้องรู้

**⚠️ Package นี้แทบถูก abandon (verified):**
- GitHub มี **187 open issues**
- Maintainer พูดเองว่าไม่ maintain แล้ว
- Documentation site พัง (report ใน issue #3434)

**⚠️ Marker deprecated โดย Google (Feb 2024):**  
`google.maps.Marker` ที่ใช้อยู่ตอนนี้ถูก Google deprecated แล้ว  
Google ออก `AdvancedMarkerElement` มาแทน  
แต่ `@react-google-maps/api` ยังไม่ support (issue #3337 เปิดอยู่ ยังไม่แก้)  
→ จะเห็น deprecation warning ใน console ทุกครั้งที่ render Marker

**Package ที่ควรเปลี่ยนไปใช้ในอนาคต:**  
Google recommend อย่างเป็นทางการให้ใช้ **`@vis.gl/react-google-maps`** แทน  
- Maintained โดย OpenJS Foundation  
- Support `AdvancedMarkerElement` ตั้งแต่ต้น  
- ออก version ใหม่ทุกสัปดาห์  
- ดู docs: `visgl.github.io/react-google-maps`

**สำหรับโปรเจคนี้ตอนนี้:** ใช้ต่อได้ ยังไม่ crash อะไร แต่รู้ไว้ว่า deprecated และควรย้ายใน future

---

### 3.2 Google Maps: Web → React Native

ตอนนี้ใช้ `@react-google-maps/api` (web)  
อนาคต React Native ใช้ `react-native-maps`

**สิ่งที่ต้องเปลี่ยนตอน migrate:**

| Web (ตอนนี้) | React Native (อนาคต) |
|-------------|---------------------|
| `<GoogleMap>` | `<MapView provider={PROVIDER_GOOGLE}>` |
| `<Marker position={{lat, lng}}>` | `<Marker coordinate={{latitude, longitude}}>` |
| `<InfoWindow>` | `<Callout>` |
| `<DirectionsRenderer>` | ไม่มี — ต้องเรียก Directions API เอง + วาด `<Polyline>` |
| `navigator.geolocation` | `react-native-geolocation-service` |
| `useJsApiLoader` | ไม่ต้องใช้ |
| `{ lat, lng }` | `{ latitude, longitude }` |
| SVG marker icons | ต้องเป็น PNG |

**⚠️ Warning สำหรับ iOS (verified จาก issue #5823):**  
Google ประกาศจะหยุด release Maps SDK สำหรับ iOS ผ่าน CocoaPods ตั้งแต่ Q2 2026 เป็นต้นไป  
`react-native-maps` ยังไม่มี migration plan สำหรับเรื่องนี้  
→ ถ้าจะทำ React Native จริงๆ ให้ติดตาม issue #5823 ไว้

---

## แพ็คเกจที่ต้อง install ก่อนเริ่ม

```bash
# Backend
npm install omise promptpay-qr qrcode @json2csv/node puppeteer

# Frontend ไม่ต้องเพิ่ม (Omise ใช้ CDN)
```

---

## Priority 4 วันที่เหลือ

### เนม
```
วันที่ 5 (วันนี้)  → PromptPay QR
วันที่ 6           → บัตรเครดิต Omise  
วันที่ 7           → ngrok + webhook, Auto-notify ช่าง
วันที่ 8           → เก็บ bug, เทสรวม
```

### ลัลลา
```
วันที่ 5 (วันนี้)  → CSV export
วันที่ 6           → PDF (Puppeteer)
วันที่ 7           → Notification broadcast
วันที่ 8           → เก็บ bug, เทสรวม
```

---

> Sources: github.com/omise/omise-node, github.com/dtinth/promptpay-qr, github.com/zemirco/json2csv,
> github.com/foliojs/pdfkit/issues/832, github.com/JustFly1984/react-google-maps-api,
> github.com/react-native-maps/react-native-maps/issues/5823, visgl.github.io/react-google-maps
