export const mockNotifications = [
  {
    notification_id: 1, user_id: 3,
    title: "จองสำเร็จ",
    message: "คุณจองตู้ A1 ที่ EV Hub สยามพารากอน เวลา 14:00-14:30 น.",
    type: "booking", is_read: false,
    created_at: "2024-03-23T13:55:00Z"
  },
  {
    notification_id: 2, user_id: 3,
    title: "ชาร์จเสร็จแล้ว!",
    message: "ชาร์จครบ 80% ที่ตู้ A2 ค่าใช้จ่าย 195.00 บาท",
    type: "charging", is_read: true,
    created_at: "2024-03-23T12:30:00Z"
  },
  {
    notification_id: 3, user_id: 3,
    title: "การจองหมดอายุ",
    message: "การจองตู้ D1 ที่ EV Point เมกาบางนา หมดอายุแล้ว",
    type: "booking", is_read: true,
    created_at: "2024-03-15T09:31:00Z"
  },
  {
    notification_id: 4, user_id: 3,
    title: "ชำระเงินสำเร็จ",
    message: "ชำระเงิน 165.75 บาท สำหรับการชาร์จที่ EV Hub สยามพารากอน สำเร็จแล้ว",
    type: "payment", is_read: false,
    created_at: "2024-03-23T15:10:00Z"
  },
  {
    notification_id: 5, user_id: 2,
    title: "งานซ่อมใหม่",
    message: "ได้รับมอบหมายซ่อมตู้ B1 ที่ EV Hub สยามพารากอน",
    type: "maintenance", is_read: false,
    created_at: "2024-03-23T10:05:00Z"
  },
  {
    notification_id: 6, user_id: 1,
    title: "แจ้งปัญหาใหม่",
    message: "มีการแจ้งปัญหาตู้ C2 ที่ EV Station เซ็นทรัลเวิลด์ รอการมอบหมาย",
    type: "maintenance", is_read: false,
    created_at: "2024-03-23T14:01:00Z"
  }
]
