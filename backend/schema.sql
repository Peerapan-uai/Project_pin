-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Apr 26, 2026 at 04:25 AM
-- Server version: 8.0.45
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ev_charger`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_profiles`
--

CREATE TABLE `admin_profiles` (
  `admin_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_skip_dates`
--

CREATE TABLE `booking_skip_dates` (
  `skip_id` int UNSIGNED NOT NULL,
  `schedule_id` int UNSIGNED NOT NULL,
  `skip_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `booking_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `charger_id` int UNSIGNED NOT NULL,
  `vehicle_id` int UNSIGNED DEFAULT NULL,
  `booking_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `scheduled_start` timestamp NULL DEFAULT NULL,
  `duration_min` int NOT NULL DEFAULT '60',
  `recurring_schedule_id` int UNSIGNED DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `status` enum('pending','confirmed','active','cancelled','completed','expired') NOT NULL DEFAULT 'pending',
  `queue_position` int DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `no_show_fee_charged` decimal(10,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chargers`
-- (updated: idle_fee_enabled, max_temperature_celsius)
--

CREATE TABLE `chargers` (
  `charger_id` int UNSIGNED NOT NULL,
  `station_id` int UNSIGNED NOT NULL,
  `charger_name` varchar(100) NOT NULL,
  `connector_type` enum('CCS','CHAdeMO','Type2','Type1') NOT NULL,
  `power_kw` decimal(6,2) NOT NULL,
  `price_per_kwh` decimal(6,2) NOT NULL,
  `status` enum('available','reserved','charging','out_of_service') NOT NULL DEFAULT 'available',
  `idle_fee_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `temperature_celsius` decimal(5,2) DEFAULT NULL,
  `max_temperature_celsius` decimal(5,2) NOT NULL DEFAULT '60.00',
  `qr_code` varchar(500) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `charging_sessions`
--

CREATE TABLE `charging_sessions` (
  `session_id` int UNSIGNED NOT NULL,
  `booking_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `charger_id` int UNSIGNED NOT NULL,
  `start_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_time` timestamp NULL DEFAULT NULL,
  `full_charge_time` timestamp NULL DEFAULT NULL,
  `idle_start_time` timestamp NULL DEFAULT NULL,
  `idle_end_time` timestamp NULL DEFAULT NULL,
  `idle_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `energy_kwh` decimal(8,2) DEFAULT NULL,
  `charge_percentage` decimal(5,2) DEFAULT NULL,
  `status` enum('charging','completed','failed','stopped') NOT NULL DEFAULT 'charging'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_tickets`
-- (updated: +issue_type, +check_in_at, +check_out_at, +test_evidence_image, +test_notes)
--

CREATE TABLE `maintenance_tickets` (
  `ticket_id` int UNSIGNED NOT NULL,
  `charger_id` int UNSIGNED NOT NULL,
  `reported_by` int UNSIGNED NOT NULL,
  `assigned_to` int UNSIGNED DEFAULT NULL,
  `issue_type` enum('safety','no_charge','payment','physical_damage','display','other') NOT NULL DEFAULT 'other',
  `title` varchar(255) NOT NULL,
  `description` text,
  `image` varchar(500) DEFAULT NULL,
  `repair_image` varchar(500) DEFAULT NULL,
  `test_evidence_image` varchar(500) DEFAULT NULL,
  `repair_notes` text,
  `test_notes` text,
  `status` enum('reported','assigned','in_progress','completed') NOT NULL DEFAULT 'reported',
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `check_in_at` timestamp NULL DEFAULT NULL,
  `check_out_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `message_id` int NOT NULL,
  `sender_id` int UNSIGNED NOT NULL,
  `receiver_id` int UNSIGNED NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('booking','charging','payment','maintenance','system','promotion') NOT NULL DEFAULT 'system',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `from_user_id` int UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_logs`
--

CREATE TABLE `notification_logs` (
  `log_id` int UNSIGNED NOT NULL,
  `notification_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `status` enum('pending','delivered','failed') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `part_requests` (NEW)
-- ช่างเบิกอะไหล่จาก spare_parts → admin อนุมัติ → stock ลด
--

CREATE TABLE `part_requests` (
  `request_id` int UNSIGNED NOT NULL,
  `ticket_id` int UNSIGNED NOT NULL,
  `tech_id` int UNSIGNED NOT NULL,
  `part_id` int UNSIGNED NOT NULL,
  `qty_requested` int NOT NULL,
  `qty_approved` int DEFAULT NULL,
  `status` enum('pending','approved','rejected','returned') NOT NULL DEFAULT 'pending',
  `requested_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_by` int UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `notes` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int UNSIGNED NOT NULL,
  `session_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('credit_card','promptpay','wallet') NOT NULL,
  `status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  `transaction_ref` varchar(100) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_refunds`
--

CREATE TABLE `payment_refunds` (
  `refund_id` int UNSIGNED NOT NULL,
  `payment_id` int UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reason` text,
  `refunded_by` int UNSIGNED NOT NULL,
  `refunded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `point_balances`
--

CREATE TABLE `point_balances` (
  `user_id` int UNSIGNED NOT NULL,
  `balance` int NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `point_transactions`
--

CREATE TABLE `point_transactions` (
  `txn_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `amount` int NOT NULL,
  `type` enum('earn','redeem','expire','adjust') NOT NULL,
  `ref` varchar(100) DEFAULT NULL,
  `expires_at` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `recurring_schedules`
--

CREATE TABLE `recurring_schedules` (
  `schedule_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `charger_id` int UNSIGNED NOT NULL,
  `days_of_week` set('mon','tue','wed','thu','fri','sat','sun') NOT NULL,
  `start_time` time NOT NULL,
  `duration_min` int NOT NULL DEFAULT '60',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `weeks_ahead` int NOT NULL DEFAULT '4',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `refund_requests`
--

CREATE TABLE `refund_requests` (
  `request_id` int UNSIGNED NOT NULL,
  `payment_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `reason` text,
  `image_url` text,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` int UNSIGNED DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `review_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `station_id` int UNSIGNED NOT NULL,
  `rating` tinyint NOT NULL,
  `comment` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scheduled_notifications`
--

CREATE TABLE `scheduled_notifications` (
  `id` int UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `scheduled_at` datetime NOT NULL,
  `target_type` enum('all','role','user_ids') NOT NULL,
  `target_value` varchar(255) DEFAULT NULL,
  `type` enum('booking','charging','payment','maintenance','system') NOT NULL DEFAULT 'system',
  `created_by` int UNSIGNED NOT NULL,
  `is_sent` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `spare_parts` (NEW)
-- คลังอะไหล่สำหรับช่างเบิกใช้งาน
--

CREATE TABLE `spare_parts` (
  `part_id` int UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` enum('electrical','mechanical','display','cable','connector','other') NOT NULL,
  `unit` varchar(20) NOT NULL DEFAULT 'ชิ้น',
  `stock_qty` int NOT NULL DEFAULT '0',
  `min_stock` int NOT NULL DEFAULT '5',
  `cost_per_unit` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stations`
-- (updated: +station_type สำหรับ auto-priority คำนวณ SLA)
--

CREATE TABLE `stations` (
  `station_id` int UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `floor` varchar(50) DEFAULT NULL,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `station_type` enum('public','private_fleet','commercial') NOT NULL DEFAULT 'public',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `scheduled_status` enum('active','inactive') DEFAULT NULL,
  `scheduled_status_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tariffs`
--

CREATE TABLE `tariffs` (
  `tariff_id` int UNSIGNED NOT NULL,
  `charger_id` int UNSIGNED NOT NULL,
  `period` enum('on_peak','off_peak') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `price_per_kwh` decimal(6,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tech_profiles`
--

CREATE TABLE `tech_profiles` (
  `tech_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `work_mode` enum('FIELD','REMOTE','HYBRID') NOT NULL,
  `primary_skill` enum('ELECTRICAL','SOFTWARE','MECHANICAL') NOT NULL,
  `status` enum('AVAILABLE','BUSY','OFFLINE') NOT NULL DEFAULT 'OFFLINE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `profile_image` varchar(500) DEFAULT NULL,
  `role` enum('user','admin','technician') NOT NULL DEFAULT 'user',
  `wallet_balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `outstanding_debt` decimal(10,2) NOT NULL DEFAULT '0.00',
  `is_banned` tinyint(1) NOT NULL DEFAULT '0',
  `ban_reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `omise_customer_id` varchar(50) DEFAULT NULL,
  `wallet_frozen` tinyint(1) DEFAULT '0',
  `freeze_reason` text,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_favorites`
--

CREATE TABLE `user_favorites` (
  `favorite_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `station_id` int UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `vehicle_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `brand` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  `license_plate` varchar(50) NOT NULL,
  `connector_type` enum('CCS','CHAdeMO','Type2','Type1') NOT NULL,
  `battery_capacity_kwh` decimal(6,2) NOT NULL,
  `battery_current_kwh` decimal(8,3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wallet_transactions`
--

CREATE TABLE `wallet_transactions` (
  `txn_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('topup','deduct','refund','adjust') DEFAULT NULL,
  `ref` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reason` varchar(255) DEFAULT NULL,
  `adjusted_by` int UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

ALTER TABLE `admin_profiles`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

ALTER TABLE `booking_skip_dates`
  ADD PRIMARY KEY (`skip_id`),
  ADD UNIQUE KEY `uk_schedule_date` (`schedule_id`,`skip_date`);

ALTER TABLE `bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD KEY `fk_bookings_user` (`user_id`),
  ADD KEY `fk_bookings_charger` (`charger_id`),
  ADD KEY `fk_bookings_recurring` (`recurring_schedule_id`);

ALTER TABLE `chargers`
  ADD PRIMARY KEY (`charger_id`),
  ADD KEY `fk_chargers_station` (`station_id`);

ALTER TABLE `charging_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `fk_sessions_booking` (`booking_id`),
  ADD KEY `fk_sessions_user` (`user_id`),
  ADD KEY `fk_sessions_charger` (`charger_id`);

ALTER TABLE `maintenance_tickets`
  ADD PRIMARY KEY (`ticket_id`),
  ADD KEY `fk_tickets_charger` (`charger_id`),
  ADD KEY `fk_tickets_reported_by` (`reported_by`),
  ADD KEY `fk_tickets_assigned_to` (`assigned_to`),
  ADD KEY `idx_tickets_issue_type` (`issue_type`);

ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `fk_notifications_user` (`user_id`),
  ADD KEY `FK_notification_from_user_id` (`from_user_id`);

ALTER TABLE `notification_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `notification_id` (`notification_id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `part_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `fk_pr_ticket` (`ticket_id`),
  ADD KEY `fk_pr_tech` (`tech_id`),
  ADD KEY `fk_pr_part` (`part_id`),
  ADD KEY `fk_pr_approved_by` (`approved_by`);

ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `fk_payments_session` (`session_id`),
  ADD KEY `fk_payments_user` (`user_id`);

ALTER TABLE `payment_refunds`
  ADD PRIMARY KEY (`refund_id`),
  ADD KEY `fk_refunds_payment` (`payment_id`),
  ADD KEY `fk_refunds_admin` (`refunded_by`);

ALTER TABLE `point_balances`
  ADD PRIMARY KEY (`user_id`);

ALTER TABLE `point_transactions`
  ADD PRIMARY KEY (`txn_id`),
  ADD KEY `idx_pt_user` (`user_id`,`created_at`),
  ADD KEY `idx_pt_expires` (`expires_at`);

ALTER TABLE `recurring_schedules`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `fk_rs_user` (`user_id`),
  ADD KEY `fk_rs_charger` (`charger_id`);

ALTER TABLE `refund_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `fk_rr_payment` (`payment_id`),
  ADD KEY `fk_rr_user` (`user_id`),
  ADD KEY `fk_rr_admin` (`reviewed_by`);

ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `fk_reviews_user` (`user_id`),
  ADD KEY `fk_reviews_station` (`station_id`);

ALTER TABLE `scheduled_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sched_user` (`created_by`);

ALTER TABLE `spare_parts`
  ADD PRIMARY KEY (`part_id`);

ALTER TABLE `stations`
  ADD PRIMARY KEY (`station_id`);

ALTER TABLE `tariffs`
  ADD PRIMARY KEY (`tariff_id`),
  ADD UNIQUE KEY `uk_charger_period` (`charger_id`,`period`),
  ADD KEY `idx_tariffs_charger` (`charger_id`,`period`);

ALTER TABLE `tech_profiles`
  ADD PRIMARY KEY (`tech_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

ALTER TABLE `user_favorites`
  ADD PRIMARY KEY (`favorite_id`),
  ADD UNIQUE KEY `uk_user_station` (`user_id`,`station_id`),
  ADD KEY `fk_fav_station` (`station_id`);

ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`vehicle_id`),
  ADD KEY `fk_vehicles_user` (`user_id`);

ALTER TABLE `wallet_transactions`
  ADD PRIMARY KEY (`txn_id`),
  ADD KEY `idx_wallet_txn_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

ALTER TABLE `admin_profiles`
  MODIFY `admin_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `booking_skip_dates`
  MODIFY `skip_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `bookings`
  MODIFY `booking_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `chargers`
  MODIFY `charger_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `charging_sessions`
  MODIFY `session_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `maintenance_tickets`
  MODIFY `ticket_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `messages`
  MODIFY `message_id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `notifications`
  MODIFY `notification_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `notification_logs`
  MODIFY `log_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `part_requests`
  MODIFY `request_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `payments`
  MODIFY `payment_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `payment_refunds`
  MODIFY `refund_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `point_transactions`
  MODIFY `txn_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `recurring_schedules`
  MODIFY `schedule_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `refund_requests`
  MODIFY `request_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `reviews`
  MODIFY `review_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `scheduled_notifications`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `spare_parts`
  MODIFY `part_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `stations`
  MODIFY `station_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `tariffs`
  MODIFY `tariff_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `tech_profiles`
  MODIFY `tech_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `user_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `user_favorites`
  MODIFY `favorite_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `vehicles`
  MODIFY `vehicle_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `wallet_transactions`
  MODIFY `txn_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

ALTER TABLE `admin_profiles`
  ADD CONSTRAINT `admin_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `booking_skip_dates`
  ADD CONSTRAINT `fk_bsd_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `recurring_schedules` (`schedule_id`) ON DELETE CASCADE;

ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_charger` FOREIGN KEY (`charger_id`) REFERENCES `chargers` (`charger_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bookings_recurring` FOREIGN KEY (`recurring_schedule_id`) REFERENCES `recurring_schedules` (`schedule_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `chargers`
  ADD CONSTRAINT `fk_chargers_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE;

ALTER TABLE `charging_sessions`
  ADD CONSTRAINT `fk_sessions_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sessions_charger` FOREIGN KEY (`charger_id`) REFERENCES `chargers` (`charger_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `maintenance_tickets`
  ADD CONSTRAINT `fk_tickets_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_tickets_charger` FOREIGN KEY (`charger_id`) REFERENCES `chargers` (`charger_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tickets_reported_by` FOREIGN KEY (`reported_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `notifications`
  ADD CONSTRAINT `FK_notification_from_user_id` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `notification_logs`
  ADD CONSTRAINT `notification_logs_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`),
  ADD CONSTRAINT `notification_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

ALTER TABLE `part_requests`
  ADD CONSTRAINT `fk_pr_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `maintenance_tickets` (`ticket_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pr_tech` FOREIGN KEY (`tech_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pr_part` FOREIGN KEY (`part_id`) REFERENCES `spare_parts` (`part_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pr_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_session` FOREIGN KEY (`session_id`) REFERENCES `charging_sessions` (`session_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `payment_refunds`
  ADD CONSTRAINT `fk_refunds_admin` FOREIGN KEY (`refunded_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_refunds_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE CASCADE;

ALTER TABLE `point_balances`
  ADD CONSTRAINT `fk_pb_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `point_transactions`
  ADD CONSTRAINT `fk_pt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `recurring_schedules`
  ADD CONSTRAINT `fk_rs_charger` FOREIGN KEY (`charger_id`) REFERENCES `chargers` (`charger_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `refund_requests`
  ADD CONSTRAINT `fk_rr_admin` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_rr_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `scheduled_notifications`
  ADD CONSTRAINT `fk_sched_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

ALTER TABLE `tariffs`
  ADD CONSTRAINT `fk_tariff_charger` FOREIGN KEY (`charger_id`) REFERENCES `chargers` (`charger_id`) ON DELETE CASCADE;

ALTER TABLE `tech_profiles`
  ADD CONSTRAINT `tech_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `user_favorites`
  ADD CONSTRAINT `fk_fav_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `vehicles`
  ADD CONSTRAINT `fk_vehicles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `wallet_transactions`
  ADD CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
