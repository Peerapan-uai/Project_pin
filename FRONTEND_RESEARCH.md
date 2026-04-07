# Frontend Research — 7 Features ที่ต้องทำ

> อัปเดต: 2026-04-03 | Backend API ครบ 51 endpoints แล้ว ✅

---

## 1. SearchPage — GPS + Sort ระยะห่าง

**ไฟล์:** `frontend/src/pages/user/SearchPage.jsx`

### วิธีทำ
- ใช้ `navigator.geolocation.getCurrentPosition()` ดึง lat/lng ของ user
- ส่ง lat/lng ไปกับ `GET /api/stations` แล้ว sort ฝั่ง frontend
- หรือถ้า lalla มี `GET /api/stations/nearby?lat=&lng=` ให้เรียกนั้นแทน

### คำนวณระยะห่าง
```js
// Haversine formula
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

### UX แนะนำ
- แสดง "กำลังหาตำแหน่ง..." spinner ระหว่างรอ GPS
- ถ้า deny GPS → fallback แสดงสถานีทั้งหมดไม่ sort
- badge แสดง "1.2 km" ใต้ชื่อสถานีแต่ละอัน
- ปุ่ม sort toggle: ระยะห่าง / ราคา / ชื่อ

---

## 2. SearchPage — Google Maps

**ไฟล์:** `frontend/src/pages/user/SearchPage.jsx`

### Package
```bash
npm install @react-google-maps/api
```

### วิธีทำ
```jsx
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY });

// map center = user GPS หรือ Bangkok default (13.7563, 100.5018)
// Marker แต่ละสถานี → click → popup แสดงชื่อ/ที่อยู่/ปุ่ม "จอง"
```

### .env ที่ต้องเพิ่ม
```
VITE_GOOGLE_MAPS_KEY=AIza...
```

### UX แนะนำ
- Layout: แผนที่ซ้าย 60% + list ขวา 40% (desktop) / toggle map↔list (mobile)
- Custom marker icon: สีเขียว = available, แดง = full/offline
- Marker click → highlight card ใน list ด้วย
- InfoWindow แสดง: ชื่อสถานี, จำนวนตู้ว่าง, ราคา/kWh, ปุ่ม navigate (Google Maps link)

---

## 3. ChargingPage — Real-time Polling

**ไฟล์:** `frontend/src/pages/user/ChargingPage.jsx` (อาจต้องสร้างใหม่)

### API ที่ใช้
`GET /api/sessions/:id/status` — poll ทุก 5 วินาที

### วิธีทำ
```jsx
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/sessions/${sessionId}/status`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setSessionData(data);
    if (data.status === 'completed') clearInterval(interval);
  }, 5000);
  return () => clearInterval(interval); // cleanup
}, [sessionId]);
```

### UI ที่ต้องแสดง
- ⚡ kW (power กำลังชาร์จตอนนี้)
- 🔋 kWh (พลังงานที่ได้รับแล้ว)
- 💰 ค่าไฟสะสม (kWh × price_per_kwh)
- ⏱️ เวลาที่ใช้ไป
- Progress bar: % ที่ชาร์จแล้ว (ถ้ามี charge_percentage)
- ปุ่ม "หยุดชาร์จ" → เรียก `PATCH /api/sessions/:id/stop`

### UX แนะนำ
- ตัวเลขค่าไฟ animate เมื่ออัปเดต (CSS transition)
- แสดง estimated time to full (ถ้ารู้ battery capacity)
- เมื่อ status = completed → redirect ไป PaymentPage อัตโนมัติ

---

## 4. BookingPage — ปุ่ม 🔧 แจ้งปัญหา

**ไฟล์:** `frontend/src/pages/user/BookingPage.jsx`

### วิธีทำ
- เพิ่มปุ่ม "🔧 แจ้งปัญหา" ในการ์ดแต่ละ booking
- navigate ไป `/report?charger_id=X` พร้อม pre-fill

```jsx
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();

<button onClick={() => navigate(`/report?charger_id=${booking.charger_id}`)}>
  🔧 แจ้งปัญหา
</button>
```

- ใน `ReportIssuePage.jsx` รับ `charger_id` จาก query param:
```jsx
const [searchParams] = useSearchParams();
const chargerId = searchParams.get('charger_id');
```

---

## 5. PaymentPage — PromptPay QR จริง

**ไฟล์:** `frontend/src/pages/user/PaymentPage.jsx`

### Flow
1. user กด "จ่ายด้วย PromptPay"
2. เรียก `POST /api/payments/qr` → ได้ `qr_image` (base64) + `payment_id`
3. แสดง QR บนหน้าจอ
4. Polling `GET /api/payments/:id/status` ทุก 3 วินาที รอ status = completed
5. หรือ user กดปุ่ม "ฉันจ่ายแล้ว" → เรียก `PATCH /api/payments/:id/confirm`

### เมื่อ install `promptpay-qr` + `qrcode` ใน backend แล้ว
- backend จะส่ง `qr_image` เป็น base64 PNG จริง
- frontend แค่ `<img src={qr_image} />`

### UX แนะนำ
- Countdown timer 15 นาที (expires_in จาก API)
- ถ้า timeout → แสดงปุ่ม "สร้าง QR ใหม่"
- แสดงยอดเงินชัดเจน ฿XXX.XX ใต้ QR

---

## 6. PaymentPage — บัตรเครดิต/เดบิต (Omise.js)

**ไฟล์:** `frontend/src/pages/user/PaymentPage.jsx`

### ขั้นตอนการ integrate
1. สมัคร Omise account → omise.co (ฟรี sandbox)
2. ได้ Public Key (`pkey_...`) + Secret Key (`skey_...`)
3. เพิ่ม Omise.js ใน `index.html`:
```html
<script src="https://cdn.omise.co/omise.js"></script>
```

4. Tokenize บัตรด้วย Omise.js (ไม่ผ่าน server เลย → PCI safe):
```js
OmiseCard.open({
  publicKey: import.meta.env.VITE_OMISE_PUBLIC_KEY,
  amount: amount * 100, // สตางค์
  onCreateTokenSuccess: (token) => {
    // ส่ง token ไป POST /api/payments/charge
    fetch('/api/payments/charge', {
      method: 'POST',
      body: JSON.stringify({ session_id, amount, token }),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` }
    });
  }
});
```

### .env ที่ต้องเพิ่ม
```
VITE_OMISE_PUBLIC_KEY=pkey_test_...
OMISE_SECRET_KEY=skey_test_...   # ใน backend .env
```

---

## 7. Public Reviews (ไม่ต้อง login)

**ไฟล์:** `backend/routes/reviews.js`

### วิธีแก้ backend (1 บรรทัด)
ตอนนี้ `GET /api/reviews/station/:id` มี `auth` middleware → ลบออก:

```js
// เปลี่ยนจาก:
router.get('/station/:id', auth, async (req, res) => { ... })

// เป็น:
router.get('/station/:id', async (req, res) => { ... })
```

### Frontend
- StationDetailPage / SearchPage สามารถดึงรีวิวได้โดยไม่ต้อง JWT
- แสดง star rating + ชื่อ reviewer + comment

---

## สรุป Priority

| ลำดับ | ฟีเจอร์ | ความยาก | Impact |
|-------|---------|---------|--------|
| 1 | BookingPage: ปุ่ม 🔧 | ง่ายมาก | ปิด scope |
| 2 | Public reviews (แก้ 1 บรรทัด) | ง่ายมาก | ปิด scope |
| 3 | ChargingPage: polling | ง่าย | สำคัญมาก |
| 4 | SearchPage: GPS + sort | ปานกลาง | UX ดี |
| 5 | PaymentPage: QR | ปานกลาง | ต้องเทส |
| 6 | SearchPage: Google Maps | ปานกลาง | ต้องมี API key |
| 7 | PaymentPage: Omise card | ยาก | ต้องสมัคร account |

---

## สิ่งที่ต้องสมัคร/ติดตั้งก่อน

| สิ่ง | ที่ไหน | ราคา |
|------|--------|------|
| Google Maps API Key | console.cloud.google.com | ฟรี $200 credit/เดือน |
| Omise Sandbox Account | omise.co | ฟรี |
| `npm install @react-google-maps/api` | frontend | - |
| `npm install promptpay-qr qrcode` | backend | - |
| ngrok (เทส webhook) | ngrok.com | ฟรี tier |
