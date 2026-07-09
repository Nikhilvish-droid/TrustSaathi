const { formatDateOnlyLocal, startOfDay, endOfDay } = require('./dateRanges');
const { scopedDonationsWhere, buildScopedDonationParams } = require('./donationTotals');

const CALENDAR_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(start, end) {
  return Math.ceil((endOfDay(end).getTime() - startOfDay(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function buildYearlyBuckets(start, endDayDate, now) {
  const buckets = [];
  let year = start.getFullYear();
  const endYear = endDayDate.getFullYear();
  while (year <= endYear) {
    const yearStart = year === start.getFullYear() ? startOfDay(start) : startOfDay(new Date(year, 0, 1));
    const yearEnd = endOfDay(new Date(year, 11, 31));
    const bucketEnd = yearEnd > endDayDate ? endDayDate : yearEnd;
    buckets.push({
      label: String(year),
      start: yearStart,
      end: bucketEnd,
      is_highlight: now.getFullYear() === year,
    });
    year += 1;
  }
  return buckets;
}

function buildMonthlyBuckets(start, endDayDate, now) {
  const buckets = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= endDayDate) {
    const monthStart = cursor < start ? startOfDay(start) : startOfDay(cursor);
    const monthEnd = endOfDay(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));
    const bucketEnd = monthEnd > endDayDate ? endDayDate : monthEnd;
    buckets.push({
      label: cursor.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      start: monthStart,
      end: bucketEnd,
      is_highlight: now >= monthStart && now <= bucketEnd,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return buckets;
}

function buildBuckets(period, ranges, chartEndOverride = null) {
  const now = new Date();

  if (period === 'today') {
    return [
      {
        label: 'Today',
        start: startOfDay(now),
        end: endOfDay(now),
        is_highlight: true,
      },
    ];
  }

  if (period === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const weekRanges = [
      [1, 7],
      [8, 14],
      [15, 21],
      [22, lastDay],
    ];
    return weekRanges.map(([fromDay, toDay], i) => ({
      label: `Week ${i + 1}`,
      start: startOfDay(new Date(year, month, fromDay)),
      end: endOfDay(new Date(year, month, toDay)),
      is_highlight: now.getDate() >= fromDay && now.getDate() <= toDay,
    }));
  }

  if (period === 'fy') {
    const year = now.getFullYear();
    return CALENDAR_MONTHS.map((label, i) => ({
      label,
      start: startOfDay(new Date(year, i, 1)),
      end: endOfDay(new Date(year, i + 1, 0)),
      is_highlight: now.getMonth() === i,
    }));
  }

  if (period === 'lifetime') {
    const start = startOfDay(ranges.current.start);
    const endDayDate = chartEndOverride
      ? endOfDay(chartEndOverride)
      : ranges.current.end
        ? endOfDay(ranges.current.end)
        : endOfDay(new Date());
    const spanDays = daysBetween(start, endDayDate);

    if (spanDays <= 1) {
      return [
        {
          label: formatDateOnlyLocal(start),
          start,
          end: endDayDate,
          is_highlight: true,
        },
      ];
    }

    // Short spans: daily buckets
    if (spanDays <= 14) {
      const buckets = [];
      let cursor = start;
      while (cursor <= endDayDate) {
        const isToday = formatDateOnlyLocal(cursor) === formatDateOnlyLocal(now);
        buckets.push({
          label: isToday
            ? `${cursor.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} (Today)`
            : cursor.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          start: startOfDay(cursor),
          end: endOfDay(cursor),
          is_highlight: isToday,
        });
        cursor = addDays(cursor, 1);
      }
      return buckets;
    }

    // Lifetime: group by calendar year (2025, 2026, 2027, …)
    return buildYearlyBuckets(start, endDayDate, now);
  }

  return [];
}

function getChartSubtitle(period, ranges) {
  if (period === 'today') return 'Today · total raised';
  if (period === 'month') return 'This month · 4 weeks';
  if (period === 'fy') return `Jan – Dec ${new Date().getFullYear()} · ₹ in thousands`;
  if (period === 'lifetime') {
    return 'Yearly · all time · ₹ in thousands';
  }
  return '';
}

function getChartBadge(period) {
  const year = new Date().getFullYear();
  if (period === 'lifetime') return 'Lifetime';
  if (period === 'fy') return String(year);
  if (period === 'month') {
    return new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }
  if (period === 'today') return 'Today';
  return null;
}

async function fetchBucketStats(pool, organizationId, organizationName, start, end) {
  const { params, dateClause } = buildScopedDonationParams(
    organizationId,
    organizationName,
    start,
    end,
  );

  const result = await pool.query(
    `SELECT 
      COALESCE(SUM(don.amount), 0) AS donation_amount,
      COUNT(don.id)::int AS donation_count,
      COUNT(DISTINCT don.donor_id)::int AS donor_count,
      COALESCE(AVG(don.amount), 0) AS avg_donation
     FROM donations don
     LEFT JOIN donors dr ON dr.id = don.donor_id AND dr.organization_id = don.organization_id
     WHERE ${scopedDonationsWhere(1)}
       ${dateClause}`,
    params,
  );
  const row = result.rows[0];
  const donationAmount = parseFloat(row.donation_amount);
  const avgDonation = parseFloat(row.avg_donation);
  return {
    donation_amount: donationAmount,
    donation_count: row.donation_count,
    donors: row.donor_count,
    avg_donation: avgDonation,
    donations_k: Number((donationAmount / 1000).toFixed(2)),
    avg_donation_k: Number((avgDonation / 1000).toFixed(2)),
  };
}

async function resolveLifetimeChartEnd(pool, organizationId) {
  const result = await pool.query(
    'SELECT MAX(date) AS max_date FROM donations WHERE organization_id = $1',
    [organizationId],
  );
  const maxDate = result.rows[0]?.max_date;
  const today = endOfDay(new Date());
  if (!maxDate) return today;
  const lastDonation = endOfDay(new Date(maxDate));
  return lastDonation > today ? lastDonation : today;
}

async function fetchChartOverview(pool, organizationId, period, ranges, organizationName = null) {
  const chartEndOverride =
    period === 'lifetime' ? await resolveLifetimeChartEnd(pool, organizationId) : null;
  const buckets = buildBuckets(period, ranges, chartEndOverride);
  if (buckets.length === 0) {
    return { subtitle: '', badge: null, points: [] };
  }

  const points = await Promise.all(
    buckets.map(async (bucket) => {
      const stats = await fetchBucketStats(
        pool,
        organizationId,
        organizationName,
        bucket.start,
        bucket.end,
      );
      return {
        label: bucket.label,
        ...stats,
        is_highlight: bucket.is_highlight,
      };
    }),
  );

  return {
    subtitle: getChartSubtitle(period, ranges),
    badge: getChartBadge(period),
    points,
  };
}

module.exports = { fetchChartOverview, buildBuckets, buildMonthlyBuckets, buildYearlyBuckets };
