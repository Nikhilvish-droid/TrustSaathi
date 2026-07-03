const pool = require('../config/db');
const { resolveOrganizationId } = require('../utils/resolveOrganizationId');
const { rowMissingFields, LOW_CONFIDENCE } = require('../utils/aiAnalysis');

const processAIPayload = async (req, res) => {
  const {
    status,
    document_type,
    organization_id,
    record_status,
    is_frontend_corrected,
    manual_review_required,
    compliance_flags,
    data,
    extracted_data,
  } = req.body;

  const records = Array.isArray(data) ? data : extracted_data;
  const effectiveStatus = status ?? 'success';

  if (effectiveStatus !== 'success' || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Invalid data format. Expected status "success" and a data array.' });
  }

  const orgResult = await resolveOrganizationId(req, organization_id);
  if (typeof orgResult === 'object' && orgResult?.error) {
    return res.status(400).json({
      error: 'Missing organization_id.',
      reason: orgResult.error,
      hint: orgResult.message,
    });
  }

  const orgId = orgResult;
  const isDraft = record_status === 'draft' || manual_review_required === true;
  const userCorrected = is_frontend_corrected === true;

  if (!userCorrected && compliance_flags) {
    const needsReview = compliance_flags.needs_manual_review === true;
    const missingFields = compliance_flags.missing_fields || [];

    if (needsReview || missingFields.length > 0) {
      return res.status(200).json({
        status: 'action_required',
        message: 'AI detected missing fields or requires manual review.',
        missing_fields: missingFields,
        raw_data: records,
      });
    }
  }

  if (!isDraft && userCorrected) {
    for (let i = 0; i < records.length; i += 1) {
      const missing = rowMissingFields(records[i]);
      if (missing.length > 0) {
        return res.status(400).json({
          error: `Row ${i + 1} is incomplete. Missing: ${missing.join(', ')}`,
          row_index: i,
          missing_fields: missing,
        });
      }
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const processedRecords = [];

    for (const record of records) {
      const donorName = record.donor_name ? record.donor_name.trim() : 'Unknown Donor';
      const paymentMode = record.payment_mode ? record.payment_mode.trim() : 'Unknown';
      const date = record.date || new Date().toISOString().split('T')[0];

      const amount = parseFloat(record.amount);
      const confidence = parseFloat(record.confidence_score) || 0;

      if (Number.isNaN(amount) || amount <= 0) {
        console.warn(`Skipping invalid amount for donor: ${donorName}`);
        continue;
      }

      const donorResult = await client.query(
        `INSERT INTO donors (organization_id, name) 
         VALUES ($1, $2) 
         ON CONFLICT (name, organization_id) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [orgId, donorName],
      );
      const donorId = donorResult.rows[0].id;

      const rowMissing = rowMissingFields(record);
      const requiresReview =
        isDraft ||
        manual_review_required === true ||
        rowMissing.length > 0 ||
        confidence < LOW_CONFIDENCE;

      const donationResult = await client.query(
        `INSERT INTO donations (organization_id, donor_id, amount, date, payment_mode, confidence_score, requires_review) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id`,
        [orgId, donorId, amount, date, paymentMode, confidence, requiresReview],
      );

      processedRecords.push(donationResult.rows[0].id);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: isDraft
        ? 'Draft saved. Records flagged for manual review.'
        : 'Successfully inserted donation records.',
      record_status: isDraft ? 'draft' : 'completed',
      records_processed: processedRecords.length,
      donation_ids: processedRecords,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database transaction failed. Rolling back changes.', error);
    res.status(500).json({ error: 'Database transaction failed', details: error.message });
  } finally {
    client.release();
  }
};

module.exports = { processAIPayload };
