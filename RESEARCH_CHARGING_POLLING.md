# ChargingPage Real-Time Polling — Research Summary

---

## 1. ใช้ Polling (setInterval) ไม่ใช่ WebSocket

| วิธี | ความยาก | เหมาะกับ |
|---|---|---|
| **setInterval Polling** | ง่าย | **ใช้อันนี้** |
| SSE | ปานกลาง | ต้องแก้ backend |
| WebSocket | ยาก | overkill สำหรับ charging |

เหตุผล: backend มี `GET /api/sessions/:id/status` อยู่แล้ว ไม่ต้องแก้อะไร

---

## 2. Pattern สำคัญ — 2 Interval แยกกัน

```
Interval A (1 วิ) — Visual Timer
  → คำนวณ elapsed time จาก start_time ที่ได้จาก API
  → แสดง "00:23:45"
  → ไม่ call network เลย

Interval B (5 วิ) — API Polling
  → GET /api/sessions/:id/status
  → อัปเดต kWh และค่าไฟ
  → เช็คว่า session หยุดแล้วหรือยัง
```

ทำไมต้องแยก → ถ้า network ช้า timer จะกระตุก ถ้าใช้ interval เดียวกัน

---

## 3. Pattern cleanup ที่ถูกต้อง

```js
useEffect(() => {
  const id = setInterval(() => {
    // do something
  }, 1000);

  return () => clearInterval(id); // ← ต้องมีเสมอ ไม่งั้น memory leak
}, []);
```

---

## 4. Stale Closure — Gotcha ที่เจอบ่อย

```js
// ❌ WRONG — count ติดค่าเก่า ไม่อัปเดต
setCount(count + 1);

// ✅ CORRECT — ใช้ functional update
setCount(prev => prev + 1);
```

ถ้าต้องอ่าน variable อื่นใน interval → ใช้ `useRef` แทน

---

## 5. คำนวณ elapsed time จาก start_time

```js
function formatElapsed(startTimeISO) {
  if (!startTimeISO) return '00:00:00';
  const totalSeconds = Math.floor((Date.now() - new Date(startTimeISO).getTime()) / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}
```

**ทำไมคำนวณจาก start_time แทนที่จะ +1 ทุกวิ:**
- ถ้า tab sleep หรือ network หาย → timer เคลื่อนไปเองได้
- คำนวณจาก start_time = แม่นเสมอ self-correcting

---

## 6. Format ค่าต่างๆ

```js
const formatKwh  = (kwh)    => `${Number(kwh || 0).toFixed(2)} kWh`  // "12.34 kWh"
const formatTHB  = (amount) => `฿${Number(amount || 0).toFixed(2)}`   // "฿45.50"
```

---

## 7. หยุด polling เมื่อ session จบ

```js
const pollingRef = useRef(null);

function stopPolling() {
  if (pollingRef.current) {
    clearInterval(pollingRef.current);
    pollingRef.current = null;
  }
}

useEffect(() => {
  async function fetchStatus() {
    const res = await fetch(`/api/sessions/${sessionId}/status`);
    if (res.status === 404) { stopPolling(); setSessionEnded(true); return; }

    const data = await res.json();
    setSessionData(data);

    // เช็ค status ทุกครั้ง
    if (data.status === 'completed' || data.status === 'stopped') {
      stopPolling();
      setSessionEnded(true);
    }
  }

  fetchStatus(); // call ทันทีตอน mount
  pollingRef.current = setInterval(fetchStatus, 5000);

  return () => stopPolling(); // cleanup ตอน unmount
}, [sessionId]);
```

---

## 8. useInterval Custom Hook (reusable)

```js
// hooks/useInterval.js
import { useEffect, useRef } from 'react';

export function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return; // pass null เพื่อ pause
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

ใช้แบบนี้: `useInterval(fetchStatus, sessionEnded ? null : 5000)`

---

## 9. Gotchas สรุป

| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| Timer วิ่งหลัง unmount | ไม่มี cleanup | `return () => clearInterval(id)` |
| Counter ไม่อัปเดต | stale closure | `setCount(prev => prev + 1)` |
| Timer กระตุก | ผูก timer กับ API call | แยก 2 interval |
| Polling ไม่หยุด | ไม่เช็ค session status | เช็ค data.status ทุกครั้ง |
| StrictMode fire 2 ครั้ง | React dev mode ปกติ | cleanup ถูกต้อง → ไม่มีปัญหา |

---

## 10. ChargingPage ตอนนี้

จากการอ่าน code จริง — **ChargingPage มีโครงสร้างถูกต้องอยู่แล้ว:**
- มี 2 interval refs (10s poll + 1s tick) แล้ว
- มี baseDurationRef + fetchedAtRef สำหรับคำนวณ

**ที่ขาดจริงๆ แค่:**
- ไม่แสดง error ใน UI (catch ไม่มี UI feedback)
- ไม่มี retry mechanism

→ แปลว่าแก้นิดเดียวก็เสร็จ
