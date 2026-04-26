const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const CONSUMPTION_RATE = 0.18; // kWh/km
const SAFETY_MARGIN = 0.8;     // 80% usable range
const MAX_DEVIATION_KM = 15;

function decodePolyline(encoded) {
  const points = [];
  let idx = 0;
  let lat = 0;
  let lng = 0;
  while (idx < encoded.length) {
    let shift = 0;
    let result = 0;
    let b;
    do {
      b = encoded.charCodeAt(idx++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(idx++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/trip-plan
router.post('/', auth, async (req, res) => {
  const { destination, vehicle_id } = req.body;
  if (!destination || (!destination.lat && !destination.address)) {
    return res.status(400).json({ message: 'destination (lat/lng หรือ address) จำเป็นต้องมี' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ message: 'Google Maps API key ยังไม่ได้ตั้งค่า' });
  }

  try {
    // หา battery ของรถที่เลือก
    let batteryKwh = 40; // default fallback
    if (vehicle_id) {
      const [vRows] = await pool.query(
        'SELECT battery_current_kwh FROM vehicles WHERE vehicle_id = ? AND user_id = ?',
        [vehicle_id, req.user.user_id]
      );
      if (vRows.length > 0 && vRows[0].battery_current_kwh != null) {
        batteryKwh = parseFloat(vRows[0].battery_current_kwh);
      }
    }

    // หา origin จาก user location หรือ default Bangkok
    const origin = '13.7563,100.5018';
    const dest = destination.lat
      ? `${destination.lat},${destination.lng}`
      : encodeURIComponent(destination.address);

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${apiKey}`;
    const gmapRes = await fetch(url);
    const gmapData = await gmapRes.json();

    if (gmapData.status !== 'OK' || !gmapData.routes?.length) {
      return res.status(400).json({ message: 'ไม่พบเส้นทาง กรุณาตรวจสอบปลายทาง', gmap_status: gmapData.status });
    }

    const route = gmapData.routes[0];
    const distanceKm = route.legs[0].distance.value / 1000;
    const durationSec = route.legs[0].duration.value;
    const estimatedArrival = new Date(Date.now() + durationSec * 1000).toISOString();

    const rangeKm = (batteryKwh / CONSUMPTION_RATE) * SAFETY_MARGIN;

    if (distanceKm <= rangeKm) {
      return res.json({
        distance_km: Math.round(distanceKm * 10) / 10,
        range_km: Math.round(rangeKm * 10) / 10,
        needs_charging: false,
        estimated_arrival: estimatedArrival,
      });
    }

    // ต้องชาร์จ — หาจุดที่แบตจะหมด (85% ของ range)
    const chargePointKm = rangeKm * 0.85;
    const polylineEncoded = route.overview_polyline.points;
    const points = decodePolyline(polylineEncoded);

    let cumulativeKm = 0;
    let chargeLat = points[0][0];
    let chargeLng = points[0][1];
    for (let i = 1; i < points.length; i++) {
      const segKm = haversineKm(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
      cumulativeKm += segKm;
      if (cumulativeKm >= chargePointKm) {
        chargeLat = points[i][0];
        chargeLng = points[i][1];
        break;
      }
    }

    // หา stations ใกล้จุดที่ต้องชาร์จ
    const [stations] = await pool.query(
      `SELECT station_id, name, address, latitude, longitude,
         (6371 * acos(
           cos(radians(?)) * cos(radians(latitude)) *
           cos(radians(longitude) - radians(?)) +
           sin(radians(?)) * sin(radians(latitude))
         )) AS distance_km
       FROM stations
       WHERE status = 'active' AND deleted_at IS NULL
       HAVING distance_km < ?
       ORDER BY distance_km ASC
       LIMIT 5`,
      [chargeLat, chargeLng, chargeLat, MAX_DEVIATION_KM]
    );

    // เพิ่มจำนวนตู้ว่างของแต่ละ station
    for (const st of stations) {
      const [chargers] = await pool.query(
        `SELECT COUNT(*) AS available_chargers FROM chargers
         WHERE station_id = ? AND status = 'available' AND deleted_at IS NULL`,
        [st.station_id]
      );
      st.available_chargers = chargers[0].available_chargers;
      st.distance_from_path_km = Math.round(st.distance_km * 10) / 10;
      delete st.distance_km;
    }

    return res.json({
      distance_km: Math.round(distanceKm * 10) / 10,
      range_km: Math.round(rangeKm * 10) / 10,
      needs_charging: true,
      charging_point: { lat: chargeLat, lng: chargeLng, after_km: Math.round(chargePointKm * 10) / 10 },
      suggested_stations: stations,
      estimated_arrival: estimatedArrival,
    });
  } catch (error) {
    console.error('Trip plan error:', error);
    return res.status(500).json({ message: 'Server error computing trip plan.' });
  }
});

module.exports = router;
