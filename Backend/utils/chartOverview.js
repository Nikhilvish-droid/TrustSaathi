const { formatDateOnlyLocal, startOfDay, endOfDay } = require('./dateRanges');

const CALENDAR_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(start, end) {
  return Math.ceil((endOfDay(end).getTime() - startOfDay(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function buildBuckets(period, ranges) {
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
    const endDayDate = endOfDay(ranges.current.end);
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

    if (spanDays <= 45) {
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

    if (spanDays <= 400) {
      const buckets = [];
      let cursor = start;
      let weekNum = 1;
      while (cursor <= endDayDate) {
        const weekEnd = endOfDay(addDays(cursor, 6));
        const bucketEnd = weekEnd > endDayDate ? endDayDate : weekEnd;
        buckets.push({
          label: `Week ${weekNum}`,
          start: startOfDay(cursor),
          end: bucketEnd,
          is_highlight: now >= cursor && now <= bucketEnd,
        });
        cursor = addDays(cursor, 7);
        weekNum += 1;
      }
      return buckets;
    }

    const buckets = [];
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= endDayDate) {
      const monthEnd = endOfDay(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));
      const bucketEnd = monthEnd > endDayDate ? endDayDate : monthEnd;
      buckets.push({
        label: cursor.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        start: startOfDay(cursor),
        end: bucketEnd,
        is_highlight: now >= cursor && now <= bucketEnd,
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return buckets;
  }

  return [];
}

function getChartSubtitle(period, ranges) {
  if (period === 'today') return 'Today · total raised';
  if (period === 'month') return 'This month · 4 weeks';
  if (period === 'fy') return `Jan – Dec ${new Date().getFullYear()} · ₹ in thousands`;
  if (period === 'lifetime') {
    return `${formatDateOnlyLocal(ranges.current.start)} to ${formatDateOnlyLocal(ranges.current.end)} · all time`;
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

async function fetchBucketStats(pool, organizationId, start, end) {
  const result = await pool.query(
    `SELECT 
      COALESCE(SUM(amount), 0) AS donation_amount,
      COUNT(id)::int AS donation_count,
      COUNT(DISTINCT donor_id)::int AS donor_count,
      COALESCE(AVG(amount), 0) AS avg_donation
     FROM donations
     WHERE organization_id = $1 AND date >= $2::date AND date <= $3::date`,
    [organizationId, formatDateOnlyLocal(start), formatDateOnlyLocal(end)],
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

async function fetchChartOverview(pool, organizationId, period, ranges) {
  const buckets = buildBuckets(period, ranges);
  if (buckets.length === 0) {
    return { subtitle: '', badge: null, points: [] };
  }

  const points = await Promise.all(
    buckets.map(async (bucket) => {
      const stats = await fetchBucketStats(pool, organizationId, bucket.start, bucket.end);
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

module.exports = { fetchChartOverview, buildBuckets };
