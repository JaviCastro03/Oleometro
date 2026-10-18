import { describe, expect, it } from 'vitest';
import {
  buildModel,
  buildTimeAxis,
  buildViewModel,
  compareRows,
  describeBacktest,
  forecastChartRows,
  forecastLabel,
  formatHash,
  getSeries,
  parseHash,
  productionRows,
  resolveSelection,
  seasonalHeatmap,
  sliceRange,
  toMonthly,
} from './dashboardModel.js';
import { eur, pct } from './format.js';

const weeks = (start, prices) =>
  prices.map((price, i) => {
    const date = new Date(Date.parse(start) + i * 7 * 86_400_000).toISOString().slice(0, 10);
    return [date, price];
  });

const insight = { latest_price: 0, level: 0.5 };
const payload = {
  meta: { is_demo: true, source: 'sample', generated_at: '2025-01-01T00:00:00+00:00', first_date: '2024-01-07', last_date: '2024-03-03' },
  countries: [{ id: 'ES', label: 'España' }, { id: 'IT', label: 'Italia' }],
  products: [{ id: 'evoo', label: 'Virgen extra' }, { id: 'virgin', label: 'Virgen' }],
  series: [
    { country: 'ES', product: 'evoo', insight, points: weeks('2024-01-07', [100, 120, 110, 90, 95, 130, 125, 140, 135]) },
    { country: 'IT', product: 'evoo', insight, points: weeks('2024-01-07', [150, 160, 155, 140, 150, 170, 165, 180, 175]) },
  ],
  production: [
    { country: 'ES', marketing_year: '2023/24', production_kt: 855, ending_stock_kt: 190, estimated: false },
    { country: 'IT', marketing_year: '2023/24', production_kt: 224, ending_stock_kt: 120, estimated: false },
    { country: 'ES', marketing_year: '2024/25', production_kt: 1370, ending_stock_kt: 260, estimated: true },
  ],
};
const model = buildModel(payload);

describe('model', () => {
  it('indexes series by country and product', () => {
    expect(model.index.get('ES|evoo').points[0]).toMatchObject({ date: '2024-01-07', price: 100 });
  });

  it('slices the trailing window of a range', () => {
    const points = model.index.get('ES|evoo').points;
    expect(sliceRange(points, 'all')).toHaveLength(9);
    expect(sliceRange(points, '1y')).toHaveLength(9);
    const long = buildModel({ ...payload, series: [{ country: 'ES', product: 'evoo', insight, points: weeks('2020-01-05', Array(300).fill(1)) }] });
    const cut = sliceRange(long.index.get('ES|evoo').points, '1y');
    expect(cut.length).toBeGreaterThan(50);
    expect(cut.length).toBeLessThan(55);
  });

  it('averages weeks into calendar months', () => {
    const monthly = toMonthly(model.index.get('ES|evoo').points);
    expect(monthly.map((m) => [m.year, m.month])).toEqual([[2024, 0], [2024, 1], [2024, 2]]);
    expect(monthly[0].price).toBeCloseTo((100 + 120 + 110 + 90) / 4);
  });

  it('builds a heatmap with normalised intensity', () => {
    const { rows, min, max } = seasonalHeatmap(model.index.get('ES|evoo').points);
    expect(rows).toHaveLength(1);
    expect(rows[0].cells.filter((c) => c.value !== null)).toHaveLength(3);
    expect(min).toBeLessThan(max);
    const intensities = rows[0].cells.filter((c) => c.value !== null).map((c) => c.intensity);
    expect(Math.min(...intensities)).toBe(0);
    expect(Math.max(...intensities)).toBe(1);
  });

  it('merges countries by week for comparison', () => {
    const { countries, rows } = compareRows(model, 'evoo', 'all');
    expect(countries).toEqual(['ES', 'IT']);
    expect(rows).toHaveLength(9);
    expect(rows[0]).toMatchObject({ ES: 100, IT: 150 });
  });

  it('pivots production by marketing year and flags estimates', () => {
    const { countries, rows } = productionRows(model);
    expect(countries).toEqual(['ES', 'IT']);
    expect(rows.map((r) => r.year)).toEqual(['2023/24', '2024/25']);
    expect(rows[0].total).toBe(855 + 224);
    expect(rows[1].estimated).toBe(true);
  });

  it('chooses yearly ticks for long spans and monthly for short ones', () => {
    const long = Array.from({ length: 6 }, (_, i) => ({ t: Date.UTC(2018 + i, 5, 1) }));
    expect(buildTimeAxis(long).ticks.map((t) => new Date(t).getUTCFullYear())).toEqual([2019, 2020, 2021, 2022, 2023]);
    const short = buildTimeAxis(model.index.get('ES|evoo').points);
    expect(short.ticks.length).toBeGreaterThan(0);
    expect(short.format(short.ticks[0])).toMatch(/^[a-z]{3}/);
  });
});

describe('selection', () => {
  it('falls back to valid defaults', () => {
    expect(resolveSelection(model, { country: 'ZZ', product: 'nope', range: 'x' })).toEqual({ country: 'ES', product: 'evoo', range: 'all' });
    expect(resolveSelection(model, { country: 'IT', product: 'evoo', range: '3y' })).toEqual({ country: 'IT', product: 'evoo', range: '3y' });
  });

  it('round-trips through the URL hash', () => {
    const selection = { country: 'IT', product: 'virgin', range: '5y' };
    expect(parseHash(formatHash(selection))).toEqual(selection);
    expect(parseHash('')).toEqual({ country: '', product: undefined, range: undefined });
  });

  it('builds the full view model', () => {
    const vm = buildViewModel(model, { country: 'ES', product: 'evoo', range: 'all' });
    expect(vm.peak).toMatchObject({ price: 140 });
    expect(vm.countryLabel).toBe('España');
    expect(vm.productLabel).toBe('Virgen extra');
  });
});

describe('format', () => {
  it('formats euros and signed percentages in Spanish', () => {
    expect(eur(8966.4)).toBe('8.966 €');
    expect(pct(-12.34)).toBe('−12,3 %');
    expect(pct(4.5)).toBe('+4,5 %');
    expect(pct(null)).toBe('—');
  });
});

describe('forecast', () => {
  const rawForecast = {
    horizons: [{ key: 'month', weeks: 4, target_date: '2024-04-14', price: 150, low: 130, high: 170, change_pct: 7, direction: 'up', strength: 'clear', backtest: null }],
    path: [
      ['2024-03-10', 142, 138, 146],
      ['2024-03-17', 145, 139, 151],
    ],
  };
  const withForecast = buildModel({ ...payload, series: [{ ...payload.series[0], forecast: rawForecast }, payload.series[1]] });

  it('keeps working when a series has no forecast', () => {
    expect(getSeries(model, 'ES', 'evoo').forecast).toBeNull();
    expect(forecastChartRows(getSeries(model, 'ES', 'evoo'))).toEqual([]);
  });

  it('joins history and forecast into one chart without a gap', () => {
    const rows = forecastChartRows(getSeries(withForecast, 'ES', 'evoo'), 2, 4);
    expect(rows).toHaveLength(3 + 1 + 2);
    const bridge = rows[3];
    expect(bridge.price).toBe(135);
    expect(bridge.forecast).toBe(135);
    expect(rows[4]).toMatchObject({ forecast: 142, band: [138, 146] });
    expect(rows[4].price).toBeUndefined();
  });

  it('words the direction by how sure the model is', () => {
    expect(forecastLabel({ direction: 'up', strength: 'clear' })).toBe('Subida probable');
    expect(forecastLabel({ direction: 'down', strength: 'weak' })).toBe('Posible bajada');
    expect(forecastLabel({ direction: 'flat', strength: 'weak' })).toBe('Estable');
  });

  it('explains the backtest and warns when it does not beat "nothing changes"', () => {
    const good = describeBacktest({ samples: 38, mean_error_pct: 4.4, vs_naive_pct: 15, direction_hit_pct: 81, direction_samples: 26 });
    expect(good).toContain('38 pruebas');
    expect(good).toContain('81 %');
    expect(good).toContain('Mejora un 15 %');
    const bad = describeBacktest({ samples: 20, mean_error_pct: 9, vs_naive_pct: -3, direction_hit_pct: null, direction_samples: 0 });
    expect(bad).toContain('tómalo con mucha cautela');
    expect(describeBacktest(null)).toBeNull();
  });
});
