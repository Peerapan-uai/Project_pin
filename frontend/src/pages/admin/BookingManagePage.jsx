import { useState, useEffect } from 'react'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import { FaCalendarAlt, FaBan } from 'react-icons/fa'

export default function BookingManagePage() {
  const [bookings, setBookings]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate]     = useState('')

  const fetchBookings = () => {
    setLoading(true)
    api.get('/api/bookings/all')
      .then((res) => setBookings(res.data.bookings ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBookings() }, [])

  const cancelBooking = (id) => {
    if (!window.confirm('ยืนยันการยกเลิกการจองนี้?')) return
    api.patch(`/api/bookings/${id}/admin-cancel`)
      .then(() => fetchBookings())
      .catch((err) => console.error(err))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const statuses = ['all', 'confirmed', 'completed', 'cancelled']

  const filtered = bookings.filter((b) => {
    const matchStatus = filterStatus === 'all' || b.status === filterStatus
    const matchDate   = !filterDate || (b.start_time && b.start_time.startsWith(filterDate))
    return matchStatus && matchDate
  })

  const totalRevenue = filtered
    .filter((b) => b.payment_status === 'completed' && b.total_amount)
    .reduce((sum, b) => sum + Number(b.total_amount), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">การจองทั้งหมด</h1>
        <p className="text-gray-500 text-sm mt-0.5">รายการจองในระบบ {bookings.length} รายการ · รายได้ที่กรอง {totalRevenue.toFixed(2)} ฿</p>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterStatus === s ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/50'}`}
            >
              {s === 'all' ? 'ทั้งหมด' : <StatusBadge status={s} />}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600">#</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600">ผู้ใช้</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">สถานี / ตู้</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">วันที่</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">สถานะ</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">ชำระเงิน</th>
              <th className="text-right px-5 py-3.5 font-semibold text-gray-600">ยอดเงิน</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((b) => (
              <tr key={b.booking_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 text-gray-400 text-xs">#{b.booking_id}</td>
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">{b.first_name} {b.last_name}</p>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <p className="text-gray-800">{b.station_name}</p>
                  <p className="text-xs text-gray-400">{b.charger_name}</p>
                </td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <FaCalendarAlt size={10} />
                    {b.start_time ? new Date(b.start_time).toLocaleDateString('th-TH') : '-'}
                  </div>
                </td>
                <td className="px-5 py-4 text-center">
                  {b.status ? <StatusBadge status={b.status} /> : <span className="text-gray-400 text-xs">-</span>}
                </td>
                <td className="px-5 py-4 text-center hidden md:table-cell">
                  {b.payment_method
                    ? <span className="text-xs text-gray-600">{b.payment_method}</span>
                    : <span className="text-gray-300 text-xs">-</span>
                  }
                </td>
                <td className="px-5 py-4 text-right font-semibold text-primary">
                  {b.total_amount ? `${Number(b.total_amount).toFixed(2)} ฿` : '-'}
                </td>
                <td className="px-5 py-4 text-center">
                  {b.status !== 'cancelled' && b.status !== 'completed' && (
                    <button
                      onClick={() => cancelBooking(b.booking_id)}
                      className="flex items-center gap-1 mx-auto px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    >
                      <FaBan size={10} /> ยกเลิก
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">ไม่มีรายการจอง</div>
        )}
      </div>
    </div>
  )
}
