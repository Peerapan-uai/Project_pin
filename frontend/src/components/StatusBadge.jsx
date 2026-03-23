const statusConfig = {
  // Charger statuses
  available:      { label: 'ว่าง',           classes: 'bg-green-100 text-green-700 border border-green-200' },
  reserved:       { label: 'ถูกจอง',         classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
  charging:       { label: 'กำลังชาร์จ',    classes: 'bg-blue-100 text-blue-700 border border-blue-200' },
  out_of_service: { label: 'ปิดซ่อม',        classes: 'bg-red-100 text-red-700 border border-red-200' },
  // Booking statuses
  completed:      { label: 'เสร็จสิ้น',      classes: 'bg-green-100 text-green-700 border border-green-200' },
  confirmed:      { label: 'ยืนยันแล้ว',     classes: 'bg-blue-100 text-blue-700 border border-blue-200' },
  cancelled:      { label: 'ยกเลิก',          classes: 'bg-gray-100 text-gray-600 border border-gray-200' },
  expired:        { label: 'หมดอายุ',         classes: 'bg-gray-100 text-gray-600 border border-gray-200' },
  pending:        { label: 'รอดำเนินการ',    classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
  // Ticket statuses
  reported:       { label: 'แจ้งปัญหา',      classes: 'bg-red-50 text-red-600 border border-red-200' },
  assigned:       { label: 'มอบหมายแล้ว',    classes: 'bg-blue-100 text-blue-700 border border-blue-200' },
  in_progress:    { label: 'กำลังซ่อม',      classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
  // Priority levels
  low:            { label: 'ต่ำ',             classes: 'bg-gray-100 text-gray-600 border border-gray-200' },
  medium:         { label: 'กลาง',            classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
  high:           { label: 'สูง',             classes: 'bg-orange-100 text-orange-700 border border-orange-200' },
  critical:       { label: 'วิกฤต',           classes: 'bg-red-100 text-red-700 border border-red-200' },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || {
    label: status,
    classes: 'bg-gray-100 text-gray-600 border border-gray-200',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}
    >
      {config.label}
    </span>
  )
}
