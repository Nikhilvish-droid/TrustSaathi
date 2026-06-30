const { Pool } = require('pg');
require('dotenv').config();

// 1. Safety Check: Ensure the database URL actually exists before starting
if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL ERROR: DATABASE_URL is not defined in the .env file.');
  process.exit(1); // Kill the server so it doesn't run broken
}

// 2. Configure the Connection Pool with Production Limits
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  // --- 🛡️ PRODUCTION SETTINGS ---
  
  // Supabase and other cloud providers REQUIRE SSL connections
  ssl: {
    rejectUnauthorized: false 
  },
  
  // Prevent overwhelming the database if 1,000 users visit at once
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds to save memory
  connectionTimeoutMillis: 5000, // Throw an error if it takes longer than 5 seconds to connect
});

// 3. Monitor for background crashes
// If the database restarts or a connection drops in the background, this prevents the Node.js server from crashing entirely.
pool.on('error', (err, client) => {
  console.error('❌ Unexpected database error on idle client:', err.message);
});

// 4. Lightweight Health Check
// Instead of reserving a dedicated connection just to test it (which wastes a slot), 
// we run a tiny, instant query to verify the connection is active.
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Securely connected to PostgreSQL (Supabase) Database'))
  .catch((err) => console.error('❌ Initial Database connection error:', err.message));

module.exports = pool;