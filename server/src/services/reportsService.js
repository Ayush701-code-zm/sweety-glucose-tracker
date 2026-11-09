const pool = require('../db/pool');
const { reportRanges } = require('../utils/dates');
const { toReading } = require('./readingsService');

async function summarise(userId, { from, to }) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count,
            MAX(value) AS highest,
            MIN(value) AS lowest,
            ROUND(AVG(value)::numeric, 1)::float AS average
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to]
  );
  const { count, highest, lowest, average } = rows[0];
  return { from, to, count, highest, lowest, average };
}

async function dailyReport(userId, date) {
  const range = reportRanges(date).daily;
  const summary = await summarise(userId, range);
  const { rows } = await pool.query(
    `SELECT id, reading_date AS date, slot, value, created_at, updated_at
     FROM readings WHERE user_id = $1 AND reading_date = $2
     ORDER BY array_position(ARRAY['morning_fasting','after_breakfast','after_lunch','after_dinner']::varchar[], slot)`,
    [userId, date]
  );
  return { ...summary, readings: rows.map(toReading) };
}

async function monthToDateReport(userId, date) {
  return summarise(userId, reportRanges(date).monthToDate);
}

async function monthlyReport(userId, date) {
  return summarise(userId, reportRanges(date).monthly);
}

async function allReports(userId, date) {
  const [daily, monthToDate, monthly] = await Promise.all([
    dailyReport(userId, date),
    monthToDateReport(userId, date),
    monthlyReport(userId, date),
  ]);
  return { date, daily, monthToDate, monthly };
}

// Average per day for a date range, used by the month chart.
async function dailyTrend(userId, { from, to }) {
  const { rows } = await pool.query(
    `SELECT reading_date AS date, ROUND(AVG(value)::numeric, 1)::float AS average,
            MIN(value) AS lowest, MAX(value) AS highest
     FROM readings WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
     GROUP BY reading_date ORDER BY reading_date`,
    [userId, from, to]
  );
  return rows;
}

module.exports = { dailyReport, monthToDateReport, monthlyReport, allReports, dailyTrend };
