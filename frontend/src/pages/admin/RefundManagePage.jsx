import { useState, useEffect } from 'react'
import api, { BASE_URL } from '../../utils/api'
import { FaUndo, FaCheck, FaTimes, FaImage } from 'react-icons/fa'

export default function RefundManagePage() {
  const [refunds, setRefunds]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [processing, setProcessing]     = useState(null)
  const [rejectModal, setRejectModal]   = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [imageModal, setImageModal]     = useState(null)
  const [filterStatus, setFilterStatus] = useState('pending')

  const fetchRefunds = () => {
    setLoading(true)
    api.get(`/api/admin/refunds?status=${filterStatus}`)
      .then((res) => setRefunds(res.data.refund_request ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRefunds() }, [filterStatus])

  const handleApprove = (requestId) => {
    if (!window.confirm('อนุมัติคืนเงินให้ผู้ใช้คนนี้?')) return
    setProcessing(requestId)
    api.post(`/api/admin/refunds/${requestId}/approve`)
      .then(() => fetchRefunds())
      .catch((err) => alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setProcessing(null))
  }

  const handleReject = () => {
    setProcessing(rejectModal)
    api.post(`/api/admin/refunds/${rejectModal}/reject`, { reason: rejectReason })
      .then(() => {
        setRejectModal(null)
        setRejectReason('')
        fetchRefunds()
      })
      .catch((err) => alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setProcessing(null))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">คำขอคืนเงิน</h1>
          <p className="text-gray-500 text-sm mt-0.5">{refunds.length} รายการ</p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="pending">รอดำเนินการ</option>
          <option value="approved">อนุมัติแล้ว</option>
          <option value="rejected">ปฏิเสธแล้ว</option>
        </select>
      </div>

      {/* รายการ */}
      <div className="space-y-4">
        {refunds.map((rr) => {
          const images = rr.image_url ? JSON.parse(rr.image_url) : []
          return (
            <div key={rr.request_id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900">{rr.first_name} {rr.last_name}</p>
                    <span className="text-xs text-gray-400">{rr.email}</span>
                  </div>
                  <p className="text-xl font-bold text-primary mb-2">
                    {Number(rr.amount).toFixed(2)} ฿
                    <span className="text-xs font-normal text-gray-400 ml-2">({rr.method})</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">เหตุผล:</span> {rr.reason}
                  </p>
                  <p className="text-xs text-gray-400">
                    ขอเมื่อ {new Date(rr.created_at).toLocaleDateString('th-TH', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                  {images.length > 0 && (
                    <button
                      onClick={() => setImageModal(images)}
                      className="mt-2 flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700"
                    >
                      <FaImage size={12} /> ดูรูปที่แนบ ({images.length} รูป)
                    </button>
                  )}
                </div>

                {/* ปุ่ม approve/reject */}
                {filterStatus === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(rr.request_id)}
                      disabled={processing === rr.request_id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold hover:bg-green-600 disabled:opacity-50"
                    >
                      <FaCheck size={11} />
                      {processing === rr.request_id ? 'กำลังดำเนินการ...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => { setRejectModal(rr.request_id); setRejectReason('') }}
                      disabled={processing === rr.request_id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 disabled:opacity-50"
                    >
                      <FaTimes size={11} /> Reject
                    </button>
                  </div>
                )}

                {/* badge สถานะถ้าไม่ใช่ pending */}
                {filterStatus !== 'pending' && (
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
                    rr.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {rr.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {refunds.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FaUndo size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ไม่มีคำขอคืนเงิน</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">ปฏิเสธคำขอคืนเงิน</h2>
              <button onClick={() => setRejectModal(null)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">เหตุผล (optional)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="ระบุเหตุผลที่ปฏิเสธ..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectModal(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing === rejectModal}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
                >
                  {processing === rejectModal ? 'กำลังดำเนินการ...' : 'ยืนยันปฏิเสธ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModal(null)}
        >
          <div className="bg-white rounded-2xl p-4 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-900">รูปที่แนบ</p>
              <button onClick={() => setImageModal(null)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {imageModal.map((src, i) => (
                <img
                  key={i}
                  src={`${BASE_URL}${src}`}
                  alt={`รูป ${i + 1}`}
                  className="w-full rounded-xl object-cover border border-gray-100"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}