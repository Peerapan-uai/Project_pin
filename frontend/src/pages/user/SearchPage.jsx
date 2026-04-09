import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  FaSearch, FaMapMarkerAlt, FaStar, FaBolt,
  FaClock, FaTimes, FaLocationArrow, FaChevronUp, FaDirections,
  FaArrowLeft, FaArrowRight, FaArrowUp, FaTimesCircle,
} from 'react-icons/fa'
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api'
import BottomNav from '../../components/BottomNav'
import api from '../../utils/api'
import { useGeolocation } from '../../hooks/useGeolocation'
import { formatDistance } from '../../utils/formatDistance'

// ─── constants ────────────────────────────────────────────────────────────────
const BANGKOK       = { lat: 13.7563, lng: 100.5018 }
const CONNECTOR_TYPES = ['ทั้งหมด', 'CCS', 'CHAdeMO', 'Type2', 'Type1']

const SNAP = {
  peek: 120,
  half: Math.round(window.innerHeight * 0.46),
  full: Math.round(window.innerHeight * 0.84),
}

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  gestureHandling: 'greedy',
  styles: [
    { featureType: 'poi',     stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ],
}

// ─── distance (Haversine) ────────────────────────────────────────────────────
function calcDistKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}


// ─── helpers ──────────────────────────────────────────────────────────────────
function pinSvg(available, selected = false) {
  const c  = available ? '#22c55e' : '#ef4444'
  const bg = available ? '#dcfce7' : '#fee2e2'
  const w  = selected ? 46 : 38
  const h  = selected ? 56 : 46
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 46 56">
    <filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.25"/></filter>
    <path d="M23 2C14.7 2 8 8.7 8 17c0 10.5 15 35 15 35S38 27.5 38 17C38 8.7 31.3 2 23 2z"
          fill="${c}" stroke="white" stroke-width="2" filter="url(#s)"/>
    <circle cx="23" cy="17" r="9" fill="${bg}"/>
    <text x="23" y="21.5" text-anchor="middle" font-size="11" font-weight="bold"
          fill="${c}" font-family="Arial,sans-serif">⚡</text>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const USER_DOT = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#4285F4" fill-opacity="0.18"/>
    <circle cx="12" cy="12" r="5.5" fill="#4285F4" stroke="white" stroke-width="2"/>
  </svg>`
)}`

// ─── component ────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [stations,         setStations]         = useState([])
  const [loading,          setLoading]          = useState(true)
  const [search,           setSearch]           = useState('')
  const [selectedConn,     setSelectedConn]     = useState('ทั้งหมด')
  const [onlyAvail,        setOnlyAvail]        = useState(false)
  const [nearbyMode,       setNearbyMode]       = useState(false)
  const [activeMarker,     setActiveMarker]     = useState(null)

  // navigation
  const [navTarget,        setNavTarget]        = useState(null)
  const [directions,       setDirections]       = useState(null)
  const [navStepIdx,       setNavStepIdx]       = useState(0)
  const [navUserPos,       setNavUserPos]       = useState(null)
  const [selectedRouteIdx,  setSelectedRouteIdx]  = useState(0)
  const [isFollowing,       setIsFollowing]       = useState(true)
  const [arrived,           setArrived]           = useState(false)
  const [navStepsExpanded,  setNavStepsExpanded]  = useState(false) // bottom strip ขยาย/ยุบ
  const watchIdRef    = useRef(null)
  const followingRef  = useRef(true)
  const stepListRef   = useRef(null)   // ref สำหรับ scroll container ของ steps

  // bottom-sheet drag
  const [sheetH,    setSheetH]    = useState(SNAP.peek)
  const [dragging,  setDragging]  = useState(false)
  const startY = useRef(0)
  const startH = useRef(0)

  const mapRef      = useRef(null)
  const rendererRef = useRef(null)
  const abortRef    = useRef(null)
  const geo      = useGeolocation()

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  })

  // ── data loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/api/stations')
      .then(r => setStations(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ถ้ามาจาก StationDetailPage พร้อม navigateTo → trigger navigation อัตโนมัติ
  const autoNavDoneRef = useRef(false)
  const pendingNavRef  = useRef(null)  // เก็บ target รอ map onLoad

  useEffect(() => {
    const target = location.state?.navigateTo
    if (!target || autoNavDoneRef.current) return
    pendingNavRef.current = target  // เก็บไว้รอ map ready
    // ถ้า map พร้อมแล้ว (isLoaded + mapRef set) → ยิงเลย
    if (isLoaded && mapRef.current) {
      autoNavDoneRef.current = true
      pendingNavRef.current = null
      startNav(target)
    }
  }, [isLoaded, location.state]) // eslint-disable-line

  // เมื่อ GPS พร้อมครั้งแรก → pan map ไปตำแหน่งผู้ใช้ทันที
  const gpsPannedRef = useRef(false)
  useEffect(() => {
    if (!geo.loading && geo.coords && !gpsPannedRef.current) {
      gpsPannedRef.current = true
      mapRef.current?.panTo({ lat: geo.coords.latitude, lng: geo.coords.longitude })
      mapRef.current?.setZoom(14)
    }
  }, [geo.loading, geo.coords])

  // inject distance_km ให้ทุกสถานีเมื่อ GPS พร้อม
  useEffect(() => {
    if (!geo.loading && geo.coords && stations.length > 0) {
      const { latitude: uLat, longitude: uLng } = geo.coords
      setStations(prev => prev.map(s => ({
        ...s,
        distance_km: s.latitude && s.longitude
          ? parseFloat(calcDistKm(uLat, uLng, parseFloat(s.latitude), parseFloat(s.longitude)).toFixed(2))
          : null,
      })))
    }
  }, [geo.loading, geo.coords, stations.length]) // eslint-disable-line

  function fetchNearby(lat, lng) {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    setNearbyMode(true)
    // radius 200 = แสดงทุกสถานีในประเทศ แล้ว sort โดย distance_km
    api.get('/api/stations/nearby', { params: { lat, lng, radius: 200 }, signal: ctrl.signal })
      .then(r => setStations(Array.isArray(r.data) ? r.data : []))
      .catch(err => { if (err.name !== 'CanceledError' && err.name !== 'AbortError') {} })
      .finally(() => setLoading(false))
  }

  function switchToAll() {
    if (abortRef.current) abortRef.current.abort()
    setNearbyMode(false)
    setLoading(true)
    api.get('/api/stations')
      .then(r => {
        const { latitude: uLat, longitude: uLng } = geo.coords || {}
        setStations((Array.isArray(r.data) ? r.data : []).map(s => ({
          ...s,
          distance_km: uLat && s.latitude
            ? parseFloat(calcDistKm(uLat, uLng, parseFloat(s.latitude), parseFloat(s.longitude)).toFixed(2))
            : s.distance_km ?? null,
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  // ── filter ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    stations.filter(s => {
      const q    = search.toLowerCase()
      const hit  = s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
      const conn = s.connector_types ? s.connector_types.split(',') : []
      return hit && (selectedConn === 'ทั้งหมด' || conn.includes(selectedConn)) &&
             (!onlyAvail || s.available_chargers > 0)
    }).sort((a, b) => {
      if (a.distance_km == null) return 1
      if (b.distance_km == null) return -1
      return a.distance_km - b.distance_km
    }),
  [stations, search, selectedConn, onlyAvail])

  // ── map helpers ─────────────────────────────────────────────────────────────
  const mapCenter = geo.coords
    ? { lat: geo.coords.latitude, lng: geo.coords.longitude }
    : BANGKOK

  const handleMarkerClick = useCallback((st) => {
    setActiveMarker(st.station_id)
    if (mapRef.current && st.latitude && st.longitude) {
      mapRef.current.panTo({ lat: parseFloat(st.latitude), lng: parseFloat(st.longitude) })
      mapRef.current.setZoom(15)
    }
    setSheetH(SNAP.peek)
  }, [])

  const locateMe = () => {
    if (nearbyMode) { switchToAll(); return }
    const doLocate = (lat, lng) => {
      fetchNearby(lat, lng)
      mapRef.current?.panTo({ lat, lng })
      mapRef.current?.setZoom(14)
    }
    if (geo.coords) {
      doLocate(geo.coords.latitude, geo.coords.longitude)
    } else {
      navigator.geolocation?.getCurrentPosition(
        (pos) => doLocate(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      )
    }
  }

  // ref เก็บ directions ล่าสุด ไม่ให้ stale closure ใน watchPosition
  const directionsRef = useRef(null)
  const navTargetRef  = useRef(null)   // ref ของ navTarget สำหรับ re-route
  const rerouteTimer  = useRef(null)   // debounce re-route

  // helper: คำนวณระยะห่างจากจุด p ไปยังเส้นทางที่ใกล้ที่สุด (เมตร)
  function distToRoute(p, dir) {
    const steps = dir.routes[0].legs[0].steps
    let minD = Infinity
    for (const step of steps) {
      const d = calcDistKm(p.lat, p.lng, step.start_location.lat(), step.start_location.lng()) * 1000
      if (d < minD) minD = d
    }
    return minD
  }

  // ── in-app navigation ───────────────────────────────────────────────────────

  // เริ่ม watchPosition + นำทางด้วย result + routeIdx ที่เลือก
  const beginNav = useCallback((st, fullResult, routeIdx = 0) => {
    navTargetRef.current = st
    setNavTarget(st)
    setSelectedRouteIdx(routeIdx)
    setArrived(false)
    setNavStepsExpanded(false)
    followingRef.current = true
    setIsFollowing(true)
    directionsRef.current = fullResult
    setDirections(fullResult)
    setNavStepIdx(0)
    setActiveMarker(null)
    mapRef.current?.fitBounds(fullResult.routes[routeIdx].bounds)

    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setNavUserPos(p)

        // camera follow
        if (followingRef.current) mapRef.current?.panTo(p)

        const dir = directionsRef.current
        if (!dir) return

        const route = dir.routes[0]
        const steps = route.legs[0].steps
        const dest  = route.legs[0].end_location

        // advance step
        setNavStepIdx(prev => {
          if (prev >= steps.length - 1) return prev
          const next = steps[prev + 1].start_location
          const d = calcDistKm(p.lat, p.lng, next.lat(), next.lng()) * 1000
          return d < 40 ? prev + 1 : prev
        })

        // arrival detection: ถึงปลายทาง < 50 เมตร
        const distToDest = calcDistKm(p.lat, p.lng, dest.lat(), dest.lng()) * 1000
        if (distToDest < 50) { setArrived(true); return }

        // re-route ถ้าออกนอกเส้นทางเกิน 80 เมตร (debounce 3 วินาที)
        const offDist = distToRoute(p, dir)
        if (offDist > 80) {
          if (rerouteTimer.current) return
          rerouteTimer.current = setTimeout(() => {
            rerouteTimer.current = null
            const dest2 = navTargetRef.current
            if (!dest2) return
            new window.google.maps.DirectionsService().route(
              {
                origin: p,
                destination: { lat: parseFloat(dest2.latitude), lng: parseFloat(dest2.longitude) },
                travelMode: window.google.maps.TravelMode.DRIVING,
              },
              (res, st) => {
                if (!navTargetRef.current) return
                if (st === 'OK') { directionsRef.current = res; setDirections(res); setNavStepIdx(0) }
              }
            )
          }, 3000)
        } else {
          if (rerouteTimer.current) { clearTimeout(rerouteTimer.current); rerouteTimer.current = null }
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000 }
    )
  }, []) // eslint-disable-line

  // กดนำทาง → เริ่มทันทีด้วยเส้นทางเร็วสุด ไม่มี selection panel
  const startNav = useCallback((st) => {
    if (!isLoaded) return
    const destination = { lat: parseFloat(st.latitude), lng: parseFloat(st.longitude) }
    setActiveMarker(null)

    navTargetRef.current = st
    setNavTarget(st)
    setNavStepIdx(0)
    setArrived(false)
    setNavStepsExpanded(false)
    followingRef.current = true
    setIsFollowing(true)

    const doRoute = (origin) => {
      new window.google.maps.DirectionsService().route(
        { origin, destination, travelMode: window.google.maps.TravelMode.DRIVING },
        (result, status) => {
          if (!navTargetRef.current) return  // ยกเลิกไปแล้วก่อน API ตอบกลับ
          if (status === 'OK') {
            beginNav(st, result, 0)
          } else {
            alert(`ไม่สามารถหาเส้นทางได้: ${status}`)
            setNavTarget(null)
            navTargetRef.current = null
          }
        }
      )
    }

    // ดึง GPS สดๆ ตอนกดนำทาง ไม่ใช้ค่าเก่าจาก state
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => doRoute({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => doRoute(geo.coords
          ? { lat: geo.coords.latitude, lng: geo.coords.longitude }
          : BANGKOK),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )
    } else {
      doRoute(geo.coords
        ? { lat: geo.coords.latitude, lng: geo.coords.longitude }
        : BANGKOK)
    }
  }, [isLoaded, geo.coords, beginNav]) // eslint-disable-line


  const stopNav = useCallback(() => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
    watchIdRef.current = null
    if (rerouteTimer.current) { clearTimeout(rerouteTimer.current); rerouteTimer.current = null }
    rendererRef.current?.setMap(null)
    rendererRef.current   = null
    directionsRef.current = null
    navTargetRef.current  = null
    followingRef.current  = true
    setNavTarget(null)
    setDirections(null)
    setNavStepIdx(0)
    setNavUserPos(null)
    setSelectedRouteIdx(0)
    setIsFollowing(true)
    setArrived(false)
    setNavStepsExpanded(false)
  }, [])

  // จัดการ DirectionsRenderer โดยตรง (ไม่ใช้ React component เพื่อหลีกเลี่ยง cleanup bug)
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return
    if (directions) {
      if (!rendererRef.current) {
        rendererRef.current = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: { strokeColor: '#4285F4', strokeWeight: 5, strokeOpacity: 0.85 },
        })
        rendererRef.current.setMap(mapRef.current)
      }
      rendererRef.current.setDirections(directions)
      rendererRef.current.setRouteIndex(selectedRouteIdx)
    } else {
      rendererRef.current?.setMap(null)
      rendererRef.current = null
    }
  }, [directions, selectedRouteIdx, isLoaded])

  // cleanup GPS watch + renderer + markers เมื่อ component unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
      if (rerouteTimer.current) clearTimeout(rerouteTimer.current)
      rendererRef.current?.setMap(null)
      Object.values(stationMarkersRef.current).forEach(m => m.setMap(null))
      stationMarkersRef.current = {}
    }
  }, [])

  // auto-scroll steps list ไปที่ step ปัจจุบัน
  useEffect(() => {
    if (!stepListRef.current) return
    const el = stepListRef.current.querySelector(`[data-step="${navStepIdx}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [navStepIdx])

  // ── nav helpers ─────────────────────────────────────────────────────────────
  const navLeg    = directions?.routes?.[0]?.legs?.[0]
  const navSteps  = navLeg?.steps ?? []
  const curStep   = navSteps[navStepIdx]
  const stripHtml = (s) => s?.replace(/<[^>]+>/g, '') ?? ''

  function turnIcon(maneuver) {
    if (!maneuver) return <FaArrowUp size={22} />
    if (maneuver.includes('left'))  return <FaArrowLeft size={22} />
    if (maneuver.includes('right')) return <FaArrowRight size={22} />
    return <FaArrowUp size={22} />
  }

  // ── bottom sheet drag ───────────────────────────────────────────────────────
  const onDragStart = (clientY) => {
    setDragging(true)
    startY.current = clientY
    startH.current = sheetH
  }

  const onDragMove = useCallback((clientY) => {
    if (!dragging) return
    const next = Math.max(SNAP.peek, Math.min(SNAP.full, startH.current + (startY.current - clientY)))
    setSheetH(next)
  }, [dragging])

  const onDragEnd = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    const snaps  = [SNAP.peek, SNAP.half, SNAP.full]
    const nearest = snaps.reduce((a, b) => Math.abs(b - sheetH) < Math.abs(a - sheetH) ? b : a)
    setSheetH(nearest)
  }, [dragging, sheetH])

  useEffect(() => {
    if (!dragging) return
    const mm = (e) => onDragMove(e.clientY)
    const tm = (e) => onDragMove(e.touches[0].clientY)
    window.addEventListener('mousemove', mm)
    window.addEventListener('touchmove', tm, { passive: true })
    window.addEventListener('mouseup',   onDragEnd)
    window.addEventListener('touchend',  onDragEnd)
    return () => {
      window.removeEventListener('mousemove', mm)
      window.removeEventListener('touchmove', tm)
      window.removeEventListener('mouseup',   onDragEnd)
      window.removeEventListener('touchend',  onDragEnd)
    }
  }, [dragging, onDragMove, onDragEnd])

  const isExpanded = sheetH >= SNAP.half

  // ── imperative station markers (หลีกเลี่ยง bug ของ <Marker> component) ────
  const stationMarkersRef = useRef({})

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return
    const map = mapRef.current
    const existing = stationMarkersRef.current
    const currentIds = new Set(filtered.map(st => st.station_id))

    // ลบ markers ที่ไม่อยู่ใน filtered แล้ว
    Object.keys(existing).forEach(id => {
      if (!currentIds.has(Number(id))) {
        existing[id].setMap(null)
        delete existing[id]
      }
    })

    // สร้างหรืออัพเดท markers
    filtered.forEach(st => {
      if (!st.latitude || !st.longitude) return
      const pos = { lat: parseFloat(st.latitude), lng: parseFloat(st.longitude) }
      const sel = activeMarker === st.station_id
      const avail = st.available_chargers > 0
      const icon = {
        url: pinSvg(avail, sel),
        scaledSize: new window.google.maps.Size(sel ? 46 : 38, sel ? 56 : 46),
        anchor: new window.google.maps.Point(sel ? 23 : 19, sel ? 56 : 46),
      }

      if (existing[st.station_id]) {
        existing[st.station_id].setPosition(pos)
        existing[st.station_id].setIcon(icon)
        existing[st.station_id].setZIndex(sel ? 5 : 1)
      } else {
        const marker = new window.google.maps.Marker({
          position: pos,
          map,
          icon,
          zIndex: sel ? 5 : 1,
        })
        marker.addListener('click', () => handleMarkerClick(st))
        existing[st.station_id] = marker
      }
    })
  }, [filtered, activeMarker, isLoaded, handleMarkerClick])

  // ── active station (for InfoWindow) ────────────────────────────────────────
  const activeSt = activeMarker ? filtered.find(s => s.station_id === activeMarker) : null

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>

      {/* ── Map area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Google Map */}
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            defaultCenter={mapCenter}
            defaultZoom={12}
            options={MAP_OPTIONS}
            onLoad={m => {
              mapRef.current = m
              // ถ้ามี pending nav (มาจาก StationDetailPage) → ยิงตอนนี้เลย
              if (pendingNavRef.current && !autoNavDoneRef.current) {
                autoNavDoneRef.current = true
                const t = pendingNavRef.current
                pendingNavRef.current = null
                startNav(t)
              }
            }}
            onClick={() => setActiveMarker(null)}
            onDragStart={() => { followingRef.current = false; setIsFollowing(false) }}
          >
            {/* user dot */}
            {geo.coords && (
              <Marker
                position={{ lat: geo.coords.latitude, lng: geo.coords.longitude }}
                icon={{ url: USER_DOT, scaledSize: new window.google.maps.Size(28, 28) }}
                zIndex={10}
              />
            )}

            {/* station pins: จัดการผ่าน useEffect + stationMarkersRef โดยตรง */}

            {/* InfoWindow */}
            {activeSt?.latitude && activeSt?.longitude && (
              <InfoWindow
                position={{ lat: parseFloat(activeSt.latitude), lng: parseFloat(activeSt.longitude) }}
                onCloseClick={() => setActiveMarker(null)}
                options={{ pixelOffset: new window.google.maps.Size(0, -52) }}
              >
                <div style={{ minWidth: 170, fontFamily: 'ui-sans-serif,system-ui,sans-serif', padding: '2px 0' }}>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: '#111827' }}>{activeSt.name}</p>
                  <p style={{ color: '#9ca3af', fontSize: 11, marginBottom: 6 }}>{activeSt.address}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: activeSt.available_chargers > 0 ? '#16a34a' : '#dc2626' }}>
                      ⚡ {activeSt.available_chargers}/{activeSt.total_chargers} ว่าง
                    </span>
                    {activeSt.distance_km != null && (
                      <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 500 }}>
                        {formatDistance(activeSt.distance_km)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button
                      onClick={() => navigate(`/stations/${activeSt.station_id}`)}
                      style={{ flex: 1, padding: '7px 0', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      ดูสถานี
                    </button>
                    <button
                      onClick={() => { startNav(activeSt); setActiveMarker(null) }}
                      style={{ flex: 1, padding: '7px 0', background: '#4285F4', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      นำทาง
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}

            {/* route line: จัดการผ่าน useEffect + rendererRef โดยตรง */}

            {/* real-time user dot ระหว่าง nav */}
            {navUserPos && (
              <Marker
                position={navUserPos}
                icon={{ url: USER_DOT, scaledSize: new window.google.maps.Size(32, 32) }}
                zIndex={20}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Floating search bar ────────────────────────────────────── */}
        <div className="absolute top-3 left-3 right-3 z-10 space-y-2 pointer-events-none">

          {/* Search row — ซ่อนระหว่างนำทาง */}
          {!navTarget && (
            <div className="flex gap-2 pointer-events-auto">
              <div className="relative flex-1">
                <FaSearch size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ค้นหาสถานี EV..."
                  className="w-full pl-9 pr-9 py-2.5 bg-white rounded-2xl text-sm shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaTimes size={12} />
                  </button>
                )}
              </div>

              {/* Locate me */}
              <button
                onClick={locateMe}
                title={nearbyMode ? 'แสดงทั้งหมด' : 'ค้นหาใกล้ฉัน'}
                className={`pointer-events-auto w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                  nearbyMode ? 'bg-primary text-white' : 'bg-white text-gray-600'
                }`}
              >
                <FaLocationArrow size={14} />
              </button>
            </div>
          )}

          {/* Filter chips — ซ่อนระหว่างนำทาง */}
          {!navTarget && <div className="flex gap-2 overflow-x-auto scrollbar-hide pointer-events-auto">
            {CONNECTOR_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setSelectedConn(t)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold shadow transition-all active:scale-95 ${
                  selectedConn === t ? 'bg-primary text-white' : 'bg-white text-gray-600'
                }`}
              >
                {t}
              </button>
            ))}
            <button
              onClick={() => setOnlyAvail(v => !v)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold shadow transition-all active:scale-95 ${
                onlyAvail ? 'bg-green-500 text-white' : 'bg-white text-gray-600'
              }`}
            >
              ว่างเท่านั้น
            </button>
          </div>}
        </div>

        {/* ── Zoom + Re-center buttons ────────────────────────────────── */}
        <div
          className="absolute right-3 z-10 flex flex-col gap-2 transition-all duration-300"
          style={{ bottom: (navTarget && navLeg ? 76 : !navTarget ? sheetH : 80) + 16 }}
        >
          {/* re-center: ขึ้นเฉพาะตอนนำทางแล้ว user pan ออกไป */}
          {navTarget && !isFollowing && (
            <button
              onClick={() => {
                followingRef.current = true
                setIsFollowing(true)
                if (navUserPos) mapRef.current?.panTo(navUserPos)
              }}
              className="w-11 h-11 bg-blue-500 rounded-xl shadow-lg flex items-center justify-center text-white active:scale-95 transition-all"
              title="กลับมาติดตามตำแหน่ง"
            >
              <FaLocationArrow size={14} />
            </button>
          )}
          <button
            onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 12) + 1)}
            className="w-11 h-11 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-700 font-light text-xl leading-none active:scale-95"
          >+</button>
          <button
            onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 12) - 1)}
            className="w-11 h-11 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-700 font-light text-xl leading-none active:scale-95"
          >−</button>
        </div>

        {/* ── Arrived Banner ─────────────────────────────────────────── */}
        {arrived && navTarget && (
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-green-500 rounded-t-3xl shadow-2xl px-6 py-6 flex flex-col items-center gap-3">
            <div className="text-4xl">🎉</div>
            <p className="text-white font-bold text-lg text-center">ถึง {navTarget.name} แล้ว!</p>
            <div className="flex gap-3 w-full mt-1">
              <button
                onClick={() => navigate(`/stations/${navTarget.station_id}`)}
                className="flex-1 py-3 bg-white text-green-600 font-bold rounded-2xl text-sm active:scale-95 transition-all"
              >
                ดูสถานี
              </button>
              <button
                onClick={stopNav}
                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-2xl text-sm active:scale-95 transition-all"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        )}


        {/* ── TOP Instruction Bar (ระหว่างนำทาง) ───────────────────── */}
        {navTarget && !arrived && (
          <div className="absolute top-0 left-0 right-0 z-20 bg-blue-600 shadow-lg"
               style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                {navLeg ? turnIcon(curStep?.maneuver) : (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {navLeg ? (
                  <>
                    <p className="text-white font-bold text-base leading-tight">
                      {stripHtml(curStep?.instructions) || 'มุ่งหน้าไป...'}
                    </p>
                    <p className="text-blue-200 text-xs mt-0.5">{curStep?.distance?.text}</p>
                  </>
                ) : (
                  <p className="text-white font-semibold text-sm">กำลังคำนวณเส้นทาง...</p>
                )}
              </div>
              <button
                onClick={stopNav}
                className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white flex-shrink-0 active:bg-white/40"
              >
                <FaTimesCircle size={18} />
              </button>
            </div>
          </div>
        )}


        {/* ── BOTTOM ETA Strip (ระหว่างนำทาง) ──────────────────────── */}
        {navTarget && !arrived && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-white shadow-2xl rounded-t-3xl overflow-hidden"
               style={{
                 transform: navLeg ? 'translateY(0)' : 'translateY(100%)',
                 transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
               }}>
            {/* tap area: toggle expand */}
            <div
              role="button"
              className="w-full flex items-center justify-between px-5 py-3 active:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setNavStepsExpanded(v => !v)}
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-lg font-bold text-gray-900 leading-none">{navLeg?.duration?.text ?? '...'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{navLeg?.distance?.text} · {navTarget?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FaChevronUp size={12} className={`text-gray-400 transition-transform duration-200 ${navStepsExpanded ? '' : 'rotate-180'}`} />
              </div>
            </div>

            {/* expanded: steps list */}
            {navStepsExpanded && (
              <div ref={stepListRef} className="overflow-y-auto border-t border-gray-100" style={{ maxHeight: '38vh' }}>
                {navSteps.map((step, i) => (
                  <div
                    key={i}
                    data-step={i}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 ${i === navStepIdx ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${i === navStepIdx ? 'bg-blue-600 text-white' : i < navStepIdx ? 'bg-gray-200 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                      <span className="text-xs font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${i === navStepIdx ? 'font-semibold text-blue-700' : i < navStepIdx ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {stripHtml(step.instructions)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{step.distance?.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Bottom Sheet ───────────────────────────────────────────── */}
        {<div
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-10 flex flex-col overflow-hidden"
          style={{
            height: sheetH,
            transition: dragging ? 'none' : 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1), transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
            transform: navTarget ? 'translateY(100%)' : 'translateY(0)',
          }}
        >
          {/* drag handle + header */}
          <div
            className="flex-shrink-0 pt-3 pb-2 cursor-grab active:cursor-grabbing select-none touch-none"
            onMouseDown={e => onDragStart(e.clientY)}
            onTouchStart={e => onDragStart(e.touches[0].clientY)}
          >
            <div className="flex justify-center mb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4">
              <p className="text-sm font-semibold text-gray-800">
                {loading
                  ? 'กำลังโหลด...'
                  : nearbyMode
                  ? `สถานีใกล้คุณ · ${filtered.length} แห่ง`
                  : `สถานีทั้งหมด · ${filtered.length} แห่ง`}
              </p>
              <button
                onClick={() => setSheetH(isExpanded ? SNAP.peek : SNAP.full)}
                className="p-1 text-gray-400 active:text-gray-600"
              >
                <FaChevronUp
                  size={14}
                  className={`transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`}
                />
              </button>
            </div>
          </div>

          {/* scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
            {!isExpanded ? (
              /* ── horizontal cards (peek) ── */
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 px-4 pb-4 pt-1" style={{ width: 'max-content' }}>
                  {loading && (
                    <div className="w-64 h-24 bg-gray-50 rounded-2xl animate-pulse" />
                  )}
                  {!loading && filtered.map(st => (
                    <div
                      key={st.station_id}
                      onClick={() => handleMarkerClick(st)}
                      className={`flex-shrink-0 w-64 bg-white rounded-2xl p-3.5 text-left border-2 transition-all shadow-sm active:scale-[0.98] cursor-pointer ${
                        activeMarker === st.station_id
                          ? 'border-primary shadow-md shadow-green-100'
                          : 'border-transparent shadow-sm'
                      }`}
                      style={{ boxShadow: activeMarker === st.station_id ? undefined : '0 2px 12px rgba(0,0,0,0.08)' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate flex-1">{st.name}</p>
                        <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                          st.available_chargers > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {st.available_chargers > 0 ? 'ว่าง' : 'เต็ม'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{st.address}</p>
                      <div className="flex items-center gap-3 mt-2.5">
                        {st.distance_km != null && (
                          <span className="flex items-center gap-1 text-xs text-primary font-semibold">
                            <FaLocationArrow size={9} />{formatDistance(st.distance_km)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                          <FaStar size={9} />{st.rating ?? 0}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <FaBolt size={9} className="text-primary" />{st.available_chargers}/{st.total_chargers}
                        </span>
                      </div>
                      {st.latitude && st.longitude && (
                        <button
                          onClick={e => { e.stopPropagation(); startNav(st) }}
                          className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors"
                        >
                          <FaDirections size={11} /> นำทาง
                        </button>
                      )}
                    </div>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <div className="w-72 py-6 text-center text-gray-400 text-sm">ไม่พบสถานี</div>
                  )}
                </div>
              </div>
            ) : (
              /* ── full vertical list (expanded) ── */
              <div className="px-4 pb-6 space-y-3 pt-1">
                {loading && [1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />
                ))}
                {!loading && filtered.map(st => (
                  <div
                    key={st.station_id}
                    onClick={() => navigate(`/stations/${st.station_id}`)}
                    className="w-full bg-white rounded-2xl p-4 text-left border border-gray-100 hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98] cursor-pointer"
                    style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{st.name}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          <FaMapMarkerAlt size={10} className="text-gray-400 flex-shrink-0" />
                          <p className="text-xs text-gray-500 truncate">{st.address}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                            <FaStar size={10} /> {st.rating ?? 0}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <FaClock size={10} className="text-gray-400" />
                            {st.open_time}–{st.close_time}
                          </span>
                          {st.distance_km != null && (
                            <span className="flex items-center gap-1 text-xs text-primary font-semibold">
                              <FaLocationArrow size={9} />{formatDistance(st.distance_km)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          st.available_chargers > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {st.available_chargers > 0 ? 'ว่าง' : 'เต็ม'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <FaBolt size={10} className="text-primary" />
                          {st.available_chargers}/{st.total_chargers}
                        </span>
                        {st.latitude && st.longitude && (
                          <button
                            onClick={e => { e.stopPropagation(); startNav(st) }}
                            className="flex items-center gap-1 text-xs text-blue-500 font-semibold hover:text-blue-700 transition-colors"
                          >
                            <FaDirections size={11} /> นำทาง
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && filtered.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <FaSearch size={36} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">ไม่พบสถานีที่ค้นหา</p>
                    <p className="text-xs mt-1 opacity-60">ลองเปลี่ยน filter หรือคำค้นหา</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>}

      </div>

      {/* ── Bottom Nav ───────────────────────────────────────────────────── */}
      <BottomNav />
    </div>
  )
}
