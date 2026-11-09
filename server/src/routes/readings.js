const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { validateReadingInput } = require('../services/readingValidation');
const readingsService = require('../services/readingsService');
const { isValidIsoDate } = require('../utils/dates');
const { SLOTS } = require('../utils/slots');

const router = express.Router();
router.use(requireAuth);

const MAX_LIMIT = 100;

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function sendValidationErrors(res, errors) {
  return res.status(400).json({ error: Object.values(errors)[0], errors });
}

router.get('/slots', (req, res) => {
  res.json({ slots: SLOTS });
});

router.get('/', async (req, res) => {
  const { from, to } = req.query;
  if ((from && !isValidIsoDate(from)) || (to && !isValidIsoDate(to))) {
    return res.status(400).json({ error: 'from and to must be dates in YYYY-MM-DD format.' });
  }
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const result = await readingsService.listReadings(req.user.id, { from, to, page, limit });
  return res.json(result);
});

router.post('/', async (req, res) => {
  const { data, errors } = validateReadingInput(req.body);
  if (errors) return sendValidationErrors(res, errors);

  const reading = await readingsService.createReading(req.user.id, data);
  return res.status(201).json({ reading });
});

router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Reading not found.' });

  const { data, errors } = validateReadingInput(req.body);
  if (errors) return sendValidationErrors(res, errors);

  const reading = await readingsService.updateReading(req.user.id, id, data);
  return res.json({ reading });
});

router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Reading not found.' });

  await readingsService.deleteReading(req.user.id, id);
  return res.status(204).end();
});

module.exports = router;
