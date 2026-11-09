// Rough guide bands shown next to a reading. These are common reference
// values for adults and are only a visual hint, not medical advice.
export function glucoseLevel({ slot, value }) {
  if (value < 70) return { label: 'Low', tone: 'low' };
  const highLimit = slot === 'morning_fasting' ? 130 : 180;
  if (value > highLimit) return { label: 'High', tone: 'high' };
  return { label: 'In range', tone: 'ok' };
}
