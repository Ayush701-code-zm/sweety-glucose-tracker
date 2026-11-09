const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}

function validateRegistration({ name, email, password }) {
  const errors = {};
  if (!name || !String(name).trim()) errors.name = 'Please enter your name.';
  if (!email || !EMAIL_PATTERN.test(String(email).trim())) errors.email = 'Please enter a valid email address.';
  if (!password || String(password).length < 8) errors.password = 'Password must be at least 8 characters.';
  return errors;
}

router.post('/register', async (req, res) => {
  const errors = validateRegistration(req.body || {});
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: Object.values(errors)[0], errors });
  }

  const name = req.body.name.trim();
  const email = req.body.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(req.body.password, SALT_ROUNDS);

  try {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );
    const user = rows[0];
    return res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.code === '23505') {
      const message = 'An account with this email already exists.';
      return res.status(409).json({ error: message, errors: { email: message } });
    }
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter your email and password.' });
  }

  const { rows } = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
  const user = rows[0];
  const matches = user ? await bcrypt.compare(password, user.password_hash) : false;

  if (!matches) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  return res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
  if (rows.length === 0) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }
  return res.json({ user: publicUser(rows[0]) });
});

module.exports = router;
