import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaBolt, FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaPhone } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
  })
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors]           = useState({})
  const [loading, setLoading]         = useState(false)

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs = {}

    if (!form.first_name.trim())          errs.first_name = 'กรุณากรอกชื่อ'
    if (!form.last_name.trim())           errs.last_name  = 'กรุณากรอกนามสกุล'
    if (!form.email.trim())               errs.email      = 'กรุณากรอกอีเมล'
    else if (!emailRegex.test(form.email.trim()))
                                          errs.email      = 'รูปแบบอีเมลไม่ถูกต้อง'
    if (!form.phone.trim())               errs.phone      = 'กรุณากรอกเบอร์โทรศัพท์'
    else if (!/^0\d{8,9}$/.test(form.phone.trim()))
                                          errs.phone      = 'เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)'
    if (!form.password)                   errs.password   = 'กรุณากรอกรหัสผ่าน'
    else if (form.password.length < 6)    errs.password   = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    if (!form.confirmPassword)            errs.confirmPassword = 'กรุณายืนยันรหัสผ่าน'
    else if (form.password !== form.confirmPassword)
                                          errs.confirmPassword = 'รหัสผ่านไม่ตรงกัน'

    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)

    try {
      const res = await api.post('/api/auth/register', {
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
      })
      const { token, user } = res.data
      login(user, token)
      navigate('/home', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
      setErrors({ email: msg })
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    'w-full py-3 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition'

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 px-6 pt-12 pb-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <FaBolt size={32} className="text-white drop-shadow" />
          </div>
          <h1 className="text-2xl font-bold">EV Charger</h1>
          <p className="text-green-100 mt-0.5 text-sm">สร้างบัญชีใหม่</p>
        </div>

        {/* Form */}
        <div className="flex-1 px-6 pt-6 pb-10 overflow-y-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-5">สมัครสมาชิก</h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ</label>
                <div className="relative">
                  <FaUser
                    size={13}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={set('first_name')}
                    placeholder="ชื่อ"
                    autoComplete="given-name"
                    className={`${inputBase} pl-9 ${errors.first_name ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                  />
                </div>
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">นามสกุล</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={set('last_name')}
                  placeholder="นามสกุล"
                  autoComplete="family-name"
                  className={`${inputBase} px-4 ${errors.last_name ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล</label>
              <div className="relative">
                <FaEnvelope
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="example@email.com"
                  autoComplete="email"
                  className={`${inputBase} pl-10 ${errors.email ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์</label>
              <div className="relative">
                <FaPhone
                  size={13}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="0812345678"
                  autoComplete="tel"
                  className={`${inputBase} pl-10 ${errors.phone ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่าน</label>
              <div className="relative">
                <FaLock
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  autoComplete="new-password"
                  className={`${inputBase} pl-10 pr-11 ${errors.password ? 'border-red-400 ring-1 ring-red-300' : ''}`}
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
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <FaLock
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="ยืนยันรหัสผ่าน"
                  autoComplete="new-password"
                  className={`${inputBase} pl-10 pr-11 ${errors.confirmPassword ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  aria-label={showConfirm ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showConfirm ? <FaEyeSlash size={17} /> : <FaEye size={17} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
              )}
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
                  กำลังสมัครสมาชิก...
                </span>
              ) : (
                'สมัครสมาชิก'
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            มีบัญชีอยู่แล้ว?{' '}
            <Link
              to="/login"
              className="text-primary font-semibold hover:text-green-600 transition-colors"
            >
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
