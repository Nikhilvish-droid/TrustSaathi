const express = require('express');
const router = express.Router();
const { processAIPayload } = require('../controllers/aiController');

// This file handles all routes starting with /api/ai
// So this becomes: POST http://localhost:5000/api/ai/upload
router.post('/upload', processAIPayload);

module.exports = router;