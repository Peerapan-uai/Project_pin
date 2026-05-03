// EV vehicles available in Thailand (2024-2025 market).
// connector values must match DB enum: 'CCS' | 'CHAdeMO' | 'Type2' | 'Type1'.
// 'CCS' here means CCS2 (the de-facto DC standard in TH).

export const EV_VEHICLES = {
  BYD: {
    'Atto 3': { capacity: 60.48, connector: 'CCS' },
    'Dolphin': { capacity: 44.9, connector: 'CCS' },
    'Dolphin Extended': { capacity: 60.48, connector: 'CCS' },
    'Seal Dynamic': { capacity: 61.4, connector: 'CCS' },
    'Seal Premium': { capacity: 82.5, connector: 'CCS' },
    'Seal Performance': { capacity: 82.5, connector: 'CCS' },
    'Seal U': { capacity: 71.8, connector: 'CCS' },
    'Seal U Design': { capacity: 87, connector: 'CCS' },
    'Sealion 6': { capacity: 18.3, connector: 'CCS' },
    'Sealion 7': { capacity: 82.5, connector: 'CCS' },
    'M6': { capacity: 71.8, connector: 'CCS' },
  },
  MG: {
    'MG4 Electric': { capacity: 51, connector: 'CCS' },
    'MG4 Long Range': { capacity: 64, connector: 'CCS' },
    'MG ZS EV': { capacity: 50.3, connector: 'CCS' },
    'New MG ZS EV': { capacity: 51, connector: 'CCS' },
    'MG ES': { capacity: 51, connector: 'CCS' },
    'MG EP': { capacity: 50.3, connector: 'CCS' },
    'MG Cyberster': { capacity: 77, connector: 'CCS' },
    'MG Maxus 9': { capacity: 90, connector: 'CCS' },
  },
  Tesla: {
    'Model 3 RWD': { capacity: 60, connector: 'CCS' },
    'Model 3 Long Range': { capacity: 79, connector: 'CCS' },
    'Model 3 Performance': { capacity: 82, connector: 'CCS' },
    'Model Y RWD': { capacity: 60, connector: 'CCS' },
    'Model Y Long Range': { capacity: 78.1, connector: 'CCS' },
    'Model Y Performance': { capacity: 82, connector: 'CCS' },
    'Model S': { capacity: 100, connector: 'CCS' },
    'Model X': { capacity: 100, connector: 'CCS' },
  },
  Neta: {
    'Neta V': { capacity: 38.54, connector: 'CCS' },
    'Neta V-II': { capacity: 36.45, connector: 'CCS' },
    'Neta X 401': { capacity: 50, connector: 'CCS' },
    'Neta X 501': { capacity: 60, connector: 'CCS' },
    'Neta GT': { capacity: 58.66, connector: 'CCS' },
  },
  'GWM (Ora)': {
    'Ora Good Cat 400': { capacity: 47.8, connector: 'CCS' },
    'Ora Good Cat 500': { capacity: 63.1, connector: 'CCS' },
    'Ora Good Cat GT': { capacity: 63.1, connector: 'CCS' },
    'Ora 07': { capacity: 83.5, connector: 'CCS' },
  },
  Volvo: {
    'XC40 Recharge': { capacity: 78, connector: 'CCS' },
    'C40 Recharge': { capacity: 78, connector: 'CCS' },
    'EX30': { capacity: 51, connector: 'CCS' },
    'EX30 Extended': { capacity: 69, connector: 'CCS' },
    'EX90': { capacity: 111, connector: 'CCS' },
  },
  'Mercedes-Benz': {
    'EQA': { capacity: 70.5, connector: 'CCS' },
    'EQB': { capacity: 70.5, connector: 'CCS' },
    'EQE': { capacity: 90.6, connector: 'CCS' },
    'EQS': { capacity: 107.8, connector: 'CCS' },
  },
  BMW: {
    'iX1': { capacity: 64.7, connector: 'CCS' },
    'iX3': { capacity: 80, connector: 'CCS' },
    'i4 eDrive40': { capacity: 83.9, connector: 'CCS' },
    'i5 eDrive40': { capacity: 84, connector: 'CCS' },
    'i7': { capacity: 105.7, connector: 'CCS' },
    'iX xDrive40': { capacity: 76.6, connector: 'CCS' },
    'iX xDrive50': { capacity: 111.5, connector: 'CCS' },
  },
  Porsche: {
    'Taycan': { capacity: 79.2, connector: 'CCS' },
    'Taycan Performance Battery Plus': { capacity: 93.4, connector: 'CCS' },
  },
  Audi: {
    'e-tron 50': { capacity: 71, connector: 'CCS' },
    'e-tron 55': { capacity: 95, connector: 'CCS' },
    'Q4 e-tron': { capacity: 77, connector: 'CCS' },
    'e-tron GT': { capacity: 93.4, connector: 'CCS' },
  },
  Hyundai: {
    'Ioniq 5 Standard': { capacity: 58, connector: 'CCS' },
    'Ioniq 5 Long Range': { capacity: 77.4, connector: 'CCS' },
    'Ioniq 6 Standard': { capacity: 53, connector: 'CCS' },
    'Ioniq 6 Long Range': { capacity: 77.4, connector: 'CCS' },
    'Kona Electric Standard': { capacity: 39.2, connector: 'CCS' },
    'Kona Electric Long Range': { capacity: 64, connector: 'CCS' },
  },
  Nissan: {
    'Leaf': { capacity: 40, connector: 'CHAdeMO' },
    'Leaf e+': { capacity: 62, connector: 'CHAdeMO' },
    'Ariya 63': { capacity: 63, connector: 'CCS' },
    'Ariya 87': { capacity: 87, connector: 'CCS' },
  },
  Toyota: {
    'bZ4X': { capacity: 71.4, connector: 'CCS' },
  },
  Lexus: {
    'RZ 450e': { capacity: 71.4, connector: 'CCS' },
    'UX 300e': { capacity: 72.8, connector: 'CCS' },
  },
  Mini: {
    'Cooper SE (old)': { capacity: 32.6, connector: 'CCS' },
    'Cooper E': { capacity: 36.6, connector: 'CCS' },
    'Cooper SE': { capacity: 49.2, connector: 'CCS' },
    'Countryman SE': { capacity: 64.6, connector: 'CCS' },
  },
  Honda: {
    'e:N1': { capacity: 68.8, connector: 'CCS' },
  },
  Wuling: {
    'Air EV': { capacity: 26.7, connector: 'Type2' },
    'BingoEV': { capacity: 31.9, connector: 'CCS' },
    'BingoEV Long Range': { capacity: 41.86, connector: 'CCS' },
  },
  AION: {
    'Y Plus': { capacity: 63.2, connector: 'CCS' },
    'ES': { capacity: 49.8, connector: 'CCS' },
    'Hyptec HT': { capacity: 73.05, connector: 'CCS' },
  },
  Deepal: {
    'S07': { capacity: 66.8, connector: 'CCS' },
    'S07 Long Range': { capacity: 79.97, connector: 'CCS' },
    'L07': { capacity: 66.8, connector: 'CCS' },
  },
  XPeng: {
    'G6 Standard': { capacity: 66, connector: 'CCS' },
    'G6 Long Range': { capacity: 87.5, connector: 'CCS' },
    'G9': { capacity: 93, connector: 'CCS' },
    'X9': { capacity: 101.5, connector: 'CCS' },
  },
  ZEEKR: {
    '001': { capacity: 100, connector: 'CCS' },
    'X': { capacity: 69, connector: 'CCS' },
    '009': { capacity: 116, connector: 'CCS' },
  },
  Smart: {
    '#1': { capacity: 66, connector: 'CCS' },
    '#3': { capacity: 66, connector: 'CCS' },
  },
  Chery: {
    'Omoda E5': { capacity: 61, connector: 'CCS' },
  },
  Geely: {
    'EX5': { capacity: 60.22, connector: 'CCS' },
  },
  Maxus: {
    'Mifa 9': { capacity: 90, connector: 'CCS' },
  },
}

export const EV_BRANDS = Object.keys(EV_VEHICLES).sort()

export const CONNECTOR_TYPES = ['CCS', 'CHAdeMO', 'Type2', 'Type1']

export function getModelsForBrand(brand) {
  if (!brand || !EV_VEHICLES[brand]) return []
  return Object.keys(EV_VEHICLES[brand])
}

export function getModelSpec(brand, model) {
  return EV_VEHICLES[brand]?.[model] || null
}