const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');
const { resolveOrganizationContext } = require('../utils/resolveOrganizationId');
const { formatDateOnlyLocal } = require('../utils/dateRanges');
const { fetchOrganizationDonationTotal } = require('../utils/donationTotals');
const { inferDonorCategory, matchesFilter, donorScopeSql } = require('../utils/donorHelpers');

async function requireOrganizationContext(req, res) {
  const ctx = await resolveOrganizationContext(req);
  if (typeof ctx === 'object' && ctx?.error) {
    res.status(400).json({ error: 'Missing organization_id.', hint: ctx.message });
    return null;
  }
  return ctx;
}

async function fetchDonorStats(organizationId, organizationName) {
  const monthStart = formatDateOnlyLocal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const scope = donorScopeSql(1, 2);
  const params = [organizationId, organizationName];

  const [totalRes, repeatRes, newRes, lifetimeRes] = await Promise.all([
    pool.query(`SELECT COUNT(DISTINCT dr.id)::int AS count ${scope}`, params),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM (
         SELECT don.donor_id FROM donations don
         INNER JOIN donors dr ON dr.id = don.donor_id AND dr.organization_id = don.organization_id
         WHERE don.organization_id = $1
           AND ($2::text IS NULL OR LOWER(TRIM(dr.name)) <> LOWER(TRIM($2)))
         GROUP BY don.donor_id HAVING COUNT(*) > 1
       ) t`,
      params,
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM (
         SELECT don.donor_id, MIN(don.date) AS first_date
         FROM donations don
         INNER JOIN donors dr ON dr.id = don.donor_id AND dr.organization_id = don.organization_id
         WHERE don.organization_id = $1
           AND ($2::text IS NULL OR LOWER(TRIM(dr.name)) <> LOWER(TRIM($2)))
         GROUP BY don.donor_id
         HAVING MIN(don.date) >= $3::date
       ) t`,
      [...params, monthStart],
    ),
    fetchOrganizationDonationTotal(organizationId, organizationName),
  ]);

  return {
    total_donors: totalRes.rows[0].count,
    repeat_donors: repeatRes.rows[0].count,
    new_this_month: newRes.rows[0].count,
    lifetime_value: lifetimeRes,
  };
}

async function buildDonorSummaries(organizationId, organizationName, search, filter) {
  const params = [organizationId, organizationName];
  let searchClause = '';
  if (search) {
    params.push(`%${search}%`);
    searchClause = `AND dr.name ILIKE $${params.length}`;
  }

  const result = await pool.query(
    `SELECT
      dr.id,
      dr.name,
      COUNT(don.id)::int AS donation_count,
      COALESCE(SUM(don.amount), 0) AS lifetime_amount,
      MAX(don.date) AS last_donation_date,
      MIN(don.date) AS first_donation_date
     ${donorScopeSql(1, 2)}
     ${searchClause}
     GROUP BY dr.id, dr.name
     ORDER BY lifetime_amount DESC, dr.name ASC`,
    params,
  );

  return result.rows
    .map((row) => {
      const category = inferDonorCategory(row.name, row.donation_count, row.first_donation_date);
      return {
        id: row.id,
        name: row.name,
        phone: null,
        pan: null,
        donation_count: row.donation_count,
        lifetime_amount: parseFloat(row.lifetime_amount),
        last_donation_date: row.last_donation_date,
        first_donation_date: row.first_donation_date,
        category,
      };
    })
    .filter((donor) =>
      matchesFilter(donor.category, donor.donation_count, donor.first_donation_date, filter),
    );
}

async function buildDonationLedgerRows(organizationId, organizationName, search, filter) {
  const donors = await buildDonorSummaries(organizationId, organizationName, search, filter);
  if (donors.length === 0) return [];

  const donorIds = donors.map((d) => d.id);
  const donorMeta = new Map(donors.map((d) => [d.id, d]));

  const ledgerResult = await pool.query(
    `SELECT
      don.id,
      don.donor_id,
      don.amount,
      don.date,
      don.payment_mode
     FROM donations don
     WHERE don.organization_id = $1 AND don.donor_id = ANY($2::uuid[])
     ORDER BY don.date DESC, don.id DESC`,
    [organizationId, donorIds],
  );

  return ledgerResult.rows.map((row) => {
    const donor = donorMeta.get(row.donor_id);
    return {
      donation_id: row.id,
      donor_name: donor?.name ?? 'Unknown Donor',
      donor_type: donor?.category ?? 'Repeat',
      contact: donor?.phone ?? null,
      pan: donor?.pan ?? null,
      date: row.date,
      payment_mode: row.payment_mode,
      amount: parseFloat(row.amount),
    };
  });
}

router.get('/', verifyToken, async (req, res) => {
  try {
    const ctx = await requireOrganizationContext(req, res);
    if (!ctx) return;

    const { organizationId, organizationName } = ctx;
    const search = (req.query.search || '').toString().trim();
    const filter = (req.query.filter || 'all').toString().trim().toLowerCase();

    const donors = await buildDonorSummaries(organizationId, organizationName, search, filter);
    const stats = await fetchDonorStats(organizationId, organizationName);

    res.status(200).json({
      message: 'Donors fetched successfully',
      stats,
      donors,
    });
  } catch (error) {
    console.error('Donors List Error:', error);
    res.status(500).json({ error: 'Failed to fetch donors.' });
  }
});

/** JSON payload for PDF / CSV exports — one row per donation. */
router.get('/export', verifyToken, async (req, res) => {
  try {
    const ctx = await requireOrganizationContext(req, res);
    if (!ctx) return;

    const { organizationId, organizationName } = ctx;
    const search = (req.query.search || '').toString().trim();
    const filter = (req.query.filter || 'all').toString().trim().toLowerCase();

    const stats = await fetchDonorStats(organizationId, organizationName);
    const rows = await buildDonationLedgerRows(organizationId, organizationName, search, filter);

    res.status(200).json({
      template: 'donors-ledger',
      message: 'Export data prepared successfully',
      meta: {
        organization_name: organizationName,
        generated_at: new Date().toISOString(),
        filter,
        search: search || null,
        row_count: rows.length,
      },
      stats,
      rows,
    });
  } catch (error) {
    console.error('Donors Export Error:', error);
    res.status(500).json({ error: 'Failed to prepare donor export.' });
  }
});

module.exports = router;
