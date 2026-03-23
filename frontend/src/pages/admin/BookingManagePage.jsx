import { useState, useEffect } from 'react'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import { FaCalendarAlt } from 'react-icons/fa'

export default function BookingManagePage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/api/bookings')
      .then((res) => setBookings(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">การจองทั้งหมด</h1>
        <p className="text-gray-500 text-sm mt-0.5">รายการจองในระบบ {bookings.length} รายการ</p>
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
              <th className="text-right px-5 py-3.5 font-semibold text-gray-600">ยอดเงิน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <tr key={b.booking_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 text-gray-400 text-xs">#{b.booking_id}</td>
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">{b.first_name} {b.last_name}</p>
                  <p className="text-xs text-gray-400">{b.vehicle_name}</p>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <p className="text-gray-800">{b.station_name}</p>
                  <p className="text-xs text-gray-400">{b.charger_name}</p>
                </td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <FaCalendarAlt size={10} />
                    {new Date(b.start_time).toLocaleDateString('th-TH')}
                  </div>
                </td>
                <td className="px-5 py-4 text-center"><StatusBadge status={b.status} /></td>
                <td className="px-5 py-4 text-right font-semibold text-primary">
                  {b.total_amount ? `${b.total_amount} ฿` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
