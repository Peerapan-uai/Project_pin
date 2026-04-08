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
  status         ENUM('pending','confirmed','cancelled','completed','expired') NOT NULL DEFAULT 'pending',
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
  type       ENUM('topup','deduct') NOT NULL,
  ref        VARCHAR(100)    DEFAULT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (txn_id),
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
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

-- =============================================================
-- Sample Data
-- Password for all users: "password123"
-- bcrypt hash: $2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu
-- =============================================================

-- Users: 1 admin, 1 technician, 2 regular users
INSERT INTO users (email, password_hash, first_name, last_name, phone, role) VALUES
  ('admin@evcharge.com',      '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Admin',    'System',   '0800000001', 'admin'),
  ('tech@evcharge.com',       '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Somchai',  'Techarat',  '0800000002', 'technician'),
  ('alice@example.com',       '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Alice',    'Wongsiri',  '0811111111', 'user'),
  ('bob@example.com',         '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Bob',      'Prasert',   '0822222222', 'user');

-- Stations: 2 stations
INSERT INTO stations (name, address, latitude, longitude, floor, open_time, close_time, status) VALUES
  ('EV Station Siam',        '991 Rama I Rd, Pathum Wan, Bangkok 10330',      13.74630000, 100.53420000, 'B1',  '06:00:00', '23:00:00', 'active'),
  ('EV Station Chatuchak',   '587/10 Kamphaeng Phet 2 Rd, Bangkok 10900',     13.79980000, 100.55050000, 'G',   '00:00:00', '00:00:00', 'active');

-- Chargers: 3 at station 1, 2 at station 2
INSERT INTO chargers (station_id, charger_name, connector_type, power_kw, price_per_kwh, status, qr_code) VALUES
  (1, 'Charger A1', 'CCS',     50.00, 6.50, 'available',     'QR-SIAM-A1'),
  (1, 'Charger A2', 'CHAdeMO', 50.00, 6.50, 'available',     'QR-SIAM-A2'),
  (1, 'Charger A3', 'Type2',   22.00, 5.00, 'out_of_service','QR-SIAM-A3'),
  (2, 'Charger B1', 'CCS',    100.00, 7.50, 'available',     'QR-CHAT-B1'),
  (2, 'Charger B2', 'Type2',   22.00, 5.00, 'available',     'QR-CHAT-B2');

-- Vehicle: 1 vehicle for Alice (user_id = 3)
INSERT INTO vehicles (user_id, brand, model, license_plate, connector_type, battery_capacity_kwh) VALUES
  (3, 'Tesla', 'Model 3', 'กข 1234', 'CCS', 75.00);

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
