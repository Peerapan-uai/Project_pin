-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Apr 18, 2026 at 01:34 AM
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
  `user_id` int UNSIGNED NOT NULL,
  `permission_level` enum('full','limited') NOT NULL DEFAULT 'full'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admin_profiles`
--

INSERT INTO `admin_profiles` (`admin_id`, `user_id`, `permission_level`) VALUES
(1, 1, 'full');

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
  `status` enum('pending','confirmed','active','cancelled','completed','expired') NOT NULL DEFAULT 'pending',
  `queue_position` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`booking_id`, `user_id`, `charger_id`, `booking_time`, `start_time`, `end_time`, `status`, `queue_position`) VALUES
(1, 6, 1, '2026-04-08 23:30:08', '2026-04-08 23:30:08', '2026-04-09 00:00:08', 'expired', NULL),
(2, 6, 15, '2026-04-08 23:51:58', '2026-04-09 06:51:58', '2026-04-09 07:06:58', 'completed', NULL),
(3, 6, 1, '2026-04-09 00:11:55', '2026-04-09 07:11:55', '2026-04-09 07:26:55', 'completed', NULL),
(4, 6, 23, '2026-04-09 00:19:09', '2026-04-09 07:19:09', '2026-04-09 07:49:09', 'completed', NULL),
(5, 9, 1, '2026-04-13 21:43:37', '2026-04-14 04:43:37', '2026-04-14 04:58:37', 'completed', NULL),
(6, 9, 1, '2026-04-16 05:04:50', '2026-04-16 05:04:50', '2026-04-16 05:34:50', 'completed', NULL),
(7, 9, 1, '2026-04-16 05:35:21', '2026-04-16 05:35:21', '2026-04-16 06:05:21', 'completed', NULL),
(8, 9, 1, '2026-04-16 09:08:11', '2026-04-16 16:08:11', '2026-04-16 16:38:11', 'completed', NULL),
(9, 9, 2, '2026-04-16 09:08:41', '2026-04-16 16:08:41', '2026-04-16 16:38:41', 'completed', NULL),
(10, 9, 2, '2026-04-16 09:15:51', '2026-04-16 16:15:51', '2026-04-16 16:45:51', 'completed', NULL),
(11, 9, 2, '2026-04-16 09:25:13', '2026-04-16 09:25:13', '2026-04-16 09:55:13', 'completed', NULL),
(12, 9, 3, '2026-04-16 10:00:54', '2026-04-16 10:00:54', NULL, 'completed', NULL);

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
(1, 1, 'SIAM-DC01', 'CCS', 150.00, 7.50, 'available', NULL, 'QR-SIAM-DC01'),
(2, 1, 'SIAM-DC02', 'CCS', 150.00, 7.50, 'available', NULL, 'QR-SIAM-DC02'),
(3, 1, 'SIAM-DC03', 'CHAdeMO', 50.00, 6.50, 'available', NULL, 'QR-SIAM-DC03'),
(4, 1, 'SIAM-AC01', 'Type2', 22.00, 5.00, 'available', NULL, 'QR-SIAM-AC01'),
(5, 2, 'JJ-DC01', 'CCS', 100.00, 7.00, 'available', NULL, 'QR-JJ-DC01'),
(6, 2, 'JJ-DC02', 'CHAdeMO', 50.00, 6.50, 'available', NULL, 'QR-JJ-DC02'),
(7, 2, 'JJ-AC01', 'Type2', 22.00, 5.00, 'available', NULL, 'QR-JJ-AC01'),
(8, 3, 'BNA-DC01', 'CCS', 150.00, 7.50, 'available', NULL, 'QR-BNA-DC01'),
(9, 3, 'BNA-DC02', 'CCS', 150.00, 7.50, 'available', NULL, 'QR-BNA-DC02'),
(10, 3, 'BNA-DC03', 'CHAdeMO', 50.00, 6.50, 'out_of_service', NULL, 'QR-BNA-DC03'),
(11, 3, 'BNA-AC01', 'Type2', 22.00, 5.00, 'available', NULL, 'QR-BNA-AC01'),
(12, 4, 'LAT-DC01', 'CCS', 80.00, 6.80, 'available', NULL, 'QR-LAT-DC01'),
(13, 4, 'LAT-DC02', 'CCS', 80.00, 6.80, 'available', NULL, 'QR-LAT-DC02'),
(14, 4, 'LAT-AC01', 'Type2', 22.00, 4.80, 'available', NULL, 'QR-LAT-AC01'),
(15, 5, 'RAM-DC01', 'CCS', 60.00, 6.50, 'available', NULL, 'QR-RAM-DC01'),
(16, 5, 'RAM-AC01', 'Type2', 7.40, 4.50, 'available', NULL, 'QR-RAM-AC01'),
(17, 6, 'PR2-DC01', 'CCS', 120.00, 7.00, 'available', NULL, 'QR-PR2-DC01'),
(18, 6, 'PR2-DC02', 'CHAdeMO', 50.00, 6.50, 'available', NULL, 'QR-PR2-DC02'),
(19, 6, 'PR2-AC01', 'Type2', 22.00, 5.00, 'available', NULL, 'QR-PR2-AC01'),
(20, 7, 'THL-DC01', 'CCS', 150.00, 8.00, 'available', NULL, 'QR-THL-DC01'),
(21, 7, 'THL-DC02', 'CCS', 150.00, 8.00, 'available', NULL, 'QR-THL-DC02'),
(22, 7, 'THL-AC01', 'Type2', 22.00, 5.50, 'available', NULL, 'QR-THL-AC01'),
(23, 8, 'ARI-DC01', 'CCS', 60.00, 6.80, 'available', NULL, 'QR-ARI-DC01'),
(24, 8, 'ARI-AC01', 'Type2', 7.40, 4.50, 'available', NULL, 'QR-ARI-AC01'),
(25, 9, 'RST-DC01', 'CCS', 150.00, 7.50, 'available', NULL, 'QR-RST-DC01'),
(26, 9, 'RST-DC02', 'CCS', 150.00, 7.50, 'available', NULL, 'QR-RST-DC02'),
(27, 9, 'RST-DC03', 'CHAdeMO', 50.00, 6.50, 'available', NULL, 'QR-RST-DC03'),
(28, 9, 'RST-AC01', 'Type2', 22.00, 5.00, 'available', NULL, 'QR-RST-AC01'),
(29, 10, 'ONN-DC01', 'CCS', 80.00, 7.00, 'available', NULL, 'QR-ONN-DC01'),
(30, 10, 'ONN-AC01', 'Type2', 22.00, 5.00, 'available', NULL, 'QR-ONN-AC01');

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
(1, 2, 6, 15, '2026-04-08 23:52:02', '2026-04-08 23:52:09', 0.08, NULL, 'completed'),
(2, 3, 6, 1, '2026-04-09 00:12:12', '2026-04-09 00:12:19', 0.21, NULL, 'completed'),
(3, 4, 6, 23, '2026-04-09 00:19:31', '2026-04-09 00:20:29', 0.93, NULL, 'completed'),
(4, 5, 9, 1, '2026-04-13 21:43:44', '2026-04-13 21:57:29', 34.29, NULL, 'completed'),
(5, 6, 9, 1, '2026-04-16 05:04:54', '2026-04-16 05:05:47', 2.17, NULL, 'completed'),
(6, 7, 9, 1, '2026-04-16 05:35:36', '2026-04-16 05:36:47', 2.92, NULL, 'completed'),
(7, 8, 9, 1, '2026-04-16 09:08:16', '2026-04-16 10:02:43', NULL, NULL, 'stopped'),
(8, 9, 9, 2, '2026-04-16 09:08:58', '2026-04-16 09:09:07', 0.29, NULL, 'completed'),
(9, 10, 9, 2, '2026-04-16 09:20:25', '2026-04-16 09:20:45', 0.79, NULL, 'completed'),
(10, 11, 9, 2, '2026-04-16 09:29:32', '2026-04-16 10:02:43', NULL, NULL, 'stopped'),
(11, 12, 9, 3, '2026-04-16 10:00:58', '2026-04-16 10:01:07', 0.11, NULL, 'completed');

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

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `message_id` int UNSIGNED NOT NULL,
  `sender_id` int UNSIGNED NOT NULL,
  `receiver_id` int UNSIGNED NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  `type` enum('booking','charging','payment','maintenance','system') NOT NULL DEFAULT 'system',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 6, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-08 23:52:02'),
(2, 6, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 0.083 kWh คิดเป็นเงิน 0.54 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-08 23:52:09'),
(3, 6, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-09 00:12:12'),
(4, 6, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 0.208 kWh คิดเป็นเงิน 1.56 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-09 00:12:19'),
(5, 6, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-09 00:19:31'),
(6, 6, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 0.933 kWh คิดเป็นเงิน 6.34 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-09 00:20:29'),
(7, 9, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-13 21:43:44'),
(8, 9, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 34.292 kWh คิดเป็นเงิน 257.19 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-13 21:57:29'),
(9, 9, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 0, '2026-04-16 05:04:54'),
(10, 9, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 2.167 kWh คิดเป็นเงิน 16.25 บาท ตัดเงินจาก wallet แล้ว', 'charging', 0, '2026-04-16 05:05:47'),
(11, 9, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 0, '2026-04-16 05:35:36'),
(12, 9, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 2.917 kWh คิดเป็นเงิน 21.88 บาท ตัดเงินจาก wallet แล้ว', 'charging', 0, '2026-04-16 05:36:47'),
(13, 9, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 0, '2026-04-16 09:08:16'),
(14, 9, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 0, '2026-04-16 09:08:58'),
(15, 9, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 0.292 kWh คิดเป็นเงิน 2.19 บาท ตัดเงินจาก wallet แล้ว', 'charging', 0, '2026-04-16 09:09:07'),
(16, 9, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 0, '2026-04-16 09:20:25'),
(17, 9, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 0.792 kWh คิดเป็นเงิน 5.94 บาท ตัดเงินจาก wallet แล้ว', 'charging', 0, '2026-04-16 09:20:45'),
(18, 9, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 0, '2026-04-16 09:29:32'),
(19, 9, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 0, '2026-04-16 10:00:58'),
(20, 9, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 0.111 kWh คิดเป็นเงิน 0.72 บาท ตัดเงินจาก wallet แล้ว', 'charging', 0, '2026-04-16 10:01:07');

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
  `status` enum('pending','delivered','failed') NOT NULL DEFAULT 'pending'
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

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `session_id`, `user_id`, `amount`, `method`, `status`, `transaction_ref`, `paid_at`) VALUES
(1, 1, 6, 0.54, 'wallet', 'completed', 'DEDUCT1775692329072177', '2026-04-08 23:52:09'),
(2, 2, 6, 1.56, 'wallet', 'completed', 'DEDUCT1775693539175739', '2026-04-09 00:12:19'),
(3, 3, 6, 6.34, 'wallet', 'completed', 'DEDUCT1775694029568549', '2026-04-09 00:20:29'),
(4, 4, 9, 257.19, 'wallet', 'completed', 'DEDUCT1776117449178984', '2026-04-13 21:57:29'),
(5, 5, 9, 16.25, 'wallet', 'completed', 'DEDUCT1776315947054215', '2026-04-16 05:05:47'),
(6, 6, 9, 21.88, 'wallet', 'completed', 'DEDUCT1776317807056437', '2026-04-16 05:36:47'),
(7, 8, 9, 2.19, 'wallet', 'completed', 'DEDUCT1776330547238881', '2026-04-16 09:09:07'),
(8, 9, 9, 5.94, 'wallet', 'completed', 'DEDUCT1776331245221367', '2026-04-16 09:20:45'),
(9, 11, 9, 0.72, 'wallet', 'completed', 'DEDUCT177633366788495', '2026-04-16 10:01:07');

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
-- Table structure for table `refund_requests`
--

CREATE TABLE `refund_requests` (
  `request_id` int UNSIGNED NOT NULL,
  `payment_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `reason` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reviewed_by` int UNSIGNED DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `image_url` text
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
(1, 'EA Anywhere สยามพารากอน', '991 ถ.พระราม 1 แขวงปทุมวัน กรุงเทพฯ 10330', 13.74630000, 100.53420000, 'B2', '06:00:00', '23:00:00', NULL, 'active'),
(2, 'PTT EV Station จตุจักร', '587/10 ถ.กำแพงเพชร 2 แขวงจตุจักร กรุงเทพฯ 10900', 13.79980000, 100.55050000, NULL, '00:00:00', '00:00:00', NULL, 'active'),
(3, 'EA Anywhere เซ็นทรัลบางนา', '585 ถ.บางนา-ตราด แขวงบางนา กรุงเทพฯ 10260', 13.66700000, 100.60470000, 'B1', '06:00:00', '22:00:00', NULL, 'active'),
(4, 'EGAT EV Station ลาดพร้าว', '2112 ถ.ลาดพร้าว แขวงวังทองหลาง กรุงเทพฯ 10310', 13.78530000, 100.60930000, NULL, '00:00:00', '00:00:00', NULL, 'active'),
(5, 'MG Super Charge รามคำแหง', '99 ถ.รามคำแหง แขวงสะพานสูง กรุงเทพฯ 10240', 13.76200000, 100.64850000, 'G', '07:00:00', '21:00:00', NULL, 'active'),
(6, 'PTT EV Station พระราม 2', '888 ถ.พระราม 2 แขวงบางมด กรุงเทพฯ 10150', 13.65670000, 100.47370000, NULL, '00:00:00', '00:00:00', NULL, 'active'),
(7, 'EA Anywhere ทองหล่อ', '261 ซ.ทองหล่อ 13 แขวงคลองตันเหนือ กรุงเทพฯ 10110', 13.73450000, 100.57820000, 'B1', '06:00:00', '23:00:00', NULL, 'active'),
(8, 'Sharge Station อารีย์', '88 ซ.อารีย์ แขวงสามเสนใน กรุงเทพฯ 10400', 13.77950000, 100.54450000, 'G', '08:00:00', '20:00:00', NULL, 'active'),
(9, 'PTT EV Station ฟิวเจอร์รังสิต', '94 ถ.พหลโยธิน ต.ประชาธิปัตย์ ธัญบุรี ปทุมธานี 12130', 13.98870000, 100.61560000, NULL, '00:00:00', '00:00:00', NULL, 'active'),
(10, 'EV Station อ่อนนุช', '900 ถ.อ่อนนุช แขวงสวนหลวง กรุงเทพฯ 10250', 13.72440000, 100.62850000, '1', '06:00:00', '22:00:00', NULL, 'active');

-- --------------------------------------------------------

--
-- Table structure for table `tech_profiles`
--

CREATE TABLE `tech_profiles` (
  `tech_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `can_field_work` tinyint(1) NOT NULL DEFAULT '0',
  `specialty` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tech_profiles`
--

INSERT INTO `tech_profiles` (`tech_id`, `user_id`, `can_field_work`, `specialty`) VALUES
(1, 2, 0, NULL),
(2, 3, 0, NULL),
(3, 4, 0, NULL),
(4, 5, 0, NULL);

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
  `wallet_frozen` tinyint(1) NOT NULL DEFAULT '0',
  `is_banned` tinyint(1) NOT NULL DEFAULT '0',
  `ban_reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `omise_customer_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `profile_image`, `role`, `wallet_balance`, `wallet_frozen`, `is_banned`, `ban_reason`, `created_at`, `updated_at`, `omise_customer_id`) VALUES
(1, 'admin@evcharge.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Admin', 'System', '0800000001', NULL, 'admin', 0.00, 0, 0, NULL, '2026-04-08 20:16:08', '2026-04-08 20:16:08', NULL),
(2, 'tech1@evcharge.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Somchai', 'Jaidee', '0800000002', NULL, 'technician', 0.00, 0, 0, NULL, '2026-04-08 20:16:08', '2026-04-08 20:16:08', NULL),
(3, 'tech2@evcharge.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Prasit', 'Kaewmanee', '0800000003', NULL, 'technician', 0.00, 0, 0, NULL, '2026-04-08 20:16:08', '2026-04-08 20:16:08', NULL),
(4, 'tech3@evcharge.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Anuchit', 'Srisawat', '0800000004', NULL, 'technician', 0.00, 0, 0, NULL, '2026-04-08 20:16:08', '2026-04-08 20:16:08', NULL),
(5, 'tech4@evcharge.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Wichai', 'Thongkham', '0800000005', NULL, 'technician', 0.00, 0, 0, NULL, '2026-04-08 20:16:08', '2026-04-08 20:16:08', NULL),
(6, 'alice@example.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Alice', 'Wongsiri', '0811111111', NULL, 'user', 2891.56, 0, 0, NULL, '2026-04-08 20:16:08', '2026-04-09 00:23:23', 'cust_test_67aj81xm6pbq8so2g92'),
(7, 'bob@example.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Bob', 'Prasert', '0822222222', NULL, 'user', 200.00, 0, 0, NULL, '2026-04-08 20:16:08', '2026-04-08 20:16:08', NULL),
(8, 'charlie@example.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Charlie', 'Somboon', '0833333333', NULL, 'user', 0.00, 0, 0, NULL, '2026-04-08 20:16:08', '2026-04-08 20:16:08', NULL),
(9, 'nemuser@gmail.com', '$2a$10$H6UDUZxtCJq0pC9iq2tSr.R3j4NkiMewat0UHtOsNIiaj4LJQhZWS', 'nemm', 'nemm', '0661234781', NULL, 'user', 195.83, 0, 0, NULL, '2026-04-08 23:17:31', '2026-04-16 10:01:07', NULL);

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
(1, 6, 'Tesla', 'Model 3', 'กข 1234', 'CCS', 75.00, 45.00),
(2, 7, 'MG', 'MG4 Electric', 'ขค 5678', 'CCS', 64.00, 30.00),
(3, 7, 'Nissan', 'Leaf', 'จฉ 9012', 'CHAdeMO', 40.00, 20.00),
(4, 9, 'CIVIC', 'SP194', 'สต533', 'CCS', 60.00, 34.29);

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
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reason` varchar(255) DEFAULT NULL,
  `adjusted_by` int UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `wallet_transactions`
--

INSERT INTO `wallet_transactions` (`txn_id`, `user_id`, `amount`, `type`, `ref`, `created_at`, `reason`, `adjusted_by`) VALUES
(1, 6, 300.00, 'topup', 'TOPUP1775688550934215', '2026-04-08 22:49:11', NULL, NULL),
(2, 6, 100.00, 'topup', 'TOPUP177568981316920', '2026-04-08 23:10:14', NULL, NULL),
(3, 6, 400.00, 'topup', 'TOPUP1775689888705724', '2026-04-08 23:11:29', NULL, NULL),
(4, 6, 500.00, 'topup', 'TOPUP1775689954040849', '2026-04-08 23:12:34', NULL, NULL),
(5, 6, 0.54, 'deduct', 'session_1', '2026-04-08 23:52:09', NULL, NULL),
(6, 6, 1.56, 'deduct', 'session_2', '2026-04-09 00:12:19', NULL, NULL),
(7, 6, 6.34, 'deduct', 'session_3', '2026-04-09 00:20:29', NULL, NULL),
(8, 6, 100.00, 'topup', 'TOPUP1775694174420467', '2026-04-09 00:22:54', NULL, NULL),
(9, 6, 1000.00, 'topup', 'TOPUP1775694202935804', '2026-04-09 00:23:23', NULL, NULL),
(10, 9, 500.00, 'topup', 'TOPUP1775912434508466', '2026-04-11 13:00:34', NULL, NULL),
(11, 9, 257.19, 'deduct', 'session_4', '2026-04-13 21:57:29', NULL, NULL),
(12, 9, 16.25, 'deduct', 'session_5', '2026-04-16 05:05:47', NULL, NULL),
(13, 9, 21.88, 'deduct', 'session_6', '2026-04-16 05:36:47', NULL, NULL),
(14, 9, 2.19, 'deduct', 'session_8', '2026-04-16 09:09:07', NULL, NULL),
(15, 9, 5.94, 'deduct', 'session_9', '2026-04-16 09:20:45', NULL, NULL),
(16, 9, 0.72, 'deduct', 'session_11', '2026-04-16 10:01:07', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD KEY `idx_bookings_user` (`user_id`,`status`),
  ADD KEY `idx_bookings_charger` (`charger_id`,`status`);

--
-- Indexes for table `chargers`
--
ALTER TABLE `chargers`
  ADD PRIMARY KEY (`charger_id`),
  ADD KEY `idx_chargers_station` (`station_id`,`status`);

--
-- Indexes for table `charging_sessions`
--
ALTER TABLE `charging_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `fk_sessions_booking` (`booking_id`),
  ADD KEY `fk_sessions_charger` (`charger_id`),
  ADD KEY `idx_sessions_user` (`user_id`,`status`);

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
  ADD KEY `fk_messages_sender` (`sender_id`),
  ADD KEY `fk_messages_receiver` (`receiver_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_notifications_user` (`user_id`,`is_read`);

--
-- Indexes for table `notification_logs`
--
ALTER TABLE `notification_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `fk_notification_logs_notification` (`notification_id`),
  ADD KEY `fk_notification_logs_user` (`user_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `idx_payments_user` (`user_id`,`status`),
  ADD KEY `idx_payments_session` (`session_id`);

--
-- Indexes for table `payment_refunds`
--
ALTER TABLE `payment_refunds`
  ADD PRIMARY KEY (`refund_id`),
  ADD KEY `fk_refunds_payment` (`payment_id`),
  ADD KEY `fk_refunds_admin` (`refunded_by`);

--
-- Indexes for table `refund_requests`
--
ALTER TABLE `refund_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `payment_id` (`payment_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `reviewed_by` (`reviewed_by`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `fk_reviews_user` (`user_id`),
  ADD KEY `idx_reviews_station` (`station_id`);

--
-- Indexes for table `stations`
--
ALTER TABLE `stations`
  ADD PRIMARY KEY (`station_id`),
  ADD KEY `idx_stations_location` (`latitude`,`longitude`);

--
-- Indexes for table `tech_profiles`
--
ALTER TABLE `tech_profiles`
  ADD PRIMARY KEY (`tech_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

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
  ADD KEY `idx_vehicles_user` (`user_id`);

--
-- Indexes for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD PRIMARY KEY (`txn_id`),
  ADD KEY `fk_wallet_user` (`user_id`),
  ADD KEY `fk_wallet_adjusted_by` (`adjusted_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  MODIFY `admin_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `booking_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `chargers`
--
ALTER TABLE `chargers`
  MODIFY `charger_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `charging_sessions`
--
ALTER TABLE `charging_sessions`
  MODIFY `session_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `maintenance_tickets`
--
ALTER TABLE `maintenance_tickets`
  MODIFY `ticket_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `message_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `notification_logs`
--
ALTER TABLE `notification_logs`
  MODIFY `log_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `payment_refunds`
--
ALTER TABLE `payment_refunds`
  MODIFY `refund_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `refund_requests`
--
ALTER TABLE `refund_requests`
  MODIFY `request_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `review_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stations`
--
ALTER TABLE `stations`
  MODIFY `station_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `tech_profiles`
--
ALTER TABLE `tech_profiles`
  MODIFY `tech_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `vehicle_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  MODIFY `txn_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  ADD CONSTRAINT `fk_admin_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

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
  ADD CONSTRAINT `fk_messages_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `notification_logs`
--
ALTER TABLE `notification_logs`
  ADD CONSTRAINT `fk_notification_logs_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notification_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

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
-- Constraints for table `refund_requests`
--
ALTER TABLE `refund_requests`
  ADD CONSTRAINT `refund_requests_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`),
  ADD CONSTRAINT `refund_requests_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `refund_requests_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `tech_profiles`
--
ALTER TABLE `tech_profiles`
  ADD CONSTRAINT `fk_tech_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `fk_vehicles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD CONSTRAINT `fk_wallet_adjusted_by` FOREIGN KEY (`adjusted_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
