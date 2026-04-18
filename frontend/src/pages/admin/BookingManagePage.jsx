import { useState, useEffect } from 'react'
import api from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../context/ToastContext'
import CalendarPicker from '../../components/ui/CalendarPicker'
import { FaCalendarAlt, FaBan, FaTimes } from 'react-icons/fa'

export default function BookingManagePage() {
  const toast = useToast()
  const [bookings, setBookings]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [filterStatus, setFilterStatus]     = useState('all')
  const [filterDate, setFilterDate]         = useState('')
  const [confirmCancelId, setConfirmCancelId] = useState(null)

  const fetchBookings = () => {
    setLoading(true)
    api.get('/api/bookings/all')
      .then((res) => setBookings(res.data.bookings ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBookings() }, [])

  const cancelBooking = () => {
    if (!confirmCancelId) return
    api.patch(`/api/bookings/${confirmCancelId}/admin-cancel`)
      .then(() => { setConfirmCancelId(null); fetchBookings(); toast.success('ยกเลิกการจองสำเร็จ') })
      .catch((err) => { setConfirmCancelId(null); toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด') })
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
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">การจองทั้งหมด</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {filtered.length} รายการ
            {totalRevenue > 0 && (
              <span> · รายได้ <span className="text-primary font-semibold">{totalRevenue.toFixed(2)} ฿</span>
                <span className="text-xs text-gray-400 ml-1">
                  {filterDate ? `(${filterDate})` : filterStatus !== 'all' ? `(${filterStatus})` : '(ตลอดเวลา — เฉพาะที่ชำระแล้ว)'}
                </span>
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filterStatus === s ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/50'}`}
            >
              {s === 'all' ? 'ทั้งหมด' : <StatusBadge status={s} />}
            </button>
          ))}
          <div className="w-44">
            <CalendarPicker value={filterDate} onChange={setFilterDate} placeholder="กรองวันที่" />
          </div>
        </div>
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
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">วิธีชำระ</th>
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
                    : b.status === 'completed'
                      ? <span className="text-gray-300 text-xs">-</span>
                      : <span className="text-xs text-amber-400">รอชำระ</span>
                  }
                </td>
                <td className="px-5 py-4 text-right font-semibold text-primary">
                  {b.total_amount
                    ? `${Number(b.total_amount).toFixed(2)} ฿`
                    : b.status === 'completed'
                      ? <span className="text-gray-300 text-xs">-</span>
                      : <span className="text-xs text-amber-400 font-normal">รอชำระ</span>
                  }
                </td>
                <td className="px-5 py-4 text-center">
                  {b.status !== 'cancelled' && b.status !== 'completed' && (
                    <button
                      onClick={() => setConfirmCancelId(b.booking_id)}
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

      {/* Confirm Cancel Modal */}
      {confirmCancelId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
              <FaBan size={18} className="text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-900 text-lg">ยืนยันยกเลิกการจอง</h3>
              <p className="text-gray-500 text-sm mt-1">การจอง #{confirmCancelId} จะถูกยกเลิกและคืนตู้ชาร์จทันที</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmCancelId(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium">
                ไม่ยกเลิก
              </button>
              <button onClick={cancelBooking}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
                ยืนยันยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
