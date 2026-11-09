const pool = require('../db/pool');
const { AppError } = require('../utils/errors');
const { slotLabel } = require('../utils/slots');
const { MESSAGES } = require('./readingValidation');

const MAX_PER_DAY = 4;

const SELECT_COLUMNS = 'id, reading_date AS date, slot, value, created_at, updated_at';

function toReading(row) {
  return {
    id: row.id,
    date: row.date,
    slot: row.slot,
    slotLabel: slotLabel(row.slot),
    value: row.value,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function checkDayRules(client, userId, { date, slot }, excludeId = null) {
  const { rows } = await client.query(
    'SELECT id, slot FROM readings WHERE user_id = $1 AND reading_date = $2 AND ($3::int IS NULL OR id <> $3)',
    [userId, date, excludeId]
  );

  if (rows.length >= MAX_PER_DAY) {
    throw new AppError(409, MESSAGES.maxPerDay, 'date');
  }
  if (rows.some((r) => r.slot === slot)) {
    throw new AppError(409, MESSAGES.duplicateSlot(slotLabel(slot)), 'slot');
  }
}

function rethrowUniqueViolation(err, slot) {
  if (err.code === '23505') {
    throw new AppError(409, MESSAGES.duplicateSlot(slotLabel(slot)), 'slot');
  }
  throw err;
}

async function listReadings(userId, { from, to, page, limit }) {
  const filters = ['user_id = $1'];
  const params = [userId];

  if (from) {
    params.push(from);
    filters.push(`reading_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    filters.push(`reading_date <= $${params.length}`);
  }
  const where = filters.join(' AND ');

  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM readings WHERE ${where}`, params);
  const total = countResult.rows[0].total;

  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLUMNS} FROM readings WHERE ${where}
     ORDER BY reading_date DESC,
       array_position(ARRAY['morning_fasting','after_breakfast','after_lunch','after_dinner']::varchar[], slot)
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rows.map(toReading),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

async function createReading(userId, reading) {
  const client = await pool.connect();
  try {
    await checkDayRules(client, userId, reading);
    const { rows } = await client.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4) RETURNING ${SELECT_COLUMNS}`,
      [userId, reading.date, reading.slot, reading.value]
    );
    return toReading(rows[0]);
  } catch (err) {
    return rethrowUniqueViolation(err, reading.slot);
  } finally {
    client.release();
  }
}

async function updateReading(userId, id, reading) {
  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT id FROM readings WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rowCount === 0) {
      throw new AppError(404, 'Reading not found.');
    }
    await checkDayRules(client, userId, reading, id);
    const { rows } = await client.query(
      `UPDATE readings SET reading_date = $1, slot = $2, value = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5 RETURNING ${SELECT_COLUMNS}`,
      [reading.date, reading.slot, reading.value, id, userId]
    );
    return toReading(rows[0]);
  } catch (err) {
    return rethrowUniqueViolation(err, reading.slot);
  } finally {
    client.release();
  }
}

async function deleteReading(userId, id) {
  const { rowCount } = await pool.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [id, userId]);
  if (rowCount === 0) {
    throw new AppError(404, 'Reading not found.');
  }
}

module.exports = { listReadings, createReading, updateReading, deleteReading, toReading };
