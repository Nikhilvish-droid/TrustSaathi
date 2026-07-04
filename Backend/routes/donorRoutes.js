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

function complianceFilterClause(complianceFilter, params) {
  switch ((complianceFilter || '').toLowerCase()) {
    case 'missing_phone':
      return `AND (dr.phone IS NULL OR TRIM(dr.phone) = '')`;
    case 'missing_pan':
      return `AND (dr.pan IS NULL OR TRIM(dr.pan) = '')`;
    case 'pending_review':
      return `AND EXISTS (
        SELECT 1 FROM donations don2
        WHERE don2.donor_id = dr.id
          AND don2.organization_id = dr.organization_id
          AND don2.requires_review = true
      )`;
    default: {
      const draftMatch = (complianceFilter || '').match(/^draft_missing_(.+)$/);
      if (draftMatch) {
        const field = draftMatch[1];
        params.push(field);
        return `AND EXISTS (
          SELECT 1 FROM donations don2
          WHERE don2.donor_id = dr.id
            AND don2.organization_id = dr.organization_id
            AND don2.requires_review = true
            AND COALESCE(don2.record_status, 'completed') = 'draft'
            AND $${params.length} = ANY(COALESCE(don2.missing_fields, '{}'))
        )`;
      }
      return '';
    }
  }
}

async function buildDonorSummaries(organizationId, organizationName, search, filter, complianceFilter) {
  const params = [organizationId, organizationName];
  let searchClause = '';
  if (search) {
    params.push(`%${search}%`);
    searchClause = `AND dr.name ILIKE $${params.length}`;
  }
  const complianceClause = complianceFilterClause(complianceFilter, params);

  const result = await pool.query(
    `SELECT
      dr.id,
      dr.name,
      dr.phone,
      dr.pan,
      COUNT(don.id)::int AS donation_count,
      COALESCE(SUM(don.amount), 0) AS lifetime_amount,
      MAX(don.date) AS last_donation_date,
      MIN(don.date) AS first_donation_date,
      (
        SELECT don2.id FROM donations don2
        WHERE don2.donor_id = dr.id AND don2.organization_id = dr.organization_id
        ORDER BY don2.date DESC, don2.id DESC LIMIT 1
      ) AS last_donation_id,
      (
        SELECT don2.amount FROM donations don2
        WHERE don2.donor_id = dr.id AND don2.organization_id = dr.organization_id
        ORDER BY don2.date DESC, don2.id DESC LIMIT 1
      ) AS last_donation_amount,
      (
        SELECT don2.payment_mode FROM donations don2
        WHERE don2.donor_id = dr.id AND don2.organization_id = dr.organization_id
        ORDER BY don2.date DESC, don2.id DESC LIMIT 1
      ) AS last_donation_payment_mode
     ${donorScopeSql(1, 2)}
     ${searchClause}
     ${complianceClause}
     GROUP BY dr.id, dr.name, dr.phone, dr.pan
     ORDER BY lifetime_amount DESC, dr.name ASC`,
    params,
  );

  return result.rows
    .map((row) => {
      const category = inferDonorCategory(row.name, row.donation_count, row.first_donation_date);
      return {
        id: row.id,
        name: row.name,
        phone: row.phone || null,
        pan: row.pan || null,
        donation_count: row.donation_count,
        lifetime_amount: parseFloat(row.lifetime_amount),
        last_donation_date: row.last_donation_date,
        first_donation_date: row.first_donation_date,
        last_donation_id: row.last_donation_id || null,
        last_donation_amount:
          row.last_donation_amount != null ? parseFloat(row.last_donation_amount) : null,
        last_donation_payment_mode: row.last_donation_payment_mode || null,
        category,
      };
    })
    .filter((donor) =>
      matchesFilter(donor.category, donor.donation_count, donor.first_donation_date, filter),
    );
}

async function buildDonationLedgerRows(organizationId, organizationName, search, filter, complianceFilter) {
  const donors = await buildDonorSummaries(organizationId, organizationName, search, filter, complianceFilter);
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
    const complianceFilter = (req.query.compliance_filter || '').toString().trim().toLowerCase();

    const donors = await buildDonorSummaries(
      organizationId,
      organizationName,
      search,
      filter,
      complianceFilter || null,
    );
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
    const complianceFilter = (req.query.compliance_filter || '').toString().trim().toLowerCase();

    const stats = await fetchDonorStats(organizationId, organizationName);
    const rows = await buildDonationLedgerRows(
      organizationId,
      organizationName,
      search,
      filter,
      complianceFilter || null,
    );

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

router.get('/:id/donations', verifyToken, async (req, res) => {
  try {
    const ctx = await requireOrganizationContext(req, res);
    if (!ctx) return;

    const { organizationId } = ctx;
    const donorId = req.params.id;

    const donorCheck = await pool.query(
      'SELECT id FROM donors WHERE id = $1 AND organization_id = $2',
      [donorId, organizationId],
    );
    if (donorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Donor not found or unauthorized.' });
    }

    const result = await pool.query(
      `SELECT id, amount, date, payment_mode
       FROM donations
       WHERE donor_id = $1 AND organization_id = $2
       ORDER BY date DESC, id DESC`,
      [donorId, organizationId],
    );

    res.status(200).json({
      message: 'Donor donations fetched successfully',
      donations: result.rows.map((row) => ({
        id: row.id,
        amount: parseFloat(row.amount),
        date: row.date,
        payment_mode: row.payment_mode,
      })),
    });
  } catch (error) {
    console.error('Donor Donations Error:', error);
    res.status(500).json({ error: 'Failed to fetch donor donations.' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const ctx = await requireOrganizationContext(req, res);
    if (!ctx) return;

    const { organizationId } = ctx;
    const donorId = req.params.id;
    const { name, phone, pan } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Donor name is required.' });
    }

    const normalizedPan = pan != null && String(pan).trim() ? String(pan).trim().toUpperCase() : null;
    const normalizedPhone = phone != null && String(phone).trim() ? String(phone).trim() : null;

    const result = await pool.query(
      `UPDATE donors
       SET name = $1, phone = $2, pan = $3
       WHERE id = $4 AND organization_id = $5
       RETURNING id, name, phone, pan`,
      [String(name).trim(), normalizedPhone, normalizedPan, donorId, organizationId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donor not found or unauthorized.' });
    }

    res.status(200).json({
      message: 'Donor updated successfully',
      donor: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A donor with this name already exists for your organization.' });
    }
    console.error('Donor Update Error:', error);
    res.status(500).json({ error: 'Failed to update donor.' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const ctx = await requireOrganizationContext(req, res);
    if (!ctx) return;

    const { organizationId } = ctx;
    const donorId = req.params.id;

    await client.query('BEGIN');

    const donorCheck = await client.query(
      'SELECT id FROM donors WHERE id = $1 AND organization_id = $2',
      [donorId, organizationId],
    );
    if (donorCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Donor not found or unauthorized.' });
    }

    await client.query(
      'DELETE FROM donations WHERE donor_id = $1 AND organization_id = $2',
      [donorId, organizationId],
    );
    await client.query(
      'DELETE FROM donors WHERE id = $1 AND organization_id = $2',
      [donorId, organizationId],
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Donor and associated donations deleted successfully',
      deleted_id: donorId,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Donor Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete donor.' });
  } finally {
    client.release();
  }
});

module.exports = router;
