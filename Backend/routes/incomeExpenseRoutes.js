const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');
const { resolveOrganizationId, resolveOrganizationContext } = require('../utils/resolveOrganizationId');

async function requireOrganizationId(req, res) {
  const orgResult = await resolveOrganizationId(req);
  if (typeof orgResult === 'object' && orgResult?.error) {
    res.status(400).json({ error: 'Missing organization_id.', hint: orgResult.message });
    return null;
  }
  return orgResult;
}

const VALID_TYPES = new Set(['Income', 'Expense']);

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function toLocalDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeDate(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (DATE_ONLY_RE.test(str)) return str;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return toLocalDateString(d);
}

const TRANSACTION_COLUMNS = `
  id, organization_id, created_by, type, category, note, amount,
  to_char(date, 'YYYY-MM-DD') AS date,
  created_at, updated_at
`;

async function requireOrganizationContext(req, res) {
  const ctx = await resolveOrganizationContext(req);
  if (typeof ctx === 'object' && ctx?.error) {
    res.status(400).json({ error: 'Missing organization_id.', hint: ctx.message });
    return null;
  }
  return ctx;
}

function monthStartLocal() {
  const d = new Date();
  return toLocalDateString(new Date(d.getFullYear(), d.getMonth(), 1));
}

async function fetchIncomeExpenseExportStats(organizationId, type) {
  const monthStart = monthStartLocal();
  const [allRes, monthRes] = await Promise.all([
    pool.query(
      `SELECT
         COALESCE(SUM(amount), 0)::float AS total_amount,
         COUNT(*)::int AS total_entries,
         COUNT(DISTINCT category)::int AS categories
       FROM income_expenses
       WHERE organization_id = $1 AND type = $2`,
      [organizationId, type],
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0)::float AS this_month
       FROM income_expenses
       WHERE organization_id = $1 AND type = $2 AND date >= $3::date`,
      [organizationId, type, monthStart],
    ),
  ]);

  const row = allRes.rows[0] || {};
  return {
    total_amount: parseFloat(row.total_amount) || 0,
    total_entries: row.total_entries || 0,
    categories: row.categories || 0,
    this_month: parseFloat(monthRes.rows[0]?.this_month) || 0,
  };
}

async function buildIncomeExpenseExportRows(organizationId, type) {
  const result = await pool.query(
    `SELECT category, note, amount, to_char(date, 'YYYY-MM-DD') AS date
     FROM income_expenses
     WHERE organization_id = $1 AND type = $2
     ORDER BY date DESC, created_at DESC`,
    [organizationId, type],
  );

  return result.rows.map((row) => ({
    date: row.date,
    category: row.category,
    note: row.note || null,
    amount: parseFloat(row.amount),
  }));
}

// GET all income & expense entries for the logged-in organization
router.get('/', verifyToken, async (req, res) => {
  try {
    const organizationId = await requireOrganizationId(req, res);
    if (!organizationId) return;

    const result = await pool.query(
      `SELECT ${TRANSACTION_COLUMNS}
       FROM income_expenses
       WHERE organization_id = $1
       ORDER BY date DESC, created_at DESC`,
      [organizationId],
    );

    res.status(200).json({
      message: 'Income & expense entries fetched successfully',
      transactions: result.rows,
    });
  } catch (error) {
    console.error('Fetch Income/Expense Error:', error);
    if (error.code === '42P01') {
      return res.status(500).json({
        error: 'income_expenses table not found. Run Backend/sql/create_income_expenses.sql in Supabase first.',
      });
    }
    res.status(500).json({ error: 'Failed to fetch income & expense entries.' });
  }
});

/** JSON payload for PDF / CSV / Excel exports — filtered by type (Income or Expense). */
router.get('/export', verifyToken, async (req, res) => {
  try {
    const ctx = await requireOrganizationContext(req, res);
    if (!ctx) return;

    const { organizationId, organizationName } = ctx;
    const type = (req.query.type || 'Income').toString().trim();

    if (!VALID_TYPES.has(type)) {
      return res.status(400).json({ error: 'type must be Income or Expense.' });
    }

    const stats = await fetchIncomeExpenseExportStats(organizationId, type);
    const rows = await buildIncomeExpenseExportRows(organizationId, type);
    const templateId = type === 'Income' ? 'income-report' : 'expense-report';

    res.status(200).json({
      template: templateId,
      message: 'Export data prepared successfully',
      meta: {
        organization_name: organizationName,
        generated_at: new Date().toISOString(),
        type,
        row_count: rows.length,
      },
      stats,
      rows,
    });
  } catch (error) {
    console.error('Income/Expense Export Error:', error);
    if (error.code === '42P01') {
      return res.status(500).json({
        error: 'income_expenses table not found. Run Backend/sql/create_income_expenses.sql in Supabase first.',
      });
    }
    res.status(500).json({ error: 'Failed to prepare income & expense export.' });
  }
});

// CREATE a new income or expense entry
router.post('/', verifyToken, async (req, res) => {
  try {
    const organizationId = await requireOrganizationId(req, res);
    if (!organizationId) return;

    const { type, category, note, amount, date } = req.body;
    const createdBy = req.user?.userId ?? null;

    if (!VALID_TYPES.has(type)) {
      return res.status(400).json({ error: 'type must be Income or Expense.' });
    }
    if (!category || !String(category).trim()) {
      return res.status(400).json({ error: 'category is required.' });
    }

    const parsedAmount = Number(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'amount must be greater than 0.' });
    }

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      return res.status(400).json({ error: 'A valid date is required.' });
    }

    const result = await pool.query(
      `INSERT INTO income_expenses
         (organization_id, created_by, type, category, note, amount, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${TRANSACTION_COLUMNS}`,
      [
        organizationId,
        createdBy,
        type,
        String(category).trim(),
        note ? String(note).trim() : null,
        parsedAmount,
        normalizedDate,
      ],
    );

    res.status(201).json({
      message: `${type} entry saved successfully!`,
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error('Create Income/Expense Error:', error);
    if (error.code === '42P01') {
      return res.status(500).json({
        error: 'income_expenses table not found. Run Backend/sql/create_income_expenses.sql in Supabase first.',
      });
    }
    res.status(500).json({ error: 'Failed to save income & expense entry.' });
  }
});

// UPDATE an income or expense entry
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const organizationId = await requireOrganizationId(req, res);
    if (!organizationId) return;

    const entryId = req.params.id;
    const { type, category, note, amount, date } = req.body;

    if (!VALID_TYPES.has(type)) {
      return res.status(400).json({ error: 'type must be Income or Expense.' });
    }
    if (!category || !String(category).trim()) {
      return res.status(400).json({ error: 'category is required.' });
    }

    const parsedAmount = Number(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'amount must be greater than 0.' });
    }

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      return res.status(400).json({ error: 'A valid date is required.' });
    }

    const result = await pool.query(
      `UPDATE income_expenses
       SET type = $1, category = $2, note = $3, amount = $4, date = $5
       WHERE id = $6 AND organization_id = $7
       RETURNING ${TRANSACTION_COLUMNS}`,
      [
        type,
        String(category).trim(),
        note ? String(note).trim() : null,
        parsedAmount,
        normalizedDate,
        entryId,
        organizationId,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found or unauthorized.' });
    }

    res.status(200).json({
      message: `${type} entry updated successfully!`,
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error('Update Income/Expense Error:', error);
    res.status(500).json({ error: 'Failed to update income & expense entry.' });
  }
});

// DELETE an income or expense entry
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const organizationId = await requireOrganizationId(req, res);
    if (!organizationId) return;

    const entryId = req.params.id;

    const result = await pool.query(
      'DELETE FROM income_expenses WHERE id = $1 AND organization_id = $2 RETURNING id',
      [entryId, organizationId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found or unauthorized.' });
    }

    res.status(200).json({
      message: 'Entry deleted successfully.',
      deleted_id: entryId,
    });
  } catch (error) {
    console.error('Delete Income/Expense Error:', error);
    res.status(500).json({ error: 'Failed to delete income & expense entry.' });
  }
});

module.exports = router;
