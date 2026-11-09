const SLOTS = [
  { key: 'morning_fasting', label: 'Morning (fasting)' },
  { key: 'after_breakfast', label: 'After breakfast' },
  { key: 'after_lunch', label: 'After lunch' },
  { key: 'after_dinner', label: 'After dinner' },
];

const SLOT_KEYS = SLOTS.map((s) => s.key);

function slotLabel(key) {
  const slot = SLOTS.find((s) => s.key === key);
  return slot ? slot.label : key;
}

module.exports = { SLOTS, SLOT_KEYS, slotLabel };
