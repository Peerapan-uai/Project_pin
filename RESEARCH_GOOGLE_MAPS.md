# Google Maps Integration — Research Summary (2025)

> หาข้อมูลไว้ก่อนนอน อ่านก่อนลงมือทำ

---

## 1. Library ที่ควรใช้ใน 2025

**ใช้ `@vis.gl/react-google-maps`** — Google ประกาศ official support แล้ว

```bash
npm install @vis.gl/react-google-maps
```

| Library | สถานะ | คำแนะนำ |
|---|---|---|
| `@vis.gl/react-google-maps` | Actively maintained, Google official | **ใช้อันนี้** |
| `@react-google-maps/api` | community-maintained เคลื่อนช้า | หลีกเลี่ยง |
| `google-maps-react` | ตายแล้ว | อย่าใช้ |

---

## 2. Setup API Key

```bash
# .env (Vite project)
VITE_GOOGLE_MAPS_API_KEY=AIza...yourkey...
```

```js
// ใน code
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
```

**⚠️ Key จะโผล่ใน browser devtools — ปกติมาก** อย่าตกใจ  
วิธีป้องกันคือ **restrict key** ใน Google Cloud Console:
- APIs & Services > Credentials > ใส่ HTTP referrer restrictions
- เพิ่ม `http://localhost:3000/*` และ domain จริง
- Restrict ให้ใช้ได้แค่ Maps JavaScript API, Places API

---

## 3. APIs ที่ต้อง Enable ใน Google Cloud Console

| API | ทำไม |
|---|---|
| **Maps JavaScript API** | render แผนที่ |
| **Places API (New)** | ถ้าจะค้นหาสถานี EV จาก Google |
| **Geocoding API** | แปลง address → coordinates |

> **Navigator.geolocation (GPS)** = browser built-in ไม่ต้อง enable อะไร ฟรี

---

## 4. Code พื้นฐาน

```jsx
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

const stations = [
  { id: 1, name: "EV Station", lat: 13.7367, lng: 100.5602 },
];

export default function EVMap() {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div style={{ width: '100%', height: '100vh' }}>  {/* ← ต้องมี height! */}
        <Map
          defaultCenter={{ lat: 13.7563, lng: 100.5018 }}
          defaultZoom={12}
          mapId="YOUR_MAP_ID"   // ← ต้องสร้างใน Google Cloud Console
        >
          {stations.map(s => (
            <AdvancedMarker key={s.id} position={{ lat: s.lat, lng: s.lng }}>
              <div style={{
                background: '#4CAF50', color: 'white',
                padding: '6px 10px', borderRadius: '20px', fontSize: '12px'
              }}>EV</div>
            </AdvancedMarker>
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}
```

---

## 5. GPS Location + Error Handling

```jsx
import { useState, useEffect } from 'react';

const BANGKOK = { lat: 13.7563, lng: 100.5018 };

function useUserLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('เบราว์เซอร์ไม่รองรับ GPS');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('กรุณาอนุญาตการเข้าถึงตำแหน่ง');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('ไม่สามารถระบุตำแหน่งได้');
            break;
          case err.TIMEOUT:
            setError('หมดเวลา กรุณาลองใหม่');
            break;
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: false, // false = เร็วกว่า ประหยัดแบต
        timeout: 10000,
        maximumAge: 60000,         // cache 1 นาที
      }
    );
  }, []);

  return {
    location: location ?? BANGKOK, // fallback กรุงเทพ
    userActualLocation: location,
    locationDenied: error?.includes('อนุญาต'),
    loading,
  };
}
```

---

## 6. คำนวณระยะห่าง (ฟรี, ไม่ต้อง API)

```js
// utils/distance.js
export function haversineDistance(coord1, coord2) {
  const R = 6371;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * (Math.PI / 180); }

// sort stations by distance
const sorted = [...stations].sort((a, b) =>
  haversineDistance(userLoc, a) - haversineDistance(userLoc, b)
);
```

> **อย่าใช้ Distance Matrix API** → เสียเงินทุก request, Haversine แม่นพอแล้ว

---

## 7. ราคา Google Maps (2025)

| API | Free ต่อเดือน |
|---|---|
| Maps JavaScript API | 10,000 map loads |
| Places API | 10,000 requests |
| Geocoding API | 10,000 requests |

App ขนาดเล็ก ~500 user → อยู่ใน free tier สบาย  
**ต้องใส่บัตรเครดิตก่อนจึงจะ enable API ได้** แต่ไม่ถูกเก็บเงินถ้าไม่เกิน free tier  
→ Set billing alert $5 ใน Google Cloud Console ทันทีหลัง enable

---

## 8. Gotchas ที่จะเจอแน่นอน

| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| แผนที่ไม่แสดง | `div` ไม่มี `height` | ใส่ `height: 500px` หรือ `100vh` |
| `AdvancedMarker` ไม่ทำงาน | ลืมใส่ `mapId` | สร้าง Map ID ใน Google Cloud Console |
| GPS ไม่ทำงาน production | ต้องเป็น HTTPS | ใช้ HTTPS บน server จริง, localhost OK |
| iOS Safari GPS ช้ามาก | enableHighAccuracy=true | ใช้ `false` |
| Key โดนขโมย | ไม่ restrict | ใส่ HTTP referrer restriction |

---

## 9. ทางเลือกฟรี: Leaflet + OpenStreetMap

```bash
npm install leaflet react-leaflet
```

ถ้า data สถานีมาจาก database ตัวเอง → **ใช้ Leaflet ได้เลย ไม่ต้องจ่ายเงิน**  
OpenStreetMap ใน Thailand ครอบคลุมดีพอ

---

## Quick Checklist ก่อนเริ่มทำ

- [ ] Enable Maps JavaScript API ใน Google Cloud Console
- [ ] สร้าง API Key + restrict domain
- [ ] สร้าง Map ID (ต้องใช้กับ AdvancedMarker)
- [ ] `npm install @vis.gl/react-google-maps`
- [ ] ใส่ key ใน `.env` → `VITE_GOOGLE_MAPS_API_KEY=...`
- [ ] เพิ่ม `.env` ใน `.gitignore`
- [ ] div ที่ครอบ Map ต้องมี height
- [ ] Set billing alert $5 ใน Google Cloud
