import { createContext, useContext, useState, useCallback } from 'react'
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa'

const ToastContext = createContext(null)

let uid = 0

const STYLES = {
  success: { bar: 'bg-green-500', icon: FaCheckCircle, iconColor: 'text-green-500', bg: 'bg-white' },
  error:   { bar: 'bg-red-500',   icon: FaTimesCircle,  iconColor: 'text-red-500',   bg: 'bg-white' },
  info:    { bar: 'bg-blue-500',  icon: FaInfoCircle,   iconColor: 'text-blue-500',  bg: 'bg-white' },
  warning: { bar: 'bg-amber-400', icon: FaExclamationTriangle, iconColor: 'text-amber-500', bg: 'bg-white' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300)
  }, [])

  const add = useCallback((type, message, duration = 3500) => {
    const id = ++uid
    setToasts((prev) => [...prev, { id, type, message, leaving: false }])
    setTimeout(() => remove(id), duration)
  }, [remove])

  const toast = {
    success: (msg, d) => add('success', msg, d),
    error:   (msg, d) => add('error',   msg, d),
    info:    (msg, d) => add('info',    msg, d),
    warning: (msg, d) => add('warning', msg, d),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: '360px', width: 'calc(100vw - 40px)' }}>
        {toasts.map((t) => {
          const s = STYLES[t.type] || STYLES.info
          const Icon = s.icon
          return (
            <div
              key={t.id}
              className={`${s.bg} rounded-2xl shadow-lg flex items-start gap-3 pr-3 overflow-hidden pointer-events-auto
                transition-all duration-300 ${t.leaving ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}
            >
              {/* colored left bar */}
              <div className={`${s.bar} w-1.5 flex-shrink-0 self-stretch rounded-l-2xl`} />
              <div className="flex items-center gap-3 py-3.5 flex-1 min-w-0">
                <Icon size={18} className={`${s.iconColor} flex-shrink-0`} />
                <p className="text-sm text-gray-800 font-medium leading-snug">{t.message}</p>
              </div>
              <button
                onClick={() => remove(t.id)}
                className="mt-3.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <FaTimes size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}