const pool = require('../config/db');
const { resolveOrganizationId } = require('../utils/resolveOrganizationId');
const { rowMissingFields, LOW_CONFIDENCE } = require('../utils/aiAnalysis');

function parseAmount(raw) {
  if (raw == null || raw === '') return null;
  const amount = parseFloat(raw);
  if (Number.isNaN(amount) || amount <= 0) return null;
  return amount;
}

function resolveDonorName(record, rowIndex) {
  const trimmed = record.donor_name ? String(record.donor_name).trim() : '';
  if (trimmed) return trimmed;
  return `Draft — Record ${rowIndex + 1}`;
}

async function upsertDonor(client, orgId, name, phone, pan) {
  const donorResult = await client.query(
    `INSERT INTO donors (organization_id, name, phone, pan)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (name, organization_id) DO UPDATE SET
       name = EXCLUDED.name,
       phone = COALESCE(EXCLUDED.phone, donors.phone),
       pan = COALESCE(EXCLUDED.pan, donors.pan)
     RETURNING id`,
    [orgId, name, phone || null, pan || null],
  );
  return donorResult.rows[0].id;
}

async function insertDonation(client, orgId, donorId, record, options) {
  const { isDraft, manualReviewRequired, rowIndex } = options;

  const paymentMode = record.payment_mode ? String(record.payment_mode).trim() : null;
  const date = record.date || null;
  const amount = parseAmount(record.amount);
  const confidence = parseFloat(record.confidence_score) || 0;

  const missingFields = Array.isArray(record.missing_fields) && record.missing_fields.length > 0
    ? record.missing_fields
    : rowMissingFields({
      donor_name: record.donor_name,
      amount: record.amount,
      date: record.date,
      payment_mode: record.payment_mode,
    });

  const requiresReview =
    isDraft ||
    manualReviewRequired === true ||
    missingFields.length > 0 ||
    confidence < LOW_CONFIDENCE;

  const recordStatus = isDraft ? 'draft' : 'completed';

  const donationResult = await client.query(
    `INSERT INTO donations (
       organization_id, donor_id, amount, date, payment_mode,
       confidence_score, requires_review, missing_fields, record_status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      orgId,
      donorId,
      amount,
      date,
      paymentMode,
      confidence,
      requiresReview,
      missingFields,
      recordStatus,
    ],
  );

  return donationResult.rows[0].id;
}

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

    for (let i = 0; i < records.length; i += 1) {
      const record = records[i];
      const amount = parseAmount(record.amount);

      if (!isDraft && (amount == null)) {
        console.warn(`Skipping row ${i + 1}: invalid amount for completed submit.`);
        continue;
      }

      const donorName = resolveDonorName(record, i);
      const donorId = await upsertDonor(
        client,
        orgId,
        donorName,
        record.phone,
        record.pan,
      );

      const donationId = await insertDonation(client, orgId, donorId, record, {
        isDraft,
        manualReviewRequired: manual_review_required,
        rowIndex: i,
      });

      processedRecords.push(donationId);
    }

    if (processedRecords.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: isDraft
          ? 'No rows to save. Add at least one row before saving as draft.'
          : 'No valid records to insert. Check amounts and required fields.',
      });
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: isDraft
        ? 'Draft saved. Records flagged for manual review in Donor Audit.'
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
