const CRITICAL_FIELDS = ['donor_name', 'amount', 'date', 'payment_mode'];
const LOW_CONFIDENCE = 0.85;

function rowMissingFields(row) {
  const missing = [];
  if (!row.donor_name || !String(row.donor_name).trim()) missing.push('donor_name');
  if (row.amount == null || Number.isNaN(Number(row.amount)) || Number(row.amount) <= 0) {
    missing.push('amount');
  }
  if (!row.date) missing.push('date');
  if (!row.payment_mode || !String(row.payment_mode).trim()) missing.push('payment_mode');
  return missing;
}

/** Document-level missing field union + per-row flags for the review UI. */
function enrichExtractResponse(payload) {
  const rows = Array.isArray(payload.extracted_data) ? payload.extracted_data : [];
  const missingSet = new Set();

  const extracted_data = rows.map((row) => {
    const missing = rowMissingFields(row);
    missing.forEach((f) => missingSet.add(f));
    const confidence = parseFloat(row.confidence_score);
    const lowConfidence = Number.isNaN(confidence) ? true : confidence < LOW_CONFIDENCE;

    return {
      ...row,
      _missing_fields: missing,
      _low_confidence: lowConfidence,
    };
  });

  const ai_analysis = payload.ai_analysis ?? {
    is_complete: missingSet.size === 0 && extracted_data.every((r) => !r._low_confidence),
    missing_fields: [...missingSet],
  };

  return {
    ...payload,
    status: payload.status ?? 'success',
    extracted_data,
    ai_analysis,
  };
}

module.exports = { enrichExtractResponse, rowMissingFields, CRITICAL_FIELDS, LOW_CONFIDENCE };
