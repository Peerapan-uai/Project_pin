import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../context/ToastContext'
import Select from '../../components/ui/Select'
import { FaUser, FaBan, FaSearch, FaTrash, FaEdit, FaKey, FaTimes, FaPlus } from 'react-icons/fa'

const EMPTY_EDIT_FORM = { first_name: '', last_name: '', phone: '', password: '', confirm_password: '' }
const EMPTY_CREATE_FORM = { first_name: '', last_name: '', email: '', phone: '', password: '', confirm_password: '' }

export default function UserManagePage() {
  const toast = useToast()
  const [users, setUsers]               = useState([])
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading]           = useState(true)

  const [editUser, setEditUser]         = useState(null)   // user object being edited
  const [editForm, setEditForm]         = useState(EMPTY_EDIT_FORM)
  const [editSaving, setEditSaving]     = useState(false)
  const [editError, setEditError]       = useState('')

  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null)  // user object to delete
  const [deleting, setDeleting]         = useState(false)
  const [confirmPwdChange, setConfirmPwdChange] = useState(null)   // { user, payload } — double-confirm password

  const [showCreate, setShowCreate]     = useState(false)
  const [createForm, setCreateForm]     = useState(EMPTY_CREATE_FORM)
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError]   = useState('')

  const fetchUsers = () => {
    setLoading(true)
    api.get('/api/users')
      .then((res) => setUsers((res.data.users ?? []).filter((u) => u.role === 'user')))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const openEdit = (u) => {
    setEditUser(u)
    setEditForm({ first_name: u.first_name ?? '', last_name: u.last_name ?? '', phone: u.phone ?? '', password: '', confirm_password: '' })
    setEditError('')
  }
  const closeEdit = () => { setEditUser(null); setEditError('') }

  const toggleBan = (user) => {
    api.patch(`/api/users/${user.user_id}/ban`, { is_banned: !user.is_banned })
      .then(() => { fetchUsers(); toast.success(user.is_banned ? 'ปลดแบนผู้ใช้สำเร็จ' : 'แบนผู้ใช้สำเร็จ') })
      .catch((err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
  }

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
    // ตรวจว่ามีการเปลี่ยนแปลงจริงมั้ย
    const noChange =
      editForm.first_name === (editUser.first_name ?? '') &&
      editForm.last_name  === (editUser.last_name  ?? '') &&
      editForm.phone      === (editUser.phone      ?? '') &&
      !editForm.password
    if (noChange) { closeEdit(); return }

    const payload = {
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      phone: editForm.phone,
      ...(editForm.password ? { password: editForm.password } : {}),
    }
    // ถ้ามีการเปลี่ยนรหัสผ่าน → แสดง double-confirm modal ก่อน
    if (editForm.password) {
      setConfirmPwdChange({ user: editUser, payload })
      return
    }
    setEditSaving(true)
    api.put(`/api/users/${editUser.user_id}`, payload)
      .then(() => {
        closeEdit()
        fetchUsers()
        toast.success('แก้ไขข้อมูลผู้ใช้สำเร็จ')
      })
      .catch((err) => setEditError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setEditSaving(false))
  }

  const handleEditConfirmed = () => {
    if (!confirmPwdChange) return
    const { user, payload } = confirmPwdChange
    setConfirmPwdChange(null)
    setEditSaving(true)
    api.put(`/api/users/${user.user_id}`, payload)
      .then(() => {
        closeEdit()
        fetchUsers()
        toast.success('แก้ไขข้อมูลผู้ใช้สำเร็จ')
      })
      .catch((err) => setEditError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setEditSaving(false))
  }

  const handleDelete = () => {
    if (!confirmDeleteUser) return
    setDeleting(true)
    api.delete(`/api/users/${confirmDeleteUser.user_id}`)
      .then(() => {
        setConfirmDeleteUser(null)
        closeEdit()
        fetchUsers()
        toast.success('ลบผู้ใช้สำเร็จ')
      })
      .catch((err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setDeleting(false))
  }

  const openCreate = () => { setShowCreate(true); setCreateForm(EMPTY_CREATE_FORM); setCreateError('') }
  const closeCreate = () => { setShowCreate(false); setCreateError('') }

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    if (!createForm.first_name || !createForm.last_name || !createForm.email || !createForm.password) {
      setCreateError('กรุณากรอกข้อมูลให้ครบ')
      return
    }
    if (createForm.password.length < 6) {
      setCreateError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }
    if (createForm.password !== createForm.confirm_password) {
      setCreateError('รหัสผ่านไม่ตรงกัน')
      return
    }
    setCreateSaving(true)
    api.post('/api/users', {
      first_name: createForm.first_name,
      last_name: createForm.last_name,
      email: createForm.email,
      phone: createForm.phone,
      password: createForm.password,
    })
      .then(() => {
        closeCreate()
        fetchUsers()
        toast.success('เพิ่มผู้ใช้สำเร็จ')
      })
      .catch((err) => setCreateError(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setCreateSaving(false))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const filtered = users.filter((u) => {
    const matchSearch = `${u.first_name} ${u.last_name} ${u.email} ${u.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || (filterStatus === 'banned' ? u.is_banned : !u.is_banned)
    return matchSearch && matchStatus
  })

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">จัดการผู้ใช้</h1>
          <p className="text-gray-500 text-sm mt-0.5">ผู้ใช้งานทั้งหมด {users.length} คน</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            <FaPlus size={11} /> เพิ่มผู้ใช้
          </button>
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
          <Select
            value={filterStatus}
            onChange={(v) => setFilterStatus(v)}
            options={[
              { value: 'all', label: 'ทุกสถานะ' },
              { value: 'active', label: 'ปกติ' },
              { value: 'banned', label: 'ถูกแบน' },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600">ผู้ใช้</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">เบอร์โทร</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">สถานะ</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((u) => (
              <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaUser size={14} className="text-primary" />
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                        title="แก้ไขผู้ใช้"
                      >
                        <FaEdit size={12} />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 hidden md:table-cell text-gray-500">{u.phone}</td>
                <td className="px-5 py-4 text-center">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.is_banned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                    {u.is_banned ? 'ถูกแบน' : 'ปกติ'}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => toggleBan(u)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mx-auto ${
                      u.is_banned
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-red-50 text-red-500 hover:bg-red-100'
                    }`}
                  >
                    <FaBan size={11} />
                    {u.is_banned ? 'ปลดแบน' : 'แบน'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">ไม่พบผู้ใช้</div>
        )}
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">แก้ไขผู้ใช้</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editUser.email}</p>
              </div>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{editError}</p>
              )}

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อ *</label>
                  <input
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="ชื่อ"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">นามสกุล *</label>
                  <input
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="นามสกุล"
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

              {/* Password change section */}
              <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">รหัสผ่านใหม่ (ไม่บังคับ)</label>
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

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeEdit} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                >
                  {editSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>

              {/* Delete section — separated from save */}
              <div className="border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteUser(editUser)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 bg-red-50 text-red-500 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  <FaTrash size={12} /> ลบผู้ใช้นี้ออกจากระบบ
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
                    {confirmPwdChange.user.first_name} {confirmPwdChange.user.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{confirmPwdChange.user.email}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                รหัสผ่านของผู้ใช้จะถูกเปลี่ยนทันที ผู้ใช้จะต้องใช้รหัสผ่านใหม่ในการ login ครั้งถัดไป
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

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">เพิ่มผู้ใช้ใหม่</h2>
              <button onClick={closeCreate} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {createError && (
                <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{createError}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อ *</label>
                  <input
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="ชื่อ"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">นามสกุล *</label>
                  <input
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="นามสกุล"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">อีเมล *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">เบอร์โทร</label>
                <input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0812345678"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">รหัสผ่าน *</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="อย่างน้อย 6 ตัว"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">ยืนยันรหัสผ่าน *</label>
                  <input
                    type="password"
                    value={createForm.confirm_password}
                    onChange={(e) => setCreateForm({ ...createForm, confirm_password: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="ยืนยันรหัสผ่าน"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeCreate} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={createSaving}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                >
                  {createSaving ? 'กำลังบันทึก...' : 'เพิ่มผู้ใช้'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete User Modal */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">ยืนยันลบผู้ใช้</h2>
              <button onClick={() => setConfirmDeleteUser(null)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 rounded-xl p-4 space-y-1">
                <p className="font-semibold text-gray-900 text-sm">{confirmDeleteUser.first_name} {confirmDeleteUser.last_name}</p>
                <p className="text-xs text-gray-500">{confirmDeleteUser.email}</p>
              </div>
              <p className="text-sm text-gray-600">คุณต้องการลบผู้ใช้นี้จริงๆ ใช่ไหม? สามารถกู้คืนได้ที่ Recycle ภายใน 30 วัน</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteUser(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}