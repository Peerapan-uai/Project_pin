import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { useAuth } from '../../context/AuthContext'
import { FaUser, FaEnvelope, FaPhone, FaCar, FaHistory, FaCreditCard, FaSignOutAlt, FaChevronRight } from 'react-icons/fa'
import api from '../../utils/api'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user: authUser, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/users/profile')
      .then(res => setProfile(res.data))
      .catch(() => setProfile(authUser))
      .finally(() => setLoading(false))
  }, [])

  const user = profile || authUser

  const menuItems = [
    { label: 'ยานพาหนะของฉัน', icon: FaCar, to: '/vehicles' },
    { label: 'ประวัติการจอง', icon: FaHistory, to: '/bookings' },
    { label: 'ประวัติการชำระเงิน', icon: FaCreditCard, to: '/payments' },
    { label: 'การแจ้งเตือน', icon: FaUser, to: '/notifications' },
  ]

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="โปรไฟล์" />

      {/* Profile card */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 px-4 pt-6 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <FaUser size={28} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">{user?.first_name} {user?.last_name}</p>
            <p className="text-green-100 text-sm">{user?.role === 'admin' ? 'ผู้ดูแลระบบ' : user?.role === 'technician' ? 'ช่างเทคนิค' : 'ผู้ใช้งาน'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {/* Info card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-3">
            <FaEnvelope size={14} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">อีเมล</p>
              <p className="text-sm font-medium text-gray-800">{user?.email}</p>
            </div>
          </div>
          {user?.phone && (
            <div className="flex items-center gap-3">
              <FaPhone size={14} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">เบอร์โทร</p>
                <p className="text-sm font-medium text-gray-800">{user.phone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map(({ label, icon: Icon, to }, i) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${i < menuItems.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <Icon size={15} className="text-gray-400" />
              <span className="flex-1 text-sm text-gray-700 text-left">{label}</span>
              <FaChevronRight size={12} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors"
        >
          <FaSignOutAlt size={15} />
          ออกจากระบบ
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
