const { donorScopeSql } = require('./donorHelpers');
const { CRITICAL_FIELDS } = require('./aiAnalysis');

const FIELD_LABELS = {
  donor_name: 'donor name',
  amount: 'amount',
  date: 'date',
  payment_mode: 'payment mode',
};

function nextFcraDeadline(fromDate = new Date()) {
  const year = fromDate.getFullYear();
  const quarters = [
    new Date(year, 2, 31),
    new Date(year, 5, 30),
    new Date(year, 8, 30),
    new Date(year, 11, 31),
  ];

  for (const deadline of quarters) {
    if (deadline >= fromDate) return deadline;
  }
  return new Date(year + 1, 2, 31);
}

function daysUntil(date) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

function formatDisplayDate(date) {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isFilled(value) {
  return value != null && String(value).trim() !== '';
}

/**
 * Donor is "complete" only when both mobile (phone) and PAN are on file.
 */
async function fetchDonorDetailStats(pool, organizationId, organizationName) {
  const result = await pool.query(
    `SELECT
      COUNT(DISTINCT dr.id)::int AS total_donors,
      COUNT(DISTINCT dr.id) FILTER (
        WHERE dr.phone IS NOT NULL AND TRIM(dr.phone) <> ''
          AND dr.pan IS NOT NULL AND TRIM(dr.pan) <> ''
      )::int AS complete_donors,
      COUNT(DISTINCT dr.id) FILTER (
        WHERE dr.phone IS NULL OR TRIM(dr.phone) = ''
      )::int AS missing_phone,
      COUNT(DISTINCT dr.id) FILTER (
        WHERE dr.pan IS NULL OR TRIM(dr.pan) = ''
      )::int AS missing_pan,
      COUNT(DISTINCT dr.id) FILTER (
        WHERE dr.phone IS NULL OR TRIM(dr.phone) = ''
           OR dr.pan IS NULL OR TRIM(dr.pan) = ''
      )::int AS incomplete_donors
     ${donorScopeSql(1)}`,
    [organizationId],
  );

  const row = result.rows[0];
  return {
    total_donors: row.total_donors,
    complete_donors: row.complete_donors,
    incomplete_donors: row.incomplete_donors,
    missing_phone: row.missing_phone,
    missing_pan: row.missing_pan,
  };
}

function computeAuditScore(completeDonors, totalDonors) {
  if (totalDonors === 0) return 100;
  return Math.round((completeDonors / totalDonors) * 100);
}

async function countPendingReviews(pool, organizationId, organizationName) {
  const result = await pool.query(
    `SELECT COUNT(don.id)::int AS count
     FROM donations don
     WHERE don.organization_id = $1
       AND don.requires_review = true`,
    [organizationId],
  );
  return result.rows[0].count;
}

async function fetchDraftMissingFieldCounts(pool, organizationId, organizationName) {
  const result = await pool.query(
    `SELECT field, COUNT(*)::int AS count
     FROM donations don
     CROSS JOIN LATERAL unnest(COALESCE(don.missing_fields, '{}')) AS field
     WHERE don.organization_id = $1
       AND don.requires_review = true
       AND COALESCE(don.record_status, 'completed') = 'draft'
     GROUP BY field
     ORDER BY count DESC`,
    [organizationId],
  );

  const counts = {};
  for (const field of CRITICAL_FIELDS) {
    counts[field] = 0;
  }
  for (const row of result.rows) {
    if (CRITICAL_FIELDS.includes(row.field)) {
      counts[row.field] = row.count;
    }
  }
  return counts;
}

function buildDraftFieldAlerts(draftFieldCounts) {
  const alerts = [];

  for (const field of CRITICAL_FIELDS) {
    const count = draftFieldCounts[field];
    if (count <= 0) continue;

    const label = FIELD_LABELS[field] || field.replace('_', ' ');
    alerts.push({
      id: `draft_missing_${field}`,
      tone: 'warning',
      title: `${count} draft record${count === 1 ? '' : 's'} missing ${label}`,
      description: 'Saved from document upload with incomplete data. Complete the missing values below.',
      action: 'Fix now',
      filter_key: `draft_missing_${field}`,
    });
  }

  return alerts;
}

function buildAlerts({
  donorStats,
  pendingReviews,
  draftFieldCounts,
  fcraDeadline,
  fcraDaysLeft,
}) {
  const alerts = [];
  const { missing_phone: missingPhone, missing_pan: missingPan, incomplete_donors: incompleteDonors } =
    donorStats;

  if (missingPhone > 0) {
    alerts.push({
      id: 'missing_phone',
      tone: 'danger',
      title: `${missingPhone} donor${missingPhone === 1 ? '' : 's'} missing mobile number`,
      description: 'Every donor must have a contact number on file for audit compliance.',
      action: 'Add mobile',
      filter_key: 'missing_phone',
    });
  }

  if (missingPan > 0) {
    alerts.push({
      id: 'missing_pan',
      tone: 'warning',
      title: `${missingPan} donor${missingPan === 1 ? '' : 's'} missing PAN card`,
      description: 'PAN is required on donor records for tax and audit compliance.',
      action: 'Add PAN',
      filter_key: 'missing_pan',
    });
  }

  alerts.push(...buildDraftFieldAlerts(draftFieldCounts));

  const draftFieldTotal = Object.values(draftFieldCounts).reduce((sum, n) => sum + n, 0);
  if (pendingReviews > 0 && draftFieldTotal === 0) {
    alerts.push({
      id: 'pending_review',
      tone: 'warning',
      title: `${pendingReviews} draft record${pendingReviews === 1 ? '' : 's'} need review`,
      description: 'Uploaded documents saved as drafts with missing values.',
      action: 'Review now',
      filter_key: 'pending_review',
    });
  } else if (pendingReviews > 0 && draftFieldTotal > 0) {
    alerts.push({
      id: 'pending_review',
      tone: 'warning',
      title: `${pendingReviews} draft upload${pendingReviews === 1 ? '' : 's'} awaiting completion`,
      description: `${draftFieldTotal} field${draftFieldTotal === 1 ? '' : 's'} still missing across your saved drafts.`,
      action: 'Review all',
      filter_key: 'pending_review',
    });
  }

  if (fcraDaysLeft <= 30) {
    alerts.push({
      id: 'fcra_deadline',
      tone: 'warning',
      title: `FCRA quarterly report due in ${fcraDaysLeft} day${fcraDaysLeft === 1 ? '' : 's'}`,
      description: `Filing deadline: ${formatDisplayDate(fcraDeadline)}.`,
      action: 'Start filing',
      filter_key: null,
    });
  }

  if (incompleteDonors === 0 && donorStats.total_donors > 0) {
    alerts.push({
      id: 'donor_details_complete',
      tone: 'success',
      title: 'All donor contact details complete',
      description: `All ${donorStats.total_donors} donors have mobile number and PAN on file.`,
      action: 'View',
      filter_key: null,
    });
  }

  alerts.push({
    id: 'trust_registration',
    tone: 'success',
    title: 'Trust registration is valid',
    description: 'Renews on 14 Mar 2028.',
    action: 'View',
    filter_key: null,
  });

  alerts.push({
    id: 'certificates',
    tone: 'success',
    title: '12A & 80G certificates uploaded',
    description: 'All audit-required certificates are on file.',
    action: 'View',
    filter_key: null,
  });

  return alerts;
}

function buildScoreMessage(score, donorStats) {
  const { total_donors: total, complete_donors: complete, incomplete_donors: incomplete } = donorStats;

  if (total === 0) {
    return 'Add donors to start tracking compliance readiness.';
  }
  if (score >= 100) {
    return `All ${total} donors have complete mobile & PAN details.`;
  }
  if (score >= 80) {
    return `${complete} of ${total} donors have full details. Fix ${incomplete} below to reach 100.`;
  }
  if (score >= 60) {
    return `${complete} of ${total} donors have full details. Several records still need mobile or PAN.`;
  }
  return `Only ${complete} of ${total} donors have complete details. Address missing mobile & PAN below.`;
}

async function fetchComplianceSummary(pool, organizationId, organizationName) {
  const [donorStats, pendingReviews, draftFieldCounts] = await Promise.all([
    fetchDonorDetailStats(pool, organizationId, organizationName),
    countPendingReviews(pool, organizationId, organizationName),
    fetchDraftMissingFieldCounts(pool, organizationId, organizationName),
  ]);

  const fcraDeadline = nextFcraDeadline();
  const fcraDaysLeft = daysUntil(fcraDeadline);

  const score = computeAuditScore(donorStats.complete_donors, donorStats.total_donors);

  const draftFieldAlerts = buildDraftFieldAlerts(draftFieldCounts).length;
  const actionableIssues =
    (donorStats.missing_phone > 0 ? 1 : 0) +
    (donorStats.missing_pan > 0 ? 1 : 0) +
    (pendingReviews > 0 ? 1 : 0) +
    (draftFieldAlerts > 0 ? 1 : 0) +
    (fcraDaysLeft <= 30 ? 1 : 0);

  const alerts = buildAlerts({
    donorStats,
    pendingReviews,
    draftFieldCounts,
    fcraDeadline,
    fcraDaysLeft,
  });

  return {
    score,
    updated_at: new Date().toISOString(),
    message: buildScoreMessage(score, donorStats),
    actionable_issues: actionableIssues,
    alerts,
    counts: {
      total_donors: donorStats.total_donors,
      complete_donors: donorStats.complete_donors,
      incomplete_donors: donorStats.incomplete_donors,
      missing_phone: donorStats.missing_phone,
      missing_pan: donorStats.missing_pan,
      pending_reviews: pendingReviews,
      draft_missing_fields: draftFieldCounts,
    },
  };
}

module.exports = {
  fetchComplianceSummary,
  fetchDonorDetailStats,
  computeAuditScore,
  isFilled,
};
