const { pool, resetDatabase, registerUser, authed } = require('./helpers');
const { today } = require('../src/utils/dates');

let api;

beforeEach(async () => {
  await resetDatabase();
  const { token } = await registerUser();
  api = authed(token);
});
afterAll(() => pool.end());

const DAY = '2026-10-15';

describe('reading validation', () => {
  test.each([
    [{ date: DAY, slot: 'after_lunch' }, 'Please enter a glucose value.'],
    [{ date: DAY, slot: 'after_lunch', value: '' }, 'Please enter a glucose value.'],
    [{ date: DAY, slot: 'after_lunch', value: 39 }, 'Value must be between 40 and 600 mg/dl.'],
    [{ date: DAY, slot: 'after_lunch', value: 601 }, 'Value must be between 40 and 600 mg/dl.'],
    [{ date: DAY, slot: 'after_lunch', value: 120.5 }, 'Value must be between 40 and 600 mg/dl.'],
    [{ date: DAY, slot: 'after_lunch', value: 'abc' }, 'Value must be between 40 and 600 mg/dl.'],
    [{ date: '2999-01-01', slot: 'after_lunch', value: 120 }, 'Date cannot be in the future.'],
  ])('rejects %j', async (body, message) => {
    const res = await api.post('/api/readings', body);
    expect(res.status).toBe(400);
    expect(Object.values(res.body.errors)).toContain(message);
  });

  test('accepts the boundary values 40 and 600', async () => {
    expect((await api.post('/api/readings', { date: DAY, slot: 'morning_fasting', value: 40 })).status).toBe(201);
    expect((await api.post('/api/readings', { date: DAY, slot: 'after_dinner', value: 600 })).status).toBe(201);
  });

  test("accepts today's date", async () => {
    const res = await api.post('/api/readings', { date: today(), slot: 'morning_fasting', value: 100 });
    expect(res.status).toBe(201);
  });

  test('allows only one reading per slot per day', async () => {
    await api.post('/api/readings', { date: DAY, slot: 'after_lunch', value: 150 });
    const res = await api.post('/api/readings', { date: DAY, slot: 'after_lunch', value: 160 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('You already have an After lunch reading for this date.');
  });

  test('allows at most 4 readings per day', async () => {
    for (const slot of ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner']) {
      await api.post('/api/readings', { date: DAY, slot, value: 120 });
    }
    const res = await api.post('/api/readings', { date: DAY, slot: 'after_lunch', value: 130 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('You can add only 4 readings per day.');
  });
});

describe('reading CRUD', () => {
  test('creates, lists, updates and deletes a reading', async () => {
    const created = await api.post('/api/readings', { date: DAY, slot: 'after_breakfast', value: 180 });
    expect(created.status).toBe(201);
    const { id } = created.body.reading;

    const list = await api.get('/api/readings');
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({ date: DAY, slot: 'after_breakfast', value: 180 });

    const updated = await api.put(`/api/readings/${id}`, { date: DAY, slot: 'after_breakfast', value: 175 });
    expect(updated.status).toBe(200);
    expect(updated.body.reading.value).toBe(175);

    expect((await api.delete(`/api/readings/${id}`)).status).toBe(204);
    expect((await api.get('/api/readings')).body.data).toHaveLength(0);
  });

  test('editing a reading keeps its own slot without a duplicate error', async () => {
    const { body } = await api.post('/api/readings', { date: DAY, slot: 'after_lunch', value: 140 });
    const res = await api.put(`/api/readings/${body.reading.id}`, { date: DAY, slot: 'after_lunch', value: 141 });
    expect(res.status).toBe(200);
  });

  test('editing into a taken slot is rejected', async () => {
    await api.post('/api/readings', { date: DAY, slot: 'after_lunch', value: 140 });
    const { body } = await api.post('/api/readings', { date: DAY, slot: 'after_dinner', value: 150 });
    const res = await api.put(`/api/readings/${body.reading.id}`, { date: DAY, slot: 'after_lunch', value: 150 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('You already have an After lunch reading for this date.');
  });

  test('paginates the readings list', async () => {
    for (let d = 1; d <= 5; d += 1) {
      await api.post('/api/readings', { date: `2026-10-0${d}`, slot: 'morning_fasting', value: 100 + d });
    }
    const res = await api.get('/api/readings?page=2&limit=2');

    expect(res.body.data.map((r) => r.date)).toEqual(['2026-10-03', '2026-10-02']);
    expect(res.body.pagination).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
  });

  test("users cannot see or change each other's readings", async () => {
    const { body } = await api.post('/api/readings', { date: DAY, slot: 'after_lunch', value: 140 });
    const other = authed((await registerUser()).token);

    expect((await other.get('/api/readings')).body.data).toHaveLength(0);
    expect((await other.put(`/api/readings/${body.reading.id}`, { date: DAY, slot: 'after_lunch', value: 99 })).status).toBe(404);
    expect((await other.delete(`/api/readings/${body.reading.id}`)).status).toBe(404);
  });
});
