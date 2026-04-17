import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { FaDownload } from 'react-icons/fa'

export default function ReportsPage() {
  const [tab, setTab]                 = useState('revenue')
  const [revenue, setRevenue]         = useState([])
  const [stationStats, setStationStats] = useState([])
  const [usage, setUsage]             = useState([])
  const [comparison, setComparison]   = useState(null)
  const [loading, setLoading]         = useState(false)
  const [period, setPeriod]           = useState('monthly')
  const [compareType, setCompareType] = useState('monthly')
  const [fromDate, setFromDate]       = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate]           = useState(() => new Date().toISOString().split('T')[0])
  const [exporting, setExporting]     = useState(false)
  const [stationList, setStationList] = useState([])
  const [revenueStation, setRevenueStation] = useState('')

  useEffect(() => {
    api.get('/api/stations')
      .then((res) => setStationList(Array.isArray(res.data) ? res.data : (res.data.stations ?? [])))
      .catch(() => {})
  }, [])

  const fetchRevenue = () => {
    setLoading(true)
    const stationParam = revenueStation ? `&station_id=${revenueStation}` : ''
    api.get(`/api/admin/reports/revenue?period=${period}&from_date=${fromDate}&to_date=${toDate}${stationParam}`)
      .then((res) => setRevenue(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const fetchStations = () => {
    setLoading(true)
    api.get('/api/admin/reports/stations')
      .then((res) => setStationStats(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const fetchUsage = () => {
    setLoading(true)
    api.get(`/api/admin/reports/usage?from_date=${fromDate}&to_date=${toDate}`)
      .then((res) => setUsage(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const fetchComparison = (type) => {
    setLoading(true)
    api.get(`/api/admin/reports/comparison?compare_type=${type ?? compareType}`)
      .then((res) => setComparison(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (tab === 'revenue') fetchRevenue()
    else if (tab === 'stations') fetchStations()
    else if (tab === 'usage') fetchUsage()
    else if (tab === 'comparison') fetchComparison()
  }, [tab])

  const handleLoad = () => {
    if (tab === 'revenue') fetchRevenue()
    else if (tab === 'usage') fetchUsage()
    else if (tab === 'stations') fetchStations()
    else if (tab === 'comparison') fetchComparison()
  }

  const handleExport = (type) => {
    setExporting(true)
    api.post('/api/admin/reports/export', { report_type: type, from_date: fromDate, to_date: toDate }, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }))
        const a = document.createElement('a')
        a.href = url
        a.download = `report_${type}_${fromDate}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      })
      .catch(() => alert('Export ไม่สำเร็จ'))
      .finally(() => setExporting(false))
  }

  const tabs = [
    { v: 'revenue', l: 'รายได้' },
    { v: 'stations', l: 'สถานี' },
    { v: 'usage', l: 'การใช้งาน' },
    { v: 'comparison', l: 'เปรียบเทียบ' },
  ]

  const compareOptions = [
    { v: 'daily',   l: 'วันนี้ vs เมื่อวาน' },
    { v: 'weekly',  l: 'สัปดาห์นี้ vs ที่แล้ว' },
    { v: 'monthly', l: 'เดือนนี้ vs ที่แล้ว' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
          <p className="text-gray-500 text-sm mt-0.5">สถิติและรายงานของระบบ</p>
        </div>
        <button onClick={() => handleExport(tab === 'comparison' ? 'revenue' : tab)} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50">
          <FaDownload size={13} /> {exporting ? 'กำลัง Export...' : 'Export CSV'}
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 mb-4 flex-wrap items-end bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        {tab !== 'comparison' && (
          <>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">จากวันที่</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">ถึงวันที่</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </>
        )}

        {tab === 'revenue' && (
          <>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">จัดกลุ่มตาม</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                <option value="daily">รายวัน</option>
                <option value="monthly">รายเดือน</option>
                <option value="yearly">รายปี</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">สถานี</label>
              <select value={revenueStation} onChange={(e) => setRevenueStation(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                <option value="">ทุกสถานี</option>
                {stationList.map((s) => (
                  <option key={s.station_id} value={s.station_id}>{s.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {tab === 'comparison' && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">เปรียบเทียบ</label>
            <select value={compareType} onChange={(e) => { setCompareType(e.target.value); fetchComparison(e.target.value) }}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
              {compareOptions.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        )}

        <button onClick={handleLoad}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600">
          โหลดข้อมูล
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map(({ v, l }) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === v ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/50'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">กำลังโหลด...</div> : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Revenue Tab */}
          {tab === 'revenue' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">ช่วงเวลา</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">รายได้ (฿)</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">รายการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {revenue.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">{r.period_date ?? r.period ?? r.date ?? '-'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-primary">{Number(r.revenue ?? 0).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{r.transaction_count ?? '-'}</td>
                  </tr>
                ))}
                {revenue.length === 0 && <tr><td colSpan={3} className="text-center py-10 text-gray-400">ไม่มีข้อมูล</td></tr>}
              </tbody>
            </table>
          )}

          {/* Stations Tab */}
          {tab === 'stations' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">สถานี</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">ตู้ชาร์จ</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Sessions</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">รายได้ (฿)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stationStats.map((s) => (
                  <tr key={s.station_id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{s.total_chargers}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{s.total_sessions}</td>
                    <td className="px-5 py-3 text-right font-semibold text-primary">{Number(s.total_revenue ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
                {stationStats.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-gray-400">ไม่มีข้อมูล</td></tr>}
              </tbody>
            </table>
          )}

          {/* Usage Tab */}
          {tab === 'usage' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">ตู้ชาร์จ</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Sessions</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">พลังงาน (kWh)</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">อุณหภูมิสูงสุด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usage.map((u) => (
                  <tr key={u.charger_id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{u.charger_name}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{u.total_sessions}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{Number(u.total_energy_kwh ?? 0).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{u.max_temperature ? `${u.max_temperature}°C` : '-'}</td>
                  </tr>
                ))}
                {usage.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-gray-400">ไม่มีข้อมูล</td></tr>}
              </tbody>
            </table>
          )}

          {/* Comparison Tab */}
          {tab === 'comparison' && comparison && (
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-5 text-center">
                <p className="text-sm text-gray-500 mb-1">{comparison.current_label ?? 'ปัจจุบัน'}</p>
                <p className="text-3xl font-bold text-primary">{Number(comparison.current_revenue ?? 0).toFixed(2)} ฿</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-5 text-center">
                <p className="text-sm text-gray-500 mb-1">{comparison.previous_label ?? 'ก่อนหน้า'}</p>
                <p className="text-3xl font-bold text-gray-600">{Number(comparison.previous_revenue ?? 0).toFixed(2)} ฿</p>
              </div>
              {comparison.percentage_change != null && (
                <div className="col-span-2 text-center bg-gray-50 rounded-2xl p-4">
                  <p className="text-sm text-gray-500">การเปลี่ยนแปลง</p>
                  <p className={`text-2xl font-bold ${Number(comparison.percentage_change) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {Number(comparison.percentage_change) >= 0 ? '+' : ''}{Number(comparison.percentage_change).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          )}
          {tab === 'comparison' && !comparison && !loading && (
            <div className="text-center py-10 text-gray-400">ไม่มีข้อมูล</div>
          )}
        </div>
      )}
    </div>
  )
}