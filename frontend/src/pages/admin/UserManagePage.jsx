import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { FaUser, FaBan, FaSearch, FaTrash } from 'react-icons/fa'

export default function UserManagePage() {
  const [users, setUsers]           = useState([])
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading]       = useState(true)

  const fetchUsers = () => {
    setLoading(true)
    api.get('/api/users')
      .then((res) => setUsers((res.data.users ?? []).filter((u) => u.role === 'user')))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleBan = (user) => {
    api.patch(`/api/users/${user.user_id}/ban`, { is_banned: !user.is_banned })
      .then(() => fetchUsers())
      .catch((err) => console.error(err))
  }

  const handleDelete = (user) => {
    if (!window.confirm(`ลบผู้ใช้ "${user.first_name} ${user.last_name}" ออกจากระบบ?`)) return
    api.delete(`/api/users/${user.user_id}`)
      .then(() => fetchUsers())
      .catch((err) => alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const filtered = users.filter((u) => {
    const matchSearch = `${u.first_name} ${u.last_name} ${u.email} ${u.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || (filterStatus === 'banned' ? u.is_banned : !u.is_banned)
    return matchSearch && matchStatus
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h1>
        <p className="text-gray-500 text-sm mt-0.5">ผู้ใช้งานทั้งหมด {users.length} คน</p>
      </div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FaSearch size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
            className="w-full pl-9 pr-4 border border-gray-300 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="all">ทุกสถานะ</option>
          <option value="active">ปกติ</option>
          <option value="banned">ถูกแบน</option>
        </select>
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
                    <div>
                      <p className="font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
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
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => toggleBan(u)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        u.is_banned
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'bg-red-50 text-red-500 hover:bg-red-100'
                      }`}
                    >
                      <FaBan size={11} />
                      {u.is_banned ? 'ปลดแบน' : 'แบน'}
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                      title="ลบผู้ใช้"
                    >
                      <FaTrash size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">ไม่พบผู้ใช้</div>
        )}
      </div>
    </div>
  )
}
