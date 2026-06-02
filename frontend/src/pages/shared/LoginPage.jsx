import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaBolt, FaEye, FaEyeSlash, FaEnvelope, FaLock } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('กรุณากรอกอีเมล')
      return
    }
    if (!password) {
      setError('กรุณากรอกรหัสผ่าน')
      return
    }

    setLoading(true)

    try {
      const res = await api.post('/api/auth/login', { email: email.trim(), password })
      const { token, user } = res.data
      login(user, token)

      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (user.role === 'technician') {
        navigate('/tech/dashboard', { replace: true })
      } else {
        navigate('/home', { replace: true })
      }
    } catch (err) {
      const status = err.response?.status
      if (status === 401 || status === 404) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      } else {
        setError(err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen flex flex-col">
        {/* Header / Hero */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 px-6 pt-16 pb-12 text-white text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FaBolt size={40} className="text-white drop-shadow" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">EV Charger</h1>
          <p className="text-green-100 mt-1 text-sm">ระบบจองสถานีชาร์จรถยนต์ไฟฟ้า</p>
        </div>

        {/* Form card */}
        <div className="flex-1 px-6 pt-8 pb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">เข้าสู่ระบบ</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                อีเมล
              </label>
              <div className="relative">
                <FaEnvelope
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                รหัสผ่าน
              </label>
              <div className="relative">
                <FaLock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่านของคุณ"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  aria-label={showPass ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPass ? <FaEyeSlash size={17} /> : <FaEye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary hover:bg-green-600 active:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-md shadow-green-200 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            ยังไม่มีบัญชี?{' '}
            <Link
              to="/register"
              className="text-primary font-semibold hover:text-green-600 transition-colors"
            >
              สมัครสมาชิก
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
