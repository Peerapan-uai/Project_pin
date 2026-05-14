import { describe, test, expect } from 'vitest';
const { getPeriodForHour } = require('./getTariff');

describe('getPeriodForHour', () => {
  test('22:00 = off_peak', () => {
    expect(getPeriodForHour(22)).toBe('off_peak');
  });

  test('23:00 = off_peak', () => {
    expect(getPeriodForHour(23)).toBe('off_peak');
  });

  test('8:00 = off_peak', () => {
    expect(getPeriodForHour(8)).toBe('off_peak');
  });

  test('9:00 = on_peak', () => {
    expect(getPeriodForHour(9)).toBe('on_peak');
  });

  test('14:00 = on_peak', () => {
    expect(getPeriodForHour(14)).toBe('on_peak');
  });

});
