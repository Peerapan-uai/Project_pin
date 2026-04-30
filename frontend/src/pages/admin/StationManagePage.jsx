import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../context/ToastContext'
import DateTimePicker from '../../components/ui/DateTimePicker'
import Select from '../../components/ui/Select'
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaBolt, FaTimes, FaSearch } from 'react-icons/fa'
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from '@react-google-maps/api'

const GMAPS_LIBRARIES = ['places']
const BANGKOK = { lat: 13.7563, lng: 100.5018 }
const MAP_CONTAINER = { width: '100%', height: '220px', borderRadius: '12px' }

const EMPTY_FORM = { name: '', address: '', latitude: '', longitude: '', floor: '', open_time: '', close_time: '', status: 'active', station_type: 'public', scheduled_status: '', scheduled_status_at: '' }

const STATION_TYPE_LABEL = {
  public:        { label: 'สาธารณะ',      color: 'bg-blue-50 text-blue-600' },
  private_fleet: { label: 'กองยาน',       color: 'bg-purple-50 text-purple-600' },
  commercial:    { label: 'เชิงพาณิชย์',  color: 'bg-amber-50 text-amber-700' },
}
const EMPTY_CHARGER_FORM = { charger_name: '', connector_type: '', power_kw: '', price_per_kwh: '', status: 'available' }

export default function StationManagePage() {
  const toast = useToast()
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, libraries: GMAPS_LIBRARIES, language: 'th' })
  const autocompleteRef = useRef(null)
  const [mapCenter, setMapCenter] = useState(BANGKOK)

  const [stations, setStations]         = useState([])
  const [confirmDeleteStation, setConfirmDeleteStation] = useState(null)
  const [confirmToggleStation, setConfirmToggleStation] = useState(null)
  const [confirmDeleteCharger, setConfirmDeleteCharger] = useState(null)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [editingId, setEditingId]       = useState(null)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  // charger modal state
  const [chargerStation, setChargerStation] = useState(null)
  const [chargers, setChargers]             = useState([])
  const [chargerLoading, setChargerLoading] = useState(false)
  const [editingCharger, setEditingCharger] = useState(null)
  const [chargerForm, setChargerForm]       = useState(EMPTY_CHARGER_FORM)
  const [chargerError, setChargerError]     = useState('')
  const [chargerSaving, setChargerSaving]   = useState(false)
  const [revenueMap, setRevenueMap]         = useState({})  // station_id -> total_revenue
  const [revenuePeriod, setRevenuePeriod]   = useState('today')  // today | 7days | month

  const fetchStations = () => {
    setLoading(true)
    api.get('/api/stations')
      .then((res) => setStations(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  const fetchRevenue = useCallback(() => {
    const today = new Date()
    let fromDate = today.toISOString().slice(0, 10)
    if (revenuePeriod === '7days') {
      const d = new Date(today)
      d.setDate(d.getDate() - 6)
      fromDate = d.toISOString().slice(0, 10)
    } else if (revenuePeriod === 'month') {
      const d = new Date(today)
      d.setDate(d.getDate() - 29)
      fromDate = d.toISOString().slice(0, 10)
    }
    const stationIds = stations.map((s) => s.station_id)
    if (stationIds.length === 0) { setRevenueMap({}); return }
    Promise.all(
      stationIds.map((sid) =>
        api.get(`/api/admin/reports/revenue?period=daily&from_date=${fromDate}&station_id=${sid}`)
          .then((res) => ({ sid, rev: res.data.summary?.total_revenue ?? 0 }))
          .catch(() => ({ sid, rev: 0 }))
      )
    ).then((results) => {
      const map = {}
      results.forEach(({ sid, rev }) => { map[sid] = rev })
      setRevenueMap(map)
    })
  }, [revenuePeriod, stations])

  useEffect(() => {
    fetchStations()
  }, [])

  useEffect(() => {
    fetchRevenue()
  }, [fetchRevenue])

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setMapCenter(BANGKOK); setError(''); setShowModal(true) }
  const openEdit = (s) => {
    setEditingId(s.station_id)
    const lat = Number(s.latitude) || BANGKOK.lat
    const lng = Number(s.longitude) || BANGKOK.lng
    setForm({
      name: s.name ?? '',
      address: s.address ?? '',
      latitude: s.latitude ?? '',
      longitude: s.longitude ?? '',
      floor: s.floor ?? '',
      open_time: s.open_time ?? '',
      close_time: s.close_time ?? '',
      status: s.status ?? 'active',
      station_type: s.station_type ?? 'public',
      scheduled_status: s.scheduled_status ?? '',
      scheduled_status_at: s.scheduled_status_at ? s.scheduled_status_at.slice(0, 16) : '',
    })
    setMapCenter({ lat, lng })
    setError('')
    setShowModal(true)
  }

  // เมื่อเลือกสถานที่จาก Autocomplete
  const onPlaceSelected = () => {
    const place = autocompleteRef.current?.getPlace()
    if (!place?.geometry) return
    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    setForm((prev) => ({
      ...prev,
      address: place.formatted_address || place.name || prev.address,
      latitude: lat,
      longitude: lng,
    }))
    setMapCenter({ lat, lng })
  }

  // reverse geocode แล้วอัปเดต form
  const updatePositionAndAddress = (lat, lng) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))
    setMapCenter({ lat, lng })
    if (window.google) {
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        console.log('Geocode status:', status, 'results:', results)
        if (status === 'OK' && results[0]) {
          setForm((prev) => ({ ...prev, address: results[0].formatted_address }))
        } else {
          console.warn('Geocode failed:', status)
        }
      })
    }
  }

  // เมื่อลาก pin บนแผนที่
  const onMarkerDragEnd = (e) => updatePositionAndAddress(e.latLng.lat(), e.latLng.lng())

  // เมื่อคลิกบนแผนที่ เพื่อปักหมุด
  const onMapClick = (e) => updatePositionAndAddress(e.latLng.lat(), e.latLng.lng())
  const closeModal = () => setShowModal(false)

  const handleDelete = () => {
    if (!confirmDeleteStation) return
    api.delete(`/api/stations/${confirmDeleteStation}`)
      .then(() => { setConfirmDeleteStation(null); fetchStations(); toast.success('ลบสถานีสำเร็จ') })
      .catch((err) => { setConfirmDeleteStation(null); toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด') })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.address || !form.latitude || !form.longitude) {
      setError('กรุณากรอกชื่อ ที่อยู่ latitude และ longitude')
      return
    }
    setSaving(true)
    const payload = { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) }
    const req = editingId
      ? api.put(`/api/stations/${editingId}`, payload)
      : api.post('/api/stations', payload)
    req
      .then(() => { closeModal(); fetchStations() })
      .catch((err) => setError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setSaving(false))
  }

  const toggleStationStatus = () => {
    if (!confirmToggleStation) return
    const { station } = confirmToggleStation
    const newStatus = station.status === 'active' ? 'inactive' : 'active'
    api.put(`/api/stations/${station.station_id}`, { ...station, status: newStatus })
      .then(() => {
        setConfirmToggleStation(null)
        setChargerStation((prev) => prev ? { ...prev, status: newStatus } : prev)
        fetchStations()
        toast.success(`${newStatus === 'inactive' ? 'ปิด' : 'เปิด'}สถานีสำเร็จ`)
      })
      .catch((err) => { setConfirmToggleStation(null); toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด') })
  }

  const openChargerModal = (station) => {
    setChargerStation(station)
    setEditingCharger(null)
    setChargerForm(EMPTY_CHARGER_FORM)
    setChargerError('')
    setChargerLoading(true)
    api.get(`/api/stations/${station.station_id}`)
      .then((res) => setChargers(res.data.chargers ?? []))
      .catch(() => setChargers([]))
      .finally(() => setChargerLoading(false))
  }
  const closeChargerModal = () => { setChargerStation(null); setEditingCharger(null) }

  const startEditCharger = (c) => {
    setEditingCharger(c.charger_id)
    setChargerForm({
      charger_name: c.charger_name ?? '',
      connector_type: c.connector_type ?? '',
      power_kw: c.power_kw ?? '',
      price_per_kwh: c.price_per_kwh ?? '',
      status: c.status ?? 'available',
    })
    setChargerError('')
  }

  const handleDeleteCharger = () => {
    if (!confirmDeleteCharger) return
    api.delete(`/api/chargers/${confirmDeleteCharger}`)
      .then(() => {
        setConfirmDeleteCharger(null)
        setChargers((prev) => prev.filter((c) => c.charger_id !== confirmDeleteCharger))
        fetchStations()
        toast.success('ลบตู้ชาร์จสำเร็จ')
      })
      .catch((err) => { setConfirmDeleteCharger(null); setChargerError(err.response?.data?.message || 'เกิดข้อผิดพลาด') })
  }

  const handleChargerSubmit = (e) => {
    e.preventDefault()
    if (!chargerForm.charger_name || !chargerForm.connector_type || !chargerForm.power_kw || !chargerForm.price_per_kwh) {
      setChargerError('กรุณากรอกข้อมูลให้ครบ')
      return
    }
    setChargerSaving(true)
    const payload = {
      ...chargerForm,
      station_id: chargerStation.station_id,
      power_kw: Number(chargerForm.power_kw),
      price_per_kwh: Number(chargerForm.price_per_kwh),
    }
    const req = editingCharger
      ? api.put(`/api/chargers/${editingCharger}`, payload)
      : api.post('/api/chargers', payload)
    req
      .then(() => {
        setEditingCharger(null)
        setChargerForm(EMPTY_CHARGER_FORM)
        setChargerError('')
        return api.get(`/api/stations/${chargerStation.station_id}`)
      })
      .then((res) => {
        setChargers(res.data.chargers ?? [])
        fetchStations()
      })
      .catch((err) => setChargerError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setChargerSaving(false))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const getStationStatus = (s) => {
    if (s.status === 'inactive') return 'closed'
    if ((s.available_chargers ?? 0) === 0 && (s.total_chargers ?? 0) > 0) return 'full'
    return 'open'
  }

  const filtered = stations.filter((s) => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || s.address?.toLowerCase().includes(search.toLowerCase())
    const stStatus = getStationStatus(s)
    const matchFilter = filterStatus === 'all' || filterStatus === stStatus
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">จัดการสถานี</h1>
          <p className="text-gray-500 text-sm mt-0.5">สถานีชาร์จทั้งหมด {stations.length} แห่ง</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาสถานี..."
              className="pl-9 pr-4 py-2 w-48 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            />
          </div>
          {[
            { key: 'all',    label: 'ทั้งหมด' },
            { key: 'open',   label: 'พร้อมบริการ' },
            { key: 'full',   label: 'เต็มแล้ว' },
            { key: 'closed', label: 'ปิดบริการ' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                filterStatus === key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="w-28">
            <Select
              value={revenuePeriod}
              onChange={(v) => setRevenuePeriod(v)}
              options={[
                { value: 'today', label: 'รายได้: วันนี้' },
                { value: '7days', label: 'รายได้: 7 วัน' },
                { value: 'month', label: 'รายได้: 30 วัน' },
              ]}
            />
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors shadow-sm shadow-green-200"
          >
            <FaPlus size={12} /> เพิ่มสถานี
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600">ชื่อสถานี</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">ที่อยู่</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">เวลาเปิด-ปิด</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">ตู้ชาร์จ</th>
              <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">รายได้รวม</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">สถานะ</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <tr key={s.station_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.floor}</p>
                  {s.station_type && (() => {
                    const t = STATION_TYPE_LABEL[s.station_type]
                    return t ? <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span> : null
                  })()}
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <div className="flex items-start gap-1.5 max-w-xs">
                    <FaMapMarkerAlt size={11} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500 line-clamp-2">{s.address}</p>
                  </div>
                </td>
                <td className="px-5 py-4 text-center hidden md:table-cell">
                  {s.open_time?.slice(0,5) === '00:00' && s.close_time?.slice(0,5) === '00:00'
                    ? <span className="text-xs font-semibold text-green-600">เปิด 24 ชม.</span>
                    : s.open_time && s.close_time
                      ? <span className="text-xs text-gray-500">{s.open_time?.slice(0,5)}–{s.close_time?.slice(0,5)}</span>
                      : <span className="text-xs text-gray-400">ไม่ระบุ</span>
                  }
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="flex items-center justify-center gap-1 text-sm">
                    <FaBolt size={11} className="text-primary" />
                    <span className="text-green-600 font-semibold">{s.available_chargers ?? 0}</span>
                    <span className="text-gray-400">/{s.total_chargers ?? 0}</span>
                  </span>
                </td>
                <td className="px-5 py-4 text-right hidden lg:table-cell">
                  {(() => {
                    const rev = revenueMap[s.station_id]
                    if (rev != null && Number(rev) > 0) return <span className="font-semibold text-primary text-sm">{Number(rev).toFixed(2)} ฿</span>
                    if (s.status === 'inactive') return <span className="text-xs text-gray-400">ปิดให้บริการ</span>
                    if ((s.total_chargers ?? 0) === 0) return <span className="text-xs text-gray-400">ยังไม่มีตู้ชาร์จ</span>
                    return <span className="text-xs text-gray-400">ยังไม่มีรายได้</span>
                  })()}
                </td>
                <td className="px-5 py-4 text-center">
                  {(() => {
                    const st = getStationStatus(s)
                    if (st === 'closed') return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">ปิดให้บริการ</span>
                    if (st === 'full')   return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">เต็มแล้ว</span>
                    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-600">พร้อมให้บริการ</span>
                  })()}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openChargerModal(s)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="จัดการตู้ชาร์จ"><FaBolt size={14} /></button>
                    <button onClick={() => openEdit(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="แก้ไขสถานี"><FaEdit size={14} /></button>
                    <button
                      onClick={() => setConfirmDeleteStation(s.station_id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      title="ลบสถานี"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">ไม่พบสถานีที่ค้นหา</div>
        )}
      </div>

      {/* Charger Management Modal */}
      {chargerStation && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-bold text-gray-900">ตู้ชาร์จ — {chargerStation.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{chargers.length} ตู้</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setConfirmToggleStation({ station: chargerStation })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    chargerStation.status === 'active'
                      ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                      : 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {chargerStation.status === 'active' ? 'ปิดสถานี' : 'เปิดสถานี'}
                </button>
                <button onClick={closeChargerModal} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {chargerError && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{chargerError}</p>}

              {/* Charger list */}
              {chargerLoading
                ? <p className="text-sm text-gray-400 text-center py-4">กำลังโหลด...</p>
                : chargers.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีตู้ชาร์จ</p>
                  : (
                    <div className="space-y-2">
                      {chargers.map((c) => (
                        <div key={c.charger_id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FaBolt size={13} className="text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{c.charger_name}</p>
                              <p className="text-xs text-gray-400">{c.connector_type} · {c.power_kw} kW · {c.price_per_kwh} ฿/kWh</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StatusBadge status={c.status} />
                            <button onClick={() => startEditCharger(c)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg"><FaEdit size={13} /></button>
                            <button onClick={() => setConfirmDeleteCharger(c.charger_id)} className="p-1.5 text-red-400 hover:bg-red-100 rounded-lg"><FaTrash size={13} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
              }

              {/* Add/Edit charger form */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">{editingCharger ? 'แก้ไขตู้ชาร์จ' : 'เพิ่มตู้ชาร์จใหม่'}</p>
                <form onSubmit={handleChargerSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อตู้ *</label>
                      <input
                        value={chargerForm.charger_name}
                        onChange={(e) => setChargerForm({ ...chargerForm, charger_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="เช่น Charger A1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">ประเภทหัวชาร์จ *</label>
                      <Select
                        value={chargerForm.connector_type}
                        onChange={(v) => setChargerForm({ ...chargerForm, connector_type: v })}
                        placeholder="-- เลือก --"
                        options={[
                          { value: 'CCS', label: 'CCS (DC)' },
                          { value: 'CHAdeMO', label: 'CHAdeMO (DC)' },
                          { value: 'Type2', label: 'Type 2 (AC)' },
                          { value: 'Type1', label: 'Type 1 (AC)' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">กำลัง (kW) *</label>
                      <input
                        type="number"
                        step="any"
                        value={chargerForm.power_kw}
                        onChange={(e) => setChargerForm({ ...chargerForm, power_kw: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="22"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">ราคา/kWh *</label>
                      <input
                        type="number"
                        step="any"
                        value={chargerForm.price_per_kwh}
                        onChange={(e) => setChargerForm({ ...chargerForm, price_per_kwh: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="7.50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">สถานะ</label>
                    <Select
                      value={chargerForm.status}
                      onChange={(v) => setChargerForm({ ...chargerForm, status: v })}
                      options={[
                        { value: 'available', label: 'ว่าง' },
                        { value: 'out_of_service', label: 'ปิดซ่อม' },
                      ]}
                    />
                  </div>
                  <div className="flex gap-3">
                    {editingCharger && (
                      <button
                        type="button"
                        onClick={() => { setEditingCharger(null); setChargerForm(EMPTY_CHARGER_FORM); setChargerError('') }}
                        className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                      >
                        ยกเลิก
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={chargerSaving}
                      className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {chargerSaving ? 'กำลังบันทึก...' : editingCharger ? 'บันทึก' : <><FaPlus size={12} /> เพิ่มตู้</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Station Modal */}
      {!chargerStation && showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editingId ? 'แก้ไขสถานี' : 'เพิ่มสถานีใหม่'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อสถานี *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="เช่น EV Station Central"
                />
              </div>
              {/* ค้นหาสถานที่ + แผนที่ */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ค้นหาสถานที่ *</label>
                {isLoaded ? (
                  <Autocomplete
                    onLoad={(ac) => (autocompleteRef.current = ac)}
                    onPlaceChanged={onPlaceSelected}
                    options={{ componentRestrictions: { country: 'th' } }}
                  >
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="พิมพ์ชื่อสถานที่หรือที่อยู่..."
                    />
                  </Autocomplete>
                ) : (
                  <input disabled className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400" placeholder="กำลังโหลดแผนที่..." />
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ที่อยู่ *</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="ที่อยู่สถานี (จะถูกเติมอัตโนมัติเมื่อเลือกจากแผนที่)"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ชั้น / โซน</label>
                {(() => {
                  const PRESETS = ['ชั้น B1','ชั้น B2','ชั้น 1','ชั้น 2','ชั้น 3','ชั้น 4','ชั้น 5']
                  const isPreset = PRESETS.includes(form.floor)
                  const isNone = !form.floor || form.floor === ''
                  const selectVal = isNone ? '__none__' : isPreset ? form.floor : '__custom__'
                  return (
                    <div className="flex gap-2">
                      <div className={selectVal === '__custom__' ? 'w-1/3' : 'w-full'}>
                        <Select
                          value={selectVal}
                          onChange={(v) => {
                            if (v === '__none__') setForm({ ...form, floor: '' })
                            else if (v === '__custom__') setForm({ ...form, floor: ' ' })
                            else setForm({ ...form, floor: v })
                          }}
                          options={[
                            { value: '__none__', label: 'ไม่มี (กลางแจ้ง/ริมถนน)' },
                            ...PRESETS.map((p) => ({ value: p, label: p })),
                            { value: '__custom__', label: 'พิมพ์เอง...' },
                          ]}
                        />
                      </div>
                      {selectVal === '__custom__' && (
                        <input
                          value={form.floor?.trim() || ''}
                          onChange={(e) => setForm({ ...form, floor: e.target.value || ' ' })}
                          className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="เช่น โซน A, ชั้น 6"
                          autoFocus
                        />
                      )}
                    </div>
                  )
                })()}
              </div>
              {isLoaded && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">ตำแหน่งบนแผนที่ (ลาก pin เพื่อปรับตำแหน่ง)</label>
                  <GoogleMap
                    mapContainerStyle={MAP_CONTAINER}
                    center={mapCenter}
                    zoom={form.latitude ? 16 : 12}
                    options={{ disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy' }}
                    onClick={onMapClick}
                  >
                    {form.latitude && form.longitude && (
                      <Marker
                        position={{ lat: Number(form.latitude), lng: Number(form.longitude) }}
                        draggable
                        onDragEnd={onMarkerDragEnd}
                      />
                    )}
                  </GoogleMap>
                  {form.latitude && form.longitude && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      <FaMapMarkerAlt size={10} className="inline mr-1" />
                      {Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}
                    </p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">เวลาเปิด</label>
                  <input
                    type="time"
                    value={form.open_time}
                    onChange={(e) => setForm({ ...form, open_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">เวลาปิด</label>
                  <input
                    type="time"
                    value={form.close_time}
                    onChange={(e) => setForm({ ...form, close_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">สถานะ</label>
                  <Select
                    value={form.status}
                    onChange={(v) => setForm({ ...form, status: v })}
                    options={[
                      { value: 'active', label: 'active' },
                      { value: 'inactive', label: 'inactive' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">ประเภทสถานี</label>
                  <Select
                    value={form.station_type}
                    onChange={(v) => setForm({ ...form, station_type: v })}
                    options={[
                      { value: 'public', label: 'สาธารณะ' },
                      { value: 'private_fleet', label: 'กองยาน' },
                      { value: 'commercial', label: 'เชิงพาณิชย์' },
                    ]}
                  />
                </div>
              </div>
              {/* ตั้งเวลาเปลี่ยนสถานะล่วงหน้า — แสดงเฉพาะตอนแก้ไข */}
              {editingId && <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 space-y-3">
                <p className="text-xs font-semibold text-amber-700">ตั้งเวลาเปลี่ยนสถานะล่วงหน้า (optional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">เปลี่ยนเป็น</label>
                    <Select
                      value={form.scheduled_status}
                      onChange={(v) => setForm({ ...form, scheduled_status: v })}
                      placeholder="-- ไม่ตั้งเวลา --"
                      options={[
                        { value: 'active', label: 'active' },
                        { value: 'inactive', label: 'inactive' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">เวลาที่จะเปลี่ยน</label>
                    <DateTimePicker
                      value={form.scheduled_status_at}
                      onChange={(v) => setForm({ ...form, scheduled_status_at: v })}
                      placeholder="เลือกวัน & เวลาที่จะเปลี่ยน"
                    />
                  </div>
                </div>
                {form.scheduled_status && form.scheduled_status_at && (
                  <p className="text-xs text-amber-600">
                    จะเปลี่ยนเป็น <strong>{form.scheduled_status}</strong> ตอน {new Date(form.scheduled_status_at).toLocaleString('th-TH')}
                  </p>
                )}
              </div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50">
                  {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึก' : 'เพิ่มสถานี'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Station Modal */}
      {confirmDeleteStation && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">ยืนยันลบสถานี</h2>
              <button onClick={() => setConfirmDeleteStation(null)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 bg-red-50 rounded-xl p-4">
                <FaTrash size={18} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-gray-700">คุณต้องการลบสถานีนี้จริงๆ ใช่ไหม? สามารถกู้คืนได้ที่ Recycle ภายใน 30 วัน</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteStation(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
                  ยืนยันลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Toggle Station Status Modal */}
      {confirmToggleStation && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">
                {confirmToggleStation.station.status === 'active' ? 'ยืนยันปิดสถานี' : 'ยืนยันเปิดสถานี'}
              </h2>
              <button onClick={() => setConfirmToggleStation(null)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                {confirmToggleStation.station.status === 'active'
                  ? `ต้องการปิดสถานี "${confirmToggleStation.station.name}" ใช่ไหม? ผู้ใช้จะไม่สามารถจองตู้ชาร์จได้`
                  : `ต้องการเปิดสถานี "${confirmToggleStation.station.name}" ใช่ไหม?`}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmToggleStation(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button
                  onClick={toggleStationStatus}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${
                    confirmToggleStation.station.status === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {confirmToggleStation.station.status === 'active' ? 'ยืนยันปิด' : 'ยืนยันเปิด'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Charger Modal */}
      {confirmDeleteCharger && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">ยืนยันลบตู้ชาร์จ</h2>
              <button onClick={() => setConfirmDeleteCharger(null)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 bg-red-50 rounded-xl p-4">
                <FaTrash size={18} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-gray-700">คุณต้องการลบตู้ชาร์จนี้จริงๆ ใช่ไหม? สามารถกู้คืนได้ที่ Recycle ภายใน 30 วัน</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteCharger(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button onClick={handleDeleteCharger} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
                  ยืนยันลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
