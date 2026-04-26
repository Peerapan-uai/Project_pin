import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaMapMarkerAlt, FaStar, FaClock, FaBolt, FaDirections, FaBan, FaHeart, FaRegHeart, FaMoon, FaSun } from 'react-icons/fa'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import StatusBadge from '../../components/StatusBadge'
import api from '../../utils/api'

const isOffPeak = () => { const h = new Date(Date.now() + 7 * 3600 * 1000).getUTCHours(); return h >= 22 || h < 9 }

export default function StationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [offPeak] = useState(isOffPeak())
  const [station, setStation] = useState(null)
  const [chargers, setChargers] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [walletFrozen, setWalletFrozen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/api/stations/${id}`),
      api.get(`/api/chargers/station/${id}`),
      api.get(`/api/reviews/station/${id}`),
      api.get('/api/wallet/balance'),
      api.get('/api/favorites'),
    ])
      .then(([stationRes, chargersRes, reviewsRes, walletRes, favRes]) => {
        setStation(stationRes.data.station || stationRes.data)
        setChargers(Array.isArray(chargersRes.data) ? chargersRes.data : chargersRes.data.chargers || [])
        setReviews(reviewsRes.data.reviews || reviewsRes.data || [])
        setWalletFrozen(!!walletRes.data.wallet_frozen)
        const favs = favRes.data.favorites || []
        setIsFavorite(favs.some(f => f.station_id === Number(id)))
      })
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [id])

  const toggleFavorite = async () => {
    if (favLoading) return
    setFavLoading(true)
    try {
      if (isFavorite) {
        await api.delete(`/api/favorites/${id}`)
        setIsFavorite(false)
      } else {
        await api.post('/api/favorites', { station_id: Number(id) })
        setIsFavorite(true)
      }
    } catch (_) {}
    setFavLoading(false)
  }

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  if (error || !station) return (
    <div className="flex flex-col min-h-screen pb-16">
      <Navbar title="รายละเอียดสถานี" showBack onBack={() => navigate(-1)} />
      <div className="flex-1 flex items-center justify-center text-gray-400">{error || 'ไม่พบสถานี'}</div>
      <BottomNav />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <Navbar title={station.name} showBack onBack={() => navigate(-1)} />

      <div className="px-4 pt-4 space-y-4">
        {/* Station info card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <h2 className="font-bold text-gray-900 text-base flex-1">{station.name}</h2>
            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className="p-1.5 -mt-0.5 -mr-0.5 text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              {isFavorite ? <FaHeart size={20} className="text-red-500" /> : <FaRegHeart size={20} />}
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <FaMapMarkerAlt size={12} className="text-gray-400" />
            <p className="text-sm text-gray-500">{station.address}</p>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 ml-4">{station.floor}</p>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <span className="flex items-center gap-1.5">
              {reviews.length > 0 ? (() => {
                const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                const rounded = Math.round(avg)
                return <>
                  <span className="text-sm font-bold text-amber-500">{avg.toFixed(1)}</span>
                  <span className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <FaStar key={s} size={12} className={s <= rounded ? 'text-amber-400' : 'text-gray-200'} />
                    ))}
                  </span>
                  <span className="text-xs text-gray-400">({reviews.length})</span>
                </>
              })() : (
                <>
                  <span className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => <FaStar key={s} size={12} className="text-gray-200" />)}
                  </span>
                  <span className="text-xs text-gray-400">(ยังไม่มีรีวิว)</span>
                </>
              )}
            </span>
            <span className={`flex items-center gap-1 text-sm font-medium ${station.open_time?.slice(0,5) === '00:00' && station.close_time?.slice(0,5) === '00:00' ? 'text-green-600' : 'text-gray-500'}`}>
              <FaClock size={13} className={station.open_time?.slice(0,5) === '00:00' && station.close_time?.slice(0,5) === '00:00' ? 'text-green-500' : 'text-gray-400'} />
              {station.open_time?.slice(0,5) === '00:00' && station.close_time?.slice(0,5) === '00:00' ? 'เปิด 24 ชม.' : `${station.open_time}–${station.close_time}`}
            </span>
          </div>
          {station.latitude && station.longitude && (
            <button
              onClick={() => navigate('/search', { state: { navigateTo: station } })}
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors active:scale-[0.98]"
            >
              <FaDirections size={15} /> นำทางมาที่นี่
            </button>
          )}
        </div>

        {/* Wallet frozen warning */}
        {walletFrozen && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <FaBan size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">กระเป๋าเงินถูกระงับ — ไม่สามารถจองตู้ชาร์จได้ กรุณาติดต่อแอดมิน</p>
          </div>
        )}

        {/* Chargers */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">ตู้ชาร์จ ({chargers.length})</h3>
          <div className="space-y-2">
            {chargers.map((c) => (
              <button
                key={c.charger_id}
                onClick={() => c.status === 'available' && !walletFrozen && navigate(`/booking/${c.charger_id}`)}
                disabled={c.status !== 'available' || walletFrozen}
                className="w-full bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 text-left flex items-center justify-between hover:shadow-md transition-all disabled:opacity-70"
              >
                <div>
                  <p className="font-semibold text-sm text-gray-900">{c.charger_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.connector_type} · {c.power_kw} kW</p>
                  <div className={`inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${offPeak ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                    {offPeak ? <FaMoon size={9} /> : <FaSun size={9} />}
                    <span>฿{offPeak ? (c.price_per_kwh * 0.7).toFixed(2) : parseFloat(c.price_per_kwh).toFixed(2)}/kWh</span>
                    {offPeak && <span className="text-blue-400 font-normal">ลด 30%</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge status={c.status} />
                  {c.status === 'available' && !walletFrozen && (
                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                      <FaBolt size={10} /> จองเลย
                    </span>
                  )}
                  {c.status === 'available' && walletFrozen && (
                    <span className="text-xs text-red-500 font-medium">ถูกระงับ</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">รีวิว ({reviews.length})</h3>
            <button
              onClick={() => navigate(`/review/${id}`)}
              className="text-xs text-primary font-semibold hover:text-green-600"
            >
              + เขียนรีวิว
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-white rounded-xl p-4 text-center text-gray-400 text-sm border border-gray-100">
              ยังไม่มีรีวิว — เป็นคนแรกที่รีวิวสถานีนี้
            </div>
          ) : (
            <div className="space-y-2">
              {reviews.map((r) => (
                <div key={r.review_id} className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {r.first_name ? `${r.first_name} ${r.last_name}` : r.reviewer_name || 'ผู้ใช้'}
                    </p>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <FaStar key={s} size={11} className={s <= r.rating ? 'text-amber-400' : 'text-gray-200'} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>}
                  <p className="text-xs text-gray-300 mt-1">
                    {new Date(r.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
