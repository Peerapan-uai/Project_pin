# Google Maps Integration - Quick Start Guide

## TL;DR

- **Library**: `@react-google-maps/api`
- **Cost**: $7/month base + $0.07-0.35 per search (free tier covers 10K/month)
- **Endpoints Needed**: 8 (not 2)
- **Timeline**: 3 weeks MVP
- **Current Status**: Database ready, needs API endpoints + React component

---

## Step 1: Get Google Maps API Key (5 min)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable: Maps JavaScript API, Places API, Distance Matrix API
4. Create API key (unrestricted or your domain only)
5. Add to `.env.local`:
```
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
REACT_APP_BACKEND_URL=http://localhost:5000/api
```

---

## Step 2: Database Setup (10 min)

Run these SQL commands:

```sql
-- Add spatial index for fast nearby search
ALTER TABLE stations ADD SPATIAL INDEX idx_location (latitude, longitude);

-- Add charger classification
ALTER TABLE chargers ADD COLUMN charger_classification 
  ENUM('DC_FAST', 'AC_SLOW', 'AC_MEDIUM') DEFAULT NULL;

UPDATE chargers SET charger_classification = 'DC_FAST' WHERE power_kw >= 50;
UPDATE chargers SET charger_classification = 'AC_SLOW' WHERE power_kw < 11;
UPDATE chargers SET charger_classification = 'AC_MEDIUM' WHERE power_kw BETWEEN 11 AND 49;

-- Create user location tracking table
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

## Step 3: Install Frontend Package (2 min)

```bash
cd frontend
npm install @react-google-maps/api
```

---

## Step 4: Create Distance Utility (5 min)

Create `backend/utils/distance.js`:

```javascript
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

---

## Step 5: Add Backend Endpoints (30 min)

In `backend/routes/stations.js`, add these endpoints:

### Endpoint 1: GET /api/stations/nearby
```javascript
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 5 } = req.query;
  const { charger_type } = req.query;

  try {
    const query = `
      SELECT s.*,
        COUNT(DISTINCT c.charger_id) AS total_chargers,
        SUM(CASE WHEN c.status = 'available' THEN 1 ELSE 0 END) AS available_chargers,
        ROUND(111 * SQRT(
          POW(s.latitude - ?, 2) + POW(s.longitude - ?, 2) * POW(COS(RADIANS(s.latitude)), 2)
        ), 2) AS distance_km
      FROM stations s
      LEFT JOIN chargers c ON s.station_id = c.station_id
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
        stations: stations.map(s => ({
          id: s.station_id,
          name: s.name,
          address: s.address,
          location: { lat: parseFloat(s.latitude), lng: parseFloat(s.longitude) },
          distance_km: parseFloat(s.distance_km),
          available_chargers: s.available_chargers || 0,
          total_chargers: s.total_chargers || 0
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nearby stations' });
  }
});
```

### Endpoint 2: GET /api/stations/:id/chargers
```javascript
router.get('/:id/chargers', async (req, res) => {
  const { id } = req.params;
  const { status } = req.query;

  try {
    let query = `
      SELECT charger_id, charger_name, connector_type, power_kw, price_per_kwh, status
      FROM chargers
      WHERE station_id = ?
      ${status ? 'AND status = ?' : ''}
    `;

    const params = [id, ...(status ? [status] : [])];
    const [chargers] = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        station_id: parseInt(id),
        chargers: chargers.map(c => ({
          id: c.charger_id,
          name: c.charger_name,
          type: c.connector_type,
          power_kw: parseFloat(c.power_kw),
          price_per_kwh: parseFloat(c.price_per_kwh),
          status: c.status,
          isAvailable: c.status === 'available'
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chargers' });
  }
});
```

### Endpoint 3: POST /api/distances/calculate
```javascript
const { calculateDistance } = require('../utils/distance');

router.post('/distances/calculate', (req, res) => {
  const { origin, destination } = req.body;

  try {
    const distance = calculateDistance(
      origin.lat, origin.lng,
      destination.lat, destination.lng
    );

    res.json({
      success: true,
      data: {
        distance_km: parseFloat(distance.toFixed(2)),
        duration_minutes: Math.round(distance / 50 * 60)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate distance' });
  }
});
```

### Endpoint 4: POST /api/users/:id/location
```javascript
router.post('/:id/location', auth, async (req, res) => {
  const { latitude, longitude } = req.body;

  try {
    const query = `
      INSERT INTO user_locations (user_id, latitude, longitude)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude)
    `;

    await pool.query(query, [req.params.id, latitude, longitude]);
    res.json({ success: true, message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});
```

---

## Step 6: Create React Component (1 hour)

Create `frontend/src/pages/StationsMapPage.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

export default function StationsMapPage() {
  const [userLocation, setUserLocation] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [chargerType, setChargerType] = useState('');
  const [radius, setRadius] = useState(5);
  const [loading, setLoading] = useState(false);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Save to backend
        fetch('/api/users/123/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude })
        });

        // Fetch nearby stations
        fetchNearbyStations(latitude, longitude);
      });
    }
  }, []);

  const fetchNearbyStations = async (lat, lng) => {
    setLoading(true);
    const query = chargerType ? `?lat=${lat}&lng=${lng}&radius=${radius}&charger_type=${chargerType}` 
                              : `?lat=${lat}&lng=${lng}&radius=${radius}`;
    
    const res = await fetch(`/api/stations/nearby${query}`);
    const data = await res.json();
    if (data.success) setStations(data.data.stations);
    setLoading(false);
  };

  const handleSearch = () => {
    if (userLocation) {
      fetchNearbyStations(userLocation.lat, userLocation.lng);
    }
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <div className="flex h-screen gap-4 p-4">
        
        {/* Sidebar */}
        <div className="w-80 bg-white p-6 rounded-lg shadow-lg overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">Find Chargers</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Charger Type</label>
              <select
                value={chargerType}
                onChange={(e) => setChargerType(e.target.value)}
                className="w-full border rounded-lg p-2"
              >
                <option value="">All Types</option>
                <option value="CCS">CCS</option>
                <option value="CHAdeMO">CHAdeMO</option>
                <option value="Type2">Type 2</option>
                <option value="Type1">Type 1</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Radius: {radius}km</label>
              <input
                type="range"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>

            {/* Station List */}
            <div className="space-y-2 mt-6">
              {stations.map((station) => (
                <div
                  key={station.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedStation(station)}
                >
                  <h3 className="font-bold text-sm">{station.name}</h3>
                  <p className="text-xs text-gray-600">{station.distance_km} km away</p>
                  <p className="text-xs">Available: {station.available_chargers}/{station.total_chargers}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 rounded-lg shadow-lg overflow-hidden">
          {userLocation && (
            <GoogleMap
              mapContainerStyle={{ height: '100%', width: '100%' }}
              center={userLocation}
              zoom={13}
            >
              {/* User Location */}
              <Marker
                position={userLocation}
                title="Your Location"
                icon={{
                  path: 'M -1 -1 L -1 1 L 0.5 0.5 L 1 1 L 1 -1 Z',
                  fillColor: '#4285F4',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 2,
                  scale: 7
                }}
              />

              {/* Station Markers */}
              {stations.map((station) => (
                <Marker
                  key={station.id}
                  position={station.location}
                  title={station.name}
                  onClick={() => setSelectedStation(station)}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: station.available_chargers > 0 ? '#34a853' : '#ea4335',
                    fillOpacity: 0.8,
                    scale: 8,
                    strokeColor: '#fff',
                    strokeWeight: 2
                  }}
                />
              ))}

              {/* Info Window */}
              {selectedStation && (
                <InfoWindow
                  position={selectedStation.location}
                  onCloseClick={() => setSelectedStation(null)}
                >
                  <div className="p-4 max-w-xs">
                    <h3 className="font-bold text-lg mb-2">{selectedStation.name}</h3>
                    <p className="text-sm text-gray-700 mb-2">{selectedStation.address}</p>
                    <p className="text-sm mb-3">
                      Available: {selectedStation.available_chargers}/{selectedStation.total_chargers}
                    </p>
                    <button
                      className="w-full bg-green-500 text-white p-2 rounded font-semibold"
                      onClick={() => window.location.href = `/booking/${selectedStation.id}`}
                    >
                      Book Now
                    </button>
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

## Step 7: Add Route to App (2 min)

In `frontend/src/routes/AppRouter.jsx`, add:

```jsx
import StationsMapPage from '../pages/StationsMapPage';

// Inside routes array:
{ path: '/stations/map', element: <StationsMapPage /> }
```

---

## Step 8: Test (10 min)

```bash
# Start backend
cd backend
npm start

# Start frontend
cd frontend
npm start

# Visit http://localhost:3000/stations/map
```

---

## Checklist

- [ ] Created Google Maps API key
- [ ] Added to .env.local
- [ ] Ran database migrations (spatial index, charger_classification, user_locations)
- [ ] Added 4 backend endpoints
- [ ] Installed @react-google-maps/api
- [ ] Created StationsMapPage.jsx component
- [ ] Added route to AppRouter
- [ ] Tested on localhost

---

## Next Steps (Optional)

1. Add distance calculation endpoint
2. Add advanced filtering endpoint
3. Add location autocomplete
4. Add real-time charger status updates
5. Add user favorites feature

---

## Files to Update

- `.env.local` - Add API key
- `backend/utils/distance.js` - NEW
- `backend/routes/stations.js` - Add 4 endpoints
- `frontend/src/pages/StationsMapPage.jsx` - NEW
- `frontend/src/routes/AppRouter.jsx` - Add route
- Database - Run 4 SQL migrations

---

## Support

- Google Maps API Docs: https://developers.google.com/maps
- @react-google-maps/api: https://react-google-maps-api-docs.netlify.app/
- Your research document: `/GOOGLE_MAPS_INTEGRATION_RESEARCH.md`

