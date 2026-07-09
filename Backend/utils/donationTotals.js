const pool = require('../config/db');
const { formatDateOnlyLocal } = require('./dateRanges');

/**
 * Organization-scoped donation rows for KPIs and charts.
 * All donors count regardless of script (Marathi, Hindi, Gujarati, English, etc.).
 */
function scopedDonationsWhere(orgParamIndex) {
  return `don.organization_id = $${orgParamIndex}`;
}

function buildScopedDonationParams(organizationId, _organizationName = null, startDate = null, endDate = null) {
  const params = [organizationId];
  let dateClause = '';

  if (startDate) {
    params.push(formatDateOnlyLocal(startDate));
    dateClause = `AND don.date >= $${params.length}::date`;
    if (endDate) {
      params.push(formatDateOnlyLocal(endDate));
      dateClause += ` AND don.date <= $${params.length}::date`;
    }
  } else if (endDate) {
    params.push(formatDateOnlyLocal(endDate));
    dateClause = `AND don.date <= $${params.length}::date`;
  }

  return { params, dateClause };
}

/**
 * Sum donation amounts for a trust. Optional date range for period KPIs.
 */
async function fetchOrganizationDonationTotal(organizationId, organizationName = null, startDate = null, endDate = null) {
  const { params, dateClause } = buildScopedDonationParams(
    organizationId,
    organizationName,
    startDate,
    endDate,
  );

  const result = await pool.query(
    `SELECT COALESCE(SUM(don.amount), 0) AS total
     FROM donations don
     LEFT JOIN donors dr ON dr.id = don.donor_id AND dr.organization_id = don.organization_id
     WHERE ${scopedDonationsWhere(1)}
       ${dateClause}`,
    params,
  );

  return parseFloat(result.rows[0].total);
}

/**
 * Period/lifetime KPI aggregates — same donor scope as fetchOrganizationDonationTotal
 * so total, avg, max, and min always refer to the same donation set.
 */
async function fetchDonationAggregateStats(
  organizationId,
  organizationName = null,
  startDate = null,
  endDate = null,
) {
  const { params, dateClause } = buildScopedDonationParams(
    organizationId,
    organizationName,
    startDate,
    endDate,
  );

  const result = await pool.query(
    `SELECT
      COALESCE(SUM(don.amount), 0) AS total_funds,
      COUNT(don.id) AS total_donations,
      COUNT(DISTINCT don.donor_id) AS total_donors,
      COALESCE(AVG(don.amount), 0) AS avg_donation,
      COALESCE(MAX(don.amount), 0) AS max_donation,
      COALESCE(MIN(NULLIF(don.amount, 0)), 0) AS min_donation,
      COUNT(CASE WHEN don.requires_review = true THEN 1 END) AS pending_reviews
     FROM donations don
     LEFT JOIN donors dr ON dr.id = don.donor_id AND dr.organization_id = don.organization_id
     WHERE ${scopedDonationsWhere(1)}
       ${dateClause}`,
    params,
  );

  const stats = result.rows[0];
  return {
    total_funds: parseFloat(stats.total_funds),
    total_donations: parseInt(stats.total_donations, 10),
    total_donors: parseInt(stats.total_donors, 10),
    avg_donation: parseFloat(stats.avg_donation),
    max_donation: parseFloat(stats.max_donation),
    min_donation: parseFloat(stats.min_donation),
    pending_reviews: parseInt(stats.pending_reviews, 10),
  };
}

module.exports = {
  fetchOrganizationDonationTotal,
  fetchDonationAggregateStats,
  scopedDonationsWhere,
  buildScopedDonationParams,
};
