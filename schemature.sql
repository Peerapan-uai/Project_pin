-- =============================================================
-- ALTER / CREATE ที่รันเพิ่มหลัง schema.sql หลัก
-- (รันใน phpMyAdmin ทีละ statement)
-- =============================================================

-- refund_requests — สร้าง 2026-04-15 (nem เขียน code ใช้ lalla รัน)
CREATE TABLE IF NOT EXISTS refund_requests (
  request_id   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  payment_id   INT UNSIGNED    NOT NULL,
  user_id      INT UNSIGNED    NOT NULL,
  reason       TEXT            NOT NULL,
  image_url    TEXT            DEFAULT NULL,
  status       ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by  INT UNSIGNED    DEFAULT NULL,
  reviewed_at  TIMESTAMP       DEFAULT NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (request_id),
  CONSTRAINT fk_rr_payment FOREIGN KEY (payment_id)  REFERENCES payments (payment_id) ON DELETE CASCADE,
  CONSTRAINT fk_rr_user    FOREIGN KEY (user_id)     REFERENCES users    (user_id)    ON DELETE CASCADE,
  CONSTRAINT fk_rr_admin   FOREIGN KEY (reviewed_by) REFERENCES users    (user_id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- stations scheduling — เพิ่ม 2026-04-15 (ตั้งเวลาเปิด/ปิดสถานีล่วงหน้า)
ALTER TABLE stations
  ADD COLUMN scheduled_status     ENUM('active','inactive') DEFAULT NULL,
  ADD COLUMN scheduled_status_at  DATETIME                  DEFAULT NULL;

-- =============================================================
-- Sample Data — เพิ่มข้อมูลตัวอย่าง
-- =============================================================

-- Reviews
INSERT INTO `reviews` (`user_id`, `station_id`, `rating`, `comment`) VALUES
(3, 1, 5, 'ตู้ชาร์จใช้งานได้ดีมากครับ จอดรถง่าย ร่มรื่น'),
(2, 2, 3, 'ชาร์จเร็วดี'),
(4, 3, 4, 'จอดรถง่าย ร่มรื่น ชาร์จเร็วดี'),
(5, 4, 5, 'ตู้ชาร์จใช้งานได้ดีมาก ปั๊มก็สะอาด'),
(7, 5, 1, 'มาถึงแล้วตู้ใช้งานไม่ได้ครับ เสียเวลามาก'),
(8, 6, 2, 'ชาร์จเร็วดี แต่ตู้มีน้อยไปหน่อยรอนาน');