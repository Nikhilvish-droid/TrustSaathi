const pool = require('../config/db');

const processAIPayload = async (req, res) => {
  const { status, document_type, extracted_data } = req.body;

  // 1. Validate the incoming data format
  if (status !== 'success' || !extracted_data || !Array.isArray(extracted_data)) {
    return res.status(400).json({ error: 'Invalid data format received from AI engine.' });
  }

  // Get a client from the pool to handle the single-session transaction
  const client = await pool.connect();

  try {
    // Start SQL Transaction
    await client.query('BEGIN');

    // 2. Setup a Dummy Organization for testing purposes
    // In production, organization_id would come from req.user (Auth middleware)
    const orgResult = await client.query(
      `INSERT INTO organizations (name, reg_number) 
       VALUES ($1, $2) 
       ON CONFLICT (reg_number) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Test Charitable Trust', 'REG-12345-TEST']
    );
    const organizationId = orgResult.rows[0].id;

    const processedRecords = [];

    // 3. Loop through extracted AI rows
    for (const record of extracted_data) {
      console.log(`Inserting: ${record.donor_name} - ₹${record.amount}`);

      // A. Insert or Fetch Donor (Handles unique constraint matching)
      const donorResult = await client.query(
        `INSERT INTO donors (organization_id, name) 
         VALUES ($1, $2) 
         ON CONFLICT (name, organization_id) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [organizationId, record.donor_name]
      );
      const donorId = donorResult.rows[0].id;

      // B. Determine if review is required based on confidence score
      const requiresReview = record.confidence_score < 0.85;

      // C. Insert the Donation record into the ledger
      const donationResult = await client.query(
        `INSERT INTO donations (organization_id, donor_id, amount, date, payment_mode, confidence_score, requires_review) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id`,
        [
          organizationId,
          donorId,
          record.amount,
          record.date,
          record.payment_mode,
          record.confidence_score,
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