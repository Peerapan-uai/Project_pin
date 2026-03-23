import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { FaUser, FaBan, FaSearch } from 'react-icons/fa'

export default function UserManagePage() {
  const [users, setUsers]   = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchUsers = () => {
    setLoading(true)
    api.get('/api/users')
      .then((res) => setUsers(res.data.filter((u) => u.role === 'user')))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleBan = (user) => {
    const payload = user.is_banned ? { ban_reason: null } : { ban_reason: 'banned by admin' }
    api.patch(`/api/users/${user.user_id}/ban`, payload)
      .then(() => fetchUsers())
      .catch((err) => console.error(err))
  }

  if (loading) return <div className="flex justify-center p-10 text-gray-500">กำลังโหลด...</div>

  const filtered = users.filter(
    (u) => `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h1>
        <p className="text-gray-500 text-sm mt-0.5">ผู้ใช้งานทั้งหมด {users.length} คน</p>
      </div>
      <div className="mb-4 relative max-w-sm">
        <FaSearch size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาผู้ใช้..."
          className="w-full pl-9 pr-4 border border-gray-300 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
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
                  <button
                    onClick={() => toggleBan(u)}
                    className={`flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
      </div>
    </div>
  )
}
