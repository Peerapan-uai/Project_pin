import { useState, useEffect } from 'react'
import api, { BASE_URL } from '../../utils/api'
import { useToast } from '../../context/ToastContext'
import Select from '../../components/ui/Select'
import { FaUndo, FaCheck, FaTimes, FaImage } from 'react-icons/fa'

const REJECT_PRESETS = [
  'ตรวจสอบแล้วระบบบันทึกว่าชาร์จสำเร็จครบถ้วน',
  'หลักฐานที่แนบมาไม่เพียงพอหรือไม่ชัดเจน',
  'เกินระยะเวลา 7 วันนับจากวันชาร์จ',
  'ไม่เข้าเงื่อนไขการขอคืนเงิน',
  'คำขอซ้ำกับที่เคยดำเนินการแล้ว',
  'อื่นๆ',
]

export default function RefundManagePage() {
  const toast = useToast()
  const [refunds, setRefunds]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [processing, setProcessing]       = useState(null)
  const [rejectModal, setRejectModal]     = useState(null)   // request_id
  const [rejectPreset, setRejectPreset]   = useState('')
  const [rejectCustom, setRejectCustom]   = useState('')
  const [approveModal, setApproveModal]   = useState(null)   // refund object
  const [imageModal, setImageModal]       = useState(null)
  const [filterStatus, setFilterStatus]   = useState('pending')

  const fetchRefunds = () => {
    setLoading(true)
    api.get(`/api/admin/refunds?status=${filterStatus}`)
      .then((res) => setRefunds(res.data.refund_request ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRefunds() }, [filterStatus])

  const handleApprove = () => {
    if (!approveModal) return
    setProcessing(approveModal.request_id)
    api.post(`/api/admin/refunds/${approveModal.request_id}/approve`)
      .then(() => { setApproveModal(null); fetchRefunds() })
      .catch((err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setProcessing(null))
  }

  const handleReject = () => {
    const reason = rejectPreset === 'อื่นๆ' ? rejectCustom : rejectPreset
    setProcessing(rejectModal)
    api.post(`/api/admin/refunds/${rejectModal}/reject`, { reason })
      .then(() => {
        setRejectModal(null)
        setRejectPreset('')
        setRejectCustom('')
        fetchRefunds()
      })
      .catch((err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
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
        <Select
          value={filterStatus}
          onChange={(v) => setFilterStatus(v)}
          options={[
            { value: 'pending', label: 'รอดำเนินการ' },
            { value: 'approved', label: 'อนุมัติแล้ว' },
            { value: 'rejected', label: 'ปฏิเสธแล้ว' },
          ]}
        />
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
                  <p className="text-sm font-semibold text-gray-800 mb-0.5">{rr.title}</p>
                  {rr.reason && (
                    <p className="text-sm text-gray-600 mb-1">{rr.reason}</p>
                  )}
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
                      onClick={() => setApproveModal(rr)}
                      disabled={processing === rr.request_id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold hover:bg-green-600 disabled:opacity-50"
                    >
                      <FaCheck size={11} />
                      {processing === rr.request_id ? 'กำลังดำเนินการ...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => { setRejectModal(rr.request_id); setRejectPreset(''); setRejectCustom('') }}
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

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">ยืนยันอนุมัติคืนเงิน</h2>
              <button onClick={() => setApproveModal(null)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <div className="p-6 space-y-3">
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
                <p className="font-semibold text-gray-800">{approveModal.first_name} {approveModal.last_name}</p>
                <p className="text-gray-500 text-xs">{approveModal.email}</p>
                <p className="font-bold text-green-600 text-lg">{Number(approveModal.amount).toFixed(2)} ฿</p>
                <p className="text-gray-700">{approveModal.title}</p>
                {approveModal.reason && <p className="text-gray-500 text-xs">{approveModal.reason}</p>}
              </div>
              <p className="text-sm text-gray-600">เงินจำนวน <span className="font-bold text-green-600">{Number(approveModal.amount).toFixed(2)} ฿</span> จะถูกโอนเข้า wallet ของผู้ใช้ทันที</p>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setApproveModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing === approveModal.request_id}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                >
                  {processing === approveModal.request_id ? 'กำลังดำเนินการ...' : 'ยืนยันอนุมัติ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <label className="text-xs font-medium text-gray-600 mb-2 block">เหตุผลที่ปฏิเสธ</label>
                <div className="space-y-2">
                  {REJECT_PRESETS.map((preset) => (
                    <label key={preset} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 border border-transparent has-[:checked]:border-red-200 has-[:checked]:bg-red-50">
                      <input
                        type="radio"
                        name="rejectPreset"
                        value={preset}
                        checked={rejectPreset === preset}
                        onChange={() => { setRejectPreset(preset); setRejectCustom('') }}
                        className="accent-red-500"
                      />
                      <span className="text-sm text-gray-700">{preset}</span>
                    </label>
                  ))}
                </div>
                {rejectPreset === 'อื่นๆ' && (
                  <textarea
                    value={rejectCustom}
                    onChange={(e) => setRejectCustom(e.target.value)}
                    rows={3}
                    placeholder="ระบุเหตุผลเพิ่มเติม..."
                    autoFocus
                    className="mt-3 w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  />
                )}
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
                  disabled={processing === rejectModal || !rejectPreset || (rejectPreset === 'อื่นๆ' && !rejectCustom.trim())}
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