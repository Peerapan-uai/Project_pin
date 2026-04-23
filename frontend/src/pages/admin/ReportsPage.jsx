import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../context/ToastContext'
import DateRangePicker from '../../components/ui/DateRangePicker'
import Select from '../../components/ui/Select'
import { FaFileCsv, FaFilePdf } from 'react-icons/fa'

const MONTH_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']

function formatPeriodDate(dateStr, period) {
  if (!dateStr) return '-'
  if (period === 'monthly') {
    const [y, m] = dateStr.split('-')
    return `${MONTH_TH[parseInt(m, 10) - 1]} ${y}`
  }
  if (period === 'daily') {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  if (period === 'yearly') return `ปี ${dateStr}`
  return dateStr
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ReportsPage() {
  const toast = useToast()
  const [tab, setTab]                 = useState('revenue')
  const [revenue, setRevenue]         = useState([])
  const [stationStats, setStationStats] = useState([])
  const [usage, setUsage]             = useState([])
  const [comparison, setComparison]   = useState(null)
  const [loading, setLoading]         = useState(false)
  const period = 'daily'
  const [compareType, setCompareType] = useState('monthly')
  const [fromDate, setFromDate]       = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate]           = useState(() => new Date().toISOString().split('T')[0])
  const [exporting, setExporting]     = useState(false)
  const [stationList, setStationList] = useState([])
  const [revenueStation, setRevenueStation] = useState('')
  const [usageStatus, setUsageStatus] = useState('')
  const [revPage, setRevPage]     = useState(1)
  const [staPage, setStaPage]     = useState(1)
  const [usagePage, setUsagePage] = useState(1)
  const PER_PAGE = 20
  const SCROLL_H = 10 * 49 // ~10 rows visible

  useEffect(() => {
    api.get('/api/stations')
      .then((res) => setStationList(Array.isArray(res.data) ? res.data : (res.data.stations ?? [])))
      .catch(() => {})
  }, [])

  const fetchRevenue = () => {
    setLoading(true)
    const stationParam = revenueStation ? `&station_id=${revenueStation}` : ''
    api.get(`/api/admin/reports/revenue?period=${period}&from_date=${fromDate}&to_date=${toDate}${stationParam}`)
      .then((res) => { setRevenue(res.data.data ?? []); setRevPage(1) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const fetchStations = () => {
    setLoading(true)
    api.get(`/api/admin/reports/stations?from_date=${fromDate}&to_date=${toDate}`)
      .then((res) => { setStationStats(res.data.data ?? []); setStaPage(1) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const fetchUsage = () => {
    setLoading(true)
    const statusParam = usageStatus ? `&status=${usageStatus}` : ''
    api.get(`/api/admin/reports/usage?from_date=${fromDate}&to_date=${toDate}${statusParam}`)
      .then((res) => { setUsage(res.data.data ?? []); setUsagePage(1) })
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

  const handleExport = (type, format = 'csv') => {
    setExporting(true)
    const endpoint = format === 'pdf' ? '/api/admin/reports/export-pdf' : '/api/admin/reports/export'
    const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8;'
    const ext = format === 'pdf' ? 'pdf' : 'csv'
    api.post(endpoint, { report_type: type, from_date: fromDate, to_date: toDate }, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }))
        const a = document.createElement('a')
        a.href = url
        a.download = `report_${type}_${fromDate}.${ext}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      })
      .catch(() => toast.error('Export ไม่สำเร็จ'))
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
        <div className="flex gap-2">
          <button onClick={() => handleExport(tab === 'comparison' ? 'revenue' : tab, 'csv')} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50">
            <FaFileCsv size={13} /> {exporting ? 'กำลัง Export...' : 'Export CSV'}
          </button>
          <button onClick={() => handleExport(tab === 'comparison' ? 'revenue' : tab, 'pdf')} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 disabled:opacity-50">
            <FaFilePdf size={13} /> {exporting ? 'กำลัง Export...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 mb-4 flex-wrap items-end bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        {tab !== 'comparison' && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">ช่วงวันที่</label>
            <DateRangePicker
              fromDate={fromDate}
              toDate={toDate}
              onChange={({ from, to }) => { setFromDate(from); setToDate(to) }}
            />
          </div>
        )}

        {tab === 'revenue' && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">สถานี</label>
            <Select
              value={revenueStation}
              onChange={(v) => setRevenueStation(v)}
              placeholder="ทุกสถานี"
              options={stationList.map((s) => ({ value: s.station_id, label: s.name }))}
            />
          </div>
        )}

        {tab === 'usage' && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">สถานะ</label>
            <Select
              value={usageStatus}
              onChange={(v) => setUsageStatus(v)}
              placeholder="ทั้งหมด"
              options={[
                { value: 'completed', label: 'เสร็จสิ้น' },
                { value: 'charging', label: 'กำลังชาร์จ' },
              ]}
            />
          </div>
        )}

        {tab === 'comparison' && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">เปรียบเทียบ</label>
            <Select
              value={compareType}
              onChange={(v) => { setCompareType(v); fetchComparison(v) }}
              options={compareOptions.map((o) => ({ value: o.v, label: o.l }))}
            />
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
          {tab === 'revenue' && (() => {
            const totalPages = Math.max(1, Math.ceil(revenue.length / PER_PAGE))
            const paged = revenue.slice((revPage - 1) * PER_PAGE, revPage * PER_PAGE)
            return (
              <>
                <div style={{ maxHeight: SCROLL_H, overflowY: 'auto' }}>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                      <tr>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600" colSpan={3}>
                          <span className="text-gray-600">รายวัน</span>
                          <span className="font-normal text-gray-400 ml-2 text-xs">ตั้งแต่ {fmtDate(fromDate)} ถึง {fmtDate(toDate)}</span>
                        </th>
                      </tr>
                      <tr>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">วันที่</th>
                        <th className="text-right px-5 py-3 font-semibold text-gray-600">รายได้ (฿)</th>
                        <th className="text-right px-5 py-3 font-semibold text-gray-600">รายการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paged.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-gray-700">{formatPeriodDate(r.period_date ?? r.period ?? r.date, period)}</td>
                          <td className="px-5 py-3 text-right font-semibold text-primary">{Number(r.revenue ?? 0).toFixed(2)}</td>
                          <td className="px-5 py-3 text-right text-gray-500">{r.transaction_count ?? '-'}</td>
                        </tr>
                      ))}
                      {revenue.length === 0 && <tr><td colSpan={3} className="text-center py-10 text-gray-400">ไม่มีข้อมูล</td></tr>}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 px-5 py-3 border-t border-gray-100">
                    <button disabled={revPage === 1} onClick={() => setRevPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">‹</button>
                    <span className="px-2 text-sm text-gray-500">{revPage} / {totalPages}</span>
                    <button disabled={revPage === totalPages} onClick={() => setRevPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">›</button>
                  </div>
                )}
              </>
            )
          })()}

          {/* Stations Tab */}
          {tab === 'stations' && (() => {
            const totalPages = Math.max(1, Math.ceil(stationStats.length / PER_PAGE))
            const paged = stationStats.slice((staPage - 1) * PER_PAGE, staPage * PER_PAGE)
            return (
              <>
                <div style={{ maxHeight: SCROLL_H, overflowY: 'auto' }}>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                      <tr>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">สถานี</th>
                        <th className="text-right px-5 py-3 font-semibold text-gray-600">ตู้ชาร์จ</th>
                        <th className="text-right px-5 py-3 font-semibold text-gray-600">จำนวนครั้งชาร์จ</th>
                        <th className="text-right px-5 py-3 font-semibold text-gray-600">รายได้ (฿) <span className="font-normal text-gray-400 text-xs">(ช่วงที่เลือก)</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paged.map((s) => (
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
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 px-5 py-3 border-t border-gray-100">
                    <button disabled={staPage === 1} onClick={() => setStaPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">‹</button>
                    <span className="px-2 text-sm text-gray-500">{staPage} / {totalPages}</span>
                    <button disabled={staPage === totalPages} onClick={() => setStaPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">›</button>
                  </div>
                )}
              </>
            )
          })()}

          {/* Usage Tab */}
          {tab === 'usage' && (() => {
            const totalPages = Math.max(1, Math.ceil(usage.length / PER_PAGE))
            const paged = usage.slice((usagePage - 1) * PER_PAGE, usagePage * PER_PAGE)
            return (
              <>
                <div style={{ maxHeight: SCROLL_H, overflowY: 'auto' }}>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                      <tr>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">ตู้ชาร์จ</th>
                        <th className="text-right px-5 py-3 font-semibold text-gray-600">จำนวนครั้งชาร์จ</th>
                        <th className="text-right px-5 py-3 font-semibold text-gray-600">พลังงานรวม (kWh)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paged.map((u) => (
                        <tr key={u.charger_id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-900">{u.charger_name}</td>
                          <td className="px-5 py-3 text-right text-gray-600">{u.total_sessions}</td>
                          <td className="px-5 py-3 text-right text-gray-600">
                            {u.total_energy_kwh != null && Number(u.total_energy_kwh) > 0 ? Number(u.total_energy_kwh).toFixed(2) : <span className="text-gray-300">-</span>}
                          </td>
                        </tr>
                      ))}
                      {usage.length === 0 && <tr><td colSpan={3} className="text-center py-10 text-gray-400">ไม่มีข้อมูล</td></tr>}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 px-5 py-3 border-t border-gray-100">
                    <button disabled={usagePage === 1} onClick={() => setUsagePage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">‹</button>
                    <span className="px-2 text-sm text-gray-500">{usagePage} / {totalPages}</span>
                    <button disabled={usagePage === totalPages} onClick={() => setUsagePage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">›</button>
                  </div>
                )}
              </>
            )
          })()}

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