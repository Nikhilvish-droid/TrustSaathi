const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Added for automatic security headers
require('dotenv').config();

// Import your router files
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const donationRoutes = require('./routes/donationRoutes');
const donorRoutes = require('./routes/donorRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const extractRoutes = require('./routes/extractRoutes');
const incomeExpenseRoutes = require('./routes/incomeExpenseRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');
const { testConnection } = require('./config/db');
const { ensureComplianceSchema } = require('./utils/ensureSchema');

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
app.use('/api/donors', donorRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/extract', extractRoutes);
app.use('/api/income-expenses', incomeExpenseRoutes);
app.use('/api/ledger', ledgerRoutes);

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


// --- START THE SERVER ---

// Listen immediately so the event loop stays alive (Express 5 + Node 24 fix)
const server = app.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
});

// Verify database connectivity (non-blocking — server starts regardless)
testConnection()
  .then(() => ensureComplianceSchema())
  .then(() => {
    console.log('Database fully initialized.');
  })
  .catch((err) => {
    if (err.message.includes('ENOTFOUND') || err.message.includes('ENETUNREACH')) {
      console.error('');
      console.error('╔══════════════════════════════════════════════════════════════╗');
      console.error('║  DATABASE CONNECTION FAILED                                  ║');
      console.error('║                                                              ║');
      console.error('║  Your Supabase project may be PAUSED (free-tier auto-pause). ║');
      console.error('║                                                              ║');
      console.error('║  To fix:                                                     ║');
      console.error('║  1. Go to https://supabase.com/dashboard                     ║');
      console.error('║  2. Select your project (wgbrjelmcqqvjwqpmekw)               ║');
      console.error('║  3. Click "Restore project" to unpause                       ║');
      console.error('║  4. Copy the new DATABASE_URL from Settings > Database       ║');
      console.error('║  5. Update Backend/.env and restart                          ║');
      console.error('║                                                              ║');
      console.error('║  Note: The new URL may use a pooler host (port 6543)         ║');
      console.error('║  instead of db.*.supabase.co (port 5432).                    ║');
      console.error('╚══════════════════════════════════════════════════════════════╝');
      console.error('');
    }
    console.warn('⚠️  Database unavailable. API routes requiring the database will fail.');
  });

// Crucial step for Vercel/Render compatibility
module.exports = app;