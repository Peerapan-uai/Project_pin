import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaChevronDown } from 'react-icons/fa'

const DAYS_TH   = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']
const MONTHS_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                   'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']

// value: "YYYY-MM-DD" | ""   onChange(val: "YYYY-MM-DD" | "")
export default function CalendarPicker({ value, onChange, placeholder = 'เลือกวัน', minDate, disabled }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => {
    if (value) { const d = new Date(value); return { year: d.getFullYear(), month: d.getMonth() } }
    const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }
  })

  useEffect(() => {
    if (value) { const d = new Date(value); setView({ year: d.getFullYear(), month: d.getMonth() }) }
  }, [value])

  // lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const selected = value ? new Date(value + 'T00:00:00') : null
  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const minD     = minDate ? new Date(minDate + 'T00:00:00') : null

  const firstDay    = new Date(view.year, view.month, 1)
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const startCol    = (firstDay.getDay() + 6) % 7

  const cells = []
  for (let i = 0; i < startCol; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const prevMonth = () => setView((v) => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
  const nextMonth = () => setView((v) => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })

  const selectDay = (d) => {
    const mm = String(view.month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    onChange(`${view.year}-${mm}-${dd}`)
    setOpen(false)
  }

  const formatDisplay = (val) => {
    if (!val) return null
    const d = new Date(val + 'T00:00:00')
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2.5 w-full border rounded-xl px-3 py-2.5 text-sm transition-all
          ${open ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'bg-white cursor-pointer'}
          focus:outline-none`}
      >
        <FaCalendarAlt size={13} className={value ? 'text-primary' : 'text-gray-400'} />
        <span className={`flex-1 text-left ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <FaChevronDown size={10} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 w-72"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <FaChevronLeft size={11} className="text-gray-600" />
              </button>
              <span className="font-semibold text-gray-900 text-sm">{MONTHS_TH[view.month]} {view.year}</span>
              <button type="button" onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <FaChevronRight size={11} className="text-gray-600" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_TH.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Date grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((d, i) => {
                if (!d) return <div key={`e-${i}`} />
                const cellDate   = new Date(view.year, view.month, d)
                const isSelected = selected && cellDate.getTime() === selected.getTime()
                const isToday    = cellDate.getTime() === today.getTime()
                const isDisabled = minD && cellDate < minD
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => selectDay(d)}
                    className={`h-9 w-full flex items-center justify-center rounded-full text-sm font-medium transition-colors
                      ${isSelected  ? 'bg-primary text-white shadow-sm'
                      : isToday     ? 'text-primary font-bold hover:bg-primary/10'
                      : isDisabled  ? 'text-gray-300 cursor-not-allowed'
                      :               'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {d}
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                ล้างค่า
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-green-600 transition-colors"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}