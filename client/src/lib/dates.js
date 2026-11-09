export function todayIso() {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

const displayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return displayFormat.format(new Date(y, m - 1, d));
}

export function formatRange(from, to) {
  return from === to ? formatDate(from) : `${formatDate(from)} to ${formatDate(to)}`;
}
