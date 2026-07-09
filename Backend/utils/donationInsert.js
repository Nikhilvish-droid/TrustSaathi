const { rowMissingFields } = require('./aiAnalysis');
const { normalizeDonorName } = require('./donorName');

async function upsertDonorAndInsertDonation(client, orgId, record, options = {}) {
  const {
    confidenceScore = 1,
    requiresReview = false,
  } = options;

  const donorName = normalizeDonorName(record.donor_name);
  const paymentMode = record.payment_mode ? String(record.payment_mode).trim() : '';
  const date = record.date;
  const amount = Number(record.amount);

  const missing = rowMissingFields({ donor_name: donorName, amount, date, payment_mode: paymentMode });
  if (missing.length > 0) {
    return { error: `Missing required fields: ${missing.join(', ')}`, missing_fields: missing };
  }

  if (Number.isNaN(amount) || amount <= 0) {
    return { error: 'Amount must be a valid number greater than zero.' };
  }

  if (Number.isNaN(Date.parse(date))) {
    return { error: 'Invalid date format. Please use YYYY-MM-DD.' };
  }

  const donorResult = await client.query(
    `INSERT INTO donors (organization_id, name)
     VALUES ($1, $2)
     ON CONFLICT (name, organization_id) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [orgId, donorName],
  );
  const donorId = donorResult.rows[0].id;

  const donationResult = await client.query(
    `INSERT INTO donations (organization_id, donor_id, amount, date, payment_mode, confidence_score, requires_review)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, amount, date, payment_mode`,
    [orgId, donorId, amount, date, paymentMode, confidenceScore, requiresReview],
  );

  return {
    donation: {
      id: donationResult.rows[0].id,
      donor_id: donorId,
      donor_name: donorName,
      amount: parseFloat(donationResult.rows[0].amount),
      date: donationResult.rows[0].date,
      payment_mode: donationResult.rows[0].payment_mode,
    },
  };
}

module.exports = { upsertDonorAndInsertDonation };
