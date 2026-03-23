export const mockTickets = [
  {
    ticket_id: 1, charger_id: 3, charger_name: "ตู้ B1",
    station_id: 1, station_name: "EV Hub สยามพารากอน", station_address: "991 ถ.พระราม 1",
    reported_by: 3, reporter_name: "สมหญิง ใจดี",
    assigned_to: 2, tech_name: "สมชาย ช่างดี",
    title: "หน้าจอไม่แสดงผล",
    description: "กดแล้วหน้าจอดำ ไม่ขึ้นอะไรเลย พยายามกดปุ่มหลายครั้งแล้ว",
    image: null, repair_image: null,
    status: "in_progress", priority: "high",
    created_at: "2024-03-23T10:00:00Z", completed_at: null,
    repair_notes: "กำลังตรวจสอบบอร์ดควบคุม"
  },
  {
    ticket_id: 2, charger_id: 5, charger_name: "ตู้ C2",
    station_id: 2, station_name: "EV Station เซ็นทรัลเวิลด์", station_address: "999/9 ถ.พระราม 1",
    reported_by: 4, reporter_name: "สมศักดิ์ รักษ์โลก",
    assigned_to: null, tech_name: null,
    title: "สายชาร์จชำรุด",
    description: "สายมีรอยแตก ไม่กล้าใช้ เกรงว่าจะเป็นอันตราย",
    image: null, repair_image: null,
    status: "reported", priority: "medium",
    created_at: "2024-03-23T14:00:00Z", completed_at: null,
    repair_notes: null
  },
  {
    ticket_id: 3, charger_id: 1, charger_name: "ตู้ A1",
    station_id: 1, station_name: "EV Hub สยามพารากอน", station_address: "991 ถ.พระราม 1",
    reported_by: 3, reporter_name: "สมหญิง ใจดี",
    assigned_to: 2, tech_name: "สมชาย ช่างดี",
    title: "ชาร์จช้าผิดปกติ",
    description: "ชาร์จแค่ 5kW ทั้งที่ตู้ระบุ 50kW",
    image: null, repair_image: null,
    status: "completed", priority: "low",
    created_at: "2024-03-10T08:00:00Z", completed_at: "2024-03-12T14:00:00Z",
    repair_notes: "เปลี่ยน firmware ใหม่ แก้ปัญหาได้แล้ว"
  }
]
