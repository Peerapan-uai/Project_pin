export const mockChargers = [
  { charger_id: 1, station_id: 1, charger_name: "ตู้ A1", connector_type: "CCS", power_kw: 50.00, price_per_kwh: 6.50, status: "available", queue_count: 0, current_percentage: null },
  { charger_id: 2, station_id: 1, charger_name: "ตู้ A2", connector_type: "CCS", power_kw: 150.00, price_per_kwh: 7.50, status: "charging", queue_count: 0, current_percentage: 65 },
  { charger_id: 3, station_id: 1, charger_name: "ตู้ B1", connector_type: "CHAdeMO", power_kw: 50.00, price_per_kwh: 6.50, status: "out_of_service", queue_count: 0, current_percentage: null },
  { charger_id: 4, station_id: 2, charger_name: "ตู้ C1", connector_type: "CCS", power_kw: 50.00, price_per_kwh: 6.00, status: "available", queue_count: 0, current_percentage: null },
  { charger_id: 5, station_id: 2, charger_name: "ตู้ C2", connector_type: "Type2", power_kw: 22.00, price_per_kwh: 5.00, status: "reserved", queue_count: 2, current_percentage: null },
  { charger_id: 6, station_id: 3, charger_name: "ตู้ D1", connector_type: "CCS", power_kw: 100.00, price_per_kwh: 7.00, status: "available", queue_count: 0, current_percentage: null },
  { charger_id: 7, station_id: 3, charger_name: "ตู้ D2", connector_type: "CCS", power_kw: 100.00, price_per_kwh: 7.00, status: "available", queue_count: 0, current_percentage: null },
  { charger_id: 8, station_id: 3, charger_name: "ตู้ D3", connector_type: "CHAdeMO", power_kw: 50.00, price_per_kwh: 6.00, status: "charging", queue_count: 1, current_percentage: 42 },
  { charger_id: 9, station_id: 3, charger_name: "ตู้ D4", connector_type: "Type2", power_kw: 22.00, price_per_kwh: 5.00, status: "out_of_service", queue_count: 0, current_percentage: null }
]
