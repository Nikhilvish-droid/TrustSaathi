const pool = require('../config/db');

const processAIPayload = async (req, res) => {
  // 1. We now explicitly require organization_id from the AI payload
  const { status, document_type, organization_id, extracted_data } = req.body;

  if (status !== 'success' || !extracted_data || !Array.isArray(extracted_data)) {
    return res.status(400).json({ error: 'Invalid data format received from AI engine.' });
  }

  // 2. Strict check for the tenant ID
  if (!organization_id) {
    return res.status(400).json({ error: 'Missing organization_id in AI payload. Cannot assign data.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start SQL Transaction

    const processedRecords = [];

    // 3. Loop through extracted AI rows with data sanitization
    for (const record of extracted_data) {
      // Clean text fields, providing safe fallbacks if the AI missed them
      const donorName = record.donor_name ? record.donor_name.trim() : 'Unknown Donor';
      const paymentMode = record.payment_mode ? record.payment_mode.trim() : 'Unknown';
      const date = record.date || new Date().toISOString().split('T')[0]; // Fallback to today if missing
      
      // Strictly parse numbers to prevent database type crashes
      const amount = parseFloat(record.amount);
      const confidence = parseFloat(record.confidence_score) || 0;

      // If the AI hallucinated the amount entirely, skip this specific row but keep processing the rest
      if (isNaN(amount) || amount <= 0) {
        console.warn(`⚠️ Skipping invalid amount for donor: ${donorName}`);
        continue; 
      }

      // A. Insert or Fetch Donor (Handles unique constraint matching)
      const donorResult = await client.query(
        `INSERT INTO donors (organization_id, name) 
         VALUES ($1, $2) 
         ON CONFLICT (name, organization_id) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [organization_id, donorName]
      );
      const donorId = donorResult.rows[0].id;

      // B. Determine if review is required based on confidence score threshold
      const requiresReview = confidence < 0.85;

      // C. Insert the Donation record into the ledger
      const donationResult = await client.query(
        `INSERT INTO donations (organization_id, donor_id, amount, date, payment_mode, confidence_score, requires_review) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id`,
        [
          organization_id,
          donorId,
          amount,
          date,
          paymentMode,
          confidence,
          requiresReview
        ]
      );

      processedRecords.push(donationResult.rows[0].id);
    }

    // Commit all changes to Supabase at once
    await client.query('COMMIT');

    res.status(201).json({
      message: 'Successfully inserted AI data into Supabase live tables!',
      records_processed: processedRecords.length,
      donation_ids: processedRecords
    });

  } catch (error) {
    // If anything fails during the loop, roll back all database entries to keep data clean
    await client.query('ROLLBACK');
    console.error('Database transaction failed. Rolling back changes.', error);
    res.status(500).json({ error: 'Database transaction failed', details: error.message });
  } finally {
    // Release the client back to the connection pool
    client.release();
  }
};

module.exports = { processAIPayload };