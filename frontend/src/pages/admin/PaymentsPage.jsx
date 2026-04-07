import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { FaMoneyBillWave, FaSearch } from 'react-icons/fa'

export default function PaymentsPage() {
  const [payments, setPayments]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filterMethod, setFilterMethod] = useState('all')
  const [filterStation, setFilterStation] = useState('all')
  const [filterDate, setFilterDate]     = useState('')

  useEffect(() => {
    api.get('/api/payments/admin/all')
      .then((res) => setPayments(res.data.payments ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const stations = [...new Set(payments.map((p) => p.station_name).filter(Boolean))]
  const methods  = [...new Set(payments.map((p) => p.method).filter(Boolean))]

  const filtered = payments.filter((p) => {
    const matchSearch  = `${p.first_name} ${p.last_name} ${p.station_name ?? ''}`.toLowerCase().includes(search.toLowerCase())
    const matchMethod  = filterMethod === 'all'  || p.method === filterMethod
    const matchStation = filterStation === 'all' || p.station_name === filterStation
    const matchDate    = !filterDate || (p.paid_at && p.paid_at.startsWith(filterDate))
    return matchSearch && matchMethod && matchStation && matchDate
  })

  const totalRevenue = filtered
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">การเงิน</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {filtered.length} รายการ · รวม {totalRevenue.toFixed(2)} ฿
        </p>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FaSearch size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อผู้ใช้, สถานี..."
            className="w-full pl-9 pr-4 border border-gray-300 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterStation}
          onChange={(e) => setFilterStation(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="all">ทุกสถานี</option>
          {stations.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="all">ทุกวิธีชำระ</option>
          {methods.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600">#</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600">ผู้ใช้</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">สถานี / ตู้</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">วิธีชำระ</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">วันที่</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">หน่วย (kWh)</th>
              <th className="text-right px-5 py-3.5 font-semibold text-gray-600">ยอดเงิน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p) => (
              <tr key={p.payment_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 text-gray-400 text-xs">#{p.payment_id}</td>
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">{p.first_name} {p.last_name}</p>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <p className="text-gray-800">{p.station_name}</p>
                  <p className="text-xs text-gray-400">{p.charger_name}</p>
                </td>
                <td className="px-5 py-4 text-center hidden md:table-cell">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{p.method}</span>
                </td>
                <td className="px-5 py-4 text-center text-xs text-gray-500 hidden lg:table-cell">
                  {p.paid_at ? new Date(p.paid_at).toLocaleDateString('th-TH') : '-'}
                </td>
                <td className="px-5 py-4 text-center text-gray-600 hidden lg:table-cell">
                  {p.energy_kwh ? `${Number(p.energy_kwh).toFixed(2)}` : '-'}
                </td>
                <td className="px-5 py-4 text-right font-semibold text-primary">
                  {p.amount ? `${Number(p.amount).toFixed(2)} ฿` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FaMoneyBillWave size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ไม่มีรายการชำระเงิน</p>
          </div>
        )}
      </div>
    </div>
  )
}
