const pool = require('../config/db');
const { formatDateOnlyLocal } = require('./dateRanges');

/**
 * Sum donation amounts for a trust. Optional date range for period KPIs.
 * Uses donations table as source of truth; excludes rows where donor name
 * equals the trust's own organization name (bad upload guard).
 */
async function fetchOrganizationDonationTotal(organizationId, organizationName = null, startDate = null, endDate = null) {
  const params = [organizationId, organizationName];
  let dateClause = '';

  if (startDate && endDate) {
    params.push(formatDateOnlyLocal(startDate), formatDateOnlyLocal(endDate));
    dateClause = `AND don.date >= $${params.length - 1}::date AND don.date <= $${params.length}::date`;
  }

  const result = await pool.query(
    `SELECT COALESCE(SUM(don.amount), 0) AS total
     FROM donations don
     LEFT JOIN donors dr ON dr.id = don.donor_id AND dr.organization_id = don.organization_id
     WHERE don.organization_id = $1
       AND ($2::text IS NULL OR dr.id IS NULL OR LOWER(TRIM(dr.name)) <> LOWER(TRIM($2)))
       ${dateClause}`,
    params,
  );

  return parseFloat(result.rows[0].total);
}

module.exports = { fetchOrganizationDonationTotal };
