import { useState, useEffect } from 'react'
import { FaWallet, FaCreditCard, FaTimes } from 'react-icons/fa'

export default function PaymentMethodModal({
  isOpen,
  onClose,
  onConfirm,
  totalCost,
  walletBalance,
  walletFrozen,
  savedCards,
  loading,
}) {
  const [selected, setSelected] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const walletSufficient = !walletFrozen && parseFloat(walletBalance) >= parseFloat(totalCost)
  const shortage = walletSufficient ? 0 : Math.max(0, parseFloat(totalCost) - parseFloat(walletBalance))

  useEffect(() => {
    if (!isOpen) return
    setErrorMsg(null)
    setConfirming(false)
    if (walletSufficient) {
      setSelected({ type: 'wallet' })
    } else if (savedCards?.length > 0) {
      setSelected({ type: 'credit_card', card_id: savedCards[0].id })
    } else {
      setSelected(null)
    }
  }, [isOpen]) // eslint-disable-line

  if (!isOpen) return null

  const handleConfirm = async () => {
    if (!selected || confirming) return
    setConfirming(true)
    setErrorMsg(null)
    try {
      await onConfirm(selected)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      setConfirming(false)
    }
  }

  const RadioDot = ({ active }) => (
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-primary' : 'border-gray-300'}`}>
      {active && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
    </div>
  )

  return (
    <div className="absolute inset-0 bg-black/50 z-[60] flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-6 pb-8 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">ยืนยันการชำระ</h3>
          <button onClick={onClose} disabled={confirming} className="text-gray-400 hover:text-gray-600 p-1">
            <FaTimes size={18} />
          </button>
        </div>

        {/* Amount */}
        <div className="text-center py-2">
          <p className="text-3xl font-bold text-primary">฿{parseFloat(totalCost).toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">ยอดชำระทั้งหมด</p>
          {localStorage.getItem('ev_redeem_token') && (
            <div className="mt-2 inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <span className="text-xs text-amber-700 font-semibold">
                ✅ ส่วนลดแต้ม ฿{localStorage.getItem('ev_redeem_discount') || '?'} ถูกนำไปหักแล้ว
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-6">กำลังโหลด...</div>
        ) : (
          <div className="space-y-2">
            {/* Wallet option */}
            <button
              disabled={!walletSufficient}
              onClick={() => walletSufficient && setSelected({ type: 'wallet' })}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-colors text-left ${
                selected?.type === 'wallet'
                  ? 'border-primary bg-green-50'
                  : walletSufficient
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
              }`}
            >
              <RadioDot active={selected?.type === 'wallet'} />
              <FaWallet className={walletSufficient ? 'text-primary' : 'text-gray-400'} size={16} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Wallet</p>
                <p className={`text-xs ${walletSufficient ? 'text-gray-500' : 'text-red-500'}`}>
                  ฿{parseFloat(walletBalance).toFixed(2)}
                  {!walletSufficient && ` — ขาด ฿${shortage.toFixed(2)}`}
                </p>
              </div>
            </button>

            {/* Saved cards */}
            {savedCards?.map(card => (
              <button
                key={card.id}
                onClick={() => setSelected({ type: 'credit_card', card_id: card.id })}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-colors text-left ${
                  selected?.type === 'credit_card' && selected.card_id === card.id
                    ? 'border-primary bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RadioDot active={selected?.type === 'credit_card' && selected.card_id === card.id} />
                <FaCreditCard className="text-blue-500" size={16} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{card.brand} •••{card.last_digits}</p>
                </div>
              </button>
            ))}

            {/* No options available */}
            {!walletSufficient && (!savedCards || savedCards.length === 0) && (
              <div className="text-center py-3 text-sm text-gray-500">
                ยอดเงินไม่พอและไม่มีบัตรเครดิตที่บันทึกไว้
                <br />
                <span className="text-xs text-gray-400">กรุณาเติมเงินก่อน</span>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <p className="text-sm text-red-500 text-center">{errorMsg}</p>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!selected || confirming || loading}
          className="w-full py-3.5 bg-primary disabled:opacity-50 text-white font-semibold rounded-2xl hover:bg-green-600 transition-colors"
        >
          {confirming ? 'กำลังดำเนินการ...' : `ยืนยันจ่าย ฿${parseFloat(totalCost).toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}
