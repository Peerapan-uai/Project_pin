import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'
import api from '../utils/api'

const NotificationContext = createContext(null)

const POLL_INTERVAL = 10000 // 10 วินาที

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef(null)
  // ใช้ ref แทนการ depend บน user object โดยตรง — ป้องกัน reference เปลี่ยนทุก render
  const userIdRef = useRef(user?.user_id)

  useEffect(() => {
    userIdRef.current = user?.user_id
  }, [user?.user_id])

  const fetchNotifications = useCallback(() => {
    if (!userIdRef.current) return
    api.get('/api/notifications')
      .then((res) => {
        setNotifications(res.data.notifications ?? [])
        setLoading(false)
      })
      .catch(() => {})
  }, []) // ไม่มี dependency → ไม่ recreate ทุก render → interval ไม่ถูก reset

  // เริ่ม/หยุด polling ตาม login/logout
  useEffect(() => {
    if (!user?.user_id) {
      setNotifications([])
      setLoading(false)
      clearInterval(intervalRef.current)
      return
    }

    setLoading(true)
    fetchNotifications()
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL)

    return () => clearInterval(intervalRef.current)
  }, [user?.user_id, fetchNotifications]) // depend บน user_id (primitive) ไม่ใช่ object

  // Fetch ทันทีเมื่อ tab กลับมา active
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && userIdRef.current) {
        fetchNotifications()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [fetchNotifications])

  const refresh = useCallback(() => fetchNotifications(), [fetchNotifications])

  const markRead = useCallback((id) => {
    api.patch(`/api/notifications/${id}/read`)
      .then(() => setNotifications((prev) =>
        prev.map((n) => n.notification_id === id ? { ...n, is_read: true } : n)
      ))
      .catch(() => {})
  }, [])

  const markAllRead = useCallback(() => {
    api.patch('/api/notifications/read-all')
      .then(() => setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true }))))
      .catch(() => {})
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}