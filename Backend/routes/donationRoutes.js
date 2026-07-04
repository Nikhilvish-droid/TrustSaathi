const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');
const { resolveOrganizationId, resolveOrganizationContext } = require('../utils/resolveOrganizationId');
const { getPeriodRanges, buildLifetimeRanges } = require('../utils/dateRanges');
const { fetchChartOverview } = require('../utils/chartOverview');
const { fetchOrganizationDonationTotal, fetchDonationAggregateStats, scopedDonationsWhere, buildScopedDonationParams } = require('../utils/donationTotals');
const { upsertDonorAndInsertDonation } = require('../utils/donationInsert');

async function requireOrganizationId(req, res) {
  const orgResult = await resolveOrganizationId(req);
  if (typeof orgResult === 'object' && orgResult?.error) {
    res.status(400).json({ error: 'Missing organization_id.', hint: orgResult.message });
    return null;
  }
  return orgResult;
}

// 1. CREATE A DONATION (manual entry)
router.post('/', verifyToken, async (req, res) => {
  const organizationId = await requireOrganizationId(req, res);
  if (!organizationId) return;

  const { donor_name, amount, date, payment_mode } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await upsertDonorAndInsertDonation(
      client,
      organizationId,
      { donor_name, amount, date, payment_mode },
      { confidenceScore: 1, requiresReview: false },
    );

    if (result.error) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: result.error, missing_fields: result.missing_fields });
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Donation saved successfully!',
      donation: result.donation,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create Donation Error:', error);
    res.status(500).json({ error: 'Failed to save donation.' });
  } finally {
    client.release();
  }
});

// 2. GET ALL DONATIONS (With Pagination for Production Performance)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const organizationId = await requireOrganizationId(req, res);
    if (!organizationId) return;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM donations WHERE organization_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3',
      [organizationId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM donations WHERE organization_id = $1',
      [organizationId]
    );
    const totalRecords = parseInt(countResult.rows[0].count);

    res.status(200).json({
      message: 'Donations fetched successfully',
      total_records: totalRecords,
      current_page: page,
      total_pages: Math.ceil(totalRecords / limit),
      donations: result.rows,
    });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to fetch donations.' });
  }
});

// 3. UPDATE ANY DONATION (With strict data validation)
router.put('/update/:id', verifyToken, async (req, res) => {
  const donationId = req.params.id;
  const organizationId = await requireOrganizationId(req, res);
  if (!organizationId) return;

  const { donor_name, amount, payment_mode, date } = req.body;

  if (!donor_name || amount === undefined || !payment_mode || !date) {
    return res.status(400).json({ error: 'Please provide donor name, amount, payment mode, and date.' });
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a valid number greater than zero.' });
  }

  if (isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD.' });
  }

  try {
    const result = await pool.query(
      `UPDATE donations 
       SET donor_name = $1, amount = $2, payment_mode = $3, date = $4, requires_review = false 
       WHERE id = $5 AND organization_id = $6 
       RETURNING *`,
      [donor_name.trim(), numericAmount, payment_mode.trim(), date, donationId, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donation record not found or unauthorized.' });
    }

    res.status(200).json({
      message: 'Donation record updated successfully!',
      donation: result.rows[0],
    });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ error: 'Failed to update donation record.' });
  }
});

// 4. DELETE A DONATION
router.delete('/delete/:id', verifyToken, async (req, res) => {
  const donationId = req.params.id;
  const organizationId = await requireOrganizationId(req, res);
  if (!organizationId) return;

  try {
    const result = await pool.query(
      'DELETE FROM donations WHERE id = $1 AND organization_id = $2 RETURNING id',
      [donationId, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donation record not found or unauthorized.' });
    }

    res.status(200).json({
      message: 'Donation record has been deleted permanently from the ledger.',
      deleted_id: donationId,
    });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete donation record.' });
  }
});

// 5. GET TOP DONORS (lifetime, org-wide)
router.get('/top-donors', verifyToken, async (req, res) => {
  try {
    const organizationId = await requireOrganizationId(req, res);
    if (!organizationId) return;

    const orgCtx = await resolveOrganizationContext(req);
    const orgName = orgCtx?.error ? null : orgCtx.organizationName;
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

    const result = await pool.query(
      `SELECT 
        dr.name AS donor_name,
        COUNT(don.id)::int AS donation_count,
        COALESCE(SUM(don.amount), 0) AS total_amount
       FROM donations don
       INNER JOIN donors dr ON dr.id = don.donor_id AND dr.organization_id = don.organization_id
       WHERE don.organization_id = $1
         AND ($3::text IS NULL OR LOWER(TRIM(dr.name)) <> LOWER(TRIM($3)))
       GROUP BY dr.id, dr.name
       ORDER BY total_amount DESC
       LIMIT $2`,
      [organizationId, limit, orgName],
    );

    res.status(200).json({
      message: 'Top donors fetched successfully',
      donors: result.rows.map((row) => ({
        name: row.donor_name,
        donation_count: row.donation_count,
        total_amount: parseFloat(row.total_amount),
      })),
    });
  } catch (error) {
    console.error('Top Donors Error:', error);
    res.status(500).json({ error: 'Failed to fetch top donors.' });
  }
});

// 6. GET RECENT DONATIONS
router.get('/recent', verifyToken, async (req, res) => {
  try {
    const organizationId = await requireOrganizationId(req, res);
    if (!organizationId) return;

    const orgCtx = await resolveOrganizationContext(req);
    const orgName = orgCtx?.error ? null : orgCtx.organizationName;
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

    const result = await pool.query(
      `SELECT 
        don.id,
        dr.name AS donor_name,
        don.amount,
        don.date,
        don.payment_mode
       FROM donations don
       INNER JOIN donors dr ON dr.id = don.donor_id AND dr.organization_id = don.organization_id
       WHERE don.organization_id = $1
         AND ($3::text IS NULL OR LOWER(TRIM(dr.name)) <> LOWER(TRIM($3)))
       ORDER BY don.date DESC, don.id DESC
       LIMIT $2`,
      [organizationId, limit, orgName],
    );

    res.status(200).json({
      message: 'Recent donations fetched successfully',
      donations: result.rows.map((row) => ({
        id: row.id,
        donor_name: row.donor_name,
        amount: parseFloat(row.amount),
        date: row.date,
        payment_mode: row.payment_mode,
      })),
    });
  } catch (error) {
    console.error('Recent Donations Error:', error);
    res.status(500).json({ error: 'Failed to fetch recent donations.' });
  }
});

// 7. GET ANALYTICS SUMMARY (period-aware KPIs with comparison)
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const organizationId = await requireOrganizationId(req, res);
    if (!organizationId) return;

    const orgCtx = await resolveOrganizationContext(req);
    const orgName = orgCtx?.error ? null : orgCtx.organizationName;

    const period = (req.query.period || 'month').toString();

    let ranges;
    if (period === 'lifetime') {
      const minResult = await pool.query(
        'SELECT MIN(date) AS first_date FROM donations WHERE organization_id = $1',
        [organizationId],
      );
      ranges = buildLifetimeRanges(minResult.rows[0]?.first_date);
    } else {
      ranges = getPeriodRanges(period);
    }

    if (!ranges) {
      return res.status(400).json({ error: 'Invalid period. Use today, month, fy, or lifetime.' });
    }

    const current = await fetchDonationStats(
      organizationId,
      ranges.current.start,
      ranges.current.end,
      orgName,
    );
    const previous = await fetchDonationStats(
      organizationId,
      ranges.previous.start,
      ranges.previous.end,
      orgName,
    );
    const registeredDonors = await fetchRegisteredDonorCount(organizationId, orgName);
    const lifetimeFunds = await fetchOrganizationDonationTotal(organizationId, orgName);
    const paymentModes = await fetchPaymentModeBreakdown(
      organizationId,
      ranges.current.start,
      ranges.current.end,
      orgName,
    );
    const chartOverview = await fetchChartOverview(pool, organizationId, period, ranges, orgName);

    const data = {
      period,
      period_label: ranges.label,
      chart_subtitle: chartOverview.subtitle,
      chart_badge: chartOverview.badge,
      total_funds: current.total_funds,
      lifetime_funds: lifetimeFunds,
      total_donors: current.total_donors,
      registered_donors: registeredDonors,
      total_donations: current.total_donations,
      avg_donation: current.avg_donation,
      max_donation: current.max_donation,
      min_donation: current.min_donation,
      pending_reviews: current.pending_reviews,
      payment_modes: paymentModes,
      chart_overview: chartOverview.points,
      changes: {
        total_funds: calcPercentChange(current.total_funds, previous.total_funds),
        total_donations: calcPercentChange(current.total_donations, previous.total_donations),
        total_donors: calcPercentChange(current.total_donors, previous.total_donors),
        avg_donation: calcPercentChange(current.avg_donation, previous.avg_donation),
        max_donation: calcPercentChange(current.max_donation, previous.max_donation),
        min_donation: calcPercentChange(current.min_donation, previous.min_donation),
      },
    };

    res.status(200).json({
      message: 'Analytics fetched successfully',
      data,
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary.' });
  }
});

function calcPercentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

async function fetchRegisteredDonorCount(organizationId, organizationName = null) {
  const result = await pool.query(
    `SELECT COUNT(DISTINCT dr.id)::int AS count
     FROM donors dr
     INNER JOIN donations don ON don.donor_id = dr.id AND don.organization_id = dr.organization_id
     WHERE dr.organization_id = $1
       AND ($2::text IS NULL OR LOWER(TRIM(dr.name)) <> LOWER(TRIM($2)))`,
    [organizationId, organizationName],
  );
  return result.rows[0].count;
}

async function fetchDonationStats(organizationId, startDate, endDate, organizationName = null) {
  return fetchDonationAggregateStats(organizationId, organizationName, startDate, endDate);
}

async function fetchPaymentModeBreakdown(organizationId, startDate, endDate, organizationName = null) {
  const { params, dateClause } = buildScopedDonationParams(
    organizationId,
    organizationName,
    startDate,
    endDate,
  );

  const result = await pool.query(
    `SELECT 
      COALESCE(NULLIF(TRIM(don.payment_mode), ''), 'Unknown') AS mode,
      COUNT(don.id)::int AS count,
      COALESCE(SUM(don.amount), 0) AS amount
     FROM donations don
     LEFT JOIN donors dr ON dr.id = don.donor_id AND dr.organization_id = don.organization_id
     WHERE ${scopedDonationsWhere(1, 2)}
       ${dateClause}
     GROUP BY mode
     ORDER BY count DESC`,
    params,
  );

  const totalCount = result.rows.reduce((sum, row) => sum + row.count, 0);

  return result.rows.map((row) => ({
    mode: row.mode,
    count: row.count,
    amount: parseFloat(row.amount),
    percent: totalCount > 0 ? Number(((row.count / totalCount) * 100).toFixed(1)) : 0,
  }));
}

module.exports = router;
