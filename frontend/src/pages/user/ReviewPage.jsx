import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { FaStar, FaCheckCircle } from 'react-icons/fa'
import api from '../../utils/api'

export default function ReviewPage() {
  const { stationId } = useParams()
  const navigate = useNavigate()
  const [station, setStation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    api.get(`/api/stations/${stationId}`)
      .then(res => setStation(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [stationId])

  const handleSubmit = () => {
    if (rating === 0) return
    setSubmitting(true)
    api.post('/api/reviews', {
      station_id: Number(stationId),
      rating,
      comment
    })
      .then(() => setSubmitted(true))
      .catch(() => setError('ส่งรีวิวไม่สำเร็จ กรุณาลองใหม่'))
      .finally(() => setSubmitting(false))
  }

  if (submitted) return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16 items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center w-full max-w-sm">
        <FaCheckCircle size={56} className="text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">ขอบคุณสำหรับรีวิว!</h2>
        <button onClick={() => navigate('/home')} className="mt-6 w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-green-600 transition-colors">กลับหน้าหลัก</button>
      </div>
    </div>
  )

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title="รีวิวสถานี" showBack onBack={() => navigate(-1)} />
      <div className="px-4 pt-6 space-y-5">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
          <p className="font-bold text-gray-900 text-lg">{station?.name || 'สถานีชาร์จ'}</p>
          <p className="text-sm text-gray-500 mt-1">ให้คะแนนประสบการณ์ของคุณ</p>
          <div className="flex justify-center gap-3 mt-4">
            {[1,2,3,4,5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
              >
                <FaStar size={36} className={`transition-colors ${(hover || rating) >= star ? 'text-amber-400' : 'text-gray-200'}`} />
              </button>
            ))}
          </div>
          {rating > 0 && <p className="text-sm text-gray-600 mt-2">{['','แย่มาก','แย่','พอใช้','ดี','ดีมาก'][rating]}</p>}
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-2">ความคิดเห็น (ไม่บังคับ)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="แชร์ประสบการณ์ของคุณ..."
            rows={4}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
        <button
          disabled={rating === 0 || submitting}
          onClick={handleSubmit}
          className="w-full py-3.5 bg-primary disabled:opacity-50 text-white font-semibold rounded-xl shadow-md shadow-green-200 hover:bg-green-600 transition-colors"
        >
          {submitting ? 'กำลังส่ง...' : 'ส่งรีวิว'}
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
