const request = require('supertest');
const { app, pool, resetDatabase, registerUser } = require('./helpers');

beforeEach(resetDatabase);
afterAll(() => pool.end());

describe('auth', () => {
  test('registers a user and stores a bcrypt hash, not the password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Asha', email: 'Asha@Example.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toEqual({ id: 1, name: 'Asha', email: 'asha@example.com' });

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['asha@example.com']);
    expect(rows[0].password_hash).not.toBe('secret123');
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/);
  });

  test('rejects a duplicate email', async () => {
    await registerUser({ email: 'same@example.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other', email: 'same@example.com', password: 'secret123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('An account with this email already exists.');
  });

  test('validates registration fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: '', email: 'bad', password: '123' });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors).sort()).toEqual(['email', 'name', 'password']);
  });

  test('logs in with the right password and rejects the wrong one', async () => {
    await registerUser({ email: 'login@example.com', password: 'rightpass1' });

    const ok = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'rightpass1' });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeDefined();

    const bad = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'wrongpass' });
    expect(bad.status).toBe(401);
    expect(bad.body.error).toBe('Email or password is incorrect.');
  });

  test('protected routes need a token', async () => {
    const res = await request(app).get('/api/readings');
    expect(res.status).toBe(401);
  });
});
