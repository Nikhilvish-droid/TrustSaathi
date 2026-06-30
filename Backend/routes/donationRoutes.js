const express = require('express');
const router = express.Router();
const pool = require('../config/db'); 
const verifyToken = require('../middleware/authMiddleware');

// 1. GET ALL DONATIONS (For the History Table)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const result = await pool.query(
      'SELECT * FROM donations WHERE organization_id = $1 ORDER BY date DESC',
      [organizationId]
    );

    res.status(200).json({
      message: 'Donations fetched successfully',
      total_records: result.rowCount,
      donations: result.rows
    });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to fetch donations.' });
  }
});

// 2. UPDATE ANY DONATION (For edits and approving AI data)
router.put('/update/:id', verifyToken, async (req, res) => {
  const donationId = req.params.id;
  const organizationId = req.user.organizationId; 
  const { donor_name, amount, payment_mode, date } = req.body;

  if (!donor_name || !amount || !payment_mode || !date) {
    return res.status(400).json({ error: 'Please provide donor name, amount, payment mode, and date.' });
  }

  try {
    const result = await pool.query(
      `UPDATE donations 
       SET donor_name = $1, amount = $2, payment_mode = $3, date = $4, requires_review = false 
       WHERE id = $5 AND organization_id = $6 
       RETURNING *`,
      [donor_name, amount, payment_mode, date, donationId, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donation record not found or unauthorized.' });
    }

    res.status(200).json({
      message: 'Donation record updated successfully!',
      donation: result.rows[0]
    });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ error: 'Failed to update donation record.' });
  }
});

// 3. DELETE A DONATION (For removing duplicate or wrong records)
router.delete('/delete/:id', verifyToken, async (req, res) => {
  const donationId = req.params.id;
  const organizationId = req.user.organizationId; 

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
      deleted_id: donationId
    });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete donation record.' });
  }
});

// 4. GET ANALYTICS SUMMARY (For the Dashboard Widgets)
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(amount), 0) AS total_funds,
        COUNT(id) AS total_donations,
        COUNT(CASE WHEN requires_review = true THEN 1 END) AS pending_reviews
       FROM donations 
       WHERE organization_id = $1`,
      [organizationId]
    );

    res.status(200).json({
      message: 'Analytics fetched successfully',
      data: result.rows[0] // Returns a single object with the calculated totals
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary.' });
  }
});

module.exports = router;