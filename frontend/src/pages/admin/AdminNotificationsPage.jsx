import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { FaBell, FaBolt, FaShoppingCart, FaTools, FaCalendarCheck } from 'react-icons/fa'

const typeIcon = { booking: FaCalendarCheck, charging: FaBolt, payment: FaShoppingCart, maintenance: FaTools }
const typeBg   = { booking: 'bg-blue-100 text-blue-600', charging: 'bg-green-100 text-primary', payment: 'bg-amber-100 text-amber-600', maintenance: 'bg-orange-100 text-orange-600' }

const isWithin = (dateStr, period) => {
  const d   = new Date(dateStr)
  const now = new Date()
  if (period === 'day')   return d.toDateString() === now.toDateString()
  if (period === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0)
    return d >= start
  }
  if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  if (period === 'year')  return d.getFullYear() === now.getFullYear()
  return true
}

export default function AdminNotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [showSendModal, setShowSendModal]   = useState(false)
  const [sendForm, setSendForm]             = useState({ mode: 'broadcast', target_type: 'role', target_value: 'user', title: '', message: '', type: 'system', scheduled_at: '' })
  const [specificTechId, setSpecificTechId] = useState('')
  const [sending, setSending]               = useState(false)
  const [sendResult, setSendResult]         = useState(null)
  const [users, setUsers]                 = useState([])
  const [filterUser, setFilterUser]       = useState('')
  const [filterRole, setFilterRole]       = useState('all')
  const [filterPeriod, setFilterPeriod]   = useState('all')
  const [loading, setLoading]             = useState(true)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/admin/notifications/all'),
      api.get('/api/users'),
    ])
      .then(([notifRes, usersRes]) => {
        setNotifications(notifRes.data.notifications ?? [])
        setUsers(usersRes.data.users ?? [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleSend = () => {
    if (!sendForm.title || !sendForm.message) return alert('กรุณากรอก title และ message')
    setSending(true)
    setSendResult(null)

    const isTechRole = sendForm.target_type === 'role' && sendForm.target_value === 'technician'
    const effectiveTargetType  = (isTechRole && specificTechId) ? 'user_ids' : sendForm.target_type
    const effectiveTargetValue = (isTechRole && specificTechId) ? specificTechId : sendForm.target_value

    let endpoint, payload
    if (sendForm.mode === 'broadcast') {
      endpoint = '/api/admin/notifications/broadcast'
      payload = { title: sendForm.title, message: sendForm.message, type: sendForm.type }
    } else if (sendForm.mode === 'targeted') {
      endpoint = '/api/admin/notifications/targeted'
      payload = { title: sendForm.title, message: sendForm.message, type: sendForm.type, target_type: effectiveTargetType, target_value: effectiveTargetValue }
    } else {
      endpoint = '/api/admin/notifications/schedule'
      if (!sendForm.scheduled_at) return alert('กรุณาเลือกเวลาที่จะส่ง')
      payload = { title: sendForm.title, message: sendForm.message, type: sendForm.type, target_type: effectiveTargetType, target_value: effectiveTargetValue, scheduled_at: sendForm.scheduled_at }
    }

    api.post(endpoint, payload)
      .then((res) => {
        setSendResult({ success: true, text: `ส่งสำเร็จ ${res.data.recipients_count ?? ''} คน` })
        setSendForm((f) => ({ ...f, title: '', message: '' }))
        fetchData()
      })
      .catch((err) => setSendResult({ success: false, text: err.response?.data?.message || 'เกิดข้อผิดพลาด' }))
      .finally(() => setSending(false))
  }

  const markAllRead = () => {
    api.patch('/api/notifications/read-all')
      .then(() => fetchData())
      .catch((err) => console.error(err))
  }

  const markRead = (id) => {
    api.patch(`/api/notifications/${id}/read`)
      .then(() => setNotifications((prev) => prev.filter((n) => n.notification_id !== id)))
      .catch((err) => console.error(err))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const filtered = notifications.filter((n) => {
    const user = users.find((u) => u.user_id === n.user_id)
    const matchUser   = !filterUser.trim() ||
      `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.toLowerCase().includes(filterUser.toLowerCase()) ||
      String(n.user_id).includes(filterUser.trim())
    const matchRole   = filterRole === 'all' || user?.role === filterRole
    const matchPeriod = isWithin(n.created_at, filterPeriod)
    return matchUser && matchRole && matchPeriod
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การแจ้งเตือน</h1>
          <p className="text-gray-500 text-sm mt-0.5">ยังไม่อ่าน {unreadCount} รายการ · ทั้งหมด {notifications.length} รายการ</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-600 hover:bg-gray-200 font-medium">
              อ่านทั้งหมด
            </button>
          )}
          <button onClick={() => setShowSendModal(true)} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600">
            + ส่งแจ้งเตือน
          </button>
        </div>
      </div>

      {/* Send Notification Panel */}
      {showSendModal && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">ส่งการแจ้งเตือน</h2>
            <button onClick={() => { setShowSendModal(false); setSendResult(null) }} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-4">
            {[{ v: 'broadcast', l: 'Broadcast (ทุกคน)' }, { v: 'targeted', l: 'Targeted (เลือกกลุ่ม)' }, { v: 'schedule', l: 'Schedule (ตั้งเวลา)' }].map(({ v, l }) => (
              <button key={v} onClick={() => setSendForm((f) => ({ ...f, mode: v }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${sendForm.mode === v ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary/50'}`}>
                {l}
              </button>
            ))}
          </div>

          {(() => {
            const isTechTarget = sendForm.mode !== 'broadcast' && sendForm.target_type === 'role' && sendForm.target_value === 'technician'
            const typeOptions = isTechTarget
              ? [{ v: 'maintenance', l: 'แจ้งซ่อม' }, { v: 'system', l: 'ทั่วไป' }]
              : [{ v: 'system', l: 'ทั่วไป' }, { v: 'booking', l: 'การจอง' }, { v: 'charging', l: 'การชาร์จ' }, { v: 'payment', l: 'การชำระเงิน' }]
            const techUsers = users.filter((u) => u.role === 'technician')
            return (
          <div className="space-y-3">
            {/* Target (targeted + schedule) */}
            {(sendForm.mode === 'targeted' || sendForm.mode === 'schedule') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">ประเภทผู้รับ</label>
                  <select value={sendForm.target_type} onChange={(e) => setSendForm((f) => ({ ...f, target_type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                    <option value="role">ตาม Role</option>
                    <option value="user_ids">ระบุ User ID</option>
                    {sendForm.mode === 'schedule' && <option value="all">ทุกคน</option>}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    {sendForm.target_type === 'role' ? 'Role' : sendForm.target_type === 'all' ? '-' : 'User IDs (คั่นด้วย ,)'}
                  </label>
                  {sendForm.target_type === 'role' ? (
                    <select value={sendForm.target_value}
                      onChange={(e) => {
                        const val = e.target.value
                        setSpecificTechId('')
                        setSendForm((f) => ({ ...f, target_value: val, type: val === 'technician' ? 'maintenance' : 'system' }))
                      }}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                      <option value="user">User</option>
                      <option value="technician">ช่าง</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : sendForm.target_type === 'all' ? (
                    <input disabled value="ทุกคน" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-400" />
                  ) : (
                    <input value={sendForm.target_value} onChange={(e) => setSendForm((f) => ({ ...f, target_value: e.target.value }))}
                      placeholder="เช่น 1,2,5" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  )}
                </div>
              </div>
            )}

            {/* Specific tech picker */}
            {isTechTarget && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ส่งหา</label>
                <select value={specificTechId} onChange={(e) => setSpecificTechId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                  <option value="">ช่างทุกคน ({techUsers.length} คน)</option>
                  {techUsers.map((t) => (
                    <option key={t.user_id} value={t.user_id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Schedule time */}
            {sendForm.mode === 'schedule' && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">เวลาที่จะส่ง</label>
                <input type="datetime-local" value={sendForm.scheduled_at} onChange={(e) => setSendForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">หัวข้อ *</label>
                <input value={sendForm.title} onChange={(e) => setSendForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="หัวข้อแจ้งเตือน" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ประเภท</label>
                <select value={sendForm.type} onChange={(e) => setSendForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                  {typeOptions.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">ข้อความ *</label>
              <textarea value={sendForm.message} onChange={(e) => setSendForm((f) => ({ ...f, message: e.target.value }))}
                rows={2} placeholder="ข้อความแจ้งเตือน"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>

            {sendResult && (
              <p className={`text-sm px-3 py-2 rounded-xl ${sendResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {sendResult.text}
              </p>
            )}

            <button onClick={handleSend} disabled={sending}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50">
              {sending ? 'กำลังส่ง...' : sendForm.mode === 'schedule' ? 'ตั้งเวลาส่ง' : 'ส่งแจ้งเตือน'}
            </button>
          </div>
          )
        })()}
        </div>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          placeholder="ค้นหาชื่อหรือ ID ผู้ใช้..."
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="all">ทุก role</option>
          <option value="user">User</option>
          <option value="technician">ช่าง</option>
        </select>
        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="all">ทุกช่วงเวลา</option>
          <option value="day">วันนี้</option>
          <option value="week">7 วันล่าสุด</option>
          <option value="month">เดือนนี้</option>
          <option value="year">ปีนี้</option>
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((n) => {
          const user = users.find((u) => u.user_id === n.user_id)
          const Icon = typeIcon[n.type] || FaBell
          return (
            <div
              key={n.notification_id}
              onClick={() => {
                if (!n.is_read) markRead(n.notification_id)
                if (n.type === 'maintenance') navigate('/admin/tickets')
                else if (n.type === 'payment') navigate('/admin/refunds')
              }}
              className={`bg-white rounded-xl p-4 shadow-sm border flex gap-4 transition-colors cursor-pointer ${
                !n.is_read ? 'border-primary/20 hover:bg-primary/5' : 'border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeBg[n.type] || 'bg-gray-100 text-gray-500'}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-semibold text-sm ${!n.is_read ? 'text-gray-900' : 'text-gray-500'}`}>{n.title}</p>
                  {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  ถึง: {user?.first_name} {user?.last_name} · {new Date(n.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <FaBell size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ไม่มีการแจ้งเตือน</p>
          </div>
        )}
      </div>
    </div>
  )
}
