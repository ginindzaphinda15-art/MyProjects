export function formatMoney(amount) {
  const n = Number(amount) || 0;
  return `E${n.toFixed(2)}`; // Lilangeni (SZL), symbol E, used interchangeably with ZAR in Eswatini
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTime(timeStr) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':');
  const hour = Number(h);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = ((hour + 11) % 12) + 1;
  return `${hour12}:${m} ${suffix}`;
}

export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export function orderTotal(items) {
  return (items || []).reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0);
}
