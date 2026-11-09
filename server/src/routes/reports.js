const express = require('express');
const { requireAuth } = require('../middleware/auth');
const reports = require('../services/reportsService');
const { isValidIsoDate, today, reportRanges } = require('../utils/dates');

const router = express.Router();
router.use(requireAuth);

function selectedDate(req, res) {
  const date = req.query.date || today();
  if (!isValidIsoDate(date)) {
    res.status(400).json({ error: 'date must be in YYYY-MM-DD format.' });
    return null;
  }
  return date;
}

router.get('/', async (req, res) => {
  const date = selectedDate(req, res);
  if (!date) return undefined;
  return res.json(await reports.allReports(req.user.id, date));
});

router.get('/daily', async (req, res) => {
  const date = selectedDate(req, res);
  if (!date) return undefined;
  return res.json(await reports.dailyReport(req.user.id, date));
});

router.get('/month-to-date', async (req, res) => {
  const date = selectedDate(req, res);
  if (!date) return undefined;
  return res.json(await reports.monthToDateReport(req.user.id, date));
});

router.get('/monthly', async (req, res) => {
  const date = selectedDate(req, res);
  if (!date) return undefined;
  return res.json(await reports.monthlyReport(req.user.id, date));
});

router.get('/trend', async (req, res) => {
  const date = selectedDate(req, res);
  if (!date) return undefined;
  const range = reportRanges(date).monthToDate;
  return res.json({ ...range, points: await reports.dailyTrend(req.user.id, range) });
});

module.exports = router;
