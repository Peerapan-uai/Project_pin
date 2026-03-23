export const mockBookings = [
  {
    booking_id: 1, user_id: 3, charger_id: 1, charger_name: "ตู้ A1",
    station_name: "EV Hub สยามพารากอน",
    booking_time: "2024-03-23T13:55:00Z",
    start_time: "2024-03-23T14:00:00Z",
    end_time: "2024-03-23T14:30:00Z",
    status: "completed",
    vehicle_id: 1, vehicle_name: "Tesla Model 3",
    energy_kwh: 25.5, total_amount: 165.75
  },
  {
    booking_id: 2, user_id: 3, charger_id: 4, charger_name: "ตู้ C1",
    station_name: "EV Station เซ็นทรัลเวิลด์",
    booking_time: "2024-03-20T10:00:00Z",
    start_time: "2024-03-20T10:00:00Z",
    end_time: "2024-03-20T10:30:00Z",
    status: "completed",
    vehicle_id: 1, vehicle_name: "Tesla Model 3",
    energy_kwh: 18.2, total_amount: 109.20
  },
  {
    booking_id: 3, user_id: 3, charger_id: 6, charger_name: "ตู้ D1",
    station_name: "EV Point เมกาบางนา",
    booking_time: "2024-03-15T09:00:00Z",
    start_time: "2024-03-15T09:00:00Z",
    end_time: "2024-03-15T09:30:00Z",
    status: "cancelled",
    vehicle_id: 1, vehicle_name: "Tesla Model 3",
    energy_kwh: null, total_amount: null
  }
]

export const mockPayments = [
  {
    payment_id: 1, user_id: 3, booking_id: 1,
    station_name: "EV Hub สยามพารากอน",
    amount: 165.75, method: "credit_card",
    status: "completed", transaction_ref: "TXN202403230001",
    paid_at: "2024-03-23T15:10:00Z"
  },
  {
    payment_id: 2, user_id: 3, booking_id: 2,
    station_name: "EV Station เซ็นทรัลเวิลด์",
    amount: 109.20, method: "promptpay",
    status: "completed", transaction_ref: "TXN202403200001",
    paid_at: "2024-03-20T11:20:00Z"
  }
]
