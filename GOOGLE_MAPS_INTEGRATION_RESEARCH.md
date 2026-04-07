# Google Maps Integration Research - EV Charging Stations App

**Date**: April 2, 2026  
**Scope**: Frontend setup, API pricing, backend endpoints, database schema, real-world comparisons

---

## Executive Summary

Your planned 2 API endpoints are **insufficient** for a production app. You need **8-10 endpoints minimum** for feature parity with competitors like ChargePoint.

### Key Findings

1. **Library Recommendation**: @react-google-maps/api (latest, EV-specific features)
2. **Pricing**: $7/month base + $0.07-0.35 per Nearby Search (free tier = 10K/month)
3. **Database**: Already has lat/lng, needs spatial index + charger_classification
4. **Endpoints Needed**: 8 must-have, 4 nice-to-have
5. **Timeline**: 3 weeks for MVP with all 8 core endpoints

---

## 1. Frontend Google Maps Setup

### Library Comparison

| Library | Recommendation | Pros | Cons |
|---------|---|---|---|
| **@react-google-maps/api** | ✅ BEST | Latest EV support, TypeScript, React hooks | Requires API key |
| google-maps-react | Alternative | Simpler, isomorphic (SSR) | Older, less maintained |
| leaflet + react-leaflet | Budget-friendly | Lightweight (30KB), free, open-source | No EV features |

### Recommendation: @react-google-maps/api
- Built-in support for EV charging features
- Full TypeScript support
- Hooks: `GoogleMap`, `Marker`, `InfoWindow`
- Latest EV charging data from Places API

---

## 2. API Key & Pricing (2026)

### Free Tier
- 10,000 events/month (Essentials SKU)
- = ~333 events/day = ~14 events/hour
- Covers 1-5 daily active users

### Pricing After Free Tier

| API | Cost | Use Case |
|-----|------|----------|
| Maps JavaScript API | $7/month | Display map |
| Nearby Search | $0.07-0.35/call | Find nearby stations |
| Place Details | $0.035-0.35/call | Station info |
| Distance Matrix | $0.005-0.01/call | Distance between points |

### Cost Optimization
Use **Field Masking** - request only needed fields:
- Basic fields (displayName, location) = $0.07/call
- All fields (reviews, photos, etc.) = $0.35/call

---

## 3. Frontend Features vs API Requirements

| Feature | Frontend | Backend API | Cost |
|---------|----------|-------------|------|
| Display map + pins | Maps JS API | DB only | $7/mo |
| Click pin → info window | Maps JS API | GET /api/stations/:id | $0 |
| Distance display | Haversine (FE) | POST /api/distances | $0 |
| Real-time location | Geolocation API | POST /api/users/:id/location | $0 |
| Filter by type | Client-side | GET /api/stations?charger_type= | $0 |
| Search autocomplete | Place Autocomplete | Optional backend cache | $0.018 |
| Charger availability | Client-side filter | GET /api/stations/:id/chargers | $0 |
| Route planning | Routes API | GET /api/stations/route-plan | $0.05-0.20 |

---

## 4. Database Changes Required

### Current Status ✅
- `stations` table has `latitude`, `longitude`
- `chargers` table has `connector_type` (CCS, CHAdeMO, Type2, Type1)
- Reviews system ready
- Booking system ready

### What to Add

```sql
-- 1. Spatial index for fast nearby search
ALTER TABLE stations ADD SPATIAL INDEX idx_location (latitude, longitude);

-- 2. Charger classification
ALTER TABLE chargers ADD COLUMN charger_classification 
  ENUM('DC_FAST', 'AC_SLOW', 'AC_MEDIUM') DEFAULT NULL;

UPDATE chargers SET charger_classification = 'DC_FAST' WHERE power_kw >= 50;
UPDATE chargers SET charger_classification = 'AC_SLOW' WHERE power_kw < 11;
UPDATE chargers SET charger_classification = 'AC_MEDIUM' WHERE power_kw BETWEEN 11 AND 49;

-- 3. User location tracking
CREATE TABLE user_locations (
  location_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (location_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  SPATIAL INDEX idx_user_location (latitude, longitude)
);
```

---

## 5. Backend API Endpoints (8 Must-Have)

### Current Endpoints
- GET /api/stations - List all
- GET /api/stations/:id/stats - Statistics
- GET /api/bookings - Booking history
- POST /api/bookings - Create booking
- GET /api/chargers - List all chargers
- GET /api/reviews - Reviews
- POST /api/reviews - Post review

### New Endpoints Required

#### 1. GET /api/stations/nearby
```
Query: ?lat=13.7563&lng=100.5018&radius=5&charger_type=CCS
Response: { userLocation, stationsCount, stations[] }
Uses: Haversine formula to calculate distance_km
```

#### 2. GET /api/stations/:id/chargers
```
Query: ?charger_type=CCS&status=available
Response: { station_id, chargers[] }
Filters: By connector_type and status
```

#### 3. POST /api/distances/calculate
```
Body: { origin: {lat, lng}, destination: {lat, lng} }
Response: { distance_km, duration_minutes }
Method: Haversine formula (no Google API needed)
```

#### 4. POST /api/users/:id/location
```
Body: { latitude, longitude }
Response: { success, message }
Saves: Real-time user location to user_locations table
```

#### 5. GET /api/stations/:id
```
Response: { station_id, name, address, location, image, hours, status }
Existing: Should already have this
```

#### 6. GET /api/stations/filter
```
Query: ?charger_type=DC_FAST&min_availability=1&rating_min=4&distance=10
Response: Filtered stations list
Advanced filtering with multiple criteria
```

#### 7. POST /api/locations/search (Optional)
```
Query: ?q=charging+station+BTS
Uses: Google Places Autocomplete or backend search
```

#### 8. GET /api/stations/:id/availability
```
Response: Real-time charger availability status
Real-time: WebSocket or polling updates
```

---

## 6. Code Snippets for Implementation

### Haversine Distance Function
```javascript
// backend/utils/distance.js
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = { calculateDistance };
```

### Updated GET /api/stations/nearby
```javascript
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 5 } = req.query;
  const { charger_type } = req.query;

  const query = `
    SELECT s.*,
      COUNT(DISTINCT c.charger_id) AS total_chargers,
      SUM(CASE WHEN c.status = 'available' THEN 1 ELSE 0 END) AS available_chargers,
      ROUND(AVG(r.rating), 1) AS avg_rating,
      ROUND(111 * SQRT(
        POW(s.latitude - ?, 2) + POW(s.longitude - ?, 2) * POW(COS(RADIANS(s.latitude)), 2)
      ), 2) AS distance_km
    FROM stations s
    LEFT JOIN chargers c ON s.station_id = c.station_id
    LEFT JOIN reviews r ON s.station_id = r.station_id
    WHERE ROUND(111 * SQRT(
      POW(s.latitude - ?, 2) + POW(s.longitude - ?, 2) * POW(COS(RADIANS(s.latitude)), 2)
    ), 2) <= ?
      AND s.status = 'active'
      ${charger_type ? 'AND c.connector_type = ?' : ''}
    GROUP BY s.station_id
    ORDER BY distance_km ASC
    LIMIT 50
  `;

  const params = [lat, lng, lat, lng, radius, ...(charger_type ? [charger_type] : [])];
  const [stations] = await pool.query(query, params);

  res.json({
    success: true,
    data: {
      userLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
      stationsCount: stations.length,
      stations: stations.map(s => ({
        id: s.station_id,
        name: s.name,
        address: s.address,
        location: { lat: parseFloat(s.latitude), lng: parseFloat(s.longitude) },
        distance_km: parseFloat(s.distance_km),
        available_chargers: s.available_chargers || 0,
        total_chargers: s.total_chargers || 0,
        avg_rating: s.avg_rating || 0
      }))
    }
  });
});
```

### React Component (Basic)
```jsx
import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

export default function StationsMapPage() {
  const [userLocation, setUserLocation] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [chargerType, setChargerType] = useState('');
  const [radius, setRadius] = useState(5);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchNearbyStations(latitude, longitude);
      });
    }
  }, []);

  const fetchNearbyStations = async (lat, lng) => {
    const params = new URLSearchParams({ lat, lng, radius });
    if (chargerType) params.append('charger_type', chargerType);
    
    const res = await fetch(`/api/stations/nearby?${params}`);
    const data = await res.json();
    setStations(data.data.stations);
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <div className="flex h-screen">
        {/* Sidebar with filters */}
        <div className="w-80 p-6 bg-white shadow-lg overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">Find Chargers</h2>
          <select
            value={chargerType}
            onChange={(e) => setChargerType(e.target.value)}
            className="w-full border rounded p-2 mb-4"
          >
            <option value="">All Types</option>
            <option value="CCS">CCS</option>
            <option value="CHAdeMO">CHAdeMO</option>
            <option value="Type2">Type 2</option>
          </select>
          <input
            type="range"
            min="1"
            max="50"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full mb-4"
          />
          <button
            onClick={() => userLocation && fetchNearbyStations(userLocation.lat, userLocation.lng)}
            className="w-full bg-blue-500 text-white p-2 rounded"
          >
            Search
          </button>
          {/* Station list */}
        </div>

        {/* Map */}
        <div className="flex-1">
          {userLocation && (
            <GoogleMap
              mapContainerStyle={{ height: '100%', width: '100%' }}
              center={userLocation}
              zoom={13}
            >
              <Marker position={userLocation} title="Your Location" />
              {stations.map((station) => (
                <Marker
                  key={station.id}
                  position={station.location}
                  onClick={() => setSelectedStation(station)}
                />
              ))}
              {selectedStation && (
                <InfoWindow
                  position={selectedStation.location}
                  onCloseClick={() => setSelectedStation(null)}
                >
                  <div className="p-4">
                    <h3 className="font-bold">{selectedStation.name}</h3>
                    <p className="text-sm">{selectedStation.distance_km} km away</p>
                    <p className="text-sm">
                      Available: {selectedStation.available_chargers}/{selectedStation.total_chargers}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>
      </div>
    </LoadScript>
  );
}
```

---

## 7. Real-World App Comparison

### ChargePoint (US Leader)
- APIs: ~12 endpoints
- Features: Real-time availability, reservations, ratings, history
- Charger status: Green (available) / Blue (in use) / Gray (unknown)
- Cost: $4-10K/month at scale

### Your App vs Competitors

| Feature | Your App | ChargePoint | Tesla | PlugShare |
|---------|----------|------------|-------|-----------|
| Show nearby on map | Planned | ✅ | ✅ | ✅ |
| Real-time availability | Partial | ✅ | ✅ | Community |
| Distance calculation | Optional | ✅ | ✅ | ✅ |
| Charger filtering | Ready | ✅ | ✅ | ✅ |
| Bookings | ✅ | ✅ | ✅ | ❌ |
| Ratings/Reviews | ✅ | ✅ | ❌ | ✅ |
| User location tracking | Can add | ✅ | ✅ | ✅ |
| Route planning | Not yet | ✅ | ✅ | ✅ |

---

## 8. Implementation Roadmap

### Week 1: Core Map
- Add spatial index to stations table
- Update GET /api/stations/nearby with Haversine
- Add GET /api/stations/:id/chargers endpoint
- Install @react-google-maps/api
- Build basic map component with pins

### Week 2: Filtering & Details
- Add distance calculation API
- Add advanced filtering endpoint
- Build filter sidebar UI
- Add info window with charger details
- Real-time search

### Week 3: Enhancements
- Add location autocomplete
- Real-time charger status updates
- User favorites/saved locations
- Trip history display
- Admin dashboard updates

---

## 9. Cost Estimation

| Users | Maps Cost | Notes |
|-------|-----------|-------|
| 1-1K | $7-30 | Free tier only |
| 1K-10K | $30-100 | Some Nearby Search calls |
| 10K-100K | $100-500 | Significant usage |
| 100K+ | $500-5K | Enterprise negotiation needed |

---

## 10. Recommended NPM Packages

```bash
# Frontend
npm install @react-google-maps/api
npm install @react-google-maps/marker-clusterer
npm install use-places-autocomplete

# Backend (optional)
npm install haversine
npm install geolib
```

---

## Key Takeaways

1. **2 endpoints are NOT enough** - You need minimum 8 for good UX
2. **Database is ready** - Just add spatial index + charger_classification
3. **Use @react-google-maps/api** - Best library for EV charging integration
4. **Cost is manageable** - $7-50/month until you scale to 100K+ users
5. **Timeline is realistic** - 3 weeks for full MVP implementation
6. **Distance calculation is free** - Use Haversine, no Google API needed

---

## References

- [Google Maps Platform Pricing 2026](https://developers.google.com/maps/billing-and-pricing/pricing)
- [@react-google-maps/api Documentation](https://react-google-maps-api-docs.netlify.app/)
- [EV Charging App Development 2026](https://stormotion.io/blog/how-to-make-an-ev-charging-station-app/)
- [Google Places API EV Features](https://mapsplatform.google.com/resources/blog/introducing-the-new-places-api-with-access-to-new-ev-accessibility-features-and-more/)
- [Haversine Formula for Distance Calculation](https://github.com/njj/haversine)
- [ChargePoint EV Network](https://driver.chargepoint.com/)

