import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { useAuth } from '../../context/AuthContext'
import {
  FaUser, FaLock, FaBell, FaQuestionCircle, FaFileAlt,
  FaShieldAlt, FaTrash, FaChevronRight, FaInfoCircle,
  FaToggleOn, FaToggleOff
} from 'react-icons/fa'
import api from '../../utils/api'

const NOTIF_KEYS = [
  { key: 'booking',     label: 'การจอง' },
  { key: 'charging',    label: 'การชาร์จ' },
  { key: 'payment',     label: 'การชำระเงิน' },
  { key: 'maintenance', label: 'การซ่อมบำรุง' },
  { key: 'promotion',   label: 'โปรโมชั่น' },
]

function loadNotifPrefs() {
  try {
    const raw = localStorage.getItem('notif_prefs')
    if (raw) return JSON.parse(raw)
  } catch {}
  return NOTIF_KEYS.reduce((acc, { key }) => ({ ...acc, [key]: true }), {})
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  // Change password modal
  const [showPassword, setShowPassword] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState(null)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState(loadNotifPrefs)

  // FAQ modal
  const [showFAQ, setShowFAQ] = useState(false)

  // About modal
  const [showAbout, setShowAbout] = useState(false)

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const toggleNotif = (key) => {
    setNotifPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] }
      localStorage.setItem('notif_prefs', JSON.stringify(updated))
      return updated
    })
  }

  const handleChangePassword = () => {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError('กรุณากรอกข้อมูลให้ครบ')
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }
    if (pwForm.next.length < 6) {
      setPwError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }
    setPwSaving(true)
    setPwError(null)
    api.put('/api/users/profile', { password: pwForm.next })
      .then(() => {
        setPwSuccess(true)
        setPwForm({ current: '', next: '', confirm: '' })
        setTimeout(() => {
          setShowPassword(false)
          setPwSuccess(false)
        }, 1500)
      })
      .catch(() => setPwError('เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่'))
      .finally(() => setPwSaving(false))
  }

  const handleDeleteAccount = () => {
    setDeleting(true)
    api.delete('/api/users/profile')
      .then(() => {
        logout()
        navigate('/login')
      })
      .catch(() => {
        setDeleting(false)
        setShowDeleteConfirm(false)
      })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="ตั้งค่า" showBack onBack={() => navigate('/profile')} />

      <div className="px-4 pt-4 space-y-4">

        {/* บัญชี */}
        <SectionLabel label="บัญชี" />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <MenuItem
            icon={FaUser}
            label="แก้ไขข้อมูลส่วนตัว"
            onClick={() => navigate('/profile')}
          />
          <MenuItem
            icon={FaLock}
            label="เปลี่ยนรหัสผ่าน"
            onClick={() => { setPwError(null); setPwSuccess(false); setShowPassword(true) }}
            last
          />
        </div>

        {/* การแจ้งเตือน */}
        <SectionLabel label="การแจ้งเตือน" />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {NOTIF_KEYS.map(({ key, label }, i) => (
            <div
              key={key}
              className={`flex items-center gap-3 px-4 py-3.5 ${i < NOTIF_KEYS.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <FaBell size={15} className="text-gray-400" />
              <span className="flex-1 text-sm text-gray-700">{label}</span>
              <button onClick={() => toggleNotif(key)}>
                {notifPrefs[key]
                  ? <FaToggleOn size={24} className="text-green-500" />
                  : <FaToggleOff size={24} className="text-gray-300" />
                }
              </button>
            </div>
          ))}
        </div>

        {/* ช่วยเหลือและข้อมูล */}
        <SectionLabel label="ช่วยเหลือและข้อมูล" />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <MenuItem
            icon={FaQuestionCircle}
            label="คำถามที่พบบ่อย (FAQ)"
            onClick={() => setShowFAQ(true)}
          />
          <MenuItem
            icon={FaFileAlt}
            label="เงื่อนไขการใช้งาน"
            onClick={() => setShowAbout(true)}
          />
          <MenuItem
            icon={FaShieldAlt}
            label="นโยบายความเป็นส่วนตัว"
            onClick={() => setShowAbout(true)}
            last
          />
        </div>

        {/* เกี่ยวกับ */}
        <SectionLabel label="เกี่ยวกับ" />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
            <FaInfoCircle size={15} className="text-gray-400" />
            <span className="flex-1 text-sm text-gray-700">เวอร์ชันแอพ</span>
            <span className="text-sm text-gray-400">v1.0.0</span>
          </div>
        </div>

        {/* ข้อมูลของฉัน */}
        <SectionLabel label="ข้อมูลของฉัน" />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <FaTrash size={15} className="text-red-400" />
            <span className="flex-1 text-sm text-red-500 text-left">ลบบัญชี</span>
          </button>
        </div>

        <div className="h-2" />
      </div>

      {/* Change Password Modal */}
      {showPassword && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">เปลี่ยนรหัสผ่าน</h2>
            {pwSuccess ? (
              <p className="text-green-600 text-sm text-center py-4">เปลี่ยนรหัสผ่านสำเร็จ ✓</p>
            ) : (
              <>
                {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="รหัสผ่านปัจจุบัน"
                    value={pwForm.current}
                    onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="password"
                    placeholder="รหัสผ่านใหม่"
                    value={pwForm.next}
                    onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="password"
                    placeholder="ยืนยันรหัสผ่านใหม่"
                    value={pwForm.confirm}
                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowPassword(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={pwSaving}
                    className="flex-1 py-2.5 bg-primary disabled:opacity-50 text-white rounded-xl text-sm font-semibold hover:bg-green-600"
                  >
                    {pwSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFAQ && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">คำถามที่พบบ่อย</h2>
            <div className="space-y-4">
              {FAQ_ITEMS.map(({ q, a }, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-gray-800">{q}</p>
                  <p className="text-sm text-gray-500 mt-1">{a}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowFAQ(false)}
              className="w-full mt-6 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* About/Terms Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">ข้อมูลแอพ</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              EV Charger — แอพพลิเคชันสำหรับค้นหาและจองเครื่องชาร์จรถยนต์ไฟฟ้า
              ให้บริการโดยทีมพัฒนา EV Charger
            </p>
            <p className="text-sm text-gray-500 leading-relaxed mt-3">
              การใช้งานแอพนี้ถือว่าคุณยอมรับเงื่อนไขการให้บริการ
              และนโยบายความเป็นส่วนตัวของเรา
              ข้อมูลส่วนตัวจะถูกเก็บรักษาอย่างปลอดภัยและไม่เปิดเผยต่อบุคคลภายนอก
            </p>
            <button
              onClick={() => setShowAbout(false)}
              className="w-full mt-6 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-6">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaTrash size={22} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">ลบบัญชี?</h2>
              <p className="text-sm text-gray-500 mt-1">
                ข้อมูลทั้งหมดจะถูกลบถาวร ทั้งประวัติการจอง การชำระเงิน และยานพาหนะ ไม่สามารถกู้คืนได้
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold hover:bg-red-600"
              >
                {deleting ? 'กำลังลบ...' : 'ลบบัญชี'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

function SectionLabel({ label }) {
  return <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">{label}</p>
}

function MenuItem({ icon: Icon, label, onClick, last }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${!last ? 'border-b border-gray-100' : ''}`}
    >
      <Icon size={15} className="text-gray-400" />
      <span className="flex-1 text-sm text-gray-700 text-left">{label}</span>
      <FaChevronRight size={12} className="text-gray-300" />
    </button>
  )
}

const FAQ_ITEMS = [
  {
    q: 'วิธีการจองเครื่องชาร์จ?',
    a: 'เลือกสถานีจากหน้าแผนที่หรือค้นหา → เลือกเครื่องชาร์จที่ต้องการ → กด "จอง" และยืนยันการจอง',
  },
  {
    q: 'ถ้าเครื่องชาร์จเสียหรือมีปัญหาทำอย่างไร?',
    a: 'กดปุ่ม "แจ้งปัญหา" ในหน้าเครื่องชาร์จ หรือไปที่เมนู "รายงานปัญหา" ทีมช่างจะรับเรื่องและดำเนินการ',
  },
  {
    q: 'สามารถยกเลิกการจองได้ไหม?',
    a: 'ยกเลิกได้ในหน้า "ประวัติการจอง" กดที่การจองที่ต้องการแล้วกด "ยกเลิก" ก่อนถึงเวลานัดหมาย',
  },
  {
    q: 'เติมเงินกระเป๋าเงินยังไง?',
    a: 'ไปที่หน้า "กระเป๋าเงิน" กดเติมเงิน เลือกจำนวนและช่องทางชำระ (บัตรเครดิต/พร้อมเพย์)',
  },
  {
    q: 'ขอคืนเงินได้ไหม?',
    a: 'ไปที่ "ประวัติการชำระเงิน" เลือกรายการที่ต้องการขอคืน กด "ขอคืนเงิน" และรอ admin ตรวจสอบ',
  },
]
