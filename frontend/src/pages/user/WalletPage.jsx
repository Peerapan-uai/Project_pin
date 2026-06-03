import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { FaWallet, FaQrcode, FaCreditCard, FaPlus, FaArrowUp, FaArrowDown, FaTimes, FaCheckCircle, FaTrash, FaBan, FaExclamationTriangle } from 'react-icons/fa'
import api from '../../utils/api'

const TYPE_LABEL = { topup: 'เติมเงิน', deduct: 'ตัดเงิน', refund: 'คืนเงิน', adjust: 'ปรับยอด' }
const TYPE_COLOR = { topup: 'text-green-600', deduct: 'text-red-500', refund: 'text-blue-500', adjust: 'text-yellow-600' }

export default function WalletPage() {
  const navigate = useNavigate()
  const [balance, setBalance] = useState(null)
  const [walletFrozen, setWalletFrozen] = useState(false)
  const [freezeReason, setFreezeReason] = useState(null)
  const [outstandingDebt, setOutstandingDebt] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [payingDebt, setPayingDebt] = useState(false)
  const [debtError, setDebtError] = useState(null)

  // modal state
  const [showModal, setShowModal] = useState(false)   // 'promptpay' | 'card' | false
  const [step, setStep] = useState('input')           // 'input' | 'qr' | 'done'
  const [amount, setAmount] = useState('')
  const [qrImage, setQrImage] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  // Omise card
  const [cardNumber, setCardNumber] = useState('4242424242424242')
  const [expiry, setExpiry] = useState('12/40')
  const [cvv, setCvv] = useState('123')
  const [cardName, setCardName] = useState('TEST USER')
  const omiseLoadedRef = useRef(false)

  // saved cards
  const [savedCards, setSavedCards] = useState([])
  const [useNewCard, setUseNewCard] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState(null)

  const fetchWallet = () => {
    api.get('/api/wallet/balance')
      .then(res => {
        setBalance(res.data.balance)
        setWalletFrozen(!!res.data.wallet_frozen)
        setFreezeReason(res.data.freeze_reason || null)
        setOutstandingDebt(parseFloat(res.data.outstanding_debt || 0))
        setTransactions(res.data.recent_transactions || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handlePayDebt = async () => {
    setPayingDebt(true)
    setDebtError(null)
    try {
      const res = await api.post('/api/wallet/pay-debt')
      setOutstandingDebt(0)
      setBalance(res.data.new_balance)
      fetchWallet()
    } catch (e) {
      setDebtError(e.response?.data?.message || 'ชำระไม่สำเร็จ')
    } finally {
      setPayingDebt(false)
    }
  }

  const fetchCards = () => {
    api.get('/api/wallet/cards')
      .then(res => {
        const cards = res.data.cards || []
        setSavedCards(cards)
        if (cards.length > 0) setSelectedCardId(cards[0].id)
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchWallet()
    fetchCards()
  }, [])

  // โหลด Omise.js เมื่อเปิด modal บัตร
  useEffect(() => {
    if (showModal !== 'card' || omiseLoadedRef.current) return
    const script = document.createElement('script')
    script.src = 'https://cdn.omise.co/omise.js'
    script.async = true
    script.onload = () => {
      if (window.Omise && import.meta.env.VITE_OMISE_PUBLIC_KEY) {
        window.Omise.setPublicKey(import.meta.env.VITE_OMISE_PUBLIC_KEY)
      }
      omiseLoadedRef.current = true
    }
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
    }
  }, [showModal])

  const openModal = (type) => {
    setShowModal(type)
    setStep('input')
    setAmount('')
    setQrImage(null)
    setError(null)
    setCardNumber('4242424242424242')
    setExpiry('12/40')
    setCvv('123')
    setCardName('TEST USER')
  }

  const closeModal = () => {
    setShowModal(false)
    setStep('input')
  }

  // PromptPay: สร้าง QR
  const handleGenerateQR = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 20) { setError('กรอกจำนวนเงินขั้นต่ำ 20 บาท'); return }
    setProcessing(true)
    setError(null)
    try {
      const res = await api.post('/api/wallet/qr', { amount: amt })
      setQrImage(res.data.qr_image)
      setStep('qr')
    } catch (e) {
      setError(e.response?.data?.message || 'เกิดข้อผิดพลาด')
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirmQR = async () => {
    setProcessing(true)
    setError(null)
    try {
      await api.post('/api/wallet/topup', { amount: parseFloat(amount), method: 'promptpay' })
      setStep('done')
      fetchWallet()
    } catch (e) {
      setError(e.response?.data?.message || 'เกิดข้อผิดพลาด')
    } finally {
      setProcessing(false)
    }
  }

  // Credit card: Omise tokenize → topup
  const handleCardTopup = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 20) { setError('กรอกจำนวนเงินขั้นต่ำ 20 บาท'); return }
    if (!cardNumber || !expiry || !cvv || !cardName) { setError('กรอกข้อมูลบัตรให้ครบ'); return }
    if (!omiseLoadedRef.current || !window.Omise) { setError('Omise ยังโหลดไม่เสร็จ กรุณารอสักครู่'); return }

    setProcessing(true)
    setError(null)

    const [expMonth, expYear] = expiry.split('/')
    window.Omise.createToken('card', {
      name: cardName,
      number: cardNumber.replace(/\s/g, ''),
      expiration_month: parseInt(expMonth),
      expiration_year: parseInt(`20${expYear?.trim()}`),
      security_code: cvv,
    }, async (statusCode, response) => {
      if (statusCode !== 200) {
        setError(response?.message || 'ข้อมูลบัตรไม่ถูกต้อง')
        setProcessing(false)
        return
      }
      try {
        await api.post('/api/wallet/topup', { amount: amt, method: 'credit_card', token: response.id })
        setStep('done')
        fetchWallet()
        fetchCards()
      } catch (e) {
        setError(e.response?.data?.message || 'ชาร์จบัตรไม่สำเร็จ')
      } finally {
        setProcessing(false)
      }
    })
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''
  const formatAmount = (n) => parseFloat(n).toLocaleString('th-TH', { minimumFractionDigits: 2 })

  if (loading) return <div className="flex justify-center p-10"><div className="text-gray-500">กำลังโหลด...</div></div>

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 relative overflow-hidden">
      <Navbar title="กระเป๋าเงิน" showBack onBack={() => navigate(-1)} />

      {/* Frozen banner */}
      {walletFrozen && (
        <div className="bg-red-500 px-4 py-3 flex items-center gap-3">
          <FaBan size={18} className="text-white shrink-0" />
          <div>
            <p className="text-white text-sm font-bold">กระเป๋าเงินถูกระงับ</p>
            <p className="text-red-100 text-xs">
              {freezeReason || 'ไม่สามารถเติมเงิน จอง หรือชาร์จได้ กรุณาติดต่อแอดมิน'}
            </p>
          </div>
        </div>
      )}

      {/* Outstanding debt banner */}
      {outstandingDebt > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3">
          <div className="flex items-start gap-2">
            <FaExclamationTriangle className="text-red-500 shrink-0 mt-0.5" size={14} />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">มียอดค้างชำระ ฿{parseFloat(outstandingDebt).toFixed(2)}</p>
              <p className="text-xs text-red-600 mt-0.5">จะไม่สามารถเริ่มชาร์จได้จนกว่าจะชำระ</p>
              {debtError && <p className="text-xs text-red-500 mt-1">{debtError}</p>}
            </div>
          </div>
          <button
            onClick={handlePayDebt}
            disabled={payingDebt}
            className="mt-2 w-full py-2 bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors"
          >
            {payingDebt ? 'กำลังชำระ...' : `ชำระยอดค้าง ฿${parseFloat(outstandingDebt).toFixed(2)}`}
          </button>
        </div>
      )}

      {/* Low balance banner */}
      {!walletFrozen && balance !== null && balance < 100 && balance > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 px-4 py-2 flex items-center gap-2">
          <FaExclamationTriangle className="text-yellow-500 shrink-0" size={14} />
          <p className="text-sm text-yellow-800">
            ยอดเงินใกล้หมด (฿{parseFloat(balance).toFixed(2)})
          </p>
        </div>
      )}

      {/* Balance card */}
      <div className={`${walletFrozen ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 'bg-gradient-to-br from-green-500 to-green-600'} px-4 pt-6 pb-8`}>
        <div className="flex flex-col items-center gap-2">
          <FaWallet size={32} className="text-white/80" />
          <p className={`${walletFrozen ? 'text-gray-200' : 'text-green-100'} text-sm`}>ยอดเงินคงเหลือ</p>
          <p className="text-white text-4xl font-bold">
            ฿{formatAmount(balance ?? 0)}
          </p>
        </div>
      </div>

      {/* Topup buttons */}
      <div className="px-4 -mt-4 grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => !walletFrozen && openModal('promptpay')}
          disabled={walletFrozen}
          className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 transition-shadow ${walletFrozen ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
        >
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <FaQrcode size={18} className="text-blue-500" />
          </div>
          <span className="text-sm font-semibold text-gray-700">PromptPay QR</span>
        </button>
        <button
          onClick={() => !walletFrozen && openModal('card')}
          disabled={walletFrozen}
          className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 transition-shadow ${walletFrozen ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
        >
          <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
            <FaCreditCard size={18} className="text-purple-500" />
          </div>
          <span className="text-sm font-semibold text-gray-700">บัตรเครดิต</span>
        </button>
      </div>

      {/* Transactions */}
      <div className="px-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">รายการล่าสุด</p>
        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center text-gray-400 text-sm">
            ยังไม่มีรายการ
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {transactions.map((txn, i) => (
              <div key={txn.txn_id} className={`flex items-center gap-3 px-4 py-3.5 ${i < transactions.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${txn.type === 'topup' || txn.type === 'refund' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {txn.type === 'topup' || txn.type === 'refund'
                    ? <FaArrowDown size={13} className="text-green-500" />
                    : <FaArrowUp size={13} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{TYPE_LABEL[txn.type] || txn.type}</p>
                  <p className="text-xs text-gray-400 truncate">{txn.ref}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${TYPE_COLOR[txn.type] || 'text-gray-700'}`}>
                    {txn.type === 'topup' || txn.type === 'refund' ? '+' : '-'}฿{formatAmount(txn.amount)}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(txn.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PromptPay Modal */}
      {showModal === 'promptpay' && (
        <div className="absolute inset-0 bg-black/50 z-[60] flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">เติมเงินผ่าน PromptPay</h2>
              <button onClick={closeModal} className="p-1 text-gray-400"><FaTimes /></button>
            </div>

            {step === 'input' && (
              <>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">จำนวนเงิน (บาท)</label>
                  <input
                    type="number"
                    placeholder="ขั้นต่ำ 20 บาท"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[50, 100, 200, 500].map(v => (
                    <button key={v} onClick={() => setAmount(String(v))}
                      className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200">
                      ฿{v}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleGenerateQR}
                  disabled={processing}
                  className="w-full py-3 bg-primary disabled:opacity-50 text-white font-semibold rounded-2xl hover:bg-green-600 flex items-center justify-center gap-2"
                >
                  <FaQrcode size={16} />
                  {processing ? 'กำลังสร้าง QR...' : 'สร้าง QR Code'}
                </button>
              </>
            )}

            {step === 'qr' && (
              <>
                <p className="text-center text-sm text-gray-500">สแกน QR เพื่อโอน <span className="font-bold text-gray-900">฿{parseFloat(amount).toLocaleString()}</span></p>
                {qrImage && <img src={qrImage} alt="PromptPay QR" className="w-48 h-48 mx-auto block" />}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button
                  onClick={handleConfirmQR}
                  disabled={processing}
                  className="w-full py-3 bg-primary disabled:opacity-50 text-white font-semibold rounded-2xl hover:bg-green-600"
                >
                  {processing ? 'กำลังยืนยัน...' : 'ฉันโอนแล้ว'}
                </button>
                <button onClick={() => setStep('input')} className="w-full py-2 text-sm text-gray-400">เปลี่ยนจำนวน</button>
              </>
            )}

            {step === 'done' && (
              <div className="text-center space-y-3">
                <FaCheckCircle size={48} className="text-green-500 mx-auto" />
                <p className="font-bold text-gray-900">เติมเงินสำเร็จ!</p>
                <p className="text-sm text-gray-500">ยอดเงิน ฿{formatAmount(balance ?? 0)}</p>
                <button onClick={closeModal} className="w-full py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-green-600">
                  ปิด
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Credit Card Modal */}
      {showModal === 'card' && (
        <div className="absolute inset-0 bg-black/50 z-[60] flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">เติมเงินผ่านบัตร</h2>
              <button onClick={closeModal} className="p-1 text-gray-400"><FaTimes /></button>
            </div>

            {step === 'done' ? (
              <div className="text-center space-y-3 py-4">
                <FaCheckCircle size={48} className="text-green-500 mx-auto" />
                <p className="font-bold text-gray-900">ชาร์จบัตรสำเร็จ!</p>
                <p className="text-sm text-gray-500">ยอดเงิน ฿{formatAmount(balance ?? 0)}</p>
                <button onClick={closeModal} className="w-full py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-green-600">
                  ปิด
                </button>
              </div>
            ) : (
              <>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">จำนวนเงิน (บาท)</label>
                  <input type="number" placeholder="ขั้นต่ำ 20 บาท" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                {/* Saved cards */}
                {savedCards.length > 0 && !useNewCard ? (
                  <>
                    <p className="text-xs text-gray-500 font-semibold">บัตรที่บันทึกไว้</p>
                    {savedCards.map(card => (
                      <div
                        key={card.id}
                        onClick={() => setSelectedCardId(card.id)}
                        className={`flex items-center gap-3 rounded-xl p-3 border cursor-pointer transition-all ${selectedCardId === card.id ? 'border-primary bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                      >
                        <FaCreditCard size={20} className={selectedCardId === card.id ? 'text-primary shrink-0' : 'text-purple-500 shrink-0'} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{card.brand} •••• {card.last_digits}</p>
                          <p className="text-xs text-gray-400">{card.name} | หมดอายุ {String(card.exp_month).padStart(2,'0')}/{card.exp_year}</p>
                        </div>
                        {selectedCardId === card.id && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        <button onClick={async (e) => {
                          e.stopPropagation()
                          await api.delete(`/api/wallet/cards/${card.id}`)
                          fetchCards()
                        }} className="p-1.5 text-gray-300 hover:text-red-500"><FaTrash size={12} /></button>
                      </div>
                    ))}
                    <button
                      onClick={async () => {
                        const amt = parseFloat(amount)
                        if (!amt || amt < 20) { setError('กรอกจำนวนเงินขั้นต่ำ 20 บาท'); return }
                        setProcessing(true); setError(null)
                        try {
                          const res = await api.post('/api/wallet/topup', { amount: amt, method: 'credit_card', use_saved_card: true, card_id: selectedCardId })
                          setBalance(res.data.new_balance)
                          setStep('done')
                          fetchWallet()
                        } catch (e) { setError(e.response?.data?.message || 'ชาร์จบัตรไม่สำเร็จ') }
                        finally { setProcessing(false) }
                      }}
                      disabled={processing}
                      className="w-full py-3 bg-primary disabled:opacity-50 text-white font-semibold rounded-2xl hover:bg-green-600 flex items-center justify-center gap-2"
                    >
                      <FaCreditCard size={14} />
                      {processing ? 'กำลังดำเนินการ...' : `เติมเงิน ฿${parseFloat(amount || 0).toLocaleString()}`}
                    </button>
                    <button onClick={() => setUseNewCard(true)} className="w-full py-2 text-sm text-primary">+ ใช้บัตรใหม่</button>
                  </>
                ) : (
                  <>
                    {savedCards.length > 0 && (
                      <button onClick={() => setUseNewCard(false)} className="text-xs text-primary">← กลับไปใช้บัตรที่บันทึกไว้</button>
                    )}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">ชื่อบนบัตร</label>
                      <input type="text" placeholder="FIRSTNAME LASTNAME" value={cardName} onChange={e => setCardName(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">เลขบัตร</label>
                      <input type="text" placeholder="4242 4242 4242 4242" maxLength={19} value={cardNumber}
                        onChange={e => setCardNumber(e.target.value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim())}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">วันหมดอายุ</label>
                        <input type="text" placeholder="MM/YY" maxLength={5} value={expiry}
                          onChange={e => {
                            let v = e.target.value.replace(/[^\d]/g, '')
                            if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2)
                            setExpiry(v)
                          }}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">CVV</label>
                        <input type="text" placeholder="123" maxLength={4} value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono" />
                      </div>
                    </div>
                    <button
                      onClick={handleCardTopup}
                      disabled={processing}
                      className="w-full py-3 bg-primary disabled:opacity-50 text-white font-semibold rounded-2xl hover:bg-green-600 flex items-center justify-center gap-2"
                    >
                      <FaPlus size={14} />
                      {processing ? 'กำลังดำเนินการ...' : `เติมเงิน ฿${parseFloat(amount || 0).toLocaleString()}`}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
