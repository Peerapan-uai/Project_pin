-- ============================================================
-- DEPRECATED: ใช้ knex migration แทน (ADR 0003)
-- ไฟล์นี้เก็บไว้เป็น reference เท่านั้น ห้ามรันใหม่
-- LALLA_MIGRATION.sql
-- รันใน phpMyAdmin ของ lalla เพื่อ sync schema กับ nem
-- วันที่: 2026-04-26
-- ทำ: Phase 1 + Phase 2 + Phase 3 features ทั้งหมด
-- ============================================================
-- วิธีใช้: copy ทีละ block ใน phpMyAdmin SQL tab แล้วกด Go
-- ถ้า error "Duplicate column" หรือ "Table already exists" → ข้ามได้ (ไม่ใช่ error จริง)
-- ============================================================

-- ─── Phase 1: Foundation UX ───────────────────────────────────────────────────

-- Feature 3/7: อุณหภูมิตู้ + overheat protection
ALTER TABLE `chargers`
  ADD COLUMN IF NOT EXISTS `temperature_celsius`     DECIMAL(5,2) NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `max_temperature_celsius` DECIMAL(5,2) NOT NULL DEFAULT '60.00';

-- Feature 2 + debt model: outstanding debt + wallet frozen
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `outstanding_debt` DECIMAL(10,2) NOT NULL DEFAULT '0.00' AFTER `wallet_balance`,
  ADD COLUMN IF NOT EXISTS `wallet_frozen`    TINYINT(1) DEFAULT '0',
  ADD COLUMN IF NOT EXISTS `freeze_reason`   VARCHAR(255) NULL DEFAULT NULL;

-- Feature 14: Favorite stations
CREATE TABLE IF NOT EXISTS `user_favorites` (
  `favorite_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED NOT NULL,
  `station_id`  INT UNSIGNED NOT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`favorite_id`),
  UNIQUE KEY `uk_user_station` (`user_id`, `station_id`),
  CONSTRAINT `fk_fav_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`(`user_id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_fav_station` FOREIGN KEY (`station_id`) REFERENCES `stations`(`station_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Phase 2: Smart Features ──────────────────────────────────────────────────

-- Feature 4: idle_fee_enabled (auto-stop hybrid Mode B)
ALTER TABLE `chargers`
  ADD COLUMN IF NOT EXISTS `idle_fee_enabled` TINYINT(1) NOT NULL DEFAULT '0';

-- Feature 6: Reward points
CREATE TABLE IF NOT EXISTS `point_balances` (
  `user_id`    INT UNSIGNED NOT NULL,
  `balance`    INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_pb_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `point_transactions` (
  `txn_id`     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `amount`     INT NOT NULL,
  `type`       ENUM('earn','redeem','expire','adjust') NOT NULL,
  `ref`        VARCHAR(100) NULL DEFAULT NULL,
  `expires_at` DATE NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`txn_id`),
  KEY `idx_pt_user` (`user_id`),
  CONSTRAINT `fk_pt_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Feature 8: TOU pricing
CREATE TABLE IF NOT EXISTS `tariffs` (
  `tariff_id`    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `charger_id`   INT UNSIGNED NOT NULL,
  `period`       ENUM('on_peak','off_peak') NOT NULL,
  `start_time`   TIME NOT NULL,
  `end_time`     TIME NOT NULL,
  `price_per_kwh` DECIMAL(10,4) NOT NULL,
  PRIMARY KEY (`tariff_id`),
  KEY `idx_tariffs_charger` (`charger_id`, `period`),
  CONSTRAINT `fk_tariff_charger` FOREIGN KEY (`charger_id`) REFERENCES `chargers`(`charger_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Phase 3: Advanced Features ───────────────────────────────────────────────

-- Feature 9: Booking schedule columns
ALTER TABLE `bookings`
  ADD COLUMN IF NOT EXISTS `scheduled_start`       TIMESTAMP NULL DEFAULT NULL AFTER `booking_time`,
  ADD COLUMN IF NOT EXISTS `duration_min`          INT NOT NULL DEFAULT 60 AFTER `scheduled_start`,
  ADD COLUMN IF NOT EXISTS `recurring_schedule_id` INT UNSIGNED NULL DEFAULT NULL AFTER `duration_min`;

-- Feature 9.2: Recurring schedules
CREATE TABLE IF NOT EXISTS `recurring_schedules` (
  `schedule_id`  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      INT UNSIGNED NOT NULL,
  `charger_id`   INT UNSIGNED NOT NULL,
  `days_of_week` SET('mon','tue','wed','thu','fri','sat','sun') NOT NULL,
  `start_time`   TIME NOT NULL,
  `duration_min` INT NOT NULL DEFAULT 60,
  `active`       TINYINT(1) NOT NULL DEFAULT 1,
  `weeks_ahead`  INT NOT NULL DEFAULT 4,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`schedule_id`),
  CONSTRAINT `fk_rs_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`(`user_id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_rs_charger` FOREIGN KEY (`charger_id`) REFERENCES `chargers`(`charger_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- FK สำหรับ recurring_schedule_id (รันหลัง CREATE TABLE recurring_schedules)
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_recurring`
    FOREIGN KEY (`recurring_schedule_id`) REFERENCES `recurring_schedules`(`schedule_id`) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS `booking_skip_dates` (
  `skip_id`     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `schedule_id` INT UNSIGNED NOT NULL,
  `skip_date`   DATE NOT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`skip_id`),
  UNIQUE KEY `uk_schedule_date` (`schedule_id`, `skip_date`),
  CONSTRAINT `fk_bsd_schedule` FOREIGN KEY (`schedule_id`)
    REFERENCES `recurring_schedules`(`schedule_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Feature 12: Idle fee columns
ALTER TABLE `charging_sessions`
  ADD COLUMN IF NOT EXISTS `full_charge_time` TIMESTAMP NULL DEFAULT NULL AFTER `end_time`,
  ADD COLUMN IF NOT EXISTS `idle_start_time`  TIMESTAMP NULL DEFAULT NULL AFTER `full_charge_time`,
  ADD COLUMN IF NOT EXISTS `idle_end_time`    TIMESTAMP NULL DEFAULT NULL AFTER `idle_start_time`,
  ADD COLUMN IF NOT EXISTS `idle_fee`         DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `idle_end_time`;

-- ─── เสร็จแล้ว ─────────────────────────────────────────────────────────────────
-- ตรวจสอบด้วย: SHOW COLUMNS FROM bookings; / SHOW TABLES;
