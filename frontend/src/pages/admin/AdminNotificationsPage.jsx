import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useToast } from '../../context/ToastContext'
import { useNotifications } from '../../context/NotificationContext'
import DateTimePicker from '../../components/ui/DateTimePicker'
import DateRangePicker from '../../components/ui/DateRangePicker'
import Select from '../../components/ui/Select'
import { FaBell, FaBolt, FaShoppingCart, FaTools, FaCalendarCheck, FaGift } from 'react-icons/fa'

const typeIcon = { booking: FaCalendarCheck, charging: FaBolt, payment: FaShoppingCart, maintenance: FaTools, promotion: FaGift }
const typeBg   = { booking: 'bg-blue-100 text-blue-600', charging: 'bg-green-100 text-primary', payment: 'bg-amber-100 text-amber-600', maintenance: 'bg-orange-100 text-orange-600', promotion: 'bg-purple-100 text-purple-600' }

const titleMap = { system: 'ประกาศ', promotion: 'โปรโมชัน', maintenance: 'แจ้งซ่อม' }


export default function AdminNotificationsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  // context ใช้สำหรับ badge (unread count ของ admin เอง)
  const { refresh: refreshBadge } = useNotifications()

  const markRead = (id) => {
    api.patch(`/api/admin/notifications/${id}/read`)
      .then(() => {
        setNotifications((prev) => prev.map((n) => n.notification_id === id ? { ...n, is_read: true } : n))
        refreshBadge()
      })
      .catch((err) => {
        console.error('markRead failed', err)
        toast.error('ไม่สามารถทำเครื่องหมายอ่านได้')
      })
  }

  const markAllRead = () => {
    api.patch('/api/admin/notifications/read-all')
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        refreshBadge()
      })
      .catch((err) => {
        console.error('markAllRead failed', err)
        toast.error('ไม่สามารถทำเครื่องหมายอ่านทั้งหมดได้')
      })
  }
  // list ใน page นี้ใช้ /api/admin/notifications/all (ทุกคนในระบบ)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [showSendModal, setShowSendModal]   = useState(false)
  const [sendForm, setSendForm]             = useState({ mode: 'broadcast', target_type: 'role', target_value: 'user', message: '', type: 'system', scheduled_at: '' })
  const [specificTechId, setSpecificTechId] = useState('')
  const [techSearch, setTechSearch]         = useState('')
  const [techDropOpen, setTechDropOpen]     = useState(false)
  const techDropRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (techDropRef.current && !techDropRef.current.contains(e.target)) setTechDropOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  const [sending, setSending]               = useState(false)
  const [sendResult, setSendResult]         = useState(null)
  const [users, setUsers]                 = useState([])
  const [fromDate, setFromDate]           = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate]               = useState(() => new Date().toISOString().split('T')[0])
  const [filterRole, setFilterRole]       = useState('all')
  const [showRead, setShowRead]           = useState(false)
  const [readPage, setReadPage]           = useState(1)
  const READ_PER_PAGE = 10

  const fetchAdminNotifs = () => {
    api.get('/api/admin/notifications/all')
      .then((res) => setNotifications(res.data.notifications ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
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

    // poll ทุก 10 วินาที
    const id = setInterval(fetchAdminNotifs, 10000)
    return () => clearInterval(id)
  }, [])

  const handleSend = () => {
    if (!sendForm.message) return toast.warning('กรุณากรอกเนื้อหา')
    setSending(true)
    setSendResult(null)

    const title = titleMap[sendForm.type] || 'แจ้งเตือน'
    const isTechRole = sendForm.target_type === 'role' && sendForm.target_value === 'technician'
    const effectiveTargetType  = (isTechRole && specificTechId) ? 'user_ids' : sendForm.target_type
    const effectiveTargetValue = (isTechRole && specificTechId) ? specificTechId : sendForm.target_value

    let endpoint, payload
    if (sendForm.mode === 'broadcast') {
      endpoint = '/api/admin/notifications/broadcast'
      payload = { title, message: sendForm.message, type: sendForm.type }
    } else if (sendForm.mode === 'targeted') {
      endpoint = '/api/admin/notifications/targeted'
      payload = { title, message: sendForm.message, type: sendForm.type, target_type: effectiveTargetType, target_value: effectiveTargetValue }
    } else {
      endpoint = '/api/admin/notifications/schedule'
      if (!sendForm.scheduled_at) return toast.warning('กรุณาเลือกเวลาที่จะส่ง')
      payload = { title, message: sendForm.message, type: sendForm.type, target_type: effectiveTargetType, target_value: effectiveTargetValue, scheduled_at: sendForm.scheduled_at }
    }

    // build descriptive success text
    const roleLabel = { user: 'User', technician: 'ช่าง' }
    let targetDesc = ''
    if (sendForm.mode === 'broadcast') {
      targetDesc = 'ทุกคน'
    } else if (isTechRole && specificTechId) {
      const tech = users.find((u) => String(u.user_id) === String(specificTechId))
      targetDesc = tech ? `${tech.first_name} ${tech.last_name}` : 'ช่าง'
    } else if (sendForm.target_type === 'role') {
      targetDesc = roleLabel[sendForm.target_value] || sendForm.target_value
    } else {
      targetDesc = 'ทุกคน'
    }

    api.post(endpoint, payload)
      .then((res) => {
        const count = res.data.recipients_count ?? ''
        setSendResult({ success: true, text: `ส่งสำเร็จหา ${targetDesc}${count ? ` (${count} คน)` : ''}` })
        setSendForm((f) => ({ ...f, message: '' }))
        setSpecificTechId('')
        setTechSearch('')
        fetchAdminNotifs()
        refreshBadge()
      })
      .catch((err) => setSendResult({ success: false, text: err.response?.data?.message || 'เกิดข้อผิดพลาด' }))
      .finally(() => setSending(false))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const filtered = notifications.filter((n) => {
    const user = users.find((u) => u.user_id === n.user_id) || n
    const nDate = new Date(n.created_at)
    const matchDate = nDate >= new Date(fromDate + 'T00:00:00') && nDate <= new Date(toDate + 'T23:59:59')
    const matchRole = filterRole === 'all' || user?.role === filterRole
    return matchDate && matchRole
  })

  const unreadList = filtered.filter((n) => !n.is_read)
  const readList   = filtered.filter((n) => n.is_read)
  const readTotalPages = Math.ceil(readList.length / READ_PER_PAGE)
  const readPaged  = readList.slice((readPage - 1) * READ_PER_PAGE, readPage * READ_PER_PAGE)

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
              ? [{ v: 'maintenance', l: 'แจ้งซ่อม' }, { v: 'system', l: 'ประกาศ' }]
              : [{ v: 'system', l: 'ประกาศ' }, { v: 'promotion', l: 'โปรโมชัน' }]
            const techUsers = users.filter((u) => u.role === 'technician')
            return (
          <div className="space-y-3">
            {/* Target (targeted + schedule) */}
            {(sendForm.mode === 'targeted' || sendForm.mode === 'schedule') && (
              <div className="grid grid-cols-2 gap-3">
                {sendForm.mode === 'schedule' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">ประเภทผู้รับ</label>
                  <Select
                    value={sendForm.target_type}
                    onChange={(v) => setSendForm((f) => ({ ...f, target_type: v }))}
                    options={[
                      { value: 'role', label: 'ตาม Role' },
                      { value: 'all', label: 'ทุกคน' },
                    ]}
                  />
                </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    {sendForm.target_type === 'all' ? '-' : 'ผู้รับ'}
                  </label>
                  {sendForm.target_type === 'role' ? (
                    <Select
                      value={sendForm.target_value}
                      onChange={(v) => {
                        setSpecificTechId('')
                        setSendForm((f) => ({ ...f, target_value: v, type: v === 'technician' ? 'maintenance' : 'system' }))
                      }}
                      options={[
                        { value: 'user', label: 'User' },
                        { value: 'technician', label: 'Tech' },
                      ]}
                    />
                  ) : (
                    <input disabled value="ทุกคน" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-400" />
                  )}
                </div>
              </div>
            )}

            {/* Specific tech picker — searchable */}
            {isTechTarget && (
              <div className="relative" ref={techDropRef}>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ส่งหา</label>
                <input
                  type="text"
                  value={specificTechId ? (() => { const t = techUsers.find((u) => String(u.user_id) === String(specificTechId)); return t ? `${t.first_name} ${t.last_name}` : techSearch })() : techSearch}
                  onChange={(e) => { setTechSearch(e.target.value); setSpecificTechId(''); setTechDropOpen(true) }}
                  onFocus={() => setTechDropOpen(true)}
                  placeholder={`ค้นหาช่าง... (${techUsers.length} คน)`}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {specificTechId && (
                  <button type="button" onClick={() => { setSpecificTechId(''); setTechSearch(''); setTechDropOpen(false) }}
                    className="absolute right-2 top-[30px] text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                )}
                {techDropOpen && !specificTechId && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {techUsers
                      .filter((t) => {
                        if (!techSearch.trim()) return true
                        const name = `${t.first_name} ${t.last_name}`.toLowerCase()
                        return name.includes(techSearch.toLowerCase())
                      })
                      .map((t) => (
                        <button key={t.user_id} type="button"
                          onClick={() => { setSpecificTechId(t.user_id); setTechSearch(''); setTechDropOpen(false) }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-primary/5 transition-colors">
                          {t.first_name} {t.last_name}
                        </button>
                      ))
                    }
                    {techUsers.filter((t) => {
                      if (!techSearch.trim()) return true
                      return `${t.first_name} ${t.last_name}`.toLowerCase().includes(techSearch.toLowerCase())
                    }).length === 0 && (
                      <p className="px-3 py-2 text-sm text-gray-400">ไม่พบช่าง</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Schedule time */}
            {sendForm.mode === 'schedule' && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">เวลาที่จะส่ง</label>
                <DateTimePicker
                  value={sendForm.scheduled_at}
                  onChange={(v) => setSendForm((f) => ({ ...f, scheduled_at: v }))}
                  placeholder="เลือกวัน & เวลาที่จะส่ง"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">หัวข้อ *</label>
              <Select
                value={sendForm.type}
                onChange={(v) => setSendForm((f) => ({ ...f, type: v }))}
                options={typeOptions.map((o) => ({ value: o.v, label: o.l }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">เนื้อหา *</label>
              <textarea value={sendForm.message} onChange={(e) => setSendForm((f) => ({ ...f, message: e.target.value }))}
                rows={2} placeholder="เนื้อหาแจ้งเตือน"
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

      <div className="flex gap-3 mb-4 flex-wrap items-end">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">ช่วงวันที่</label>
          <DateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            onChange={({ from, to }) => { setFromDate(from); setToDate(to) }}
            single
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Role</label>
          <Select
            value={filterRole}
            onChange={(v) => setFilterRole(v)}
            options={[
              { value: 'all', label: 'ทุก role' },
              { value: 'user', label: 'User' },
              { value: 'technician', label: 'ช่าง' },
            ]}
          />
        </div>
      </div>

      {/* Unread notifications */}
      <div className="space-y-2">
        {unreadList.map((n) => {
          const Icon = typeIcon[n.type] || FaBell
          return (
            <div
              key={n.notification_id}
              onClick={() => {
                markRead(n.notification_id)
                if (n.type === 'maintenance') navigate('/admin/tickets')
                else if (n.type === 'payment') navigate('/admin/refunds')
              }}
              className="bg-white rounded-xl p-4 shadow-sm border border-primary/20 hover:bg-primary/5 flex gap-4 transition-colors cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeBg[n.type] || 'bg-gray-100 text-gray-500'}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-gray-900">{n.title}</p>
                  <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        {unreadList.length === 0 && !showRead && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <FaBell size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ไม่มีการแจ้งเตือนที่ยังไม่อ่าน</p>
          </div>
        )}
      </div>

      {/* Read notifications — collapsible scrollable panel */}
      {readList.length > 0 && (
        <div className="mt-5">
          <button
            onClick={() => { setShowRead((v) => !v); setReadPage(1) }}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 mb-3"
          >
            <span className={`transition-transform ${showRead ? 'rotate-90' : ''}`}>▶</span>
            รายการที่อ่านแล้ว ({readList.length})
          </button>

          {showRead && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ height: Math.min(readList.length * 76 + 50, 480), minHeight: 200 }}>
              {/* Scrollable rows */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {readPaged.map((n) => {
                  const Icon = typeIcon[n.type] || FaBell
                  return (
                    <div
                      key={n.notification_id}
                      onClick={() => {
                        if (n.type === 'maintenance') navigate('/admin/tickets')
                        else if (n.type === 'payment') navigate('/admin/refunds')
                      }}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${typeBg[n.type] || 'bg-gray-100 text-gray-500'}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">{n.title}</p>
                        <p className="text-xs text-gray-400 truncate">{n.message}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(n.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Pagination */}
              {readTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2 px-5 py-3 border-t border-gray-100 flex-shrink-0">
                  <button disabled={readPage === 1} onClick={() => setReadPage((p) => p - 1)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">‹</button>
                  <span className="px-2 text-sm text-gray-500">{readPage} / {readTotalPages}</span>
                  <button disabled={readPage === readTotalPages} onClick={() => setReadPage((p) => p + 1)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">›</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
