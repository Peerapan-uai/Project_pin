import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { FaWallet, FaSearch, FaSnowflake, FaPlus, FaMinus, FaTimes } from 'react-icons/fa'

const TYPE_LABEL = { topup: 'เติมเงิน', deduct: 'ตัดเงิน', refund: 'คืนเงิน', adjust: 'ปรับยอด' }
const TYPE_COLOR = { topup: 'text-green-600', deduct: 'text-red-500', refund: 'text-blue-500', adjust: 'text-amber-500' }

export default function WalletManagePage() {
  const [summary, setSummary]             = useState(null)
  const [transactions, setTransactions]   = useState([])
  const [users, setUsers]                 = useState([])
  const [filterUser, setFilterUser]       = useState('')
  const [filterType, setFilterType]       = useState('')
  const [page, setPage]                   = useState(1)
  const [totalPages, setTotalPages]       = useState(1)
  const [loading, setLoading]             = useState(true)
  const [walletModal, setWalletModal]     = useState(null)  // user ที่กด ดู wallet
  const [adjustModal, setAdjustModal]     = useState(null)  // user ที่กด ปรับยอด
  const [adjustForm, setAdjustForm]       = useState({ amount: '', reason: '' })
  const [adjustSaving, setAdjustSaving]   = useState(false)
  const [search, setSearch]               = useState('')

  const fetchSummary = () =>
    api.get('/api/admin/wallet/summary').then((res) => setSummary(res.data.summary)).catch(() => {})

  const fetchTransactions = () => {
    setLoading(true)
    const params = new URLSearchParams({ page })
    if (filterType) params.set('type', filterType)
    api.get(`/api/admin/wallet/transactions?${params}`)
      .then((res) => {
        setTransactions(res.data.data ?? [])
        setTotalPages(res.data.pagination?.total_pages ?? 1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSummary()
    api.get('/api/users').then((res) => setUsers(res.data.users ?? [])).catch(() => {})
  }, [])

  useEffect(() => { fetchTransactions() }, [page, filterType])

  const openWallet = (user) => {
    api.get(`/api/admin/wallet/users/${user.user_id}/wallet`)
      .then((res) => setWalletModal(res.data))
      .catch((err) => alert(err.response?.data?.message || 'ดึงข้อมูลไม่ได้'))
  }

  const handleFreeze = (userId, frozen) => {
    const action = frozen ? 'unfreeze' : 'freeze'
    if (!window.confirm(`${action === 'freeze' ? 'อั้น' : 'ปลดอั้น'} wallet ของ user นี้?`)) return
    api.patch(`/api/admin/wallet/users/${userId}/wallet/freeze`, { action })
      .then(() => {
        if (walletModal) setWalletModal((prev) => ({ ...prev, user: { ...prev.user, wallet_frozen: action === 'freeze' ? 1 : 0 } }))
        fetchSummary()
      })
      .catch((err) => alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
  }

  const handleAdjust = () => {
    if (!adjustForm.amount || !adjustForm.reason) return alert('กรุณากรอก amount และ reason')
    const amount = parseFloat(adjustForm.amount)
    if (isNaN(amount) || amount === 0) return alert('amount ต้องเป็นตัวเลขที่ไม่ใช่ 0')
    setAdjustSaving(true)
    api.post(`/api/admin/wallet/users/${adjustModal.user_id}/wallet/adjust`, { amount, reason: adjustForm.reason })
      .then((res) => {
        alert(`ปรับยอดสำเร็จ ยอดใหม่: ${res.data.new_balance} ฿`)
        setAdjustModal(null)
        setAdjustForm({ amount: '', reason: '' })
        if (walletModal?.user?.user_id === adjustModal.user_id) openWallet(adjustModal)
        fetchSummary()
        fetchTransactions()
      })
      .catch((err) => alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
      .finally(() => setAdjustSaving(false))
  }

  const filteredUsers = users.filter((u) => u.role === 'user' &&
    `${u.first_name} ${u.last_name} ${u.email} ${u.user_id}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">จัดการ Wallet</h1>
        <p className="text-gray-500 text-sm mt-0.5">ดู ปรับยอด และอั้น wallet ของผู้ใช้</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'ยอด Wallet รวม', value: `${Number(summary.total_wallet_balance ?? 0).toFixed(2)} ฿`, color: 'text-primary' },
            { label: 'เติมเงินรวม', value: `${Number(summary.total_topup ?? 0).toFixed(2)} ฿`, color: 'text-green-600' },
            { label: 'ตัดเงินรวม', value: `${Number(summary.total_deduct ?? 0).toFixed(2)} ฿`, color: 'text-red-500' },
            { label: 'Wallet ถูกอั้น', value: `${summary.frozen_wallets_count} บัญชี`, color: 'text-amber-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Wallet List */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Wallet ผู้ใช้</h2>
          <div className="relative mb-3">
            <FaSearch size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, อีเมล, ID..."
              className="w-full pl-9 pr-4 border border-gray-300 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map((u) => (
              <div key={u.user_id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{u.first_name} {u.last_name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                  <p className="text-sm font-bold text-primary mt-0.5">{Number(u.wallet_balance ?? 0).toFixed(2)} ฿
                    {u.wallet_frozen ? <span className="ml-2 text-xs text-amber-500 font-semibold">อั้นอยู่</span> : null}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => openWallet(u)} className="px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100">
                    ดู
                  </button>
                  <button onClick={() => { setAdjustModal(u); setAdjustForm({ amount: '', reason: '' }) }}
                    className="px-2.5 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-medium hover:bg-amber-100">
                    ปรับ
                  </button>
                  <button onClick={() => handleFreeze(u.user_id, u.wallet_frozen)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${u.wallet_frozen ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                    {u.wallet_frozen ? 'ปลด' : 'อั้น'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">ประวัติธุรกรรม</h2>
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
              className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
              <option value="">ทุกประเภท</option>
              <option value="topup">เติมเงิน</option>
              <option value="deduct">ตัดเงิน</option>
              <option value="refund">คืนเงิน</option>
              <option value="adjust">ปรับยอด</option>
            </select>
          </div>
          {loading ? <p className="text-center text-gray-400 py-8">กำลังโหลด...</p> : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.map((t) => (
                <div key={t.txn_id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.first_name} {t.last_name}</p>
                    <p className="text-xs text-gray-400">{t.reason || t.ref}</p>
                    <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 ${TYPE_COLOR[t.type]}`}>{TYPE_LABEL[t.type]}</span>
                    <p className={`text-sm font-bold mt-1 ${TYPE_COLOR[t.type]}`}>{Number(t.amount).toFixed(2)} ฿</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-3">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">‹</button>
              <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">›</button>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Detail Modal */}
      {walletModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">{walletModal.user.name}</h2>
                <p className="text-xs text-gray-400">{walletModal.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setAdjustModal({ user_id: walletModal.user.user_id, ...walletModal.user }); setAdjustForm({ amount: '', reason: '' }) }}
                  className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-xs font-medium hover:bg-amber-100">ปรับยอด</button>
                <button onClick={() => handleFreeze(walletModal.user.user_id, walletModal.user.wallet_frozen)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium ${walletModal.user.wallet_frozen ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {walletModal.user.wallet_frozen ? 'ปลดอั้น' : 'อั้น wallet'}
                </button>
                <button onClick={() => setWalletModal(null)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 flex gap-6 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-500">ยอดคงเหลือ</p>
                <p className="text-xl font-bold text-primary">{Number(walletModal.user.wallet_balance).toFixed(2)} ฿</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">สถานะ</p>
                <p className={`text-sm font-semibold ${walletModal.user.wallet_frozen ? 'text-amber-500' : 'text-green-600'}`}>
                  {walletModal.user.wallet_frozen ? 'ถูกอั้น' : 'ปกติ'}
                </p>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {walletModal.transactions.map((t) => (
                <div key={t.txn_id} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div>
                    <p className="text-xs font-medium text-gray-700">{TYPE_LABEL[t.type]}</p>
                    <p className="text-xs text-gray-400">{t.reason || t.ref}</p>
                    <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <p className={`text-sm font-bold ${TYPE_COLOR[t.type]}`}>{Number(t.amount).toFixed(2)} ฿</p>
                </div>
              ))}
              {walletModal.transactions.length === 0 && <p className="text-center text-gray-400 text-sm py-6">ไม่มีประวัติ</p>}
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {adjustModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">ปรับยอด Wallet</h2>
              <button onClick={() => setAdjustModal(null)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">{adjustModal.name || `${adjustModal.first_name} ${adjustModal.last_name}`}</p>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">จำนวน (บวก = เติม, ลบ = หัก)</label>
                <div className="flex gap-2">
                  <button onClick={() => setAdjustForm((f) => ({ ...f, amount: f.amount.startsWith('-') ? f.amount.slice(1) : `-${f.amount}` }))}
                    className="px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">+/-</button>
                  <input type="number" value={adjustForm.amount} onChange={(e) => setAdjustForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="เช่น 100 หรือ -50"
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">เหตุผล *</label>
                <input value={adjustForm.reason} onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="เหตุผลการปรับยอด"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAdjustModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600">ยกเลิก</button>
                <button onClick={handleAdjust} disabled={adjustSaving}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50">
                  {adjustSaving ? 'กำลังบันทึก...' : 'ยืนยัน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}