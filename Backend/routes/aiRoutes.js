const express = require('express');
const router = express.Router();
const { processAIPayload } = require('../controllers/aiController');

// --- 🛡️ SERVER-TO-SERVER SECURITY ---
// Custom middleware to ensure only your AI microservice can hit this endpoint
const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // Check if the key exists and matches the one in your .env file
  if (!apiKey || apiKey !== process.env.AI_SERVICE_API_KEY) {
    console.warn(`⚠️ Unauthorized AI upload attempt from IP: ${req.ip}`);
    return res.status(403).json({ error: 'Forbidden: Invalid or missing API Key.' });
  }
  
  next(); // Key is valid, proceed to the controller
};

// Apply the API Key middleware to the upload route
// URL: POST http://localhost:5000/api/ai/upload
router.post('/upload', requireApiKey, processAIPayload);

module.exports = router;