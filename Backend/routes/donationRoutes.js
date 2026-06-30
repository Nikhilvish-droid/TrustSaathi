const express = require('express');
const router = express.Router();
const pool = require('../config/db'); 
const verifyToken = require('../middleware/authMiddleware');

// 1. GET ALL DONATIONS (With Pagination for Production Performance)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    
    // Pagination logic (defaults to page 1, 50 items per page)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM donations WHERE organization_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3',
      [organizationId, limit, offset]
    );

    // Get total count for frontend pagination math
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM donations WHERE organization_id = $1',
      [organizationId]
    );
    const totalRecords = parseInt(countResult.rows[0].count);

    res.status(200).json({
      message: 'Donations fetched successfully',
      total_records: totalRecords,
      current_page: page,
      total_pages: Math.ceil(totalRecords / limit),
      donations: result.rows
    });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to fetch donations.' });
  }
});

// 2. UPDATE ANY DONATION (With strict data validation)
router.put('/update/:id', verifyToken, async (req, res) => {
  const donationId = req.params.id;
  const organizationId = req.user.organizationId; 
  const { donor_name, amount, payment_mode, date } = req.body;

  // Ensure all fields exist
  if (!donor_name || amount === undefined || !payment_mode || !date) {
    return res.status(400).json({ error: 'Please provide donor name, amount, payment mode, and date.' });
  }

  // Validate Amount (must be a positive number)
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a valid number greater than zero.' });
  }

  // Validate Date (basic check to prevent DB crashes)
  if (isNaN(Date.parse(date))) {
     return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD.' });
  }

  try {
    const result = await pool.query(
      `UPDATE donations 
       SET donor_name = $1, amount = $2, payment_mode = $3, date = $4, requires_review = false 
       WHERE id = $5 AND organization_id = $6 
       RETURNING *`,
      [donor_name.trim(), numericAmount, payment_mode.trim(), date, donationId, organizationId]
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

// 3. DELETE A DONATION 
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

// 4. GET ANALYTICS SUMMARY (Ensuring numerical safety)
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

    // PostgreSQL COUNT and SUM functions often return strings (BigInt) in node-postgres
    // We parse them to numbers so Developer 3's frontend charts don't break
    const stats = result.rows[0];
    const data = {
      total_funds: parseFloat(stats.total_funds),
      total_donations: parseInt(stats.total_donations, 10),
      pending_reviews: parseInt(stats.pending_reviews, 10)
    };

    res.status(200).json({
      message: 'Analytics fetched successfully',
      data: data 
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary.' });
  }
});

module.exports = router;