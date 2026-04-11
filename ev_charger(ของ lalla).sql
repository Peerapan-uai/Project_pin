-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Apr 09, 2026 at 01:05 AM
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
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `booking_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `charger_id` int UNSIGNED NOT NULL,
  `booking_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled','completed','expired') NOT NULL DEFAULT 'pending',
  `queue_position` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`booking_id`, `user_id`, `charger_id`, `booking_time`, `start_time`, `end_time`, `status`, `queue_position`) VALUES
(1, 5, 1, '2026-04-02 23:50:16', '2026-04-03 10:00:00', '2026-04-03 11:00:00', 'completed', NULL),
(2, 5, 2, '2026-04-02 23:50:45', '2026-04-03 12:00:00', '2026-04-03 13:00:00', 'completed', NULL),
(3, 7, 4, '2026-04-03 19:51:01', '2026-04-03 19:51:01', '2026-04-03 20:21:01', 'expired', NULL),
(4, 7, 1, '2026-04-03 23:34:32', '2026-04-03 23:34:32', '2026-04-04 00:04:32', 'expired', NULL),
(5, 7, 1, '2026-04-03 23:46:24', '2026-04-03 23:46:24', '2026-04-04 00:16:24', 'expired', NULL),
(6, 7, 4, '2026-04-04 08:51:44', '2026-04-04 08:51:44', '2026-04-04 09:21:44', 'expired', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `chargers`
--

CREATE TABLE `chargers` (
  `charger_id` int UNSIGNED NOT NULL,
  `station_id` int UNSIGNED NOT NULL,
  `charger_name` varchar(100) NOT NULL,
  `connector_type` enum('CCS','CHAdeMO','Type2','Type1') NOT NULL,
  `power_kw` decimal(6,2) NOT NULL,
  `price_per_kwh` decimal(6,2) NOT NULL,
  `status` enum('available','reserved','charging','out_of_service') NOT NULL DEFAULT 'available',
  `temperature_celsius` decimal(5,2) DEFAULT NULL,
  `qr_code` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `chargers`
--

INSERT INTO `chargers` (`charger_id`, `station_id`, `charger_name`, `connector_type`, `power_kw`, `price_per_kwh`, `status`, `temperature_celsius`, `qr_code`) VALUES
(1, 1, 'Charger A1', 'CCS', 50.00, 6.50, 'available', NULL, 'QR-SIAM-A1'),
(2, 1, 'Charger A2', 'CHAdeMO', 50.00, 6.50, 'available', NULL, 'QR-SIAM-A2'),
(3, 1, 'Charger A3', 'Type2', 22.00, 5.00, 'out_of_service', NULL, 'QR-SIAM-A3'),
(4, 2, 'Charger B1', 'CCS', 100.00, 7.50, 'available', NULL, 'QR-CHAT-B1'),
(5, 2, 'Charger B2', 'Type2', 22.00, 5.00, 'available', NULL, 'QR-CHAT-B2');

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
  `energy_kwh` decimal(8,2) DEFAULT NULL,
  `charge_percentage` decimal(5,2) DEFAULT NULL,
  `status` enum('charging','completed','failed','stopped') NOT NULL DEFAULT 'charging'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `charging_sessions`
--

INSERT INTO `charging_sessions` (`session_id`, `booking_id`, `user_id`, `charger_id`, `start_time`, `end_time`, `energy_kwh`, `charge_percentage`, `status`) VALUES
(1, 1, 5, 1, '2026-04-02 23:50:16', '2026-04-02 23:50:16', 10.00, NULL, 'completed'),
(2, 2, 5, 2, '2026-04-02 23:50:45', '2026-04-02 23:50:45', 5.00, NULL, 'completed');

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_tickets`
--

CREATE TABLE `maintenance_tickets` (
  `ticket_id` int UNSIGNED NOT NULL,
  `charger_id` int UNSIGNED NOT NULL,
  `reported_by` int UNSIGNED NOT NULL,
  `assigned_to` int UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `image` varchar(500) DEFAULT NULL,
  `repair_image` varchar(500) DEFAULT NULL,
  `repair_notes` text,
  `status` enum('reported','assigned','in_progress','completed') NOT NULL DEFAULT 'reported',
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `maintenance_tickets`
--

INSERT INTO `maintenance_tickets` (`ticket_id`, `charger_id`, `reported_by`, `assigned_to`, `title`, `description`, `image`, `repair_image`, `repair_notes`, `status`, `priority`, `created_at`, `completed_at`) VALUES
(1, 1, 5, NULL, 'ทดสอบระบบ', 'ตู้ไม่ทำงาน', NULL, NULL, NULL, 'reported', 'high', '2026-04-02 23:49:40', NULL);

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

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `content`, `is_read`, `created_at`) VALUES
(1, 2, 1, 'สวัดดี', 1, '2026-03-27 05:17:21'),
(2, 1, 2, '📋 มอบหมายงาน: ชาร์จช้าผิดปกติ\n📍 ตู้: Charger B1 · EV Station Chatuchak\n🔧 สาเหตุ: ชาร์จได้แค่ 3kW แทนที่จะ 22kW', 1, '2026-03-27 06:48:44'),
(3, 1, 2, '{\"_type\":\"assignment\",\"ticket_id\":16,\"title\":\"หน้าจอค้าง\",\"charger\":\"Charger B3\",\"station\":\"fox\",\"reason\":\"กดปุ่มไม่ตอบสนอง\"}', 1, '2026-03-27 07:41:50'),
(4, 2, 1, '⏳ รอสักครู่: หน้าจอค้าง', 1, '2026-03-27 07:42:27'),
(5, 2, 1, '📸 ภาพหลังซ่อม: ชาร์จช้าผิดปกติ', 1, '2026-03-27 07:43:30'),
(6, 2, 9, '📸 ภาพหลังซ่อม: ชาร์จช้าผิดปกติ', 0, '2026-03-27 07:43:30'),
(7, 2, 9, '/uploads/tickets/ticket-19-1774597410487-967733011.png', 0, '2026-03-27 07:43:30'),
(8, 2, 1, '/uploads/tickets/ticket-19-1774597410487-967733011.png', 1, '2026-03-27 07:43:30');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('booking','charging','payment','maintenance','system') NOT NULL DEFAULT 'system',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 2, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #1: ทดสอบระบบ', 'maintenance', 0, '2026-04-02 23:49:40');

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

--
-- Dumping data for table `notification_logs`
--

INSERT INTO `notification_logs` (`log_id`, `notification_id`, `user_id`, `delivered_at`, `read_at`, `status`) VALUES
(1, 1, 5, '2026-03-27 07:43:30', NULL, 'delivered');

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

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `session_id`, `user_id`, `amount`, `method`, `status`, `transaction_ref`, `paid_at`) VALUES
(1, 1, 5, 65.00, 'promptpay', 'refunded', 'QR1775173816216930', '2026-04-02 23:50:45'),
(2, 2, 5, 32.50, 'promptpay', 'failed', 'QR1775173845287830', NULL);

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

--
-- Dumping data for table `payment_refunds`
--

INSERT INTO `payment_refunds` (`refund_id`, `payment_id`, `amount`, `reason`, `refunded_by`, `refunded_at`) VALUES
(1, 1, 65.00, 'ทดสอบคืนเงิน', 6, '2026-04-02 23:50:45');

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
) ;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`review_id`, `user_id`, `station_id`, `rating`, `comment`, `created_at`) VALUES
(1, 5, 1, 5, 'สะอาด ตู้สวยสีสดใส', '2026-04-02 23:50:45'),
(2, 1, 1, 3, 'nice', '2026-04-08 10:55:40');

-- --------------------------------------------------------

--
-- Table structure for table `stations`
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
  `status` enum('active','inactive') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `stations`
--

INSERT INTO `stations` (`station_id`, `name`, `address`, `latitude`, `longitude`, `floor`, `open_time`, `close_time`, `image`, `status`) VALUES
(1, 'EV Station Siam', '991 Rama I Rd, Pathum Wan, Bangkok 10330', 13.74630000, 100.53420000, 'B1', '06:00:00', '23:00:00', NULL, 'active'),
(2, 'EV Station Chatuchak', '587/10 Kamphaeng Phet 2 Rd, Bangkok 10900', 13.79980000, 100.55050000, 'G', '00:00:00', '00:00:00', NULL, 'active');

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
  `is_banned` tinyint(1) NOT NULL DEFAULT '0',
  `ban_reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `wallet_frozen` tinyint(1) DEFAULT '0',
  `freeze_reason` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `profile_image`, `role`, `is_banned`, `ban_reason`, `created_at`, `updated_at`, `wallet_frozen`, `freeze_reason`) VALUES
(1, 'admin@evcharge.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Admin', 'System', '0800000001', NULL, 'admin', 0, NULL, '2026-04-02 23:46:51', '2026-04-02 23:53:16', 0, NULL),
(2, 'tech@evcharge.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Somchai', 'Techarat', '0800000002', NULL, 'technician', 0, NULL, '2026-04-02 23:46:51', '2026-04-02 23:53:16', 0, NULL),
(3, 'alice@example.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Alice', 'Wongsiri', '0811111111', NULL, 'user', 0, NULL, '2026-04-02 23:46:51', '2026-04-02 23:53:16', 0, NULL),
(4, 'bob@example.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Bob', 'Prasert', '0822222222', NULL, 'user', 0, NULL, '2026-04-02 23:46:51', '2026-04-02 23:53:16', 0, NULL),
(5, 'botclaude@gmail.com', '$2a$10$QsUmwkyIMHyoSDU5XGGu0enFVpVOvdtA7LugA0YnZRgh/3OX5LRHa', 'Bot', 'Claude', '0812345678', NULL, 'user', 0, NULL, '2026-04-02 23:49:21', '2026-04-02 23:49:21', 0, NULL),
(6, 'botadmin@gmail.com', '$2a$10$wswBQVQmSXgB3UQpaEjw1.XqrTxBoi7xcZTsqR2jfQluU6XXvnPUS', 'Admin', 'Bot', '0899999999', NULL, 'admin', 0, NULL, '2026-04-02 23:50:44', '2026-04-02 23:50:44', 0, NULL),
(7, 'nemuser@gmail.com', '$2a$10$EaKJ2dIx8l8Mukh0bsydG.rtgGxlAVoyddc6AGJg5IPi3Ghphkm3S', 'เนม', 'เนม', '0615612345', NULL, 'user', 0, NULL, '2026-04-03 14:22:49', '2026-04-03 14:22:49', 0, NULL),
(8, 'Emma123@gmail.com', '$2a$10$6mwZpIr0kvr3LxWY/EBZ0e2xLSUQQfQds0ZIo4iygjP5VZfBTT3pK', 'Emma', 'Woods', '0631962204', NULL, 'user', 0, NULL, '2026-04-08 17:37:50', '2026-04-08 17:37:50', 0, NULL);

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
  `battery_current_kwh` decimal(6,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`vehicle_id`, `user_id`, `brand`, `model`, `license_plate`, `connector_type`, `battery_capacity_kwh`, `battery_current_kwh`) VALUES
(1, 3, 'Tesla', 'Model 3', 'à¸à¸‚ 1234', 'CCS', 75.00, NULL),
(2, 5, 'Toyota', 'bZ4X', 'กก 1234', 'CCS', 71.00, 10.00),
(3, 7, 'BYD', 'Cipo', 'รวย 9331', 'CCS', 65.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `wallet_transactions`
--

CREATE TABLE `wallet_transactions` (
  `txn_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('topup','deduct','refund','adjust') NOT NULL,
  `ref` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD KEY `fk_bookings_user` (`user_id`),
  ADD KEY `fk_bookings_charger` (`charger_id`);

--
-- Indexes for table `chargers`
--
ALTER TABLE `chargers`
  ADD PRIMARY KEY (`charger_id`),
  ADD KEY `fk_chargers_station` (`station_id`);

--
-- Indexes for table `charging_sessions`
--
ALTER TABLE `charging_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `fk_sessions_booking` (`booking_id`),
  ADD KEY `fk_sessions_user` (`user_id`),
  ADD KEY `fk_sessions_charger` (`charger_id`);

--
-- Indexes for table `maintenance_tickets`
--
ALTER TABLE `maintenance_tickets`
  ADD PRIMARY KEY (`ticket_id`),
  ADD KEY `fk_tickets_charger` (`charger_id`),
  ADD KEY `fk_tickets_reported_by` (`reported_by`),
  ADD KEY `fk_tickets_assigned_to` (`assigned_to`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `fk_notifications_user` (`user_id`);

--
-- Indexes for table `notification_logs`
--
ALTER TABLE `notification_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `notification_id` (`notification_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `fk_payments_session` (`session_id`),
  ADD KEY `fk_payments_user` (`user_id`);

--
-- Indexes for table `payment_refunds`
--
ALTER TABLE `payment_refunds`
  ADD PRIMARY KEY (`refund_id`),
  ADD KEY `fk_refunds_payment` (`payment_id`),
  ADD KEY `fk_refunds_admin` (`refunded_by`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `fk_reviews_user` (`user_id`),
  ADD KEY `fk_reviews_station` (`station_id`);

--
-- Indexes for table `stations`
--
ALTER TABLE `stations`
  ADD PRIMARY KEY (`station_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`vehicle_id`),
  ADD KEY `fk_vehicles_user` (`user_id`);

--
-- Indexes for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD PRIMARY KEY (`txn_id`),
  ADD KEY `idx_wallet_txn_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `booking_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `chargers`
--
ALTER TABLE `chargers`
  MODIFY `charger_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `charging_sessions`
--
ALTER TABLE `charging_sessions`
  MODIFY `session_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `maintenance_tickets`
--
ALTER TABLE `maintenance_tickets`
  MODIFY `ticket_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `message_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notification_logs`
--
ALTER TABLE `notification_logs`
  MODIFY `log_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `payment_refunds`
--
ALTER TABLE `payment_refunds`
  MODIFY `refund_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `review_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stations`
--
ALTER TABLE `stations`
  MODIFY `station_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `vehicle_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  MODIFY `txn_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_charger` FOREIGN KEY (`charger_id`) REFERENCES `chargers` (`charger_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `chargers`
--
ALTER TABLE `chargers`
  ADD CONSTRAINT `fk_chargers_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE;

--
-- Constraints for table `charging_sessions`
--
ALTER TABLE `charging_sessions`
  ADD CONSTRAINT `fk_sessions_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sessions_charger` FOREIGN KEY (`charger_id`) REFERENCES `chargers` (`charger_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `maintenance_tickets`
--
ALTER TABLE `maintenance_tickets`
  ADD CONSTRAINT `fk_tickets_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_tickets_charger` FOREIGN KEY (`charger_id`) REFERENCES `chargers` (`charger_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tickets_reported_by` FOREIGN KEY (`reported_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `notification_logs`
--
ALTER TABLE `notification_logs`
  ADD CONSTRAINT `notification_logs_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`),
  ADD CONSTRAINT `notification_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_session` FOREIGN KEY (`session_id`) REFERENCES `charging_sessions` (`session_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_refunds`
--
ALTER TABLE `payment_refunds`
  ADD CONSTRAINT `fk_refunds_admin` FOREIGN KEY (`refunded_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_refunds_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `fk_vehicles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
