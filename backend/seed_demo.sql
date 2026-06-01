-- Stations (3 สถานี กรุงเทพ)
INSERT INTO stations (name, address, latitude, longitude, open_time, close_time, station_type) VALUES
('EV Hub สยามพารากอน', 'ถ.พระราม 1 แขวงปทุมวัน กรุงเทพ', 13.74638400, 100.53468700, '08:00:00', '22:00:00', 'public'),
('EV Hub เซ็นทรัลลาดพร้าว', 'ถ.พหลโยธิน แขวงจตุจักร กรุงเทพ', 13.81940000, 100.56230000, '09:00:00', '21:00:00', 'public'),
('EV Hub ฟิวเจอร์พาร์ค', 'ถ.พหลโยธิน ต.ประชาธิปัตย์ ปทุมธานี', 13.91880000, 100.57350000, '09:00:00', '21:00:00', 'commercial');

-- Chargers (สถานีละ 2-3 ตัว)
INSERT INTO chargers (station_id, charger_name, connector_type, power_kw, price_per_kwh, idle_fee_enabled) VALUES
(1, 'Charger A1', 'CCS', 50.00, 6.50, 1),
(1, 'Charger A2', 'Type2', 22.00, 5.00, 0),
(1, 'Charger A3', 'CHAdeMO', 50.00, 6.50, 1),
(2, 'Charger B1', 'CCS', 150.00, 8.00, 1),
(2, 'Charger B2', 'Type2', 22.00, 5.00, 0),
(3, 'Charger C1', 'CCS', 150.00, 8.00, 1),
(3, 'Charger C2', 'CCS', 150.00, 8.00, 1);
