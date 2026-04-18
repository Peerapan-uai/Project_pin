import { useState, useRef, useEffect } from 'react'

/**
 * Custom Select dropdown
 * Props:
 *   value        — selected value (string)
 *   onChange     — fn(value)
 *   options      — [{ value, label }]
 *   placeholder  — string (optional)
 *   className    — extra class on the trigger button (optional)
 *   disabled     — bool (optional)
 */
export default function Select({ value, onChange, options = [], placeholder = 'เลือก...', className = '', disabled = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find((o) => String(o.value) === String(value))

  // ปิดเมื่อคลิกนอก
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (val) => {
    onChange(val)
    setOpen(false)
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border rounded-xl text-sm text-left transition-colors focus:outline-none
          ${open ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        {/* Triangle — ▲ เมื่อเปิด, ▼ เมื่อปิด */}
        <span className={`text-[10px] text-gray-500 transition-transform flex-shrink-0 ${open ? '' : 'rotate-180'}`}>▲</span>
      </button>

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value)
            return (
              <div
                key={opt.value}
                onMouseDown={() => handleSelect(opt.value)}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors
                  ${isSelected
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-50'}`}
              >
                {opt.label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
