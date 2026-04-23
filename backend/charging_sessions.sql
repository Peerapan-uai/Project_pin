-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Apr 20, 2026 at 06:30 AM
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
(18, 7, 6, 1, '2026-04-01 08:00:00', '2026-04-01 09:30:00', 25.50, 85.00, 'completed'),
(19, 8, 6, 1, '2026-04-02 10:00:00', '2026-04-02 11:15:00', 20.00, 80.00, 'completed'),
(20, 9, 7, 2, '2026-04-03 14:00:00', '2026-04-03 15:45:00', 30.75, 90.00, 'completed'),
(21, 15, 12, 29, '2026-04-15 13:02:20', '2026-04-16 04:35:04', NULL, NULL, 'completed'),
(22, 16, 12, 1, '2026-04-15 13:03:56', '2026-04-16 04:35:04', NULL, NULL, 'completed'),
(23, 18, 12, 15, '2026-04-15 13:36:29', '2026-04-16 04:35:04', NULL, NULL, 'completed'),
(24, 17, 12, 19, '2026-04-15 13:36:31', '2026-04-16 04:35:04', NULL, NULL, 'completed'),
(25, 19, 12, 11, '2026-04-15 16:07:10', '2026-04-16 04:35:04', NULL, NULL, 'completed'),
(26, 21, 12, 2, '2026-04-16 03:04:07', '2026-04-16 04:35:04', NULL, NULL, 'completed'),
(27, 22, 12, 3, '2026-04-16 03:08:29', '2026-04-16 04:35:04', NULL, NULL, 'completed'),
(28, 23, 12, 4, '2026-04-16 03:20:38', '2026-04-16 04:35:04', NULL, NULL, 'completed'),
(29, 24, 12, 1, '2026-04-16 04:37:31', '2026-04-16 04:42:22', NULL, NULL, 'completed'),
(34, 26, 12, 1, '2026-04-16 06:25:59', '2026-04-16 06:26:15', 0.63, NULL, 'completed'),
(35, 27, 12, 1, '2026-04-16 06:44:13', '2026-04-16 06:44:16', 0.08, NULL, 'completed'),
(36, 28, 12, 3, '2026-04-16 09:04:22', '2026-04-16 09:04:24', 1.00, NULL, 'completed'),
(37, 29, 12, 1, '2026-04-16 10:22:32', '2026-04-16 10:23:33', 2.50, NULL, 'completed'),
(38, 30, 12, 1, '2026-04-16 18:31:57', NULL, NULL, NULL, 'charging'),
(39, 31, 12, 2, '2026-04-17 05:27:36', NULL, NULL, NULL, 'charging'),
(40, 32, 12, 12, '2026-04-17 05:27:59', NULL, NULL, NULL, 'charging'),
(41, 33, 12, 15, '2026-04-17 05:31:22', NULL, NULL, NULL, 'charging'),
(42, 34, 12, 25, '2026-04-17 05:36:38', NULL, NULL, NULL, 'charging'),
(43, 35, 12, 26, '2026-04-17 05:37:21', NULL, NULL, NULL, 'charging'),
(44, 36, 12, 4, '2026-04-17 05:41:18', NULL, NULL, NULL, 'charging'),
(45, 37, 12, 9, '2026-04-17 05:41:58', NULL, NULL, NULL, 'charging'),
(46, 39, 7, 11, '2026-04-18 09:42:50', NULL, NULL, NULL, 'charging'),
(47, 40, 12, 6, '2026-04-18 09:43:50', NULL, NULL, NULL, 'charging'),
(48, 43, 12, 3, '2026-04-19 08:02:10', NULL, NULL, NULL, 'charging'),
(49, 44, 12, 5, '2026-04-19 08:06:19', '2026-04-19 08:06:31', 0.31, NULL, 'completed');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `charging_sessions`
--
ALTER TABLE `charging_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `fk_sessions_booking` (`booking_id`),
  ADD KEY `fk_sessions_user` (`user_id`),
  ADD KEY `fk_sessions_charger` (`charger_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `charging_sessions`
--
ALTER TABLE `charging_sessions`
  MODIFY `session_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `charging_sessions`
--
ALTER TABLE `charging_sessions`
  ADD CONSTRAINT `fk_sessions_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sessions_charger` FOREIGN KEY (`charger_id`) REFERENCES `chargers` (`charger_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
