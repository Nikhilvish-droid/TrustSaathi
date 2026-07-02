const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL ERROR: DATABASE_URL is not defined in the environment.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render/Supabase hosted PostgreSQL
  }
});

// Catches errors on idle clients (e.g. network drop, server restart)
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

const testConnection = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in the environment.');
  }

  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('✅ Database connected successfully.');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = pool;
module.exports.testConnection = testConnection;
