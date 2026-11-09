import { todayIso } from './dates';

export const MESSAGES = {
  valueRequired: 'Please enter a glucose value.',
  valueRange: 'Value must be between 40 and 600 mg/dl.',
  futureDate: 'Date cannot be in the future.',
  dateRequired: 'Please choose a date.',
  slotRequired: 'Please choose a time slot.',
};

// Same rules as the API, so most mistakes are caught before a request is sent.
export function validateReading({ date, slot, value }, today = todayIso()) {
  const errors = {};
  const text = String(value ?? '').trim();

  if (text === '') errors.value = MESSAGES.valueRequired;
  else if (!/^\d+$/.test(text) || Number(text) < 40 || Number(text) > 600) errors.value = MESSAGES.valueRange;

  if (!date) errors.date = MESSAGES.dateRequired;
  else if (date > today) errors.date = MESSAGES.futureDate;

  if (!slot) errors.slot = MESSAGES.slotRequired;

  return errors;
}
