const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Added for automatic security headers
require('dotenv').config();

// Import your router files
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const donationRoutes = require('./routes/donationRoutes');
const { testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// --- 🛡️ PRODUCTION MIDDLEWARE ---

// 1. Security Headers (Protects against cross-site scripting and other web vulnerabilities)
app.use(helmet());

// 2. CORS Configuration 
// This allows your frontend to talk to your backend safely. 
// Later, you can set FRONTEND_URL in your .env file to strictly allow ONLY your Vercel app.
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// 3. Body Parsing with Limits 
// Prevents hackers from crashing your server by sending massive 1GB JSON files.
// Set to 5mb to comfortably allow bulk AI data uploads.
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));


// --- 🛣️ ROUTES ---
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);

// Health Check Route (Used by hosting platforms to verify server is alive)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'TrustSaathi Backend is secure and running smoothly.' });
});


// --- ⚠️ GLOBAL ERROR HANDLING ---

// 1. 404 Route Not Found Handler (If frontend hits a wrong URL)
app.use((req, res, next) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// 2. Catch-all Error Handler 
// This is crucial. If any route breaks, this catches it so the whole server doesn't crash.
// It also hides complex error details from the frontend to prevent leaking database secrets.
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({ 
    error: 'An internal server error occurred.',
    // Only show actual error message if running locally, never in production
    details: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});


// Change the bottom of server.js to this:
// --- START THE SERVER ---

// Verify database connectivity before accepting requests
testConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running and listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Server startup aborted:', err.message);
    process.exit(1);
  });

// Crucial step for Vercel/Render compatibility
module.exports = app;