import { useState, useEffect } from 'react'
import api, { BASE_URL } from '../../utils/api'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../context/ToastContext'
import { FaTicketAlt, FaUserCog, FaWrench, FaSearch, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa'

const ISSUE_LABEL = {
  safety:          { label: 'อันตราย',   color: 'bg-red-100 text-red-700' },
  no_charge:       { label: 'ชาร์จไม่ได้', color: 'bg-orange-100 text-orange-700' },
  payment:         { label: 'ชำระเงิน',  color: 'bg-orange-100 text-orange-700' },
  physical_damage: { label: 'เสียหาย',   color: 'bg-yellow-100 text-yellow-700' },
  display:         { label: 'หน้าจอ',    color: 'bg-blue-100 text-blue-700' },
  other:           { label: 'อื่นๆ',     color: 'bg-gray-100 text-gray-600' },
}

export default function TicketManagePage() {
  const toast = useToast()
  const [tickets, setTickets]         = useState([])
  const [technicians, setTechnicians] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch]           = useState('')
  const [loading, setLoading]         = useState(true)
  const [assignModal, setAssignModal] = useState(null)
  const [confirmUnassignId, setConfirmUnassignId] = useState(null)
  const [expandedId, setExpandedId]   = useState(null)  // ticket ที่เปิด detail panel

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/tickets'),
      api.get('/api/users'),
    ])
      .then(([ticketsRes, usersRes]) => {
        setTickets(ticketsRes.data.tickets ?? [])
        setTechnicians((usersRes.data.users ?? []).filter((u) => u.role === 'technician'))
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const assign = (ticketId, techId) => {
    api.patch(`/api/tickets/${ticketId}/assign`, { technician_id: Number(techId) })
      .then(() => { setAssignModal(null); fetchData(); toast.success('มอบหมายช่างสำเร็จ') })
      .catch((err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
  }

  const unassign = () => {
    if (!confirmUnassignId) return
    api.patch(`/api/tickets/${confirmUnassignId}/unassign`)
      .then(() => { setAssignModal(null); setConfirmUnassignId(null); fetchData(); toast.success('ยกเลิกการมอบหมายสำเร็จ') })
      .catch((err) => { setConfirmUnassignId(null); toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด') })
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const filtered = tickets.filter((t) => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    const matchSearch = !search.trim() ||
      `${t.title} ${t.description ?? ''} ${t.charger_name ?? ''} ${t.station_name ?? ''}`.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const statuses = ['all', 'reported', 'assigned', 'in_progress', 'completed']

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">จัดการแจ้งซ่อม</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            ทั้งหมด {tickets.length} รายการ · รอมอบหมาย {tickets.filter((t) => t.status === 'reported').length} รายการ
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, ID, สถานี..."
              className="pl-9 pr-4 py-2 w-48 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white" />
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterStatus === s ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/50'}`}>
            {s === 'all' ? 'ทั้งหมด' : <StatusBadge status={s} />}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      <div className="space-y-3">
        {filtered.map((t) => (
          <div key={t.ticket_id} className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <FaTicketAlt size={13} className="text-gray-400" />
                    <h3 className="font-semibold text-gray-900">{t.title}</h3>
                    <StatusBadge status={t.status} />
                    {/* Issue type badge */}
                    {t.issue_type && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ISSUE_LABEL[t.issue_type]?.color}`}>
                        {ISSUE_LABEL[t.issue_type]?.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{t.charger_name} · {t.station_name}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.description}</p>
                  {t.assigned_to_name && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <FaUserCog size={10} /> มอบหมายให้ {t.assigned_to_name}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* ปุ่มมอบหมายช่าง */}
                  {(t.status === 'reported' || t.status === 'assigned') && (
                    <button
                      onClick={() => setAssignModal(t)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        t.status === 'reported'
                          ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                          : 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                      }`}
                    >
                      <FaWrench size={11} />
                      {t.status === 'reported' ? 'มอบหมายช่าง' : 'เปลี่ยนช่าง'}
                    </button>
                  )}
                  {/* ปุ่มเปิด detail */}
                  <button
                    onClick={() => setExpandedId(expandedId === t.ticket_id ? null : t.ticket_id)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50"
                  >
                    {expandedId === t.ticket_id ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                  </button>
                </div>
              </div>

              {/* Repair notes + image (always visible) */}
              {(t.repair_notes || t.repair_image) && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  {t.repair_notes && (
                    <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-medium">หมายเหตุ:</span> {t.repair_notes}
                    </div>
                  )}
                  {t.repair_image && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">รูปการซ่อม:</p>
                      <img
                        src={`${BASE_URL}${t.repair_image}`}
                        alt="repair"
                        className="max-h-48 rounded-xl border border-gray-200 object-cover cursor-pointer hover:opacity-90"
                        onClick={() => window.open(`${BASE_URL}${t.repair_image}`, '_blank')}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Expandable detail panel */}
            {expandedId === t.ticket_id && (
              <TicketDetailPanel ticket={t} onRefresh={fetchData} />
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">ไม่พบแจ้งซ่อมที่ค้นหา</div>
        )}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <AssignModal
          ticket={assignModal}
          technicians={technicians}
          tickets={tickets}
          onAssign={(techId) => assign(assignModal.ticket_id, techId)}
          onUnassign={() => setConfirmUnassignId(assignModal.ticket_id)}
          onClose={() => setAssignModal(null)}
        />
      )}

      {/* Confirm Unassign Modal */}
      {confirmUnassignId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
              <FaWrench size={18} className="text-amber-500" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-900 text-lg">ยืนยันยกเลิกมอบหมาย</h3>
              <p className="text-gray-500 text-sm mt-1">ช่างที่ได้รับมอบหมายจะถูกถอดออกจากงานนี้</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmUnassignId(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium">
                ยกเลิก
              </button>
              <button onClick={unassign}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600">
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Panel ที่เปิดใต้การ์ด ticket — priority override + part requests
function TicketDetailPanel({ ticket, onRefresh }) {
  const [overridePriority, setOverridePriority] = useState(ticket.priority)
  const [overriding, setOverriding]             = useState(false)
  const [partRequests, setPartRequests]         = useState([])
  const [proposals, setProposals]               = useState([])
  const [adminNote, setAdminNote]               = useState('')
  const [reviewingId, setReviewingId]           = useState(null)

  useEffect(() => {
    api.get(`/api/spare-parts/requests/${ticket.ticket_id}`)
      .then(res => setPartRequests(res.data.requests))
      .catch(() => {})
    api.get(`/api/tickets/${ticket.ticket_id}/proposals`)
      .then(res => setProposals(res.data.proposals))
      .catch(() => {})
  }, [ticket.ticket_id])

  const loadRequests = () => {
    api.get(`/api/spare-parts/requests/${ticket.ticket_id}`)
      .then(res => setPartRequests(res.data.requests))
      .catch(() => {})
  }

  const handlePriorityOverride = async (newPriority) => {
    if (ticket.issue_type === 'safety' && newPriority !== 'critical') {
      alert('Safety ticket ไม่สามารถลด priority ได้')
      return
    }
    setOverriding(true)
    try {
      await api.patch(`/api/tickets/${ticket.ticket_id}/priority`, { priority: newPriority })
      setOverridePriority(newPriority)
      onRefresh()
    } catch (err) {
      alert(err.response?.data?.message || 'เปลี่ยน priority ไม่สำเร็จ')
    } finally {
      setOverriding(false)
    }
  }

  const handleApprove = async (requestId) => {
    try {
      await api.patch(`/api/spare-parts/request/${requestId}/approve`)
      loadRequests()
    } catch (err) {
      alert(err.response?.data?.message || 'อนุมัติไม่สำเร็จ')
    }
  }

  const handleReject = async (requestId) => {
    try {
      await api.patch(`/api/spare-parts/request/${requestId}/reject`)
      loadRequests()
    } catch (err) {
      alert(err.response?.data?.message || 'ปฏิเสธไม่สำเร็จ')
    }
  }

  const handleReviewProposal = async (proposalId, status) => {
    setReviewingId(proposalId)
    try {
      await api.patch(`/api/tickets/proposals/${proposalId}/review`, { status, admin_note: adminNote || undefined })
      const res = await api.get(`/api/tickets/${ticket.ticket_id}/proposals`)
      setProposals(res.data.proposals)
      setAdminNote('')
    } catch (err) {
      alert(err.response?.data?.message || 'บันทึกไม่สำเร็จ')
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
      {/* Priority override */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-600">Priority:</span>
        <select
          value={overridePriority}
          onChange={(e) => handlePriorityOverride(e.target.value)}
          disabled={overriding || ticket.issue_type === 'safety'}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none disabled:opacity-50"
        >
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🟠 High</option>
          <option value="critical">🔴 Critical</option>
        </select>
        {ticket.issue_type === 'safety' && (
          <span className="text-xs text-red-500">🔒 ล็อก</span>
        )}
      </div>

      {/* Part requests */}
      {partRequests.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">การขอเบิกอะไหล่</p>
          <div className="space-y-2">
            {partRequests.map(r => (
              <div key={r.request_id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{r.part_name} ×{r.qty_requested} {r.unit}</p>
                  <p className="text-xs text-gray-400">{new Date(r.requested_at).toLocaleString('th-TH')}</p>
                </div>
                {r.status === 'pending' ? (
                  <div className="flex gap-1.5">
                    <button onClick={() => handleApprove(r.request_id)}
                      className="text-xs px-2.5 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600">
                      อนุมัติ
                    </button>
                    <button onClick={() => handleReject(r.request_id)}
                      className="text-xs px-2.5 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                      ปฏิเสธ
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs font-semibold ${r.status === 'approved' ? 'text-green-600' : 'text-red-500'}`}>
                    {r.status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {partRequests.length === 0 && (
        <p className="text-xs text-gray-400">ยังไม่มีการขอเบิกอะไหล่</p>
      )}

      {/* Proposals */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">ข้อเสนอจากช่าง (ซ่อม / เปลี่ยนตู้)</p>
        {proposals.length === 0 && <p className="text-xs text-gray-400">ยังไม่มีข้อเสนอ</p>}
        {proposals.map(p => (
          <div key={p.proposal_id} className="bg-gray-50 rounded-xl px-3 py-3 mb-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${p.recommendation === 'repair' ? 'text-blue-600' : 'text-orange-600'}`}>
                {p.recommendation === 'repair' ? 'แนะนำ: ซ่อม' : 'แนะนำ: เปลี่ยนตู้ใหม่'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                p.status === 'rejected' ? 'bg-red-100 text-red-600' :
                'bg-green-100 text-green-700'
              }`}>
                {p.status === 'pending' ? 'รอพิจารณา' :
                 p.status === 'rejected' ? 'ปฏิเสธ' :
                 p.status === 'approved_repair' ? 'อนุมัติ: ซ่อม' : 'อนุมัติ: เปลี่ยน'}
              </span>
            </div>
            <p className="text-xs text-gray-600">{p.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              {p.repair_cost_estimate && <span>ค่าซ่อม: {Number(p.repair_cost_estimate).toLocaleString()} บาท</span>}
              {p.replace_cost_estimate && <span>ราคาตู้ใหม่: {Number(p.replace_cost_estimate).toLocaleString()} บาท</span>}
              {p.repair_cost_estimate && p.replace_cost_estimate && (
                <span className={`col-span-2 font-medium ${Number(p.repair_cost_estimate) / Number(p.replace_cost_estimate) > 0.5 ? 'text-red-500' : 'text-green-600'}`}>
                  {Math.round(Number(p.repair_cost_estimate) / Number(p.replace_cost_estimate) * 100)}% ของราคาตู้ใหม่
                  {Number(p.repair_cost_estimate) / Number(p.replace_cost_estimate) > 0.5 ? ' → แนะนำเปลี่ยน' : ' → คุ้มค่าซ่อม'}
                </span>
              )}
            </div>
            {p.estimated_time_hours && <p className="text-xs text-gray-500">เวลาประเมิน: {p.estimated_time_hours} ชม.</p>}
            <p className="text-xs text-gray-400">โดย {p.tech_name} · {new Date(p.created_at).toLocaleDateString('th-TH')}</p>

            {p.status === 'pending' && (
              <div className="space-y-2 pt-1">
                <input value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  placeholder="หมายเหตุ admin (ไม่บังคับ)"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
                <div className="flex gap-2">
                  <button onClick={() => handleReviewProposal(p.proposal_id, 'approved_repair')}
                    disabled={reviewingId === p.proposal_id}
                    className="flex-1 text-xs py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
                    อนุมัติ: ซ่อม
                  </button>
                  <button onClick={() => handleReviewProposal(p.proposal_id, 'approved_replace')}
                    disabled={reviewingId === p.proposal_id}
                    className="flex-1 text-xs py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
                    อนุมัติ: เปลี่ยน
                  </button>
                  <button onClick={() => handleReviewProposal(p.proposal_id, 'rejected')}
                    disabled={reviewingId === p.proposal_id}
                    className="flex-1 text-xs py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50">
                    ปฏิเสธ
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const TECH_STATUS_CONFIG = {
  AVAILABLE: { label: 'พร้อมทำงาน', dot: 'bg-green-500', text: 'text-green-600' },
  BUSY:      { label: 'กำลังทำงาน', dot: 'bg-amber-500', text: 'text-amber-600' },
  OFFLINE:   { label: 'ไม่พร้อม',   dot: 'bg-gray-400',  text: 'text-gray-400'  },
}

function AssignModal({ ticket, technicians, tickets, onAssign, onUnassign, onClose }) {
  const [search, setSearch] = useState('')

  const todayStr = new Date().toDateString()

  const workloadMap = technicians.reduce((acc, tech) => {
    acc[tech.user_id] = tickets.filter(
      (t) => t.assigned_to === tech.user_id &&
             t.status !== 'completed' &&
             t.assigned_at && new Date(t.assigned_at).toDateString() === todayStr
    ).length
    return acc
  }, {})

  const filteredTechs = technicians
    .filter((tech) => {
      if (!search.trim()) return true
      const nameEmail = `${tech.first_name} ${tech.last_name} ${tech.email ?? ''}`.toLowerCase()
      const isIdSearch = /^\d+$/.test(search.trim())
      if (isIdSearch) return Number(search.trim()) === tech.user_id
      return nameEmail.includes(search.toLowerCase())
    })
    .sort((a, b) => {
      const order = { AVAILABLE: 0, BUSY: 1, OFFLINE: 2 }
      return (order[a.tech_status] ?? 2) - (order[b.tech_status] ?? 2)
    })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900">เลือกช่าง</h2>
            <p className="text-xs text-gray-500 mt-0.5">{ticket.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <FaSearch size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, อีเมล, ID..."
              className="w-full pl-9 pr-4 border border-gray-200 rounded-xl py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-3 space-y-2">
          {filteredTechs.map((tech) => {
            const workload            = workloadMap[tech.user_id] ?? 0
            const isCurrentlyAssigned = ticket.assigned_to === tech.user_id
            const tsCfg               = TECH_STATUS_CONFIG[tech.tech_status] ?? TECH_STATUS_CONFIG.OFFLINE
            const hasActiveWork       = tickets.some((t) => t.assigned_to === tech.user_id && t.status !== 'completed')
            const isUnavailable       = hasActiveWork && !isCurrentlyAssigned

            return (
              <button
                key={tech.user_id}
                onClick={() => !isUnavailable && onAssign(tech.user_id)}
                disabled={isUnavailable && !isCurrentlyAssigned}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isCurrentlyAssigned
                    ? 'border-primary bg-primary/5'
                    : isUnavailable
                      ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                      : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{tech.first_name} {tech.last_name}</p>
                      {isCurrentlyAssigned && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">ช่างปัจจุบัน</span>
                      )}
                      {tech.tech_status && (
                        <span className={`flex items-center gap-1 text-xs font-medium ${tsCfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tsCfg.dot}`} />
                          {tsCfg.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{tech.email}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className={`text-sm font-bold ${workload === 0 ? 'text-green-500' : workload >= 3 ? 'text-red-500' : 'text-amber-500'}`}>
                      {workload} งาน
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
          {filteredTechs.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-6">ไม่พบช่าง</p>
          )}
        </div>

        {ticket.assigned_to && (
          <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={onUnassign}
              className="w-full py-2 border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50 transition-colors"
            >
              ยกเลิกการมอบหมายช่าง
            </button>
          </div>
        )}
      </div>
    </div>
  )
}