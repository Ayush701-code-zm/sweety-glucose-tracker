const bcrypt = require('bcrypt');
const pool = require('./pool');
const migrate = require('./migrate');
const { today } = require('../utils/dates');
const { SLOT_KEYS } = require('../utils/slots');

const DEMO_USER = {
  name: 'Demo Patient',
  email: 'demo@sweety.app',
  password: 'demo12345',
};

// Typical ranges per slot so the sample data looks believable.
const SLOT_RANGES = {
  morning_fasting: [85, 135],
  after_breakfast: [130, 210],
  after_lunch: [125, 220],
  after_dinner: [120, 200],
};

// Small deterministic generator so every seed run gives the same data.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function isoDaysBack(fromIso, days) {
  const [y, m, d] = fromIso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d - days));
  return date.toISOString().slice(0, 10);
}

function buildReadings(endDate, days) {
  const random = createRandom(42);
  const rows = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = isoDaysBack(endDate, i);
    // Leave a few gaps so the data feels like real logging habits.
    const slots = i === 0 ? SLOT_KEYS.slice(0, 2) : SLOT_KEYS.filter(() => random() > 0.12);
    slots.forEach((slot) => {
      const [min, max] = SLOT_RANGES[slot];
      rows.push({ date, slot, value: Math.round(min + random() * (max - min)) });
    });
  }
  return rows;
}

async function seed() {
  await migrate();

  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [DEMO_USER.name, DEMO_USER.email, passwordHash]
  );
  const userId = rows[0].id;

  await pool.query('DELETE FROM readings WHERE user_id = $1', [userId]);

  const readings = buildReadings(today(), 60);
  for (const r of readings) {
    await pool.query('INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)', [
      userId,
      r.date,
      r.slot,
      r.value,
    ]);
  }

  console.log(`Seeded ${readings.length} readings for ${DEMO_USER.email} (password: ${DEMO_USER.password}).`);
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  });
