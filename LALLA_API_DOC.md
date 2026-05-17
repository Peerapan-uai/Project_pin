# API Documentation — นางสาว ลัลลา โดดแช, L002

---

## Users (Admin)

---

Users - Get All Users ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/users
  req.headers{ Authorization }
res.json{ users: [ user_id, email, first_name, last_name, phone, role, wallet_balance, is_banned, created_at ] }

---

Users - Get User by ID ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/users/{id}
  req.headers{ Authorization }
  req.params{ id }
res.json{ user: { user_id, email, first_name, last_name, phone, role, wallet_balance, is_banned }, tech_profile: { tech_id, work_mode, primary_skill, status } }

---

Users - Update User ( นางสาว ลัลลา โดดแช, L002 )
PUT  /api/users/{id}
  req.headers{ Authorization }
  req.params{ id }
  req.body{ first_name, last_name, email, phone, role, primary_skill, work_mode }
res.json{ message }

---

Users - Ban / Unban User ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/users/{id}/ban
  req.headers{ Authorization }
  req.params{ id }
  req.body{ is_banned, ban_reason }
res.json{ message, is_banned }

---

Users - Create Technician Account ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/users/technician
  req.headers{ Authorization }
  req.body{ first_name, last_name, email, password, phone, primary_skill, work_mode }
res.json{ message, user_id }

---

Users - Delete User (Soft Delete) ( นางสาว ลัลลา โดดแช, L002 )
DELETE  /api/users/{id}
  req.headers{ Authorization }
  req.params{ id }
res.json{ message }

---

## Stations (Admin)

---

Stations - Create Station ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/stations
  req.headers{ Authorization }
  req.body{ name, address, latitude, longitude, floor, open_time, close_time, image, status, station_type }
res.json{ message, station_id }

---

Stations - Update Station ( นางสาว ลัลลา โดดแช, L002 )
PUT  /api/stations/{id}
  req.headers{ Authorization }
  req.params{ id }
  req.body{ name, address, latitude, longitude, floor, open_time, close_time, image, status, station_type }
res.json{ message }

---

Stations - Delete Station (Soft Delete) ( นางสาว ลัลลา โดดแช, L002 )
DELETE  /api/stations/{id}
  req.headers{ Authorization }
  req.params{ id }
res.json{ message }

---

## Chargers (Admin + Technician)

---

Chargers - Get All Chargers ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/chargers
  req.headers{ Authorization }
res.json[ charger_id, station_id, charger_name, connector_type, power_kw, price_per_kwh, status ]

---

Chargers - Create Charger ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/chargers
  req.headers{ Authorization }
  req.body{ station_id, charger_name, connector_type, power_kw, price_per_kwh, status }
res.json{ message, charger_id }

---

Chargers - Update Charger ( นางสาว ลัลลา โดดแช, L002 )
PUT  /api/chargers/{id}
  req.headers{ Authorization }
  req.params{ id }
  req.body{ charger_name, connector_type, power_kw, price_per_kwh, status }
res.json{ message }

---

Chargers - Update Charger Status ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/chargers/{id}/status
  req.headers{ Authorization }
  req.params{ id }
  req.body{ status }
res.json{ message }

---

Chargers - Delete Charger (Soft Delete) ( นางสาว ลัลลา โดดแช, L002 )
DELETE  /api/chargers/{id}
  req.headers{ Authorization }
  req.params{ id }
res.json{ message }

---

## Tickets (Admin + Technician)

---

Tickets - Get All Tickets ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/tickets
  req.headers{ Authorization }
res.json{ tickets: [ ticket_id, charger_id, reported_by, assigned_to, issue_type, title, description, status, priority, charger_name, connector_type, power_kw, station_name, station_address, latitude, longitude, floor, reporter_name, assigned_to_name, created_at ] }

---

Tickets - Assign Ticket to Technician ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/tickets/{id}/assign
  req.headers{ Authorization }
  req.params{ id }
  req.body{ technician_id }
res.json{ message }

---

Tickets - Unassign Technician from Ticket ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/tickets/{id}/unassign
  req.headers{ Authorization }
  req.params{ id }
res.json{ message }

---

Tickets - Update Ticket Status ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/tickets/{id}/status
  req.headers{ Authorization }
  req.params{ id }
  req.body{ status, repair_notes, test_notes }
res.json{ message }

---

Tickets - Upload Repair Image ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/tickets/{id}/image
  req.headers{ Authorization }
  req.params{ id }
  req.body{ image (multipart/form-data) }
res.json{ message, image_url }

---

Tickets - Upload Test Evidence Image ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/tickets/{id}/test-image
  req.headers{ Authorization }
  req.params{ id }
  req.body{ image (multipart/form-data) }
res.json{ message, image_url }

---

Tickets - Technician Check-in ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/tickets/{id}/checkin
  req.headers{ Authorization }
  req.params{ id }
res.json{ message }

---

Tickets - Technician Check-out ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/tickets/{id}/checkout
  req.headers{ Authorization }
  req.params{ id }
res.json{ message }

---

Tickets - Override Priority ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/tickets/{id}/priority
  req.headers{ Authorization }
  req.params{ id }
  req.body{ priority }
res.json{ message }

---

Tickets - Submit Repair Proposal ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/tickets/{id}/proposal
  req.headers{ Authorization }
  req.params{ id }
  req.body{ recommendation, repair_cost_estimate, replace_cost_estimate, estimated_time_hours, description, evidence_image (multipart/form-data) }
res.json{ message, proposal_id }

---

Tickets - Get Repair Proposals ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/tickets/{id}/proposals
  req.headers{ Authorization }
  req.params{ id }
res.json{ proposals: [ proposal_id, recommendation, repair_cost_estimate, replace_cost_estimate, estimated_time_hours, description, status, admin_note, tech_name, reviewed_by_name, created_at ] }

---

Tickets - Review Repair Proposal ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/tickets/proposals/{id}/review
  req.headers{ Authorization }
  req.params{ id }
  req.body{ status, admin_note }
res.json{ message }

---

Tickets - Get Repair History ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/tickets/{id}/repair-history
  req.headers{ Authorization }
  req.params{ id }
res.json{ history: [ ticket_id, title, issue_type, priority, completed_at, repair_notes, tech_name ] }

---

## Bookings (Admin)

---

Bookings - Get All Bookings ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/bookings/all
  req.headers{ Authorization }
res.json{ bookings: [ booking_id, user_id, charger_id, status, scheduled_start, duration_min, created_at ] }

---

Bookings - Admin Cancel Booking ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/bookings/{id}/admin-cancel
  req.headers{ Authorization }
  req.params{ id }
  req.body{ reason }
res.json{ message }

---

## Payments (Admin)

---

Payments - Get All Payments ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/payments/admin/all
  req.headers{ Authorization }
res.json{ payments: [ payment_id, session_id, user_id, amount, method, status, transaction_ref, paid_at ] }

---

## Sessions (Admin)

---

Sessions - Get All Sessions ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/sessions/all
  req.headers{ Authorization }
res.json{ sessions: [ session_id, booking_id, user_id, charger_id, start_time, end_time, energy_kwh, status ] }

---

## Spare Parts (Admin + Technician)

---

Spare Parts - Get All Parts ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/spare-parts
  req.headers{ Authorization }
res.json{ parts: [ part_id, name, category, unit, stock_qty, min_stock, cost_per_unit ] }

---

Spare Parts - Add Part ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/spare-parts
  req.headers{ Authorization }
  req.body{ name, category, unit, stock_qty, min_stock, cost_per_unit }
res.json{ message, part_id }

---

Spare Parts - Update Stock ( นางสาว ลัลลา โดดแช, L002 )
PUT  /api/spare-parts/{id}/stock
  req.headers{ Authorization }
  req.params{ id }
  req.body{ stock_qty }
res.json{ message }

---

Spare Parts - Get Part Requests by Ticket ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/spare-parts/requests/{ticketId}
  req.headers{ Authorization }
  req.params{ ticketId }
res.json{ requests: [ request_id, ticket_id, part_id, part_name, unit, category, qty_requested, qty_approved, status, approved_by_name, requested_at ] }

---

Spare Parts - Request Part (Technician) ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/spare-parts/request
  req.headers{ Authorization }
  req.body{ ticket_id, part_id, qty_requested }
res.json{ message, request_id }

---

Spare Parts - Approve Part Request ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/spare-parts/request/{id}/approve
  req.headers{ Authorization }
  req.params{ id }
  req.body{ qty_approved }
res.json{ message }

---

Spare Parts - Reject Part Request ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/spare-parts/request/{id}/reject
  req.headers{ Authorization }
  req.params{ id }
  req.body{ notes }
res.json{ message }

---

## Admin Wallet

---

Admin Wallet - Get User Wallet ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/wallet/users/{id}/wallet
  req.headers{ Authorization }
  req.params{ id }
res.json{ user: { user_id, first_name, last_name, wallet_balance, wallet_frozen, freeze_reason }, transactions: [ txn_id, amount, type, ref, reason, created_at ] }

---

Admin Wallet - Get All Transactions ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/wallet/transactions
  req.headers{ Authorization }
  req.query{ page, limit, user_id, type, from_date, to_date }
res.json{ transactions: [ txn_id, user_id, amount, type, ref, reason, created_at ], total, page, total_pages }

---

Admin Wallet - Get Transaction by ID ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/wallet/transactions/{txnId}
  req.headers{ Authorization }
  req.params{ txnId }
res.json{ transaction: { txn_id, user_id, amount, type, ref, reason, adjusted_by, created_at } }

---

Admin Wallet - Adjust Balance ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/admin/wallet/users/{userId}/wallet/adjust
  req.headers{ Authorization }
  req.params{ userId }
  req.body{ amount, reason }
res.json{ success, message, ref, previous_balance, adjustment_amount, new_balance, reason }

---

Admin Wallet - Freeze / Unfreeze Wallet ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/admin/wallet/users/{userId}/wallet/freeze
  req.headers{ Authorization }
  req.params{ userId }
  req.body{ freeze, reason }
res.json{ success, message, wallet_frozen, freeze_reason }

---

Admin Wallet - Wallet Summary ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/wallet/summary
  req.headers{ Authorization }
  req.query{ from_date, to_date }
res.json{ summary: { total_wallet_balance, total_topup, total_deduct, total_refund, total_adjust } }

---

## Admin Reports

---

Admin Reports - Revenue Report ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/reports/revenue
  req.headers{ Authorization }
  req.query{ period, from_date, to_date, station_id }
res.json{ summary: { total_revenue }, data: [ period_date, revenue ] }

---

Admin Reports - Usage Report ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/reports/usage
  req.headers{ Authorization }
  req.query{ from_date, to_date }
res.json{ summary: { total_energy_kwh, total_sessions }, data: [ date, total_sessions, total_energy_kwh ] }

---

Admin Reports - Stations Report ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/reports/stations
  req.headers{ Authorization }
res.json{ data: [ station_id, name, total_revenue, total_sessions, total_energy_kwh ] }

---

Admin Reports - Comparison ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/reports/comparison
  req.headers{ Authorization }
  req.query{ compare_type }
res.json{ current_label, previous_label, current_revenue, previous_revenue, percentage_change }

---

Admin Reports - Export CSV ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/admin/reports/export
  req.headers{ Authorization }
  req.body{ report_type, from_date, to_date }
res → CSV file (Content-Disposition: attachment)

---

Admin Reports - PDF Invoice ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/reports/payments/{paymentId}/invoice
  req.headers{ Authorization }
  req.params{ paymentId }
res → PDF file (Content-Disposition: attachment)

---

## Admin Notifications

---

Admin Notifications - Get All ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/notifications/all
  req.headers{ Authorization }
res.json{ notifications: [ notification_id, user_id, title, message, type, is_read, created_at ] }

---

Admin Notifications - Broadcast ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/admin/notifications/broadcast
  req.headers{ Authorization }
  req.body{ title, message, type }
res.json{ message, count }

---

Admin Notifications - Targeted ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/admin/notifications/targeted
  req.headers{ Authorization }
  req.body{ title, message, type, user_ids }
res.json{ message, count }

---

Admin Notifications - Schedule ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/admin/notifications/schedule
  req.headers{ Authorization }
  req.body{ title, message, scheduled_at, target_type, target_value, type }
res.json{ message, id }

---

## Admin Logs

---

Admin Logs - Get All Logs ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/logs
  req.headers{ Authorization }
res.json{ logs: [ method, path, status, user_id, ip, created_at ] }

---

Admin Logs - Get Logs by Type ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/logs/{type}
  req.headers{ Authorization }
  req.params{ type }
res.json{ logs: [ method, path, status, user_id, ip, created_at ] }

---

## Admin Trash (Recycle Bin)

---

Admin Trash - Get Deleted Users ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/trash/users
  req.headers{ Authorization }
res.json{ items: [ user_id, email, first_name, last_name, role, deleted_at ] }

---

Admin Trash - Get Deleted Stations ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/trash/stations
  req.headers{ Authorization }
res.json{ items: [ station_id, name, address, deleted_at ] }

---

Admin Trash - Get Deleted Chargers ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/trash/chargers
  req.headers{ Authorization }
res.json{ items: [ charger_id, charger_name, station_id, deleted_at ] }

---

Admin Trash - Restore User ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/admin/trash/users/{id}/restore
  req.headers{ Authorization }
  req.params{ id }
res.json{ message }

---

Admin Trash - Restore Station ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/admin/trash/stations/{id}/restore
  req.headers{ Authorization }
  req.params{ id }
res.json{ message }

---

Admin Trash - Restore Charger ( นางสาว ลัลลา โดดแช, L002 )
PATCH  /api/admin/trash/chargers/{id}/restore
  req.headers{ Authorization }
  req.params{ id }
res.json{ message }

---

Admin Trash - Permanent Delete User ( นางสาว ลัลลา โดดแช, L002 )
DELETE  /api/admin/trash/users/{id}
  req.headers{ Authorization }
  req.params{ id }
res.json{ message }

---

Admin Trash - Permanent Delete Station ( นางสาว ลัลลา โดดแช, L002 )
DELETE  /api/admin/trash/stations/{id}
  req.headers{ Authorization }
  req.params{ id }
res.json{ message }

---

Admin Trash - Permanent Delete Charger ( นางสาว ลัลลา โดดแช, L002 )
DELETE  /api/admin/trash/chargers/{id}
  req.headers{ Authorization }
  req.params{ id }
res.json{ message }

---

## Admin Refund Requests

---

Admin Refunds - Get All Refund Requests ( นางสาว ลัลลา โดดแช, L002 )
GET  /api/admin/refunds
  req.headers{ Authorization }
  req.query{ status }
res.json{ refund_request: [ request_id, payment_id, user_id, title, reason, image_url, status, reviewed_by, created_at ] }

---

Admin Refunds - Approve Refund ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/admin/refunds/{requestId}/approve
  req.headers{ Authorization }
  req.params{ requestId }
res.json{ message, refunded_amount }

---

Admin Refunds - Reject Refund ( นางสาว ลัลลา โดดแช, L002 )
POST  /api/admin/refunds/{requestId}/reject
  req.headers{ Authorization }
  req.params{ requestId }
  req.body{ reason }
res.json{ message }