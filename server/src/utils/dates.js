const config = require('../config');

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// Today's date as YYYY-MM-DD in the configured timezone (en-CA formats as ISO).
function today(timeZone = config.timezone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function toIso(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function lastDayOfMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// Date ranges for the three reports, all relative to the selected date.
function reportRanges(selected) {
  const [y, m] = selected.split('-').map(Number);
  const prevY = m === 1 ? y - 1 : y;
  const prevM = m === 1 ? 12 : m - 1;

  return {
    daily: { from: selected, to: selected },
    monthToDate: { from: toIso(y, m, 1), to: selected },
    monthly: { from: toIso(prevY, prevM, 1), to: toIso(prevY, prevM, lastDayOfMonth(prevY, prevM)) },
  };
}

module.exports = { isValidIsoDate, today, reportRanges };
