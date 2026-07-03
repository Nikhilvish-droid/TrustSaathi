const express = require('express');
const router = express.Router();
const { signup, login, updateProfile, deleteAccount, googleLogin, completeProfile, getProfile } = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit'); // Import the new security package

// --- 🛡️ SECURITY: Rate Limiting ---
// Block IPs that spam the login or signup routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window (15 minutes)
  message: { error: 'Too many authentication attempts from this IP. Please try again in 15 minutes.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Public Routes (Protected by rate limiter)
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleLogin);
router.put('/complete-profile', completeProfile);

// Protected Routes (Token required in headers)
router.get('/me', verifyToken, getProfile);

// PUT /api/auth/update
router.put('/update', verifyToken, updateProfile);

// DELETE /api/auth/delete
router.delete('/delete', verifyToken, deleteAccount);

module.exports = router;