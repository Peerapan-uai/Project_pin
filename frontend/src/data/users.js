export const mockUsers = [
  { user_id: 1, email: "admin@evcharger.com", first_name: "Admin", last_name: "System", role: "admin", is_banned: false, phone: "0800000001", created_at: "2024-01-01T00:00:00Z" },
  { user_id: 2, email: "tech1@evcharger.com", first_name: "สมชาย", last_name: "ช่างดี", role: "technician", is_banned: false, phone: "0811111111", created_at: "2024-01-02T00:00:00Z" },
  { user_id: 3, email: "user1@gmail.com", first_name: "สมหญิง", last_name: "ใจดี", role: "user", is_banned: false, phone: "0822222222", created_at: "2024-01-03T00:00:00Z" },
  { user_id: 4, email: "user2@gmail.com", first_name: "สมศักดิ์", last_name: "รักษ์โลก", role: "user", is_banned: false, phone: "0833333333", created_at: "2024-01-04T00:00:00Z" }
]

export const currentUser = mockUsers[2] // logged in as user1 by default
