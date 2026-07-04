const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');
const { resolveOrganizationContext } = require('../utils/resolveOrganizationId');
const { fetchComplianceSummary } = require('../utils/complianceChecks');

async function requireOrganizationContext(req, res) {
  const ctx = await resolveOrganizationContext(req);
  if (typeof ctx === 'object' && ctx?.error) {
    res.status(400).json({ error: 'Missing organization_id.', hint: ctx.message });
    return null;
  }
  return ctx;
}

router.get('/summary', verifyToken, async (req, res) => {
  try {
    const ctx = await requireOrganizationContext(req, res);
    if (!ctx) return;

    const { organizationId, organizationName } = ctx;
    const summary = await fetchComplianceSummary(pool, organizationId, organizationName);

    res.status(200).json({
      message: 'Compliance summary fetched successfully',
      ...summary,
    });
  } catch (error) {
    console.error('Compliance Summary Error:', error);
    res.status(500).json({ error: 'Failed to fetch compliance summary.' });
  }
});

module.exports = router;
