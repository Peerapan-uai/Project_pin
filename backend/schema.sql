-- =============================================================
-- EV Charger App — Full MySQL Schema
-- Drop and recreate all tables (safe for re-runs)
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS notification_logs;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS maintenance_tickets;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS payment_refunds;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS charging_sessions;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS chargers;
DROP TABLE IF EXISTS stations;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------------
-- users
-- -------------------------------------------------------------
CREATE TABLE users (
  user_id       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255)    NOT NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,
  first_name    VARCHAR(100)    NOT NULL,
  last_name     VARCHAR(100)    NOT NULL,
  phone         VARCHAR(20)     DEFAULT NULL,
  profile_image VARCHAR(500)    DEFAULT NULL,
  role          ENUM('user','admin','technician') NOT NULL DEFAULT 'user',
  wallet_balance DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  wallet_frozen  TINYINT(1)     NOT NULL DEFAULT 0,
  omise_customer_id VARCHAR(50)  DEFAULT NULL,
  is_banned     BOOLEAN         NOT NULL DEFAULT FALSE,
  ban_reason    TEXT            DEFAULT NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- vehicles
-- -------------------------------------------------------------
CREATE TABLE vehicles (
  vehicle_id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id              INT UNSIGNED NOT NULL,
  brand                VARCHAR(100) NOT NULL,
  model                VARCHAR(100) NOT NULL,
  license_plate        VARCHAR(50)  NOT NULL,
  connector_type       ENUM('CCS','CHAdeMO','Type2','Type1') NOT NULL,
  battery_capacity_kwh DECIMAL(6,2) NOT NULL,
  battery_current_kwh  DECIMAL(6,2) DEFAULT NULL,
  PRIMARY KEY (vehicle_id),
  CONSTRAINT fk_vehicles_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- stations
-- -------------------------------------------------------------
CREATE TABLE stations (
  station_id  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255)    NOT NULL,
  address     TEXT            NOT NULL,
  latitude    DECIMAL(10,8)   NOT NULL,
  longitude   DECIMAL(11,8)   NOT NULL,
  floor       VARCHAR(50)     DEFAULT NULL,
  open_time   TIME            DEFAULT NULL,
  close_time  TIME            DEFAULT NULL,
  image       VARCHAR(500)    DEFAULT NULL,
  status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  PRIMARY KEY (station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- chargers
-- -------------------------------------------------------------
CREATE TABLE chargers (
  charger_id      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  station_id      INT UNSIGNED    NOT NULL,
  charger_name    VARCHAR(100)    NOT NULL,
  connector_type  ENUM('CCS','CHAdeMO','Type2','Type1') NOT NULL,
  power_kw        DECIMAL(6,2)    NOT NULL,
  price_per_kwh   DECIMAL(6,2)    NOT NULL,
  status          ENUM('available','reserved','charging','out_of_service') NOT NULL DEFAULT 'available',
  temperature_celsius DECIMAL(5,2) DEFAULT NULL,
  qr_code         VARCHAR(500)    DEFAULT NULL,
  PRIMARY KEY (charger_id),
  CONSTRAINT fk_chargers_station FOREIGN KEY (station_id) REFERENCES stations (station_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- bookings
-- -------------------------------------------------------------
CREATE TABLE bookings (
  booking_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED NOT NULL,
  charger_id     INT UNSIGNED NOT NULL,
  booking_time   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  start_time     TIMESTAMP    NULL DEFAULT NULL,
  end_time       TIMESTAMP    NULL DEFAULT NULL,
  status         ENUM('pending','confirmed','active','cancelled','completed','expired') NOT NULL DEFAULT 'pending',
  queue_position INT          DEFAULT NULL,
  PRIMARY KEY (booking_id),
  CONSTRAINT fk_bookings_user    FOREIGN KEY (user_id)    REFERENCES users    (user_id)    ON DELETE CASCADE,
  CONSTRAINT fk_bookings_charger FOREIGN KEY (charger_id) REFERENCES chargers (charger_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- charging_sessions
-- -------------------------------------------------------------
CREATE TABLE charging_sessions (
  session_id        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  booking_id        INT UNSIGNED    NOT NULL,
  user_id           INT UNSIGNED    NOT NULL,
  charger_id        INT UNSIGNED    NOT NULL,
  start_time        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time          TIMESTAMP       NULL DEFAULT NULL,
  energy_kwh        DECIMAL(8,2)    DEFAULT NULL,
  charge_percentage DECIMAL(5,2)    DEFAULT NULL,
  status            ENUM('charging','completed','failed','stopped') NOT NULL DEFAULT 'charging',
  PRIMARY KEY (session_id),
  CONSTRAINT fk_sessions_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_user    FOREIGN KEY (user_id)    REFERENCES users     (user_id)    ON DELETE CASCADE,
  CONSTRAINT fk_sessions_charger FOREIGN KEY (charger_id) REFERENCES chargers  (charger_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- payments
-- -------------------------------------------------------------
CREATE TABLE payments (
  payment_id      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  session_id      INT UNSIGNED    NOT NULL,
  user_id         INT UNSIGNED    NOT NULL,
  amount          DECIMAL(10,2)   NOT NULL,
  method          ENUM('credit_card','promptpay','wallet') NOT NULL,
  status          ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  transaction_ref VARCHAR(100)    DEFAULT NULL,
  paid_at         TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (payment_id),
  CONSTRAINT fk_payments_session FOREIGN KEY (session_id) REFERENCES charging_sessions (session_id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_user    FOREIGN KEY (user_id)    REFERENCES users             (user_id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- reviews
-- -------------------------------------------------------------
CREATE TABLE reviews (
  review_id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  station_id INT UNSIGNED NOT NULL,
  rating     TINYINT      NOT NULL,
  comment    TEXT         DEFAULT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id),
  CONSTRAINT fk_reviews_user    FOREIGN KEY (user_id)    REFERENCES users    (user_id)    ON DELETE CASCADE,
  CONSTRAINT fk_reviews_station FOREIGN KEY (station_id) REFERENCES stations (station_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- maintenance_tickets
-- -------------------------------------------------------------
CREATE TABLE maintenance_tickets (
  ticket_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  charger_id   INT UNSIGNED NOT NULL,
  reported_by  INT UNSIGNED NOT NULL,
  assigned_to  INT UNSIGNED DEFAULT NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT         DEFAULT NULL,
  image        VARCHAR(500) DEFAULT NULL,
  repair_image VARCHAR(500) DEFAULT NULL,
  repair_notes TEXT         DEFAULT NULL,
  status       ENUM('reported','assigned','in_progress','completed') NOT NULL DEFAULT 'reported',
  priority     ENUM('low','medium','high','critical')                NOT NULL DEFAULT 'medium',
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP    NULL DEFAULT NULL,
  PRIMARY KEY (ticket_id),
  CONSTRAINT fk_tickets_charger     FOREIGN KEY (charger_id)  REFERENCES chargers (charger_id) ON DELETE CASCADE,
  CONSTRAINT fk_tickets_reported_by FOREIGN KEY (reported_by) REFERENCES users    (user_id)    ON DELETE CASCADE,
  CONSTRAINT fk_tickets_assigned_to FOREIGN KEY (assigned_to) REFERENCES users    (user_id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- notifications
-- -------------------------------------------------------------
CREATE TABLE notifications (
  notification_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED NOT NULL,
  title           VARCHAR(255) NOT NULL,
  message         TEXT         NOT NULL,
  type            ENUM('booking','charging','payment','maintenance','system') NOT NULL DEFAULT 'system',
  is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- notification_logs
-- =====================================================================
CREATE TABLE notification_logs (
  log_id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  notification_id   INT UNSIGNED NOT NULL,
  user_id           INT UNSIGNED NOT NULL,
  delivered_at      DATETIME     DEFAULT NULL,
  read_at           DATETIME     DEFAULT NULL,
  status            ENUM('pending', 'delivered', 'failed') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (log_id),
  CONSTRAINT fk_notification_logs_notification FOREIGN KEY (notification_id) REFERENCES notifications (notification_id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_logs_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- payment_refunds
-- =====================================================================
CREATE TABLE payment_refunds (
  refund_id    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  payment_id   INT UNSIGNED    NOT NULL,
  amount       DECIMAL(10,2)   NOT NULL,
  reason       TEXT            DEFAULT NULL,
  refunded_by  INT UNSIGNED    NOT NULL,
  refunded_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (refund_id),
  CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id)  REFERENCES payments (payment_id) ON DELETE CASCADE,
  CONSTRAINT fk_refunds_admin   FOREIGN KEY (refunded_by) REFERENCES users    (user_id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- wallet_transactions
-- =====================================================================
CREATE TABLE wallet_transactions (
  txn_id     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED    NOT NULL,
  amount     DECIMAL(10,2)   NOT NULL,
  type       ENUM('topup','deduct','refund','adjust') NOT NULL,
  ref        VARCHAR(100)    DEFAULT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason     VARCHAR(255)    DEFAULT NULL,
  adjusted_by INT UNSIGNED   DEFAULT NULL,
  PRIMARY KEY (txn_id),
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_wallet_adjusted_by FOREIGN KEY (adjusted_by) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- messages
-- =====================================================================
CREATE TABLE messages (
  message_id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_id   INT UNSIGNED NOT NULL,
  receiver_id INT UNSIGNED NOT NULL,
  content     TEXT         NOT NULL,
  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id),
  CONSTRAINT fk_messages_sender   FOREIGN KEY (sender_id)   REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Performance Indexes ─────────────────────────────────────────────────────
-- เปรียบเหมือนสารบัญหนังสือ: ไม่มี index = เปิดทุกหน้าหาข้อมูล → ช้ามาก
CREATE INDEX idx_chargers_station     ON chargers(station_id, status);
CREATE INDEX idx_bookings_user        ON bookings(user_id, status);
CREATE INDEX idx_bookings_charger     ON bookings(charger_id, status);
CREATE INDEX idx_sessions_user        ON charging_sessions(user_id, status);
CREATE INDEX idx_payments_user        ON payments(user_id, status);
CREATE INDEX idx_payments_session     ON payments(session_id);
CREATE INDEX idx_notifications_user   ON notifications(user_id, is_read);
CREATE INDEX idx_reviews_station      ON reviews(station_id);
CREATE INDEX idx_vehicles_user        ON vehicles(user_id);
CREATE INDEX idx_stations_location    ON stations(latitude, longitude);
CREATE INDEX idx_tickets_user         ON maintenance_tickets(user_id);
CREATE INDEX idx_wallet_txn_user      ON wallet_transactions(user_id);

-- =============================================================
-- Sample Data
-- Password for all users: "password123"
-- bcrypt hash: $2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu
-- =============================================================

-- Users: 1 admin, 4 technicians, 3 regular users
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, wallet_balance) VALUES
  ('admin@evcharge.com',  '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Admin',    'System',      '0800000001', 'admin',      0.00),
  ('tech1@evcharge.com',  '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Somchai',  'Jaidee',      '0800000002', 'technician', 0.00),
  ('tech2@evcharge.com',  '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Prasit',   'Kaewmanee',   '0800000003', 'technician', 0.00),
  ('tech3@evcharge.com',  '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Anuchit',  'Srisawat',    '0800000004', 'technician', 0.00),
  ('tech4@evcharge.com',  '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Wichai',   'Thongkham',   '0800000005', 'technician', 0.00),
  ('alice@example.com',   '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Alice',    'Wongsiri',    '0811111111', 'user',       500.00),
  ('bob@example.com',     '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Bob',      'Prasert',     '0822222222', 'user',       200.00),
  ('charlie@example.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Charlie',  'Somboon',     '0833333333', 'user',       0.00);

-- =============================================================
-- Stations: 10 สถานี (อิงข้อมูลจริงในกรุงเทพฯ)
--   ใหญ่ (4 ตู้): สยาม, บางนา, รังสิต
--   กลาง (3 ตู้): จตุจักร, ลาดพร้าว, พระราม 2, ทองหล่อ
--   เล็ก  (2 ตู้): รามคำแหง, อารีย์, อ่อนนุช
-- =============================================================
INSERT INTO stations (name, address, latitude, longitude, floor, open_time, close_time, status) VALUES
  ('EA Anywhere สยามพารากอน',      '991 ถ.พระราม 1 แขวงปทุมวัน กรุงเทพฯ 10330',          13.74630000, 100.53420000, 'B2',   '06:00:00', '23:00:00', 'active'),
  ('PTT EV Station จตุจักร',       '587/10 ถ.กำแพงเพชร 2 แขวงจตุจักร กรุงเทพฯ 10900',    13.79980000, 100.55050000, NULL,   '00:00:00', '00:00:00', 'active'),
  ('EA Anywhere เซ็นทรัลบางนา',    '585 ถ.บางนา-ตราด แขวงบางนา กรุงเทพฯ 10260',          13.66700000, 100.60470000, 'B1',   '06:00:00', '22:00:00', 'active'),
  ('EGAT EV Station ลาดพร้าว',     '2112 ถ.ลาดพร้าว แขวงวังทองหลาง กรุงเทพฯ 10310',      13.78530000, 100.60930000, NULL,   '00:00:00', '00:00:00', 'active'),
  ('MG Super Charge รามคำแหง',      '99 ถ.รามคำแหง แขวงสะพานสูง กรุงเทพฯ 10240',           13.76200000, 100.64850000, 'G',    '07:00:00', '21:00:00', 'active'),
  ('PTT EV Station พระราม 2',      '888 ถ.พระราม 2 แขวงบางมด กรุงเทพฯ 10150',             13.65670000, 100.47370000, NULL,   '00:00:00', '00:00:00', 'active'),
  ('EA Anywhere ทองหล่อ',          '261 ซ.ทองหล่อ 13 แขวงคลองตันเหนือ กรุงเทพฯ 10110',   13.73450000, 100.57820000, 'B1',   '06:00:00', '23:00:00', 'active'),
  ('Sharge Station อารีย์',        '88 ซ.อารีย์ แขวงสามเสนใน กรุงเทพฯ 10400',              13.77950000, 100.54450000, 'G',    '08:00:00', '20:00:00', 'active'),
  ('PTT EV Station ฟิวเจอร์รังสิต','94 ถ.พหลโยธิน ต.ประชาธิปัตย์ ธัญบุรี ปทุมธานี 12130', 13.98870000, 100.61560000, NULL,   '00:00:00', '00:00:00', 'active'),
  ('EV Station อ่อนนุช',          '900 ถ.อ่อนนุช แขวงสวนหลวง กรุงเทพฯ 10250',            13.72440000, 100.62850000, '1',    '06:00:00', '22:00:00', 'active');

-- =============================================================
-- Chargers: 30 ตู้ (อิงราคาจริง DC Fast 6.50-8.50 ฿/kWh, AC 4.50-5.50 ฿/kWh)
-- =============================================================

-- Station 1: EA Anywhere สยามพารากอน (4 ตู้ — สถานีใหญ่)
INSERT INTO chargers (station_id, charger_name, connector_type, power_kw, price_per_kwh, status, qr_code) VALUES
  (1, 'SIAM-DC01',  'CCS',     150.00, 7.50, 'available',      'QR-SIAM-DC01'),
  (1, 'SIAM-DC02',  'CCS',     150.00, 7.50, 'available',      'QR-SIAM-DC02'),
  (1, 'SIAM-DC03',  'CHAdeMO',  50.00, 6.50, 'available',      'QR-SIAM-DC03'),
  (1, 'SIAM-AC01',  'Type2',    22.00, 5.00, 'available',      'QR-SIAM-AC01');

-- Station 2: PTT EV จตุจักร (3 ตู้ — สถานีกลาง)
INSERT INTO chargers (station_id, charger_name, connector_type, power_kw, price_per_kwh, status, qr_code) VALUES
  (2, 'JJ-DC01',    'CCS',     100.00, 7.00, 'available',      'QR-JJ-DC01'),
  (2, 'JJ-DC02',    'CHAdeMO',  50.00, 6.50, 'available',      'QR-JJ-DC02'),
  (2, 'JJ-AC01',    'Type2',    22.00, 5.00, 'available',      'QR-JJ-AC01');

-- Station 3: EA Anywhere เซ็นทรัลบางนา (4 ตู้ — สถานีใหญ่)
INSERT INTO chargers (station_id, charger_name, connector_type, power_kw, price_per_kwh, status, qr_code) VALUES
  (3, 'BNA-DC01',   'CCS',     150.00, 7.50, 'available',      'QR-BNA-DC01'),
  (3, 'BNA-DC02',   'CCS',     150.00, 7.50, 'available',      'QR-BNA-DC02'),
  (3, 'BNA-DC03',   'CHAdeMO',  50.00, 6.50, 'out_of_service', 'QR-BNA-DC03'),
  (3, 'BNA-AC01',   'Type2',    22.00, 5.00, 'available',      'QR-BNA-AC01');

-- Station 4: EGAT EV ลาดพร้าว (3 ตู้ — สถานีกลาง)
INSERT INTO chargers (station_id, charger_name, connector_type, power_kw, price_per_kwh, status, qr_code) VALUES
  (4, 'LAT-DC01',   'CCS',      80.00, 6.80, 'available',      'QR-LAT-DC01'),
  (4, 'LAT-DC02',   'CCS',      80.00, 6.80, 'available',      'QR-LAT-DC02'),
  (4, 'LAT-AC01',   'Type2',    22.00, 4.80, 'available',      'QR-LAT-AC01');

-- Station 5: MG Super Charge รามคำแหง (2 ตู้ — สถานีเล็ก)
INSERT INTO chargers (station_id, charger_name, connector_type, power_kw, price_per_kwh, status, qr_code) VALUES
  (5, 'RAM-DC01',   'CCS',      60.00, 6.50, 'available',      'QR-RAM-DC01'),
  (5, 'RAM-AC01',   'Type2',     7.40, 4.50, 'available',      'QR-RAM-AC01');

-- Station 6: PTT EV พระราม 2 (3 ตู้ — สถานีกลาง)
INSERT INTO chargers (station_id, charger_name, connector_type, power_kw, price_per_kwh, status, qr_code) VALUES
  (6, 'PR2-DC01',   'CCS',     120.00, 7.00, 'available',      'QR-PR2-DC01'),
  (6, 'PR2-DC02',   'CHAdeMO',  50.00, 6.50, 'available',      'QR-PR2-DC02'),
  (6, 'PR2-AC01',   'Type2',    22.00, 5.00, 'available',      'QR-PR2-AC01');

-- Station 7: EA Anywhere ทองหล่อ (3 ตู้ — สถานีกลาง)
INSERT INTO chargers (station_id, charger_name, connector_type, power_kw, price_per_kwh, status, qr_code) VALUES
  (7, 'THL-DC01',   'CCS',     150.00, 8.00, 'available',      'QR-THL-DC01'),
  (7, 'THL-DC02',   'CCS',     150.00, 8.00, 'available',      'QR-THL-DC02'),
  (7, 'THL-AC01',   'Type2',    22.00, 5.50, 'available',      'QR-THL-AC01');

-- Station 8: Sharge Station อารีย์ (2 ตู้ — สถานีเล็ก)
INSERT INTO chargers (station_id, charger_name, connector_type, power_kw, price_per_kwh, status, qr_code) VALUES
  (8, 'ARI-DC01',   'CCS',      60.00, 6.80, 'available',      'QR-ARI-DC01'),
  (8, 'ARI-AC01',   'Type2',     7.40, 4.50, 'available',      'QR-ARI-AC01');

-- Station 9: PTT EV ฟิวเจอร์รังสิต (4 ตู้ — สถานีใหญ่)
INSERT INTO chargers (station_id, charger_name, connector_type, power_kw, price_per_kwh, status, qr_code) VALUES
  (9, 'RST-DC01',   'CCS',     150.00, 7.50, 'available',      'QR-RST-DC01'),
  (9, 'RST-DC02',   'CCS',     150.00, 7.50, 'available',      'QR-RST-DC02'),
  (9, 'RST-DC03',   'CHAdeMO',  50.00, 6.50, 'available',      'QR-RST-DC03'),
  (9, 'RST-AC01',   'Type2',    22.00, 5.00, 'available',      'QR-RST-AC01');

-- Station 10: EV Station อ่อนนุช (2 ตู้ — สถานีเล็ก)
INSERT INTO chargers (station_id, charger_name, connector_type, power_kw, price_per_kwh, status, qr_code) VALUES
  (10, 'ONN-DC01',  'CCS',      80.00, 7.00, 'available',      'QR-ONN-DC01'),
  (10, 'ONN-AC01',  'Type2',    22.00, 5.00, 'available',      'QR-ONN-AC01');

-- Vehicles: 1 คันสำหรับ Alice (user_id = 6), 1 คันสำหรับ Bob (user_id = 7)
INSERT INTO vehicles (user_id, brand, model, license_plate, connector_type, battery_capacity_kwh, battery_current_kwh) VALUES
  (6, 'Tesla',   'Model 3',    'กข 1234', 'CCS',  75.00, 45.00),
  (7, 'MG',      'MG4 Electric','ขค 5678', 'CCS',  64.00, 30.00),
  (7, 'Nissan',  'Leaf',        'จฉ 9012', 'CHAdeMO', 40.00, 20.00);

-- =============================================================
-- MongoDB Collections (Logs System)
-- =============================================================
-- Database: ev_charger
-- Collection: logs
-- Purpose: Store API request logs for auditing and debugging
-- 
-- Fields:
-- - method: String (GET, POST, PUT, DELETE, PATCH)
-- - url: String (API endpoint path)
-- - statusCode: Number (HTTP status code: 200, 400, 404, 500...)
-- - userId: Number (user_id from users table, null if anonymous)
-- - userRole: String (user, admin, technician)
-- - ip: String (Client IP address)
-- - userAgent: String (Browser/Client information)
-- - responseTime: Number (milliseconds)
-- - body: Object (Request body JSON)
-- - createdAt: Date (Timestamp with TTL: 7776000 sec = 90 days auto-delete)
-- 
-- Indexes:
-- 1. userId_1 — Fast lookup by user
-- 2. statusCode_1 — Find error logs (500, 404, etc.)
-- 3. createdAt_1 with TTL — Auto-delete logs older than 90 days
-- 
-- TTL Configuration:
-- db.logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 })
-- =============================================================
