import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../context/ToastContext'
import Select from '../../components/ui/Select'
import { FaUserCog, FaPlus, FaWrench, FaTimes, FaEdit, FaSearch, FaTrash, FaKey } from 'react-icons/fa'

const EMPTY_FORM = { first_name: '', last_name: '', email: '', password: '', phone: '', primary_skill: '' }

const SKILL_OPTIONS = [
  { value: '',            label: '-- เลือกความเชี่ยวชาญ --' },
  { value: 'ELECTRICAL',  label: 'ELECTRICAL — ระบบไฟฟ้า' },
  { value: 'SOFTWARE',    label: 'SOFTWARE — ซอฟต์แวร์' },
  { value: 'MECHANICAL',  label: 'MECHANICAL — เครื่องกล' },
]

const SKILL_BADGE = {
  ELECTRICAL: 'bg-yellow-100 text-yellow-700',
  SOFTWARE:   'bg-blue-100 text-blue-700',
  MECHANICAL: 'bg-orange-100 text-orange-700',
}

const TECH_STATUS_CONFIG = {
  AVAILABLE: { label: 'พร้อมทำงาน', dot: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
  BUSY:      { label: 'กำลังทำงาน', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
  OFFLINE:   { label: 'ไม่พร้อม',   dot: 'bg-gray-400',  badge: 'bg-gray-100 text-gray-500'  },
}

export default function TechnicianManagePage() {
  const toast = useToast()
  const [technicians, setTechnicians]     = useState([])
  const [tickets, setTickets]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [showModal, setShowModal]         = useState(false)
  const [editTech, setEditTech]           = useState(null)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [editForm, setEditForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')
  const [editError, setEditError]         = useState('')
  const [search, setSearch]               = useState('')
  const [confirmDeleteTech, setConfirmDeleteTech] = useState(null)
  const [confirmPwdChange, setConfirmPwdChange]   = useState(null)  // { tech, payload }

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/users'),
      api.get('/api/tickets'),
    ])
      .then(([usersRes, ticketsRes]) => {
        setTechnicians((usersRes.data.users ?? []).filter((u) => u.role === 'technician'))
        setTickets(ticketsRes.data.tickets ?? [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const openModal = () => { setForm(EMPTY_FORM); setError(''); setShowModal(true) }
  const closeModal = () => setShowModal(false)

  const openEdit = (tech) => {
    setEditTech(tech)
    setEditForm({ first_name: tech.first_name, last_name: tech.last_name, phone: tech.phone ?? '', password: '', confirm_password: '', primary_skill: tech.primary_skill ?? '' })
    setEditError('')
  }

  const handleDelete = () => {
    if (!confirmDeleteTech) return
    api.delete(`/api/users/${confirmDeleteTech.user_id}`)
      .then(() => { setConfirmDeleteTech(null); fetchData(); toast.success('ลบช่างสำเร็จ') })
      .catch((err) => { setConfirmDeleteTech(null); toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด') })
  }
  const closeEdit = () => setEditTech(null)

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editForm.first_name || !editForm.last_name) {
      setEditError('กรุณากรอกชื่อและนามสกุล')
      return
    }
    if (editForm.password && editForm.password !== editForm.confirm_password) {
      setEditError('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }
    if (editForm.password && editForm.password.length < 6) {
      setEditError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }
    const payload = {
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      phone: editForm.phone,
      primary_skill: editForm.primary_skill,
      ...(editForm.password ? { password: editForm.password } : {}),
    }
    if (editForm.password) {
      setConfirmPwdChange({ tech: editTech, payload })
      return
    }
    setSaving(true)
    api.put(`/api/users/${editTech.user_id}`, payload)
      .then(() => { closeEdit(); fetchData(); toast.success('แก้ไขข้อมูลช่างสำเร็จ') })
      .catch((err) => setEditError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setSaving(false))
  }

  const handleEditConfirmed = () => {
    if (!confirmPwdChange) return
    const { tech, payload } = confirmPwdChange
    setConfirmPwdChange(null)
    setSaving(true)
    api.put(`/api/users/${tech.user_id}`, payload)
      .then(() => { closeEdit(); fetchData(); toast.success('แก้ไขข้อมูลช่างสำเร็จ') })
      .catch((err) => setEditError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setSaving(false))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบ')
      return
    }
    setSaving(true)
    api.post('/api/users/technician', form)
      .then(() => { closeModal(); fetchData() })
      .catch((err) => setError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setSaving(false))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const filtered = technicians.filter((t) =>
    `${t.first_name} ${t.last_name} ${t.email} ${t.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">จัดการช่าง</h1>
          <p className="text-gray-500 text-sm mt-0.5">ช่างเทคนิคทั้งหมด {technicians.length} คน</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, อีเมล, เบอร์..."
              className="pl-9 pr-4 py-2 w-52 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            />
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors shadow-sm shadow-green-200"
          >
            <FaPlus size={12} /> เพิ่มช่าง
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((t) => {
          const assignedTickets = tickets.filter((tk) => tk.assigned_to === t.user_id && tk.status !== 'completed')
          return (
            <div key={t.user_id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaUserCog size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{t.first_name} {t.last_name}</p>
                  <p className="text-xs text-gray-500">{t.email}</p>
                  <p className="text-xs text-gray-400">{t.phone}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {t.primary_skill && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SKILL_BADGE[t.primary_skill] ?? 'bg-gray-100 text-gray-600'}`}>
                        {t.primary_skill}
                      </span>
                    )}
                    {(() => {
                      const cfg = TECH_STATUS_CONFIG[t.tech_status] ?? TECH_STATUS_CONFIG.OFFLINE
                      return (
                        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      )
                    })()}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(t)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="แก้ไขข้อมูล">
                    <FaEdit size={15} />
                  </button>
                  <button onClick={() => setConfirmDeleteTech(t)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="ลบช่าง">
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                  <FaWrench size={11} /> งานที่กำลังดำเนินการ ({assignedTickets.length})
                </p>
                {assignedTickets.length === 0
                  ? <p className="text-xs text-gray-400">ไม่มีงาน</p>
                  : assignedTickets.map((tk) => (
                    <p key={tk.ticket_id} className="text-xs text-gray-600 py-0.5">• {tk.title} ({tk.station_name})</p>
                  ))
                }
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400 text-sm">
            {search ? 'ไม่พบช่างที่ค้นหา' : 'ยังไม่มีช่างในระบบ'}
          </div>
        )}
      </div>

      {/* Edit Technician Modal */}
      {editTech && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">แก้ไขข้อมูลช่าง</h2>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{editError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อ *</label>
                  <input
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">นามสกุล *</label>
                  <input
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">เบอร์โทร</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0812345678"
                />
              </div>
              <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-blue-700">เปลี่ยนรหัสผ่าน (ไม่บังคับ)</p>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">รหัสผ่านใหม่</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="เว้นว่างถ้าไม่ต้องการเปลี่ยน"
                    autoComplete="new-password"
                  />
                </div>
                {editForm.password && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">ยืนยันรหัสผ่านใหม่</label>
                    <input
                      type="password"
                      value={editForm.confirm_password}
                      onChange={(e) => setEditForm({ ...editForm, confirm_password: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder="ยืนยันรหัสผ่านใหม่"
                      autoComplete="new-password"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ความเชี่ยวชาญ</label>
                <Select
                  value={editForm.primary_skill}
                  onChange={(v) => setEditForm({ ...editForm, primary_skill: v })}
                  options={SKILL_OPTIONS}
                />
                {!editForm.primary_skill && (
                  <p className="text-xs text-amber-500 mt-1">กรุณาระบุก่อน assign งาน</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeEdit} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50">
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Technician Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">เพิ่มช่างเทคนิค</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อ *</label>
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="ชื่อ"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">นามสกุล *</label>
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="นามสกุล"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">อีเมล *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">รหัสผ่าน *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="รหัสผ่าน"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">เบอร์โทร</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0812345678"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ความเชี่ยวชาญ</label>
                <Select
                  value={form.primary_skill}
                  onChange={(v) => setForm({ ...form, primary_skill: v })}
                  options={SKILL_OPTIONS}
                />
                {!form.primary_skill && (
                  <p className="text-xs text-amber-500 mt-1">กรุณาระบุก่อน assign งาน</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50">
                  {saving ? 'กำลังบันทึก...' : 'เพิ่มช่าง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Double-Confirm Password Change Modal */}
      {confirmPwdChange && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">ยืนยันเปลี่ยนรหัสผ่าน</h2>
              <button onClick={() => setConfirmPwdChange(null)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <FaKey size={16} className="text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {confirmPwdChange.tech.first_name} {confirmPwdChange.tech.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{confirmPwdChange.tech.email}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                รหัสผ่านของช่างจะถูกเปลี่ยนทันที ช่างจะต้องใช้รหัสผ่านใหม่ในการ login ครั้งถัดไป
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmPwdChange(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleEditConfirmed}
                  className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600"
                >
                  ยืนยันเปลี่ยนรหัสผ่าน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Technician Modal */}
      {confirmDeleteTech && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
              <FaTrash size={18} className="text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-900 text-lg">ยืนยันลบช่าง</h3>
              <p className="text-gray-500 text-sm mt-1">
                <span className="font-semibold text-gray-700">{confirmDeleteTech.first_name} {confirmDeleteTech.last_name}</span>
                {' '}จะถูกลบออกจากระบบถาวร
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteTech(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium">
                ยกเลิก
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
                ลบช่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
