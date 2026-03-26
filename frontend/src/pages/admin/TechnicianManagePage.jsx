import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { FaUserCog, FaPlus, FaWrench, FaTimes } from 'react-icons/fa'

const EMPTY_FORM = { first_name: '', last_name: '', email: '', password: '', phone: '' }

export default function TechnicianManagePage() {
  const [technicians, setTechnicians] = useState([])
  const [tickets, setTickets]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการช่าง</h1>
          <p className="text-gray-500 text-sm mt-0.5">ช่างเทคนิคทั้งหมด {technicians.length} คน</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 shadow-md shadow-green-200"
        >
          <FaPlus size={13} /> เพิ่มช่าง
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {technicians.map((t) => {
          const assignedTickets = tickets.filter((tk) => tk.assigned_to === t.user_id && tk.status !== 'completed')
          return (
            <div key={t.user_id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaUserCog size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{t.first_name} {t.last_name}</p>
                  <p className="text-xs text-gray-500">{t.email}</p>
                  <p className="text-xs text-gray-400">{t.phone}</p>
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
        {technicians.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400 text-sm">ยังไม่มีช่างในระบบ</div>
        )}
      </div>

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
    </div>
  )
}
