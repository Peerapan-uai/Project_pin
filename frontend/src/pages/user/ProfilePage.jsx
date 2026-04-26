import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { useAuth } from '../../context/AuthContext'
import {
  FaUser, FaEnvelope, FaPhone, FaCar, FaHistory, FaCreditCard,
  FaSignOutAlt, FaChevronRight, FaEdit, FaBell, FaWallet, FaCog, FaHeart, FaStar
} from 'react-icons/fa'
import api from '../../utils/api'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user: authUser, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // edit modal
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState(null)

  useEffect(() => {
    api.get('/api/users/profile')
      .then(res => setProfile(res.data.user))
      .catch(() => setProfile(authUser))
      .finally(() => setLoading(false))
  }, [])

  const user = profile || authUser

  const openEdit = () => {
    setEditForm({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
    })
    setEditError(null)
    setShowEdit(true)
  }

  const handleSave = () => {
    if (!editForm.first_name || !editForm.last_name) {
      setEditError('กรุณากรอกชื่อและนามสกุล')
      return
    }
    setSaving(true)
    setEditError(null)
    const body = {
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      phone: editForm.phone || null,
    }
    api.put('/api/users/profile', body)
      .then(() => {
        setProfile(prev => ({ ...prev, ...body }))
        setShowEdit(false)
      })
      .catch(() => setEditError('บันทึกไม่สำเร็จ กรุณาลองใหม่'))
      .finally(() => setSaving(false))
  }

  const menuItems = [
    { label: 'กระเป๋าเงิน', icon: FaWallet, to: '/wallet' },
    { label: 'แต้มสะสม', icon: FaStar, to: '/points' },
    { label: 'ยานพาหนะของฉัน', icon: FaCar, to: '/vehicles' },
    { label: 'สถานีโปรด', icon: FaHeart, to: '/favorites' },
    { label: 'ประวัติการจอง', icon: FaHistory, to: '/bookings' },
    { label: 'ประวัติการชำระเงิน', icon: FaCreditCard, to: '/payments' },
    { label: 'การแจ้งเตือน', icon: FaBell, to: '/notifications' },
    { label: 'ตั้งค่า', icon: FaCog, to: '/settings' },
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
          <div className="flex-1">
            <p className="text-white font-bold text-lg">{user?.first_name} {user?.last_name}</p>
            <p className="text-green-100 text-sm">
              {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : user?.role === 'technician' ? 'ช่างเทคนิค' : 'ผู้ใช้งาน'}
            </p>
          </div>
          <button
            onClick={openEdit}
            className="p-2 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-colors"
          >
            <FaEdit size={15} />
          </button>
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

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">แก้ไขข้อมูล</h2>
            {editError && <p className="text-red-500 text-sm">{editError}</p>}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="ชื่อ"
                value={editForm.first_name}
                onChange={e => setEditForm(p => ({ ...p, first_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="นามสกุล"
                value={editForm.last_name}
                onChange={e => setEditForm(p => ({ ...p, last_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="tel"
                placeholder="เบอร์โทร"
                value={editForm.phone}
                onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-primary disabled:opacity-50 text-white rounded-xl text-sm font-semibold hover:bg-green-600"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
