const express = require('express');
const router = express.Router();
const { processAIPayload } = require('../controllers/aiController');
const verifyToken = require('../middleware/authMiddleware');

// --- 🛡️ FLEXIBLE AUTHENTICATION ---
// Middleware that allows access from EITHER the AI service (using a static API key)
// OR a logged-in user (using a JWT). This enables the same '/upload' endpoint to be
// used for both the initial AI processing and subsequent user-driven corrections.
const flexibleAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers.authorization;

  // If a valid API key is provided (for server-to-server communication), grant access.
  if (apiKey && apiKey === process.env.AI_SERVICE_API_KEY) {
    return next();
  }
  
  // If an authorization header is provided (for user-driven requests), use JWT verification.
  if (authHeader) {
    return verifyToken(req, res, next);
  }

  // If neither valid auth method is found, deny access.
  return res.status(403).json({ error: 'Forbidden: A valid API Key or JWT token is required.' });
};


// Apply the API Key middleware to the upload route
// URL: POST http://localhost:5000/api/ai/upload
router.post('/upload', flexibleAuth, processAIPayload);

module.exports = router;