/** Format a Date as YYYY-MM-DD in local timezone (avoids UTC shift from toISOString). */
function formatDateOnlyLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getPeriodRanges(period, from, to) {
  const now = new Date();

  if (period === 'today') {
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    return {
      label: 'Today',
      current: { start: startOfDay(now), end: endOfDay(now) },
      previous: { start: startOfDay(prev), end: endOfDay(prev) },
    };
  }

  if (period === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth();
    const currentStart = new Date(year, month, 1);
    const currentEnd = new Date(year, month + 1, 0);
    const prevMonth = new Date(year, month - 1, 1);
    const prevEnd = new Date(year, month, 0);
    return {
      label: 'This Month',
      current: { start: currentStart, end: endOfDay(currentEnd) },
      previous: { start: prevMonth, end: endOfDay(prevEnd) },
    };
  }

  if (period === 'fy') {
    const year = now.getFullYear();
    const currentStart = new Date(year, 0, 1);
    const currentEnd = new Date(year, 11, 31);
    const prevStart = new Date(year - 1, 0, 1);
    const prevEnd = new Date(year - 1, 11, 31);
    return {
      label: 'This Year',
      current: { start: currentStart, end: endOfDay(currentEnd) },
      previous: { start: prevStart, end: endOfDay(prevEnd) },
    };
  }

  return null;
}

/** Lifetime = all donations from first record onward (no upper date cap). */
function buildLifetimeRanges(firstDonationDate) {
  const now = new Date();
  const start = firstDonationDate ? startOfDay(new Date(firstDonationDate)) : startOfDay(now);
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);

  return {
    label: 'Lifetime',
    current: { start, end: null },
    previous: { start, end: endOfDay(prevEnd) },
  };
}

function getPeriodRangesLegacyCustom(period, from, to) {
  if (period !== 'custom' || !from || !to) return null;
  const currentStart = startOfDay(new Date(from));
  const currentEnd = endOfDay(new Date(to));
  if (isNaN(currentStart.getTime()) || isNaN(currentEnd.getTime())) return null;

  const durationMs = currentEnd.getTime() - currentStart.getTime();
  const prevEnd = new Date(currentStart.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return {
    label: 'Custom Range',
    current: { start: currentStart, end: currentEnd },
    previous: { start: prevStart, end: prevEnd },
  };
}

function getCurrentFyRange() {
  const now = new Date();
  const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(fyStartYear, 3, 1);
  const end = endOfDay(now);
  const label = `FY ${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;
  return { start, end, label, fyStartYear };
}

module.exports = {
  formatDateOnlyLocal,
  getPeriodRanges,
  buildLifetimeRanges,
  getPeriodRangesLegacyCustom,
  getCurrentFyRange,
  startOfDay,
  endOfDay,
};
