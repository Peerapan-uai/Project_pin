import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

const DAYS_TH = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']
const MONTHS_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                   'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
const MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

function toStr(d) {
  if (!d) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function parseDate(s) {
  if (!s) return null
  return new Date(s + 'T00:00:00')
}
function sameDay(a, b) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function inRange(d, from, to) {
  if (!d || !from || !to) return false
  return d >= from && d <= to
}
function fmtShort(d) {
  if (!d) return ''
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

// presets
function getToday() { const d = new Date(); d.setHours(0,0,0,0); return { from: d, to: new Date(d) } }
function getThisWeek() {
  const now = new Date(); now.setHours(0,0,0,0)
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1
  const mon = new Date(now); mon.setDate(now.getDate() - day)
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  return { from: mon, to: sun }
}
function getThisMonth() {
  const now = new Date(); now.setHours(0,0,0,0)
  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 0) }
}

/**
 * DateRangePicker — dual calendar with presets
 * Props: fromDate, toDate (YYYY-MM-DD strings), onChange({ from, to })
 */
export default function DateRangePicker({ fromDate, toDate, onChange, disabled, single }) {
  const [open, setOpen] = useState(false)
  const [tempFrom, setTempFrom] = useState(null)
  const [tempTo, setTempTo] = useState(null)
  const [hoverDate, setHoverDate] = useState(null)
  const [activePreset, setActivePreset] = useState(null)

  // left calendar view month, right = left + 1
  const [leftView, setLeftView] = useState(() => {
    if (fromDate) { const d = parseDate(fromDate); return { year: d.getFullYear(), month: d.getMonth() } }
    const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }
  })

  const rightView = leftView.month === 11
    ? { year: leftView.year + 1, month: 0 }
    : { year: leftView.year, month: leftView.month + 1 }

  useEffect(() => {
    if (open) {
      setTempFrom(parseDate(fromDate))
      setTempTo(parseDate(toDate))
      setActivePreset(null)
      if (fromDate) {
        const d = parseDate(fromDate)
        setLeftView({ year: d.getFullYear(), month: d.getMonth() })
      }
    }
  }, [open])

  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden' }
    else { document.body.style.overflow = '' }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const today = new Date(); today.setHours(0,0,0,0)

  const prevMonth = () => setLeftView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
  const nextMonth = () => setLeftView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })

  const handleDayClick = (date) => {
    setActivePreset(null)
    if (!tempFrom || (tempFrom && tempTo)) {
      // start new selection
      setTempFrom(date)
      setTempTo(null)
    } else {
      // complete selection
      if (date < tempFrom) {
        setTempTo(tempFrom)
        setTempFrom(date)
      } else {
        setTempTo(date)
      }
    }
  }

  const applyPreset = (name, getter) => {
    const { from, to } = getter()
    setTempFrom(from)
    setTempTo(to)
    setActivePreset(name)
    setLeftView({ year: from.getFullYear(), month: from.getMonth() })
  }

  const handleApply = () => {
    if (tempFrom && tempTo) {
      onChange({ from: toStr(tempFrom), to: toStr(tempTo) })
    } else if (tempFrom) {
      onChange({ from: toStr(tempFrom), to: toStr(tempFrom) })
    }
    setOpen(false)
  }

  const handleCancel = () => setOpen(false)

  // display text
  const displayFrom = parseDate(fromDate)
  const displayTo = parseDate(toDate)
  const displayText = displayFrom && displayTo
    ? `${fmtShort(displayFrom)}  -  ${fmtShort(displayTo)}`
    : 'เลือกช่วงวันที่'

  const renderCalendar = (view, hideTitle) => {
    const firstDay = new Date(view.year, view.month, 1)
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
    const startCol = (firstDay.getDay() + 6) % 7

    const cells = []
    for (let i = 0; i < startCol; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    const effectiveTo = tempTo || hoverDate

    return (
      <div className="flex-1 min-w-0">
        {!hideTitle && (
        <div className="text-center font-semibold text-gray-800 text-sm mb-2">
          {MONTHS_TH[view.month]} {view.year}
        </div>
        )}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_TH.map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            if (!d) return <div key={`e-${i}`} className="h-8" />
            const cellDate = new Date(view.year, view.month, d)
            const isToday = sameDay(cellDate, today)
            const isStart = sameDay(cellDate, tempFrom)
            const isEnd = tempTo ? sameDay(cellDate, tempTo) : (tempFrom && !tempTo && hoverDate && sameDay(cellDate, hoverDate))
            const isInRange = tempFrom && effectiveTo && !isStart && !isEnd && inRange(cellDate,
              tempFrom < (effectiveTo) ? tempFrom : effectiveTo,
              tempFrom < (effectiveTo) ? effectiveTo : tempFrom
            )
            const isFuture = cellDate > today

            return (
              <div key={d} className={`relative h-8 flex items-center justify-center
                ${isInRange ? 'bg-primary/10' : ''}
                ${isStart ? 'rounded-l-full bg-primary/10' : ''}
                ${isEnd ? 'rounded-r-full bg-primary/10' : ''}
              `}>
                <button
                  type="button"
                  disabled={isFuture}
                  onClick={() => handleDayClick(cellDate)}
                  onMouseEnter={() => { if (tempFrom && !tempTo) setHoverDate(cellDate) }}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors relative z-10
                    ${isStart || isEnd ? 'bg-primary text-white font-bold'
                    : isToday ? 'text-primary font-bold ring-1 ring-primary/40'
                    : isFuture ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {d}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const presets = [
    { name: 'today', label: 'วันนี้', getter: getToday },
    { name: 'week', label: 'สัปดาห์นี้', getter: getThisWeek },
    { name: 'month', label: 'เดือนนี้', getter: getThisMonth },
  ]

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2.5 border rounded-xl px-3 py-2.5 text-sm transition-all
          ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'bg-white cursor-pointer hover:border-gray-400'}
          border-gray-300 focus:outline-none`}
      >
        <FaCalendarAlt size={13} className={fromDate ? 'text-primary' : 'text-gray-400'} />
        <span className={fromDate ? 'text-gray-900' : 'text-gray-400'}>{displayText}</span>
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          onClick={handleCancel}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            style={{ maxWidth: single ? 420 : 680 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header — display bar */}
            <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-2">
              <FaCalendarAlt size={14} className="text-primary" />
              <span className="text-sm font-medium text-gray-700">
                {tempFrom ? fmtShort(tempFrom) : '...'} &nbsp;-&nbsp; {tempTo ? fmtShort(tempTo) : '...'}
              </span>
            </div>

            <div className="flex">
              {/* Calendars */}
              <div className="p-5 flex-1">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                    <FaChevronLeft size={12} className="text-gray-500" />
                  </button>
                  {single && (
                    <span className="font-semibold text-gray-900 text-sm">{MONTHS_TH[leftView.month]} {leftView.year}</span>
                  )}
                  <button type="button" onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                    <FaChevronRight size={12} className="text-gray-500" />
                  </button>
                </div>

                <div className={single ? '' : 'flex gap-6'} onMouseLeave={() => setHoverDate(null)}>
                  {renderCalendar(leftView, single)}
                  {!single && renderCalendar(rightView)}
                </div>
              </div>

              {/* Right: Presets + inputs */}
              <div className="w-48 border-l border-gray-100 p-4 flex flex-col gap-3 bg-gray-50/50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ช่วงเวลา</p>
                {presets.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p.name, p.getter)}
                    className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${activePreset === p.name
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <div className="flex-1" />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={handleCancel}
                    className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
                    ยกเลิก
                  </button>
                  <button type="button" onClick={handleApply}
                    className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-green-600">
                    ตกลง
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}