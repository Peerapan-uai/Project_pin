import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { FaChartBar, FaDownload, FaFileInvoice } from 'react-icons/fa'

export default function ReportsPage() {
  const [tab, setTab]                 = useState('revenue')
  const [revenue, setRevenue]         = useState([])
  const [stations, setStations]       = useState([])
  const [usage, setUsage]             = useState([])
  const [comparison, setComparison]   = useState(null)
  const [loading, setLoading]         = useState(false)
  const [period, setPeriod]           = useState('monthly')
  const [fromDate, setFromDate]       = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate]           = useState(() => new Date().toISOString().split('T')[0])
  const [exporting, setExporting]     = useState(false)

  const fetchRevenue = () => {
    setLoading(true)
    api.get(`/api/admin/reports/revenue?period=${period}&from_date=${fromDate}&to_date=${toDate}`)
      .then((res) => setRevenue(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const fetchStations = () => {
    setLoading(true)
    api.get('/api/admin/reports/stations')
      .then((res) => setStations(res.data.data ?? []))
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

  const fetchComparison = () => {
    setLoading(true)
    api.get('/api/admin/reports/comparison?compare_type=monthly')
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

  const handleExport = (type) => {
    setExporting(true)
    api.post('/api/admin/reports/export', { type, from_date: fromDate, to_date: toDate }, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a')
        a.href = url
        a.download = `report_${type}_${fromDate}.csv`
        a.click()
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
          <p className="text-gray-500 text-sm mt-0.5">สถิติและรายงานของระบบ</p>
        </div>
        <button onClick={() => handleExport('payments')} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50">
          <FaDownload size={13} /> {exporting ? 'กำลัง Export...' : 'Export CSV'}
        </button>
      </div>

      {/* Date range filter */}
      <div className="flex gap-3 mb-4 flex-wrap items-center bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
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
        {tab === 'revenue' && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">ช่วงเวลา</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
              <option value="daily">รายวัน</option>
              <option value="monthly">รายเดือน</option>
              <option value="yearly">รายปี</option>
            </select>
          </div>
        )}
        <button onClick={() => {
          if (tab === 'revenue') fetchRevenue()
          else if (tab === 'usage') fetchUsage()
        }} className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600">
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
                    <td className="px-5 py-3 text-gray-700">{r.period ?? r.date ?? r.month ?? r.year}</td>
                    <td className="px-5 py-3 text-right font-semibold text-primary">{Number(r.total_revenue ?? r.revenue ?? 0).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{r.total_payments ?? r.count ?? '-'}</td>
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
                {stations.map((s) => (
                  <tr key={s.station_id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{s.total_chargers}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{s.total_sessions}</td>
                    <td className="px-5 py-3 text-right font-semibold text-primary">{Number(s.total_revenue ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
                {stations.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-gray-400">ไม่มีข้อมูล</td></tr>}
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
              {[
                { label: 'เดือนนี้', value: comparison.current_period?.total_revenue ?? comparison.current?.revenue ?? 0, color: 'text-primary' },
                { label: 'เดือนที่แล้ว', value: comparison.previous_period?.total_revenue ?? comparison.previous?.revenue ?? 0, color: 'text-gray-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-2xl p-5 text-center">
                  <p className="text-sm text-gray-500 mb-1">{label}</p>
                  <p className={`text-3xl font-bold ${color}`}>{Number(value).toFixed(2)} ฿</p>
                </div>
              ))}
              {comparison.growth_percentage != null && (
                <div className="col-span-2 text-center bg-gray-50 rounded-2xl p-4">
                  <p className="text-sm text-gray-500">การเติบโต</p>
                  <p className={`text-2xl font-bold ${Number(comparison.growth_percentage) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {Number(comparison.growth_percentage) >= 0 ? '+' : ''}{Number(comparison.growth_percentage).toFixed(1)}%
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