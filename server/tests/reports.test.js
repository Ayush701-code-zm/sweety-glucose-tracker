const { pool, resetDatabase, registerUser, authed } = require('./helpers');
const { reportRanges } = require('../src/utils/dates');

let api;

beforeEach(async () => {
  await resetDatabase();
  api = authed((await registerUser()).token);
});
afterAll(() => pool.end());

describe('report date ranges', () => {
  test('matches the example in the brief (selected 15 Oct 2026)', () => {
    expect(reportRanges('2026-10-15')).toEqual({
      daily: { from: '2026-10-15', to: '2026-10-15' },
      monthToDate: { from: '2026-10-01', to: '2026-10-15' },
      monthly: { from: '2026-09-01', to: '2026-09-30' },
    });
  });

  test('previous month wraps across the year and handles leap years', () => {
    expect(reportRanges('2026-01-10').monthly).toEqual({ from: '2025-12-01', to: '2025-12-31' });
    expect(reportRanges('2028-03-05').monthly).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });
});

describe('reports', () => {
  test('daily, month-to-date and monthly summaries', async () => {
    const readings = [
      ['2026-09-10', 'morning_fasting', 90],
      ['2026-09-30', 'after_dinner', 200],
      ['2026-10-01', 'morning_fasting', 100],
      ['2026-10-15', 'morning_fasting', 110],
      ['2026-10-15', 'after_lunch', 145],
      ['2026-10-15', 'after_dinner', 132],
      ['2026-10-20', 'after_lunch', 300],
    ];
    for (const [date, slot, value] of readings) {
      await api.post('/api/readings', { date, slot, value });
    }

    const { body } = await api.get('/api/reports?date=2026-10-15');

    expect(body.daily).toMatchObject({ count: 3, highest: 145, lowest: 110, average: 129 });
    expect(body.daily.readings.map((r) => r.slotLabel)).toEqual(['Morning (fasting)', 'After lunch', 'After dinner']);
    expect(body.monthToDate).toMatchObject({ from: '2026-10-01', to: '2026-10-15', count: 4, highest: 145, lowest: 100 });
    expect(body.monthToDate.average).toBe(121.8);
    expect(body.monthly).toMatchObject({ from: '2026-09-01', to: '2026-09-30', count: 2, highest: 200, lowest: 90, average: 145 });
  });

  test('returns an empty summary when there are no readings', async () => {
    const { body } = await api.get('/api/reports/daily?date=2026-10-15');
    expect(body).toMatchObject({ count: 0, highest: null, lowest: null, average: null, readings: [] });
  });
});
