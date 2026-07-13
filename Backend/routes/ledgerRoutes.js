const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');
const { resolveOrganizationId } = require('../utils/resolveOrganizationId');

const VALID_TYPES = new Set(['Income', 'Expense']);
const VALID_MODES = new Set(['UPI', 'Cash', 'Bank Transfer', 'Cheque']);
const NOTE_PREFIX = 'TS_LEDGER_META::';

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

function parseLedgerNote(note, type) {
  const fallback = {
    name: type === 'Income' ? 'Income Entry' : 'Expense Entry',
    mode: 'Cash',
    description: note || '',
  };

  if (!note || typeof note !== 'string') return fallback;
  if (!note.startsWith(NOTE_PREFIX)) return fallback;

  try {
    const payload = JSON.parse(note.slice(NOTE_PREFIX.length));
    return {
      name: String(payload?.name || '').trim() || fallback.name,
      mode: VALID_MODES.has(payload?.mode) ? payload.mode : fallback.mode,
      description: String(payload?.description || '').trim(),
    };
  } catch {
    return fallback;
  }
}

function buildLedgerNote({ name, mode, description }) {
  return `${NOTE_PREFIX}${JSON.stringify({
    name: String(name || '').trim(),
    mode,
    description: String(description || '').trim(),
  })}`;
}

function mapRowToLedgerTransaction(row) {
  const noteMeta = parseLedgerNote(row.note, row.type);
  return {
    id: String(row.id),
    date: row.date,
    name: noteMeta.name,
    category: row.category,
    type: row.type,
    mode: noteMeta.mode,
    amount: Number(row.amount),
    description: noteMeta.description || undefined,
  };
}

async function requireOrganizationId(req, res) {
  const orgResult = await resolveOrganizationId(req);
  if (typeof orgResult === 'object' && orgResult?.error) {
    res.status(400).json({ error: 'Missing organization_id.', hint: orgResult.message });
    return null;
  }
  return orgResult;
}

// GET ledger transactions for the logged-in organization
router.get('/', verifyToken, async (req, res) => {
  try {
    const organizationId = await requireOrganizationId(req, res);
    if (!organizationId) return;

    const result = await pool.query(
      `SELECT id, category, type, note, amount, to_char(date, 'YYYY-MM-DD') AS date
       FROM income_expenses
       WHERE organization_id = $1
       ORDER BY date DESC, created_at DESC`,
      [organizationId],
    );

    res.status(200).json({
      message: 'Ledger transactions fetched successfully',
      transactions: result.rows.map(mapRowToLedgerTransaction),
    });
  } catch (error) {
    console.error('Fetch Ledger Error:', error);
    if (error.code === '42P01') {
      return res.status(500).json({
        error: 'income_expenses table not found. Run Backend/sql/create_income_expenses.sql in Supabase first.',
      });
    }
    res.status(500).json({ error: 'Failed to fetch ledger transactions.' });
  }
});

// CREATE a ledger transaction for the logged-in organization
router.post('/', verifyToken, async (req, res) => {
  try {
    const organizationId = await requireOrganizationId(req, res);
    if (!organizationId) return;

    const { date, name, category, type, mode, amount, description } = req.body;
    const createdBy = req.user?.userId ?? null;

    if (!VALID_TYPES.has(type)) {
      return res.status(400).json({ error: 'type must be Income or Expense.' });
    }
    if (!VALID_MODES.has(mode)) {
      return res.status(400).json({ error: 'mode must be UPI, Cash, Bank Transfer, or Cheque.' });
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

    const note = buildLedgerNote({
      name: String(name || '').trim() || (type === 'Income' ? 'Anonymous Donor' : 'Payee'),
      mode,
      description: description || '',
    });

    const result = await pool.query(
      `INSERT INTO income_expenses
         (organization_id, created_by, type, category, note, amount, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, category, type, note, amount, to_char(date, 'YYYY-MM-DD') AS date`,
      [organizationId, createdBy, type, String(category).trim(), note, parsedAmount, normalizedDate],
    );

    res.status(201).json({
      message: `${type} entry saved successfully!`,
      transaction: mapRowToLedgerTransaction(result.rows[0]),
    });
  } catch (error) {
    console.error('Create Ledger Error:', error);
    if (error.code === '42P01') {
      return res.status(500).json({
        error: 'income_expenses table not found. Run Backend/sql/create_income_expenses.sql in Supabase first.',
      });
    }
    res.status(500).json({ error: 'Failed to save ledger transaction.' });
  }
});

module.exports = router;
