import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../context/ToastContext'
import { FaTrash, FaUndo, FaUser, FaBuilding, FaBolt } from 'react-icons/fa'

const TABS = [
  { key: 'users',    label: 'ผู้ใช้',      Icon: FaUser },
  { key: 'stations', label: 'สถานี',       Icon: FaBuilding },
  { key: 'chargers', label: 'ตู้ชาร์จ',   Icon: FaBolt },
]

export default function TrashPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('users')
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [confirmItem, setConfirmItem]   = useState(null)  // { item, action: 'restore'|'delete' }

  const fetchTrash = (tab = activeTab) => {
    setLoading(true)
    api.get(`/api/admin/trash/${tab}`)
      .then((res) => setItems(res.data.items ?? []))
      .catch(() => toast.error('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTrash(activeTab) }, [activeTab])

  const handleRestore = (item) => {
    const idKey = activeTab === 'users' ? 'user_id' : activeTab === 'stations' ? 'station_id' : 'charger_id'
    api.patch(`/api/admin/trash/${activeTab}/${item[idKey]}/restore`)
      .then(() => { toast.success('กู้คืนสำเร็จ'); setConfirmItem(null); fetchTrash() })
      .catch((err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
  }

  const handleDelete = (item) => {
    const idKey = activeTab === 'users' ? 'user_id' : activeTab === 'stations' ? 'station_id' : 'charger_id'
    api.delete(`/api/admin/trash/${activeTab}/${item[idKey]}`)
      .then(() => { toast.success('ลบถาวรสำเร็จ'); setConfirmItem(null); fetchTrash() })
      .catch((err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'))
  }

  const getLabel = (item) => {
    if (activeTab === 'users')    return `${item.first_name} ${item.last_name} (${item.email})`
    if (activeTab === 'stations') return `${item.name} — ${item.address}`
    return `${item.charger_name} · ${item.connector_type} · ${item.station_name}`
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <FaTrash className="text-red-400" /> Recycle Bin
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">กำลังโหลด...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <FaTrash size={32} className="opacity-30" />
            <p>ไม่มีรายการใน trash</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">รายการ</th>
                {activeTab === 'users' && <th className="px-5 py-3 text-left">Role</th>}
                <th className="px-5 py-3 text-left">ลบเมื่อ</th>
                <th className="px-5 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, i) => {
                const idKey = activeTab === 'users' ? 'user_id' : activeTab === 'stations' ? 'station_id' : 'charger_id'
                return (
                  <tr key={item[idKey] ?? i} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 text-gray-800 font-medium">{getLabel(item)}</td>
                    {activeTab === 'users' && (
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{item.role}</span>
                      </td>
                    )}
                    <td className="px-5 py-3 text-gray-400">{formatDate(item.deleted_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setConfirmItem({ item, action: 'restore' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-xs font-medium transition"
                        >
                          <FaUndo size={11} /> กู้คืน
                        </button>
                        <button
                          onClick={() => setConfirmItem({ item, action: 'delete' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-medium transition"
                        >
                          <FaTrash size={11} /> ลบถาวร
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            {confirmItem.action === 'restore' ? (
              <>
                <h2 className="text-lg font-bold text-gray-800">ยืนยันการกู้คืน</h2>
                <p className="text-sm text-gray-600">
                  กู้คืน <span className="font-semibold text-green-600">{getLabel(confirmItem.item)}</span> กลับมาใช้งานใช่ไหม?
                </p>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setConfirmItem(null)} className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">ยกเลิก</button>
                  <button onClick={() => handleRestore(confirmItem.item)} className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600">กู้คืน</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-800">ลบถาวร</h2>
                <p className="text-sm text-gray-600">
                  ลบ <span className="font-semibold text-red-500">{getLabel(confirmItem.item)}</span> ออกจากระบบถาวร
                </p>
                <p className="text-xs text-red-400 bg-red-50 rounded-lg px-3 py-2">
                  ⚠️ ข้อมูลจะหายถาวร กู้คืนไม่ได้อีก
                </p>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setConfirmItem(null)} className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">ยกเลิก</button>
                  <button onClick={() => handleDelete(confirmItem.item)} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600">ลบถาวร</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
