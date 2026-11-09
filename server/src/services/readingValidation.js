const { SLOT_KEYS } = require('../utils/slots');
const { isValidIsoDate, today } = require('../utils/dates');

const MESSAGES = {
  valueRequired: 'Please enter a glucose value.',
  valueRange: 'Value must be between 40 and 600 mg/dl.',
  futureDate: 'Date cannot be in the future.',
  dateRequired: 'Please choose a date.',
  dateInvalid: 'Please enter a valid date.',
  slotInvalid: 'Please choose a time slot.',
  maxPerDay: 'You can add only 4 readings per day.',
  duplicateSlot: (slotLabel) => `You already have an ${slotLabel} reading for this date.`,
};

function parseValue(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return { error: MESSAGES.valueRequired };
  }
  const text = String(raw).trim();
  if (!/^\d+$/.test(text)) {
    return { error: MESSAGES.valueRange };
  }
  const value = Number(text);
  if (value < 40 || value > 600) {
    return { error: MESSAGES.valueRange };
  }
  return { value };
}

// Checks the shape of a reading. Rules that need the database
// (one per slot, four per day) are checked in the readings service.
function validateReadingInput(body = {}) {
  const errors = {};

  const parsed = parseValue(body.value);
  if (parsed.error) errors.value = parsed.error;

  if (!body.date) {
    errors.date = MESSAGES.dateRequired;
  } else if (!isValidIsoDate(body.date)) {
    errors.date = MESSAGES.dateInvalid;
  } else if (body.date > today()) {
    errors.date = MESSAGES.futureDate;
  }

  if (!SLOT_KEYS.includes(body.slot)) {
    errors.slot = MESSAGES.slotInvalid;
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }
  return { data: { date: body.date, slot: body.slot, value: parsed.value } };
}

module.exports = { validateReadingInput, MESSAGES };
