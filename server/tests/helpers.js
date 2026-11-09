const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const migrate = require('../src/db/migrate');

async function resetDatabase() {
  await migrate();
  await pool.query('TRUNCATE readings, users RESTART IDENTITY CASCADE');
}

async function registerUser(overrides = {}) {
  const body = {
    name: 'Test User',
    email: `user${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(body);
  return { token: res.body.token, user: res.body.user, password: body.password };
}

function authed(token) {
  return {
    get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url, body) => request(app).post(url).set('Authorization', `Bearer ${token}`).send(body),
    put: (url, body) => request(app).put(url).set('Authorization', `Bearer ${token}`).send(body),
    delete: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
  };
}

module.exports = { app, pool, resetDatabase, registerUser, authed };
