const express = require('express');
const router = express.Router();
const { signup, login, updateProfile, deleteAccount } = require('../controllers/authController');

// Import the middleware to protect the update and delete routes
const verifyToken = require('../middleware/authMiddleware');

// Public Routes (No token needed)
router.post('/signup', signup);
router.post('/login', login);

// Protected Routes (Token required in headers)
// PUT /api/auth/update
router.put('/update', verifyToken, updateProfile);

// DELETE /api/auth/delete
router.delete('/delete', verifyToken, deleteAccount);

module.exports = router;