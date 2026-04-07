# SearchPage GPS + Nearby Stations — Research Summary (2025)

> หาข้อมูลไว้ก่อนนอน อ่านก่อนลงมือทำ

---

## 1. Pattern ที่ถูกต้อง — Custom Hook

```js
// hooks/useGeolocation.js
import { useState, useEffect } from 'react';

export function useGeolocation(options = {}) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    coords: null,  // { latitude, longitude, accuracy }
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ loading: false, error: { code: 0, message: 'ไม่รองรับ GPS' }, coords: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({ loading: false, error: null, coords: position.coords });
      },
      (err) => {
        setState({ loading: false, error: err, coords: null });
      },
      {
        enableHighAccuracy: false,  // false = เร็วกว่า ประหยัดแบต ใช้ network/WiFi
        timeout: 10000,
        maximumAge: 120000,         // cache 2 นาที
        ...options,
      }
    );
  }, []); // [] = run ครั้งเดียวตอน mount

  return state;
}
```

---

## 2. ใช้ใน SearchPage

```jsx
import { useGeolocation } from '../hooks/useGeolocation';
import { useState, useEffect } from 'react';

export default function SearchPage() {
  const { loading, error, coords } = useGeolocation();
  const [stations, setStations] = useState([]);

  useEffect(() => {
    if (!coords) return;

    fetch(`/api/stations/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=10`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setStations(data));

  }, [coords?.latitude, coords?.longitude]); // ← ใช้ .latitude/.longitude ไม่ใช่ coords object!

  if (loading) return <LoadingLocation />;
  if (error)   return <LocationErrorFallback error={error} />;

  return <StationList stations={stations} />;
}
```

---

## 3. HTTP vs HTTPS — จุดสำคัญมาก

| สถานการณ์ | GPS ทำงาน? |
|---|---|
| `https://` (production) | ✅ |
| `http://localhost:3000` (dev) | ✅ ยกเว้นพิเศษ |
| `http://192.168.x.x:3000` (ทดสอบบนมือถือ LAN) | ❌ ไม่ทำงาน! |
| `http://yourdomain.com` | ❌ |

**ทดสอบบนมือถือจริง → ใช้ ngrok:**
```bash
ngrok http 5173
# ได้ https://abc123.ngrok.io → ใช้บนมือถือได้เลย
```

---

## 4. Error Handling ครบทุก case

```jsx
function LocationErrorFallback({ error }) {
  // error.code: 1=denied, 2=unavailable, 3=timeout, 0=not supported
  const messages = {
    1: {
      title: 'ไม่ได้รับอนุญาตเข้าถึงตำแหน่ง',
      desc: 'กรุณาเปิดการอนุญาตตำแหน่งในการตั้งค่าเบราว์เซอร์',
      showRetry: false,  // กด retry จะ error ทันที ไม่มีประโยชน์
      showManualSearch: true,
    },
    2: {
      title: 'ไม่สามารถระบุตำแหน่งได้',
      desc: 'สัญญาณ GPS ไม่เสถียร',
      showRetry: true,
      showManualSearch: true,
    },
    3: {
      title: 'หมดเวลาค้นหาตำแหน่ง',
      desc: 'ใช้เวลานานเกินไป',
      showRetry: true,
    },
  };

  const config = messages[error.code] ?? messages[2];
  return (
    <div>
      <h3>{config.title}</h3>
      <p>{config.desc}</p>
      {config.showRetry && <button onClick={() => window.location.reload()}>ลองอีกครั้ง</button>}
    </div>
  );
}
```

**⚠️ error.code === 1 (PERMISSION_DENIED):** อย่าใส่ปุ่ม Retry เพราะกดแล้วจะ error ทันทีซ้ำ  
ต้องให้ user ไปแก้ใน browser settings เอง → บอกวิธีใน UI

---

## 5. แสดงระยะทาง

```js
// utils/formatDistance.js
export function formatDistance(distanceKm) {
  const meters = distanceKm * 1000;
  if (meters < 1000) {
    return `${Math.round(meters / 50) * 50} ม.`;  // round ทุก 50m
  }
  return `${distanceKm.toFixed(1)} กม.`;
}

// ตัวอย่าง:
// formatDistance(0.085) → "100 ม."
// formatDistance(0.85)  → "850 ม."
// formatDistance(1.234) → "1.2 กม."
```

Backend ส่ง `distance_km` มาแล้ว → แค่ใส่ใน function นี้

---

## 6. Gotchas บน iOS Safari

| ปัญหา | รายละเอียด |
|---|---|
| Permissions API โกหก | `navigator.permissions.query` บน Safari return 'prompt' แม้จะ denied แล้ว → เชื่อ error จาก getCurrentPosition แทน |
| Precise Location iOS 14+ | ถ้า user ปิด Precise Location จะได้ความแม่นแค่ระดับเมือง (~3km) → OK สำหรับ search |
| Permission อาจหมดอายุ | Safari ให้ permission แบบ "วันนี้" หรือ "session" ไม่ใช่ permanent |
| HTTPS บังคับ 100% | `http://192.168.x.x` ไม่ทำงานบน iOS เลย → ใช้ ngrok |

---

## 7. Performance — อย่าใช้ coords object เป็น dependency

```js
// ❌ WRONG — re-fetch ทุกครั้งที่ GPS update แม้พิกัดไม่เปลี่ยน
useEffect(() => { ... }, [coords]);

// ✅ CORRECT — re-fetch เฉพาะตอนพิกัดเปลี่ยนจริงๆ
useEffect(() => { ... }, [coords?.latitude, coords?.longitude]);
```

**Round ก่อนใช้เป็น cache key** — GPS ขยับนิดหน่อยตลอดเวลา:
```js
const roundedLat = Math.round(coords.latitude * 1000) / 1000;   // ~100m precision
const roundedLng = Math.round(coords.longitude * 1000) / 1000;
useEffect(() => { ... }, [roundedLat, roundedLng]);
```

---

## 8. Cancel Request เมื่อ coords เปลี่ยน (prevent race condition)

```js
useEffect(() => {
  if (!coords) return;
  const controller = new AbortController();

  fetch(`/api/stations/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=10`, {
    signal: controller.signal,
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => setStations(data))
    .catch(err => {
      if (err.name !== 'AbortError') setError(err);
    });

  return () => controller.abort(); // cancel ถ้า coords เปลี่ยนก่อน request เสร็จ
}, [coords?.latitude, coords?.longitude]);
```

---

## 9. สถาปัตยกรรม SearchPage รวม

```
SearchPage
├── useGeolocation()              → coords + loading + error
├── fetch /api/stations/nearby    → stations[]
│
├── loading    → <p>กำลังระบุตำแหน่ง GPS...</p>
├── gps error  → <LocationErrorFallback />
├── fetching   → skeleton cards
└── success    → <StationList>
                   └── <StationCard distance={formatDistance(s.distance_km)} />
```

```jsx
export default function SearchPage() {
  const geo = useGeolocation();
  const [stations, setStations] = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!geo.coords) return;
    setFetching(true);
    const ctrl = new AbortController();

    fetch(`/api/stations/nearby?lat=${geo.coords.latitude}&lng=${geo.coords.longitude}&radius=10`, {
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { setStations(data); setFetching(false); })
      .catch(err => { if (err.name !== 'AbortError') setFetching(false); });

    return () => ctrl.abort();
  }, [geo.coords?.latitude, geo.coords?.longitude]);

  if (geo.loading) return <p>กำลังระบุตำแหน่ง GPS...</p>;
  if (geo.error)   return <LocationErrorFallback error={geo.error} />;
  if (fetching)    return <p>กำลังค้นหาสถานี...</p>;

  return (
    <div>
      <p>{stations.length} สถานีในระยะ 10 กม.</p>
      {stations.map(s => (
        <StationCard key={s.id} station={s} distance={formatDistance(s.distance_km)} />
      ))}
    </div>
  );
}
```

---

## Quick Checklist ก่อนเริ่มทำ

- [ ] สร้าง `hooks/useGeolocation.js`
- [ ] ใส่ `enableHighAccuracy: false` (เร็วกว่า เพียงพอสำหรับ search)
- [ ] handle error ทั้ง 3 case (1=denied, 2=unavailable, 3=timeout)
- [ ] **อย่า** ใส่ปุ่ม Retry สำหรับ error.code === 1
- [ ] ใช้ `coords?.latitude` เป็น dependency ไม่ใช่ `coords`
- [ ] ใส่ AbortController ป้องกัน race condition
- [ ] สร้าง `utils/formatDistance.js`
- [ ] ทดสอบบนมือถือผ่าน ngrok (ไม่ใช่ LAN IP)
