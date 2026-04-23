-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Apr 23, 2026 at 04:50 PM
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

--
-- Dumping data for table `admin_profiles`
--

INSERT INTO `admin_profiles` (`admin_id`, `user_id`) VALUES
(1, 1);

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
(8, 7, 2, '2026-04-10 05:10:26', '2026-04-03 14:00:00', '2026-04-03 15:45:00', 'completed', NULL),
(11, 7, 2, '2026-04-10 05:11:18', '2026-04-03 14:00:00', '2026-04-03 15:45:00', 'completed', NULL),
(14, 7, 2, '2026-04-10 05:11:35', '2026-04-03 14:00:00', '2026-04-03 15:45:00', 'completed', NULL),
(15, 12, 29, '2026-04-15 13:01:45', '2026-04-15 20:01:44', '2026-04-15 20:31:44', 'completed', NULL),
(16, 12, 1, '2026-04-15 13:02:51', '2026-04-15 20:02:51', '2026-04-15 22:02:51', 'completed', NULL),
(17, 12, 19, '2026-04-15 13:04:21', '2026-04-15 20:04:21', '2026-04-15 20:19:21', 'completed', NULL),
(18, 12, 15, '2026-04-15 13:05:40', '2026-04-15 20:05:40', '2026-04-15 20:20:40', 'completed', NULL),
(19, 12, 11, '2026-04-15 16:07:06', '2026-04-15 23:07:06', '2026-04-15 23:22:06', 'completed', NULL),
(21, 12, 2, '2026-04-16 03:03:59', '2026-04-16 10:03:59', '2026-04-16 10:18:59', 'completed', NULL),
(22, 12, 3, '2026-04-16 03:08:25', '2026-04-16 10:08:25', '2026-04-16 10:38:25', 'completed', NULL),
(23, 12, 4, '2026-04-16 03:20:35', '2026-04-16 10:20:35', '2026-04-16 10:50:35', 'completed', NULL),
(24, 12, 1, '2026-04-16 04:37:21', '2026-04-16 04:37:21', '2026-04-16 05:07:21', 'expired', NULL),
(25, 12, 1, '2026-04-16 04:50:14', '2026-04-16 04:50:14', '2026-04-16 05:20:14', 'expired', NULL),
(26, 12, 1, '2026-04-16 06:13:04', '2026-04-16 13:13:04', '2026-04-16 13:43:04', 'completed', NULL),
(27, 12, 1, '2026-04-16 06:33:12', '2026-04-16 13:33:12', '2026-04-16 14:18:12', 'completed', NULL),
(28, 12, 3, '2026-04-16 06:45:32', '2026-04-16 13:45:32', '2026-04-16 14:15:32', 'completed', NULL),
(29, 12, 1, '2026-04-16 10:19:55', '2026-04-16 10:19:55', NULL, 'completed', NULL),
(30, 12, 1, '2026-04-16 18:31:52', '2026-04-16 18:31:52', NULL, 'cancelled', NULL),
(31, 12, 2, '2026-04-17 05:18:06', '2026-04-17 05:18:06', NULL, 'cancelled', NULL),
(32, 12, 12, '2026-04-17 05:27:55', '2026-04-17 05:27:55', NULL, 'cancelled', NULL),
(33, 12, 15, '2026-04-17 05:31:18', '2026-04-17 05:31:18', NULL, 'cancelled', NULL),
(34, 12, 25, '2026-04-17 05:36:32', '2026-04-17 05:36:32', NULL, 'cancelled', NULL),
(35, 12, 26, '2026-04-17 05:37:17', '2026-04-17 05:37:17', NULL, 'cancelled', NULL),
(36, 12, 4, '2026-04-17 05:41:11', '2026-04-17 05:41:11', NULL, 'cancelled', NULL),
(37, 12, 9, '2026-04-17 05:41:54', '2026-04-17 05:41:54', NULL, 'cancelled', NULL),
(38, 1, 3, '2026-04-18 09:40:56', '2026-04-18 09:40:56', NULL, 'expired', NULL),
(39, 7, 11, '2026-04-18 09:42:46', '2026-04-18 09:42:46', NULL, 'cancelled', NULL),
(40, 12, 6, '2026-04-18 09:43:46', '2026-04-18 09:43:46', NULL, 'cancelled', NULL),
(41, 1, 13, '2026-04-18 16:59:38', '2026-04-18 16:59:38', NULL, 'expired', NULL),
(43, 12, 3, '2026-04-19 08:02:06', '2026-04-19 08:02:06', NULL, 'cancelled', NULL),
(44, 12, 5, '2026-04-19 08:06:16', '2026-04-19 08:06:16', NULL, 'completed', NULL),
(45, 7, 13, '2026-04-20 07:27:39', '2026-04-20 07:27:39', NULL, 'completed', NULL),
(46, 7, 23, '2026-04-20 07:28:54', '2026-04-20 07:28:54', NULL, 'completed', NULL),
(47, 7, 27, '2026-04-20 07:30:36', '2026-04-20 07:30:36', NULL, 'completed', NULL),
(48, 7, 8, '2026-04-21 06:57:26', '2026-04-21 06:57:26', NULL, 'completed', NULL),
(49, 7, 1, '2026-04-21 08:27:03', '2026-04-21 08:27:03', NULL, 'completed', NULL),
(50, 7, 5, '2026-04-21 08:30:23', '2026-04-21 08:30:23', NULL, 'completed', NULL),
(51, 7, 1, '2026-04-21 10:43:42', '2026-04-21 10:43:42', NULL, 'completed', NULL),
(52, 7, 3, '2026-04-21 10:47:04', '2026-04-21 10:47:04', NULL, 'completed', NULL),
(53, 12, 5, '2026-04-22 14:59:18', '2026-04-22 14:59:18', NULL, 'completed', NULL);

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
  `qr_code` varchar(500) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `chargers`
--

INSERT INTO `chargers` (`charger_id`, `station_id`, `charger_name`, `connector_type`, `power_kw`, `price_per_kwh`, `status`, `temperature_celsius`, `qr_code`, `deleted_at`) VALUES
(1, 1, 'SIAM-DC01', 'CCS', 150.00, 7.50, 'available', NULL, 'QR-SIAM-DC01', NULL),
(2, 1, 'SIAM-DC02', 'CCS', 150.00, 7.50, 'available', NULL, 'QR-SIAM-DC02', NULL),
(3, 1, 'SIAM-DC03', 'CHAdeMO', 50.00, 6.50, 'available', NULL, 'QR-SIAM-DC03', NULL),
(4, 1, 'SIAM-AC01', 'Type2', 22.00, 5.00, 'available', NULL, 'QR-SIAM-AC01', NULL),
(5, 2, 'JJ-DC01', 'CCS', 100.00, 7.00, 'available', NULL, 'QR-JJ-DC01', NULL),
(6, 2, 'JJ-DC02', 'CHAdeMO', 50.00, 6.50, 'available', NULL, 'QR-JJ-DC02', NULL),
(7, 2, 'JJ-AC01', 'Type2', 22.00, 5.00, 'available', NULL, 'QR-JJ-AC01', NULL),
(8, 3, 'BNA-DC01', 'CCS', 150.00, 7.50, 'available', NULL, 'QR-BNA-DC01', NULL),
(9, 3, 'BNA-DC02', 'CCS', 150.00, 7.50, 'available', NULL, 'QR-BNA-DC02', NULL),
(10, 3, 'BNA-DC03', 'CHAdeMO', 50.00, 6.50, 'out_of_service', NULL, 'QR-BNA-DC03', NULL),
(11, 3, 'BNA-AC01', 'Type2', 22.00, 5.00, 'available', NULL, 'QR-BNA-AC01', NULL),
(12, 4, 'LAT-DC01', 'CCS', 80.00, 6.80, 'available', NULL, 'QR-LAT-DC01', NULL),
(13, 4, 'LAT-DC02', 'CCS', 80.00, 6.80, 'available', NULL, 'QR-LAT-DC02', NULL),
(14, 4, 'LAT-AC01', 'Type2', 22.00, 4.80, 'available', NULL, 'QR-LAT-AC01', NULL),
(15, 5, 'RAM-DC01', 'CCS', 60.00, 6.50, 'available', NULL, 'QR-RAM-DC01', NULL),
(17, 6, 'PR2-DC01', 'CCS', 120.00, 7.00, 'available', NULL, 'QR-PR2-DC01', NULL),
(18, 6, 'PR2-DC02', 'CHAdeMO', 50.00, 6.50, 'available', NULL, 'QR-PR2-DC02', NULL),
(19, 6, 'PR2-AC01', 'Type2', 22.00, 5.00, 'available', NULL, 'QR-PR2-AC01', NULL),
(20, 7, 'THL-DC01', 'CCS', 150.00, 8.00, 'available', NULL, 'QR-THL-DC01', NULL),
(21, 7, 'THL-DC02', 'CCS', 150.00, 7.00, 'available', NULL, 'QR-THL-DC02', NULL),
(22, 7, 'THL-AC01', 'Type2', 22.00, 5.50, 'available', NULL, 'QR-THL-AC01', NULL),
(23, 8, 'ARI-DC01', 'CCS', 60.00, 6.80, 'available', NULL, 'QR-ARI-DC01', NULL),
(24, 8, 'ARI-AC01', 'Type2', 7.40, 4.50, 'available', NULL, 'QR-ARI-AC01', NULL),
(25, 9, 'RST-DC01', 'CCS', 150.00, 7.50, 'available', NULL, 'QR-RST-DC01', NULL),
(26, 9, 'RST-DC02', 'CCS', 150.00, 7.50, 'available', NULL, 'QR-RST-DC02', NULL),
(27, 9, 'RST-DC03', 'CHAdeMO', 50.00, 6.50, 'available', NULL, 'QR-RST-DC03', NULL),
(28, 9, 'RST-AC01', 'Type2', 22.00, 5.00, 'available', NULL, 'QR-RST-AC01', NULL),
(29, 10, 'ONN-DC01', 'CCS', 80.00, 7.00, 'available', NULL, 'QR-ONN-DC01', NULL),
(30, 10, 'ONN-AC01', 'Type2', 22.00, 5.00, 'available', NULL, 'QR-ONN-AC01', NULL),
(31, 11, 'Charger A1', 'CCS', 45.00, 10.00, 'available', NULL, NULL, NULL);

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
(34, 26, 12, 1, '2026-04-16 06:25:59', '2026-04-16 06:26:15', 0.63, NULL, 'completed'),
(35, 27, 12, 1, '2026-04-16 06:44:13', '2026-04-16 06:44:16', 0.08, NULL, 'completed'),
(36, 28, 12, 3, '2026-04-16 09:04:22', '2026-04-16 09:04:24', 1.00, NULL, 'completed'),
(37, 29, 12, 1, '2026-04-16 10:22:32', '2026-04-16 10:23:33', 2.50, NULL, 'completed'),
(47, 40, 12, 6, '2026-04-18 09:43:50', '2026-04-21 08:45:53', NULL, NULL, 'stopped'),
(48, 43, 12, 3, '2026-04-19 08:02:10', '2026-04-21 08:45:53', NULL, NULL, 'stopped'),
(49, 44, 12, 5, '2026-04-19 08:06:19', '2026-04-19 08:06:31', 0.31, NULL, 'completed'),
(50, 45, 7, 13, '2026-04-20 07:27:43', '2026-04-20 07:28:01', 0.38, NULL, 'completed'),
(51, 46, 7, 23, '2026-04-20 07:29:01', '2026-04-20 07:29:31', 0.48, NULL, 'completed'),
(52, 47, 7, 27, '2026-04-20 07:30:45', '2026-04-20 07:33:11', 2.01, NULL, 'completed'),
(53, 48, 7, 8, '2026-04-21 06:57:29', '2026-04-21 06:57:38', 0.29, NULL, 'completed'),
(54, 49, 7, 1, '2026-04-21 08:27:08', '2026-04-21 08:29:23', 5.58, NULL, 'completed'),
(55, 50, 7, 5, '2026-04-21 08:30:27', '2026-04-21 08:39:35', 15.17, NULL, 'completed'),
(56, 51, 7, 1, '2026-04-21 10:43:46', '2026-04-21 10:44:32', 1.83, NULL, 'completed'),
(57, 52, 7, 3, '2026-04-21 10:47:23', '2026-04-21 10:48:45', 1.13, NULL, 'completed'),
(58, 53, 12, 5, '2026-04-22 14:59:31', '2026-04-22 15:18:58', 32.36, NULL, 'completed');

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
  `assigned_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `maintenance_tickets`
--

INSERT INTO `maintenance_tickets` (`ticket_id`, `charger_id`, `reported_by`, `assigned_to`, `title`, `description`, `image`, `repair_image`, `repair_notes`, `status`, `priority`, `created_at`, `assigned_at`, `completed_at`) VALUES
(1, 1, 1, 2, 'ปัญหาตู้', 'ฝาตู้หลุด', 'Untitled (3) 4.png', '/uploads/tickets/ticket-1-1776258662434-447285508.png', 'ติดฝาตู้ใหม่แทนอันเก่าที่หลุดไป', 'completed', 'high', '2026-04-10 05:56:17', NULL, '2026-04-10 05:56:17'),
(2, 2, 2, 2, 'ปุ่มหยุดฉุกเฉินถูกกดค้าง', 'ปุ่ม Emergency Stop ถูกกดไว้ ทำให้กระแสไฟตัด ระบบไม่ยอมรีเซ็ต', '03-calculator.pdf', '03-calculator.pdf', 'ตรวจสอบพบว่าปุ่มโดนกระแทกจนกลไกด้านในหัก ทำการเปลี่ยนปุ่ม E-Stop ใหม่ยกชุด และทดสอบระบบตัดไฟกระแสสลับ (AC Contactor)', 'completed', 'critical', '2026-04-11 11:07:09', NULL, '2026-04-11 11:07:09'),
(3, 3, 3, 2, 'ควันออกจากตู้ชาร์จ', 'พบกลิ่นไหม้และควันออกจากช่องระบายอากาศขณะชาร์จไฟแรงสูง', '03-calculator.pdf', '03-calculator.pdf', 'พบตัวเก็บประจุ (Capacitor) บนบอร์ด Power Supply บวมและระเบิด ทำการเปลี่ยนบอร์ดใหม่และเช็คแรงดันไฟขาเข้า พบว่าไฟเกิน จึงติดตั้งตัวกันกระชากเพิ่มเติม', 'completed', 'critical', '2026-04-11 11:07:09', NULL, '2026-04-11 11:07:09'),
(4, 1, 12, 2, 'เริ่มชาร์จไม่ได้', 'ถึงตู้แล้วชาร์จรถไม่ได้', NULL, '/uploads/tickets/ticket-4-1776416562556-224715124.jpg', 'ต้องสั่งปลดล็อกหัวชาร์จ', 'completed', 'medium', '2026-04-15 13:03:45', NULL, NULL),
(7, 11, 12, 2, 'สายไฟที่ตู้ขาด', 'สายไฟมีรอยฉีกขาดเห็นทองแดงข้างในเหมือนโดนหนุแทะ', NULL, '/uploads/tickets/ticket-7-1776360016508-785758348.jpg', 'เปลี่ยนสายไฟ  33 เส้น', 'completed', 'medium', '2026-04-15 13:16:06', NULL, NULL),
(8, 2, 12, 2, 'หน้าจอค้าง', 'กดไรไม่ได้เลย', NULL, '/uploads/tickets/ticket-8-1776415491066-218910752.png', 'ทำการ Restart เครื่องใหม่ และทดสอบการใช้งานเบื้องต้น หน้าใช้งานได้ตามปกติแล้ว', 'completed', 'medium', '2026-04-15 13:16:54', NULL, NULL),
(9, 17, 12, 11, 'หัวชาร์จเสีหาย', 'หัวชาร์จเสีหายผิดรูปใช้งานไม่ได้', NULL, '/uploads/tickets/ticket-9-1776275776354-628314675.png', 'เปลี่ยนหัว', 'completed', 'medium', '2026-04-15 13:17:58', NULL, NULL),
(10, 13, 1, NULL, 'จอภาพแตก', 'เเตกเปิดไม่ได้มีเศษกระจกร่วงไปหมด', NULL, NULL, NULL, 'reported', 'medium', '2026-04-15 18:27:25', NULL, NULL),
(11, 20, 1, NULL, 'ชาร์จไม่เข้า', 'กดชาร์จแล้ว แต่มันไม่เริ่มชาร์จ', NULL, NULL, NULL, 'reported', 'medium', '2026-04-15 18:27:58', NULL, NULL),
(12, 23, 1, NULL, 'ฝาตู้หลุด', 'ตู้ชาร์จฝาหาย', NULL, NULL, NULL, 'reported', 'medium', '2026-04-15 18:28:31', NULL, NULL),
(13, 28, 1, NULL, 'สายไฟขาด', 'มีไฟฟ้ารั่วมาจากสายไฟที่ขาด', NULL, NULL, NULL, 'reported', 'medium', '2026-04-15 18:29:07', NULL, NULL),
(14, 21, 1, NULL, 'ไฟฟ้าช็อตควันออก', 'ไฟฟ้ารัดวงจรตู้มีควันเต็มตู้', NULL, NULL, NULL, 'reported', 'medium', '2026-04-15 18:30:02', NULL, NULL),
(15, 2, 12, 2, 'หัวชาร์จเสียหาย', 'หัวชาร์จเสียหายผิดรูปเหมือนโดนทุบ', NULL, '/uploads/tickets/ticket-15-1776415534658-264329423.jpg', 'เปลี่ยนหัวชาร์จใหม่', 'completed', 'medium', '2026-04-16 03:05:48', NULL, NULL),
(16, 7, 12, 2, 'จอเสีย', 'กดใช้แล้วไม่ขึ้นไรเลย', NULL, '/uploads/tickets/ticket-16-1776416578405-961688961.jpg', 'Force Restart ตัวเครื่องและทำการ Clear Cache ของระบบ ทดลองเปิดใช้งานแอปพลิเคชันทิ้งไว้ 15 นาที ไม่พบอาการจอค้างซ้ำ', 'completed', 'medium', '2026-04-16 18:32:25', NULL, NULL),
(17, 7, 12, 2, 'จอเสีย', 'เปิดจอตู้ไม่ได้ใช้งานไม่ได้', NULL, '/uploads/tickets/ticket-17-1776415558637-686012408.png', NULL, 'completed', 'medium', '2026-04-17 08:16:25', '2026-04-17 08:39:54', NULL),
(18, 3, 1, 13, 'หน้าจอไม่แสดงไรเลย', 'เปิดใช้งานไม่ได้', NULL, NULL, NULL, 'assigned', 'medium', '2026-04-18 16:30:49', '2026-04-21 01:13:25', NULL),
(19, 14, 1, 2, 'ตู้ฝาหลุด', 'ตู้ฝาหลุดเห็นข้างในตู้', NULL, NULL, 'เสกกกดดดด', 'completed', 'medium', '2026-04-18 16:58:54', '2026-04-21 09:06:33', NULL),
(20, 7, 1, 11, 'มีควันออกตู้', 'ไฟฟ้ารั่ว มีควันออก ', NULL, NULL, NULL, 'assigned', 'medium', '2026-04-18 17:03:49', '2026-04-21 01:13:30', NULL),
(21, 30, 1, 9, 'หัวชาร์จแตกเสียหาย', 'หัวชาร์จแตกเสียหายเราทำตกเอง', NULL, NULL, NULL, 'assigned', 'medium', '2026-04-18 17:06:11', '2026-04-21 01:13:39', NULL),
(22, 8, 12, 13, 'test', 'test', NULL, NULL, NULL, 'assigned', 'medium', '2026-04-19 08:06:08', '2026-04-21 01:13:35', NULL),
(23, 1, 12, 2, 'test', 'test\n', NULL, NULL, NULL, 'completed', 'medium', '2026-04-20 02:14:09', '2026-04-21 00:53:00', NULL),
(24, 8, 12, 2, 'พัง', 'พัง', NULL, '/uploads/tickets/ticket-24-1776734125105-134983615.jpg', NULL, 'completed', 'medium', '2026-04-21 00:43:03', '2026-04-21 00:45:31', NULL),
(25, 20, 12, 13, 'teast', 'teast', NULL, NULL, NULL, 'assigned', 'medium', '2026-04-21 01:12:59', '2026-04-21 01:17:12', NULL),
(26, 14, 7, 2, 'test', 'test', NULL, '/uploads/tickets/ticket-26-1776761580628-350391086.jpg', NULL, 'completed', 'medium', '2026-04-21 06:58:00', '2026-04-21 08:51:47', NULL),
(27, 5, 7, 2, 'ชาร์จไม่เข้า', 'ให้ช่างมาเช็คให้หน่อยคับ มันชาทแล้วพลังงานไม่เข้า', NULL, '/uploads/tickets/ticket-27-1776762043013-746950186.jpg', 'เสดด', 'completed', 'medium', '2026-04-21 08:57:32', '2026-04-21 08:59:51', NULL),
(28, 1, 12, 2, 'ชาร์จไม่เข้า', 'เรียกช่างมาที', NULL, NULL, NULL, 'completed', 'medium', '2026-04-22 15:00:03', '2026-04-22 15:17:07', NULL);

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
  `type` enum('booking','charging','payment','maintenance','system','promotion') NOT NULL DEFAULT 'system',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `from_user_id` int UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `from_user_id`) VALUES
(22, 3, 'แจ้งเตือนทดสอบ', 'นี่คือข้อความทดสอบ broadcast', 'system', 1, '2026-04-14 15:36:44', NULL),
(23, 4, 'แจ้งเตือนทดสอบ', 'นี่คือข้อความทดสอบ broadcast', 'system', 1, '2026-04-14 15:36:44', NULL),
(24, 5, 'แจ้งเตือนทดสอบ', 'นี่คือข้อความทดสอบ broadcast', 'system', 1, '2026-04-14 15:36:44', NULL),
(25, 7, 'แจ้งเตือนทดสอบ', 'นี่คือข้อความทดสอบ broadcast', 'system', 1, '2026-04-14 15:36:44', NULL),
(26, 8, 'แจ้งเตือนทดสอบ', 'นี่คือข้อความทดสอบ broadcast', 'system', 1, '2026-04-14 15:36:44', NULL),
(27, 3, 'การจอง', 'นี่คือข้อความทดสอบ booking', 'booking', 1, '2026-04-14 15:40:36', NULL),
(28, 4, 'การจอง', 'นี่คือข้อความทดสอบ booking', 'booking', 1, '2026-04-14 15:40:36', NULL),
(29, 5, 'การจอง', 'นี่คือข้อความทดสอบ booking', 'booking', 1, '2026-04-14 15:40:36', NULL),
(30, 7, 'การจอง', 'นี่คือข้อความทดสอบ booking', 'booking', 1, '2026-04-14 15:40:36', NULL),
(31, 8, 'การจอง', 'นี่คือข้อความทดสอบ booking', 'booking', 1, '2026-04-14 15:40:36', NULL),
(32, 2, 'แจ้งช่างทุกคน', 'มีงานซ่อมใหม่', 'maintenance', 1, '2026-04-14 15:42:38', NULL),
(33, 3, 'แจ้งเตือนเฉพาะคุณ', 'ยอด wallet ของคุณมีการปรับ', 'payment', 1, '2026-04-14 15:43:25', NULL),
(34, 4, 'แจ้งเตือนเฉพาะคุณ', 'ยอด wallet ของคุณมีการปรับ', 'payment', 1, '2026-04-14 15:43:25', NULL),
(35, 7, 'แจ้งเตือนเฉพาะคุณ', 'ยอด wallet ของคุณมีการปรับ', 'payment', 1, '2026-04-14 15:43:25', NULL),
(36, 2, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #4: เริ่มชาร์จไม่ได้', 'maintenance', 1, '2026-04-15 13:03:45', NULL),
(37, 9, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #4: เริ่มชาร์จไม่ได้', 'maintenance', 1, '2026-04-15 13:03:45', NULL),
(38, 11, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #4: เริ่มชาร์จไม่ได้', 'maintenance', 1, '2026-04-15 13:03:45', NULL),
(39, 2, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #5: สายไฟที่ตู้ขาด', 'maintenance', 1, '2026-04-15 13:12:17', NULL),
(40, 9, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #5: สายไฟที่ตู้ขาด', 'maintenance', 1, '2026-04-15 13:12:17', NULL),
(41, 11, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #5: สายไฟที่ตู้ขาด', 'maintenance', 1, '2026-04-15 13:12:17', NULL),
(42, 2, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #6: หน้าจอค้าง', 'maintenance', 1, '2026-04-15 13:13:07', NULL),
(43, 9, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #6: หน้าจอค้าง', 'maintenance', 1, '2026-04-15 13:13:07', NULL),
(44, 11, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #6: หน้าจอค้าง', 'maintenance', 1, '2026-04-15 13:13:07', NULL),
(45, 2, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #7: สายไฟที่ตู้ขาด', 'maintenance', 1, '2026-04-15 13:16:06', NULL),
(46, 9, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #7: สายไฟที่ตู้ขาด', 'maintenance', 1, '2026-04-15 13:16:06', NULL),
(47, 11, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #7: สายไฟที่ตู้ขาด', 'maintenance', 1, '2026-04-15 13:16:06', NULL),
(48, 2, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #8: หน้าจอค้าง', 'maintenance', 1, '2026-04-15 13:16:54', NULL),
(49, 9, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #8: หน้าจอค้าง', 'maintenance', 1, '2026-04-15 13:16:54', NULL),
(50, 11, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #8: หน้าจอค้าง', 'maintenance', 1, '2026-04-15 13:16:54', NULL),
(51, 2, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #9: หัวชาร์จเสีหาย', 'maintenance', 1, '2026-04-15 13:17:58', NULL),
(52, 9, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #9: หัวชาร์จเสีหาย', 'maintenance', 1, '2026-04-15 13:17:58', NULL),
(53, 11, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #9: หัวชาร์จเสีหาย', 'maintenance', 1, '2026-04-15 13:17:58', NULL),
(54, 1, 'ทดสอบ schedule', 'cron job ทำงานแล้ว', 'system', 1, '2026-04-15 16:30:00', NULL),
(55, 3, 'ทดสอบ schedule', 'cron job ทำงานแล้ว', 'system', 1, '2026-04-15 16:30:00', NULL),
(56, 4, 'ทดสอบ schedule', 'cron job ทำงานแล้ว', 'system', 1, '2026-04-15 16:30:00', NULL),
(58, 5, 'ทดสอบ schedule', 'cron job ทำงานแล้ว', 'system', 1, '2026-04-15 16:30:00', NULL),
(59, 12, 'ทดสอบ schedule', 'cron job ทำงานแล้ว', 'system', 1, '2026-04-15 16:30:00', NULL),
(60, 8, 'ทดสอบ schedule', 'cron job ทำงานแล้ว', 'system', 1, '2026-04-15 16:30:00', NULL),
(61, 7, 'ทดสอบ schedule', 'cron job ทำงานแล้ว', 'system', 1, '2026-04-15 16:30:00', NULL),
(62, 2, 'ทดสอบ schedule', 'cron job ทำงานแล้ว', 'system', 1, '2026-04-15 16:30:00', NULL),
(63, 9, 'ทดสอบ schedule', 'cron job ทำงานแล้ว', 'system', 1, '2026-04-15 16:30:00', NULL),
(64, 11, 'ทดสอบ schedule', 'cron job ทำงานแล้ว', 'system', 1, '2026-04-15 16:30:00', NULL),
(65, 2, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #10: จอภาพแตก', 'maintenance', 1, '2026-04-15 18:27:25', NULL),
(66, 9, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #10: จอภาพแตก', 'maintenance', 1, '2026-04-15 18:27:25', NULL),
(67, 11, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #10: จอภาพแตก', 'maintenance', 1, '2026-04-15 18:27:25', NULL),
(68, 2, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #11: ชาร์จไม่เข้า', 'maintenance', 1, '2026-04-15 18:27:58', NULL),
(69, 9, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #11: ชาร์จไม่เข้า', 'maintenance', 1, '2026-04-15 18:27:58', NULL),
(70, 11, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #11: ชาร์จไม่เข้า', 'maintenance', 1, '2026-04-15 18:27:58', NULL),
(71, 2, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #12: ฝาตู้หลุด', 'maintenance', 1, '2026-04-15 18:28:31', NULL),
(72, 9, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #12: ฝาตู้หลุด', 'maintenance', 1, '2026-04-15 18:28:31', NULL),
(73, 11, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #12: ฝาตู้หลุด', 'maintenance', 1, '2026-04-15 18:28:31', NULL),
(74, 2, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #13: สายไฟขาด', 'maintenance', 1, '2026-04-15 18:29:07', NULL),
(75, 9, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #13: สายไฟขาด', 'maintenance', 1, '2026-04-15 18:29:07', NULL),
(76, 11, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #13: สายไฟขาด', 'maintenance', 1, '2026-04-15 18:29:07', NULL),
(77, 2, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #14: ไฟฟ้าช็อตควันออก', 'maintenance', 1, '2026-04-15 18:30:02', NULL),
(78, 9, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #14: ไฟฟ้าช็อตควันออก', 'maintenance', 1, '2026-04-15 18:30:02', NULL),
(79, 11, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #14: ไฟฟ้าช็อตควันออก', 'maintenance', 1, '2026-04-15 18:30:02', NULL),
(81, 2, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #15: หัวชาร์จเสียหาย', 'maintenance', 1, '2026-04-16 03:05:48', NULL),
(82, 9, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #15: หัวชาร์จเสียหาย', 'maintenance', 1, '2026-04-16 03:05:48', NULL),
(83, 11, 'มีแจ้งปัญหาใหม่', 'ตั๋วซ่อม #15: หัวชาร์จเสียหาย', 'maintenance', 1, '2026-04-16 03:05:48', NULL),
(84, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-16 06:25:59', NULL),
(85, 12, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 0.625 kWh คิดเป็นเงิน 4.69 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-16 06:26:15', NULL),
(86, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-16 06:44:13', NULL),
(87, 12, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 0.083 kWh คิดเป็นเงิน 0.62 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-16 06:44:16', NULL),
(88, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-16 09:04:22', NULL),
(89, 12, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 1 kWh คิดเป็นเงิน 6.5 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-16 09:04:24', NULL),
(90, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-16 10:22:32', NULL),
(91, 12, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 2.5 kWh คิดเป็นเงิน 18.75 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-16 10:23:33', NULL),
(92, 1, 'ซ่อมเสร็จแล้ว', 'สายไฟที่ตู้ขาด ซ่อมเสร็จโดย สมชาย เหนือใคร', 'maintenance', 1, '2026-04-16 17:20:16', NULL),
(95, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-16 18:31:57', NULL),
(96, 1, 'มีแจ้งซ่อมใหม่', 'แจ้งซ่อม #16: จอเสีย', 'maintenance', 1, '2026-04-16 18:32:25', NULL),
(98, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-17 05:27:36', NULL),
(99, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-17 05:27:59', NULL),
(100, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-17 05:31:22', NULL),
(101, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-17 05:36:38', NULL),
(102, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-17 05:37:21', NULL),
(103, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-17 05:41:18', NULL),
(104, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-17 05:41:58', NULL),
(105, 1, 'มีแจ้งซ่อมใหม่', 'แจ้งซ่อม #17: จอเสีย', 'maintenance', 1, '2026-04-17 08:16:25', NULL),
(107, 1, 'ซ่อมเสร็จแล้ว', 'หน้าจอค้าง ซ่อมเสร็จโดย สมชาย เหนือใคร', 'maintenance', 1, '2026-04-17 08:44:50', NULL),
(110, 1, 'ซ่อมเสร็จแล้ว', 'หัวชาร์จเสียหาย ซ่อมเสร็จโดย สมชาย เหนือใคร', 'maintenance', 1, '2026-04-17 08:45:34', NULL),
(113, 1, 'ซ่อมเสร็จแล้ว', 'เริ่มชาร์จไม่ได้ ซ่อมเสร็จโดย สมชาย เหนือใคร', 'maintenance', 1, '2026-04-17 09:02:42', NULL),
(116, 1, 'ซ่อมเสร็จแล้ว', 'จอเสีย ซ่อมเสร็จโดย สมชาย เหนือใคร', 'maintenance', 1, '2026-04-17 09:03:05', NULL),
(119, 7, 'คำขอคืนเงินอนุมัติแล้ว', 'คำขอคืนเงิน 185.75 บาท ได้รับการอนุมัติแล้วเงินเข้า wallet แล้ว', 'payment', 1, '2026-04-18 09:13:39', NULL),
(120, 7, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-18 09:42:50', NULL),
(121, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-18 09:43:50', NULL),
(122, 1, 'มีคำขอคืนเงิน', 'ผู้ใช้ขอคืนเงิน payment #9: ชาร์จไม่เสดก้ตัด', 'payment', 1, '2026-04-18 16:28:21', NULL),
(125, 12, 'ส่งคำขอคืนเงินแล้ว', 'คำขอคืนเงิน #5 ได้รับแล้ว ทีมงานจะตรวจสอบภายใน 24-48 ชั่วโมง', 'payment', 1, '2026-04-18 16:28:21', NULL),
(126, 1, 'มีแจ้งซ่อมใหม่', 'แจ้งซ่อม #18: หน้าจอไม่แสดงไรเลย', 'maintenance', 1, '2026-04-18 16:30:49', NULL),
(128, 1, 'มีแจ้งซ่อมใหม่', 'แจ้งซ่อม #19: ตู้ฝาหลุด', 'maintenance', 1, '2026-04-18 16:58:54', NULL),
(130, 1, 'มีแจ้งซ่อมใหม่', 'แจ้งซ่อม #20: มีควันออกตู้', 'maintenance', 1, '2026-04-18 17:03:49', NULL),
(132, 1, 'มีแจ้งซ่อมใหม่', 'แจ้งซ่อม #21: หัวชาร์จแตกเสียหาย', 'maintenance', 1, '2026-04-18 17:06:11', NULL),
(134, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-19 08:02:10', NULL),
(135, 1, 'มีแจ้งซ่อมใหม่', 'แจ้งซ่อม #22: test', 'maintenance', 1, '2026-04-19 08:06:08', NULL),
(137, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-19 08:06:19', NULL),
(138, 12, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 0.306 kWh คิดเป็นเงิน 2.14 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-19 08:06:31', NULL),
(139, 12, 'คำขอคืนเงินอนุมัติแล้ว', 'คำขอคืนเงิน 50.00 บาท ได้รับการอนุมัติแล้วเงินเข้า wallet แล้ว', 'payment', 1, '2026-04-19 22:27:55', NULL),
(141, 1, 'มีคำขอคืนเงิน', 'ผู้ใช้ขอคืนเงิน payment #14: test', 'payment', 1, '2026-04-20 02:13:03', NULL),
(144, 12, 'ส่งคำขอคืนเงินแล้ว', 'คำขอคืนเงิน #6 ได้รับแล้ว ทีมงานจะตรวจสอบภายใน 24-48 ชั่วโมง', 'payment', 1, '2026-04-20 02:13:03', NULL),
(145, 1, 'มีคำขอคืนเงิน', 'ผู้ใช้ขอคืนเงิน payment #8: test', 'payment', 1, '2026-04-20 02:13:37', NULL),
(148, 12, 'ส่งคำขอคืนเงินแล้ว', 'คำขอคืนเงิน #7 ได้รับแล้ว ทีมงานจะตรวจสอบภายใน 24-48 ชั่วโมง', 'payment', 1, '2026-04-20 02:13:37', NULL),
(149, 1, 'มีแจ้งซ่อมใหม่', 'แจ้งซ่อม #23: test', 'maintenance', 1, '2026-04-20 02:14:09', NULL),
(151, 7, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-20 07:27:43', NULL),
(152, 7, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 0.378 kWh คิดเป็นเงิน 2.57 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-20 07:28:01', NULL),
(153, 7, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-20 07:29:01', NULL),
(154, 7, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 0.483 kWh คิดเป็นเงิน 3.28 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-20 07:29:31', NULL),
(155, 7, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-20 07:30:45', NULL),
(156, 7, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 2.014 kWh คิดเป็นเงิน 13.09 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-20 07:33:11', NULL),
(157, 1, 'ซ่อมเสร็จแล้ว', 'จอเสีย ซ่อมเสร็จโดย สมชาย เหนือใคร', 'maintenance', 1, '2026-04-21 00:41:46', NULL),
(160, 1, 'มีแจ้งซ่อมใหม่', 'แจ้งซ่อม #24: พัง', 'maintenance', 1, '2026-04-21 00:43:03', NULL),
(162, 1, 'มีแจ้งซ่อมใหม่', 'แจ้งซ่อม #25: teast', 'maintenance', 1, '2026-04-21 01:12:59', NULL),
(164, 1, 'ซ่อมเสร็จแล้ว', 'พัง ซ่อมเสร็จโดย สมชาย เหนือใคร', 'maintenance', 1, '2026-04-21 01:15:25', NULL),
(167, 1, 'ซ่อมเสร็จแล้ว', 'test ซ่อมเสร็จโดย สมชาย เหนือใคร', 'maintenance', 1, '2026-04-21 01:15:53', NULL),
(170, 12, 'คำขอคืนเงินถูกปฏิเสธ', 'คำขอคืนเงินไม่ได้รับการอนุมัติ เหตุผล: EVเราไม่มีพนง', 'payment', 1, '2026-04-21 01:52:23', NULL),
(171, 1, 'มีคำขอคืนเงิน', 'ผู้ใช้ขอคืนเงิน payment #7: test', 'payment', 1, '2026-04-21 02:01:21', NULL),
(174, 12, 'ส่งคำขอคืนเงินแล้ว', 'คำขอคืนเงิน #8 ได้รับแล้ว ทีมงานจะตรวจสอบภายใน 24-48 ชั่วโมง', 'payment', 1, '2026-04-21 02:01:21', NULL),
(175, 3, 'ประกาศ', 'test', 'system', 1, '2026-04-21 06:43:41', NULL),
(176, 4, 'ประกาศ', 'test', 'system', 1, '2026-04-21 06:43:41', NULL),
(177, 5, 'ประกาศ', 'test', 'system', 1, '2026-04-21 06:43:41', NULL),
(178, 7, 'ประกาศ', 'test', 'system', 1, '2026-04-21 06:43:41', NULL),
(179, 8, 'ประกาศ', 'test', 'system', 1, '2026-04-21 06:43:41', NULL),
(180, 12, 'ประกาศ', 'test', 'system', 1, '2026-04-21 06:43:41', NULL),
(181, 1, 'มีคำขอคืนเงิน', 'ผู้ใช้ขอคืนเงิน payment #15: test', 'payment', 1, '2026-04-21 06:57:05', NULL),
(182, 7, 'ส่งคำขอคืนเงินแล้ว', 'คำขอคืนเงิน #9 ได้รับแล้ว ทีมงานจะตรวจสอบภายใน 24-48 ชั่วโมง', 'payment', 1, '2026-04-21 06:57:05', NULL),
(183, 1, 'มีคำขอคืนเงิน', 'ผู้ใช้ขอคืนเงิน payment #16: test', 'payment', 1, '2026-04-21 06:57:16', NULL),
(184, 7, 'ส่งคำขอคืนเงินแล้ว', 'คำขอคืนเงิน #10 ได้รับแล้ว ทีมงานจะตรวจสอบภายใน 24-48 ชั่วโมง', 'payment', 1, '2026-04-21 06:57:16', NULL),
(185, 7, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-21 06:57:29', NULL),
(186, 7, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 0.292 kWh คิดเป็นเงิน 2.19 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-21 06:57:38', NULL),
(187, 1, 'มีแจ้งซ่อมใหม่', 'แจ้งซ่อม #26: test', 'maintenance', 1, '2026-04-21 06:58:00', NULL),
(188, 3, 'โปรโมชัน', 'test', 'promotion', 1, '2026-04-21 07:30:35', NULL),
(189, 4, 'โปรโมชัน', 'test', 'promotion', 1, '2026-04-21 07:30:35', NULL),
(190, 5, 'โปรโมชัน', 'test', 'promotion', 1, '2026-04-21 07:30:35', NULL),
(191, 7, 'โปรโมชัน', 'test', 'promotion', 1, '2026-04-21 07:30:35', NULL),
(192, 8, 'โปรโมชัน', 'test', 'promotion', 1, '2026-04-21 07:30:35', NULL),
(193, 12, 'โปรโมชัน', 'test', 'promotion', 1, '2026-04-21 07:30:35', NULL),
(194, 3, 'โปรโมชัน', 'dd', 'promotion', 1, '2026-04-21 07:30:44', NULL),
(195, 4, 'โปรโมชัน', 'dd', 'promotion', 1, '2026-04-21 07:30:44', NULL),
(196, 5, 'โปรโมชัน', 'dd', 'promotion', 1, '2026-04-21 07:30:44', NULL),
(197, 7, 'โปรโมชัน', 'dd', 'promotion', 1, '2026-04-21 07:30:44', NULL),
(198, 8, 'โปรโมชัน', 'dd', 'promotion', 1, '2026-04-21 07:30:44', NULL),
(199, 12, 'โปรโมชัน', 'dd', 'promotion', 1, '2026-04-21 07:30:44', NULL),
(200, 7, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-21 08:27:08', NULL),
(201, 7, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 5.583 kWh คิดเป็นเงิน 41.87 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-21 08:29:23', NULL),
(202, 7, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-21 08:30:27', NULL),
(203, 1, 'มีคำขอคืนเงิน', 'ผู้ใช้ขอคืนเงิน payment #18: ', 'payment', 1, '2026-04-21 08:32:36', NULL),
(204, 7, 'ส่งคำขอคืนเงินแล้ว', 'คำขอคืนเงิน #11 ได้รับแล้ว ทีมงานจะตรวจสอบภายใน 24-48 ชั่วโมง', 'payment', 1, '2026-04-21 08:32:36', NULL),
(205, 7, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 15.167 kWh คิดเป็นเงิน 106.17 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-21 08:39:35', NULL),
(206, 1, 'ซ่อมเสร็จแล้ว', 'test ซ่อมเสร็จโดย สมชาย เหนือใคร', 'maintenance', 1, '2026-04-21 08:53:00', NULL),
(207, 1, 'มีแจ้งซ่อมใหม่', 'แจ้งซ่อม #27: ชาร์จไม่เข้า', 'maintenance', 1, '2026-04-21 08:57:32', NULL),
(208, 1, 'ซ่อมเสร็จแล้ว', 'ชาร์จไม่เข้า ซ่อมเสร็จโดย สมชาย เหนือใคร', 'maintenance', 1, '2026-04-21 09:00:42', NULL),
(209, 7, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-21 10:43:46', NULL),
(210, 7, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 1.833 kWh คิดเป็นเงิน 13.75 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-21 10:44:32', NULL),
(211, 7, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-21 10:47:23', NULL),
(212, 7, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 1.125 kWh คิดเป็นเงิน 7.31 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-21 10:48:45', NULL),
(213, 1, 'ซ่อมเสร็จแล้ว', 'ตู้ฝาหลุด ซ่อมเสร็จโดย สมชาย เหนือใคร', 'maintenance', 1, '2026-04-21 12:00:49', NULL),
(214, 12, 'เริ่มชาร์จแล้ว', 'เริ่มการชาร์จเรียบร้อยแล้ว กดหยุดชาร์จเมื่อต้องการสิ้นสุด Session', 'charging', 1, '2026-04-22 14:59:31', NULL),
(215, 1, 'มีแจ้งซ่อมใหม่', 'แจ้งซ่อม #28: ชาร์จไม่เข้า', 'maintenance', 1, '2026-04-22 15:00:03', NULL),
(216, 1, 'ซ่อมเสร็จแล้ว', 'ชาร์จไม่เข้า ซ่อมเสร็จโดย สมชาย เหนือใคร', 'maintenance', 1, '2026-04-22 15:18:42', NULL),
(217, 12, 'ชาร์จเสร็จสิ้น', 'ชาร์จไป 32.361 kWh คิดเป็นเงิน 226.53 บาท ตัดเงินจาก wallet แล้ว', 'charging', 1, '2026-04-22 15:18:58', NULL);

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
(10, 34, 12, 4.69, 'wallet', 'completed', 'DEDUCT1776320775617503', '2026-04-16 06:26:15'),
(11, 35, 12, 0.62, 'wallet', 'completed', 'DEDUCT1776321856465715', '2026-04-16 06:44:16'),
(12, 36, 12, 6.50, 'wallet', 'completed', 'DEDUCT1776330264505676', '2026-04-16 09:04:24'),
(13, 37, 12, 18.75, 'wallet', 'completed', 'DEDUCT1776335013968734', '2026-04-16 10:23:33'),
(14, 49, 12, 2.14, 'wallet', 'completed', 'DEDUCT1776585991682202', '2026-04-19 08:06:31'),
(15, 50, 7, 2.57, 'wallet', 'completed', 'DEDUCT1776670081321384', '2026-04-20 07:28:01'),
(16, 51, 7, 3.28, 'wallet', 'completed', 'DEDUCT1776670171864929', '2026-04-20 07:29:31'),
(17, 52, 7, 13.09, 'wallet', 'completed', 'DEDUCT1776670391519114', '2026-04-20 07:33:11'),
(18, 53, 7, 2.19, 'wallet', 'completed', 'DEDUCT1776754658382949', '2026-04-21 06:57:38'),
(19, 54, 7, 41.87, 'wallet', 'completed', 'DEDUCT1776760163735133', '2026-04-21 08:29:23'),
(20, 55, 7, 106.17, 'wallet', 'completed', 'DEDUCT1776760775141824', '2026-04-21 08:39:35'),
(21, 56, 7, 13.75, 'wallet', 'completed', 'DEDUCT1776768272052731', '2026-04-21 10:44:32'),
(22, 57, 7, 7.31, 'wallet', 'completed', 'DEDUCT177676852566779', '2026-04-21 10:48:45'),
(23, 58, 12, 226.53, 'wallet', 'completed', 'DEDUCT1776871138789940', '2026-04-22 15:18:58');

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
  `title` varchar(255) NOT NULL DEFAULT '',
  `reason` text,
  `image_url` text,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` int UNSIGNED DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `refund_requests`
--

INSERT INTO `refund_requests` (`request_id`, `payment_id`, `user_id`, `title`, `reason`, `image_url`, `status`, `reviewed_by`, `reviewed_at`, `created_at`) VALUES
(6, 14, 12, 'ยกเลิกการจองแต่ยังถูกตัดเงิน', 'test', '[\"/uploads/refunds/refund_12_1776651183424_0.jpeg\"]', 'pending', NULL, NULL, '2026-04-20 02:13:03'),
(9, 15, 7, 'ยกเลิกการจองแต่ยังถูกตัดเงิน', 'test', NULL, 'pending', NULL, NULL, '2026-04-21 06:57:05'),
(10, 16, 7, 'ชาร์จไม่เสร็จ / หยุดกลางคัน', 'test', NULL, 'pending', NULL, NULL, '2026-04-21 06:57:15'),
(11, 18, 7, 'ถูกเก็บเงินผิดจำนวน', '', NULL, 'pending', NULL, NULL, '2026-04-21 08:32:35');

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
(3, 3, 1, 5, 'ตู้ชาร์จใช้งานได้ดีมากครับ จอดรถง่าย ร่มรื่น', '2026-04-14 13:28:30'),
(4, 2, 2, 3, 'ชาร์จเร็วดี', '2026-04-14 13:28:30'),
(5, 4, 3, 4, 'จอดรถง่าย ร่มรื่น ชาร์จเร็วดี', '2026-04-14 13:28:30'),
(6, 5, 4, 5, 'ตู้ชาร์จใช้งานได้ดีมาก ปั๊มก็สะอาด', '2026-04-14 13:28:30'),
(7, 7, 5, 1, 'มาถึงแล้วตู้ใช้งานไม่ได้ครับ เสียเวลามาก', '2026-04-14 13:28:30'),
(8, 8, 6, 2, 'ชาร์จเร็วดี แต่ตู้มีน้อยไปหน่อยรอนาน', '2026-04-14 13:28:30'),
(9, 1, 3, 5, NULL, '2026-04-21 07:21:58'),
(10, 12, 4, 5, 'ดีมากกก ตู้สะอาด จองคิวง่าย', '2026-04-22 15:00:38');

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

--
-- Dumping data for table `scheduled_notifications`
--

INSERT INTO `scheduled_notifications` (`id`, `title`, `message`, `scheduled_at`, `target_type`, `target_value`, `type`, `created_by`, `is_sent`, `created_at`) VALUES
(1, 'ทดสอบ schedule', 'cron job ทำงานแล้ว', '2026-04-15 16:30:00', 'all', NULL, 'system', 1, 1, '2026-04-14 19:25:37');

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
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `scheduled_status` enum('active','inactive') DEFAULT NULL,
  `scheduled_status_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `stations`
--

INSERT INTO `stations` (`station_id`, `name`, `address`, `latitude`, `longitude`, `floor`, `open_time`, `close_time`, `image`, `status`, `scheduled_status`, `scheduled_status_at`, `deleted_at`) VALUES
(1, 'EA Anywhere สยามพารากอน', '991 ถ.พระราม 1 แขวงปทุมวัน กรุงเทพฯ 10330', 13.74630000, 100.53420000, 'B2', '00:00:00', '23:00:00', NULL, 'active', NULL, NULL, NULL),
(2, 'PTT EV Station จตุจักร', '587/10 ถ.กำแพงเพชร 2 แขวงจตุจักร กรุงเทพฯ 10900', 13.79980000, 100.55050000, NULL, '00:00:00', '00:00:00', NULL, 'active', NULL, NULL, NULL),
(3, 'EA Anywhere เซ็นทรัลบางนา', '585 ถ.บางนา-ตราด แขวงบางนา กรุงเทพฯ 10260', 13.66700000, 100.60470000, 'B1', '06:00:00', '22:00:00', NULL, 'active', NULL, NULL, '2026-04-21 08:44:09'),
(4, 'EGAT EV Station ลาดพร้าว', '2112 ถ.ลาดพร้าว แขวงวังทองหลาง กรุงเทพฯ 10310', 13.78530000, 100.60930000, NULL, '00:00:00', '00:00:00', NULL, 'active', NULL, NULL, NULL),
(5, 'MG Super Charge รามคำแหง', '99 ถ.รามคำแหง แขวงสะพานสูง กรุงเทพฯ 10240', 13.76200000, 100.64850000, 'G', '07:00:00', '21:00:00', NULL, 'inactive', NULL, NULL, NULL),
(6, 'PTT EV Station พระราม 2', '888 ถ.พระราม 2 แขวงบางมด กรุงเทพฯ 10150', 13.65670000, 100.47370000, NULL, '00:00:00', '00:00:00', NULL, 'active', NULL, NULL, '2026-04-21 07:49:43'),
(7, 'EA Anywhere ทองหล่อ', '261 ซ.ทองหล่อ 13 แขวงคลองตันเหนือ กรุงเทพฯ 10110', 13.73450000, 100.57820000, 'B1', '06:00:00', '23:00:00', NULL, 'active', NULL, NULL, NULL),
(8, 'Sharge Station อารีย์', '88 ซ.อารีย์ แขวงสามเสนใน กรุงเทพฯ 10400', 13.77950000, 100.54450000, 'G', '08:00:00', '20:00:00', NULL, 'inactive', NULL, NULL, NULL),
(9, 'PTT EV Station ฟิวเจอร์รังสิต', '94 ถ.พหลโยธิน ต.ประชาธิปัตย์ ธัญบุรี ปทุมธานี 12130', 13.98870000, 100.61560000, NULL, '00:00:00', '00:00:00', NULL, 'active', NULL, NULL, NULL),
(10, 'EV Station อ่อนนุช', '900 ถ.อ่อนนุช แขวงสวนหลวง กรุงเทพฯ 10250', 13.72440000, 100.62850000, '1', '06:00:00', '22:00:00', NULL, 'active', NULL, NULL, '2026-04-21 07:58:47'),
(11, 'EV Where station', '99 ถ. เฉลิมเขต 4 แขวงวัดเทพศิรินทร์ เขตป้อมปราบศัตรูพ่าย กรุงเทพมหานคร 10100 ประเทศไทย', 13.74937441, 100.51005841, NULL, '00:00:00', '00:00:00', NULL, 'active', NULL, NULL, NULL);

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

--
-- Dumping data for table `tech_profiles`
--

INSERT INTO `tech_profiles` (`tech_id`, `user_id`, `work_mode`, `primary_skill`, `status`) VALUES
(1, 2, 'FIELD', 'MECHANICAL', 'AVAILABLE'),
(2, 9, 'FIELD', 'SOFTWARE', 'AVAILABLE'),
(4, 11, 'FIELD', 'ELECTRICAL', 'AVAILABLE'),
(5, 13, 'FIELD', 'ELECTRICAL', 'AVAILABLE');

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
  `is_banned` tinyint(1) NOT NULL DEFAULT '0',
  `ban_reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `omise_customer_id` varchar(50) DEFAULT NULL,
  `wallet_frozen` tinyint(1) DEFAULT '0',
  `freeze_reason` text,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `profile_image`, `role`, `wallet_balance`, `is_banned`, `ban_reason`, `created_at`, `updated_at`, `omise_customer_id`, `wallet_frozen`, `freeze_reason`, `deleted_at`) VALUES
(1, 'admin@evcharge.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Admin', 'System', '0800000001', NULL, 'admin', 500.00, 0, NULL, '2026-04-02 23:46:51', '2026-04-10 02:39:02', NULL, 1, NULL, NULL),
(2, 'tech@evcharge.com', '$2a$10$tzxmTBAGoBjl3JyilbjRKuw/cNiGwpGSvdeAuwz9bLekUFOSaO7Yy', 'สมชาย', 'เหนือใคร', '0800000002', NULL, 'technician', 0.00, 0, NULL, '2026-04-02 23:46:51', '2026-04-21 01:14:47', NULL, 0, NULL, NULL),
(3, 'alice@example.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Alice', 'Wongsiri', '0811111111', NULL, 'user', 0.00, 0, NULL, '2026-04-02 23:46:51', '2026-04-20 11:34:37', NULL, 0, NULL, '2026-04-20 11:34:37'),
(4, 'bob@example.com', '$2a$10$beSwIFkMj8RMmNfQdhxF0uTZ28AvB72gwcyiyid/Hhqf.z/RJaNAu', 'Bob', 'Prasert', '0822222222', NULL, 'user', 6125.00, 0, NULL, '2026-04-02 23:46:51', '2026-04-19 09:44:22', NULL, 1, NULL, '2026-04-19 09:44:22'),
(5, 'botclaude@gmail.com', '$2a$10$AGQ4tZ3pk5ma7TJl9yoOZ.nEC2oVgKjcHBcPMHsu8ik2D7JKr7TyO', 'Bot', 'Claude', '0812345678', NULL, 'user', 0.00, 0, NULL, '2026-04-02 23:49:21', '2026-04-18 17:17:18', NULL, 0, NULL, NULL),
(7, 'nemuser@gmail.com', '$2a$10$EaKJ2dIx8l8Mukh0bsydG.rtgGxlAVoyddc6AGJg5IPi3Ghphkm3S', 'เนม', 'เนม', '0615612345', NULL, 'user', 1046.02, 0, NULL, '2026-04-03 14:22:49', '2026-04-21 11:51:55', 'cust_test_67fdle9af6i7uh2ymtw', 0, NULL, NULL),
(8, 'Emma123@gmail.com', '$2a$10$6mwZpIr0kvr3LxWY/EBZ0e2xLSUQQfQds0ZIo4iygjP5VZfBTT3pK', 'Emma', 'Woods', '0631962204', NULL, 'user', 0.00, 0, NULL, '2026-04-08 17:37:50', '2026-04-15 17:53:53', NULL, 0, NULL, NULL),
(9, 'tech1@evcharge.com', '$2a$10$2elQTP2byuBNBsleskW7aupyKFICc/cCCGKYsny412dQY2yUhYxdW', 'สมทบ', 'มิตรดี', '', NULL, 'technician', 0.00, 0, NULL, '2026-04-14 20:01:36', '2026-04-14 20:44:36', NULL, 0, NULL, NULL),
(11, 'tech2@evcharge.com', '$2a$10$VWpSB4NoFSch13b2smjY4.3CyPfOFZ0MLA49QrfNEs9SIJujGMuKG', 'เทพบุตร', 'นามสมมติ', NULL, NULL, 'technician', 0.00, 0, NULL, '2026-04-15 06:16:50', '2026-04-15 06:16:50', NULL, 0, NULL, NULL),
(12, 'dodchalalla99@gmail.com', '$2a$10$xPxPtcz2IRMtCslgiegAR.QJ48.lH2cqxvYmhwMH4bM/8/qhkc.je', 'ลัลลา', 'โดดแช', '0812345678', NULL, 'user', 8140.77, 0, NULL, '2026-04-15 12:57:23', '2026-04-22 15:18:58', 'cust_test_67dc8gpdmv30e2ekcu0', 0, NULL, NULL),
(13, 'tech3@evcharge.com', '$2a$10$QHfVL8YO7wc6rXsJ1RG5peWEJf8m8f4PWkfwczSCVxHNEfKWjgu3G', 'มานะ', 'มาไม', '0999914556', NULL, 'technician', 0.00, 0, NULL, '2026-04-20 11:14:55', '2026-04-20 11:14:55', NULL, 0, NULL, NULL),
(14, 'user123@gmail.com', '$2a$10$ED.QpXCyC.PTgRaVQok2D.HTj2zyH9jMU9XJ0FuEZN4bPWTi5Uruu', 'ลีนา', 'โดดแช', '1234567890', NULL, 'user', 0.00, 0, NULL, '2026-04-21 08:18:09', '2026-04-21 08:18:09', NULL, 0, NULL, NULL);

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
(2, 5, 'Toyota', 'bZ4X', 'กก 1234', 'CCS', 71.00, 10.00),
(3, 7, 'BYD', 'Cipo', 'รวย 9331', 'CCS', 65.00, 0.38),
(4, 12, 'Tesla', 'Model 3 (Long Range)', 'รร 9999 เชียงใหม่', 'Type2', 75.00, 37.50),
(5, 12, 'NETA', 'V', 'ฮฮ 555 กรุงเทพ', 'CCS', 38.50, 3.85),
(6, 12, 'GWM', 'ORA Good Cat (Ultra)', 'กข 4321 กรุงเทพมหานคร', 'CCS', 75.00, 15.00),
(7, 1, 'BYD', 'Atto 3', 'อห  1222', 'CCS', 80.00, 16.00);

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
-- Dumping data for table `wallet_transactions`
--

INSERT INTO `wallet_transactions` (`txn_id`, `user_id`, `amount`, `type`, `ref`, `created_at`, `reason`, `adjusted_by`) VALUES
(1011, 5, 300.00, 'topup', 'REF003', '2026-04-14 21:00:00', 'เติมเงินเข้ากระเป๋าสตางค์โดยผู้ใช้', NULL),
(1012, 5, 120.00, 'deduct', 'PAY-003', '2026-04-14 21:05:30', 'ชำระเงินค่าบริการชาร์จรถไฟฟ้า', NULL),
(1013, 8, 50.00, 'adjust', 'ADJUST-003', '2026-04-14 21:10:00', 'เพิ่มโบนัสโปรโมชั่นพิเศษ (Admin)', 2),
(1014, 7, 80.00, 'refund', 'REF-REFUND-002', '2026-04-14 21:12:15', 'คืนเงินเนื่องจากตู้ชาร์จขัดข้อง', NULL),
(1015, 3, -20.00, 'adjust', 'ADJUST-004', '2026-04-14 21:15:00', 'หักเงินเพื่อปรับปรุงยอดที่ผิดพลาด', 1),
(1016, 4, 150.00, 'deduct', 'PAY-004', '2026-04-14 21:20:45', 'ชำระเงินค่าบริการชาร์จรถไฟฟ้า', NULL),
(1017, 4, 50.00, 'refund', 'REF-REFUND-003', '2026-04-14 21:25:00', 'คืนเงินส่วนต่างหลังจากชาร์จเสร็จสิ้น', NULL),
(1018, 12, 500.00, 'topup', 'TOPUP1776309576284653', '2026-04-16 03:19:36', NULL, NULL),
(1019, 12, 1000.00, 'topup', 'TOPUP1776309622501842', '2026-04-16 03:20:23', NULL, NULL),
(1020, 12, 4.69, 'deduct', 'session_34', '2026-04-16 06:26:15', NULL, NULL),
(1021, 12, 0.62, 'deduct', 'session_35', '2026-04-16 06:44:16', NULL, NULL),
(1022, 12, 6.50, 'deduct', 'session_36', '2026-04-16 09:04:24', NULL, NULL),
(1023, 12, 18.75, 'deduct', 'session_37', '2026-04-16 10:23:33', NULL, NULL),
(1024, 7, 150.50, 'adjust', 'ADJUST177635751584842', '2026-04-16 16:38:35', 'ลูกค้าจ่ายเงินซ้ำ', 1),
(1025, 12, 900.00, 'topup', 'TOPUP1776403713553911', '2026-04-17 05:28:34', NULL, NULL),
(1026, 7, 185.75, 'refund', 'refund_request_2', '2026-04-18 09:13:39', NULL, NULL),
(1027, 12, 200.00, 'topup', 'TOPUP177658575773665', '2026-04-19 08:02:39', NULL, NULL),
(1028, 12, 100.00, 'topup', 'TOPUP177658576736546', '2026-04-19 08:02:48', NULL, NULL),
(1029, 12, 2.14, 'deduct', 'session_49', '2026-04-19 08:06:31', NULL, NULL),
(1030, 12, 50.00, 'refund', 'refund_request_5', '2026-04-19 22:27:55', NULL, NULL),
(1031, 12, 600.00, 'topup', 'TOPUP1776637813510145', '2026-04-19 22:30:14', NULL, NULL),
(1032, 7, 2.57, 'deduct', 'session_50', '2026-04-20 07:28:01', NULL, NULL),
(1033, 7, 3.28, 'deduct', 'session_51', '2026-04-20 07:29:31', NULL, NULL),
(1034, 7, 13.09, 'deduct', 'session_52', '2026-04-20 07:33:11', NULL, NULL),
(1035, 7, 2.19, 'deduct', 'session_53', '2026-04-21 06:57:38', NULL, NULL),
(1036, 7, 300.00, 'topup', 'TOPUP1776759673101929', '2026-04-21 08:21:13', NULL, NULL),
(1037, 7, 100.00, 'topup', 'TOPUP1776759756533287', '2026-04-21 08:22:38', NULL, NULL),
(1038, 7, 41.87, 'deduct', 'session_54', '2026-04-21 08:29:23', NULL, NULL),
(1039, 7, 106.17, 'deduct', 'session_55', '2026-04-21 08:39:35', NULL, NULL),
(1040, 7, 13.75, 'deduct', 'session_56', '2026-04-21 10:44:32', NULL, NULL),
(1041, 7, 7.31, 'deduct', 'session_57', '2026-04-21 10:48:45', NULL, NULL),
(1042, 7, 500.00, 'topup', 'TOPUP1776772314623355', '2026-04-21 11:51:56', NULL, NULL),
(1043, 12, 5000.00, 'topup', 'TOPUP1776869288179616', '2026-04-22 14:48:09', NULL, NULL),
(1044, 12, 50.00, 'topup', 'TOPUP177686983327988', '2026-04-22 14:57:14', NULL, NULL),
(1045, 12, 226.53, 'deduct', 'session_58', '2026-04-22 15:18:58', NULL, NULL);

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
  ADD KEY `fk_notifications_user` (`user_id`),
  ADD KEY `FK_notification_from_user_id` (`from_user_id`);

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
-- Indexes for table `refund_requests`
--
ALTER TABLE `refund_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `fk_rr_payment` (`payment_id`),
  ADD KEY `fk_rr_user` (`user_id`),
  ADD KEY `fk_rr_admin` (`reviewed_by`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `fk_reviews_user` (`user_id`),
  ADD KEY `fk_reviews_station` (`station_id`);

--
-- Indexes for table `scheduled_notifications`
--
ALTER TABLE `scheduled_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sched_user` (`created_by`);

--
-- Indexes for table `stations`
--
ALTER TABLE `stations`
  ADD PRIMARY KEY (`station_id`);

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
-- AUTO_INCREMENT for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  MODIFY `admin_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `booking_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `chargers`
--
ALTER TABLE `chargers`
  MODIFY `charger_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `charging_sessions`
--
ALTER TABLE `charging_sessions`
  MODIFY `session_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT for table `maintenance_tickets`
--
ALTER TABLE `maintenance_tickets`
  MODIFY `ticket_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `message_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=218;

--
-- AUTO_INCREMENT for table `notification_logs`
--
ALTER TABLE `notification_logs`
  MODIFY `log_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `payment_refunds`
--
ALTER TABLE `payment_refunds`
  MODIFY `refund_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `refund_requests`
--
ALTER TABLE `refund_requests`
  MODIFY `request_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `review_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `scheduled_notifications`
--
ALTER TABLE `scheduled_notifications`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `stations`
--
ALTER TABLE `stations`
  MODIFY `station_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tech_profiles`
--
ALTER TABLE `tech_profiles`
  MODIFY `tech_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `vehicle_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  MODIFY `txn_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1046;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  ADD CONSTRAINT `admin_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

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
  ADD CONSTRAINT `FK_notification_from_user_id` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
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
-- Constraints for table `refund_requests`
--
ALTER TABLE `refund_requests`
  ADD CONSTRAINT `fk_rr_admin` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_rr_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `scheduled_notifications`
--
ALTER TABLE `scheduled_notifications`
  ADD CONSTRAINT `fk_sched_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `tech_profiles`
--
ALTER TABLE `tech_profiles`
  ADD CONSTRAINT `tech_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

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
