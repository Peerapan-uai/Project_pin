import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBolt, FaEye, FaEyeSlash, FaEnvelope, FaLock, FaShieldAlt } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('กรุณากรอกอีเมล'); return }
    if (!password)     { setError('กรุณากรอกรหัสผ่าน'); return }

    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', { email: email.trim(), password })
      const { token, user } = res.data

      if (user.role !== 'admin' && user.role !== 'technician') {
        setError('บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบ Staff')
        setLoading(false)
        return
      }

      login(user, token)

      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/tech/dashboard', { replace: true })
      }
    } catch (err) {
      const status = err.response?.status
      if (status === 400 || status === 401) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      } else {
        setError(err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-green-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <FaBolt size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl">EV Charger</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            ระบบจัดการ<br />EV Charging Station
          </h1>
          <p className="text-green-200 text-lg">
            สำหรับผู้ดูแลระบบและช่างเทคนิค
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'สถานีทั้งหมด', value: 'Stations' },
            { label: 'จัดการผู้ใช้', value: 'Users' },
            { label: 'ตู้ชาร์จ', value: 'Chargers' },
            { label: 'แจ้งซ่อม', value: 'Tickets' },
          ].map((item) => (
            <div key={item.value} className="bg-white/10 rounded-xl p-4">
              <p className="text-green-200 text-xs">{item.label}</p>
              <p className="text-white font-semibold mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo (mobile) */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <FaBolt size={20} className="text-white" />
            </div>
            <span className="text-gray-900 font-bold text-xl">EV Charger</span>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-2">
              <FaShieldAlt size={22} className="text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Staff Login</h2>
            </div>
            <p className="text-gray-500 text-sm mb-8">เข้าสู่ระบบสำหรับ Admin และ Technician</p>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล</label>
                <div className="relative">
                  <FaEnvelope size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@evcharge.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่าน</label>
                <div className="relative">
                  <FaLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="รหัสผ่านของคุณ"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  >
                    {showPass ? <FaEyeSlash size={17} /> : <FaEye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-md mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    กำลังเข้าสู่ระบบ...
                  </span>
                ) : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">บัญชีทดสอบ</p>
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-500">Admin:</span>
                  <span className="font-mono">admin@evcharge.com / password123</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ช่าง:</span>
                  <span className="font-mono">tech@evcharge.com / password123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
