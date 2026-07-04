const pool = require('../config/db');

/**
 * Idempotent column additions for compliance features.
 * Safe to run on every server start.
 */
async function ensureComplianceSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS pan TEXT;
      ALTER TABLE donations ADD COLUMN IF NOT EXISTS receipt_number TEXT;
      ALTER TABLE donations ADD COLUMN IF NOT EXISTS receipt_generated_at TIMESTAMPTZ;
      ALTER TABLE donations ADD COLUMN IF NOT EXISTS missing_fields TEXT[] DEFAULT '{}';
      ALTER TABLE donations ADD COLUMN IF NOT EXISTS record_status TEXT DEFAULT 'completed';
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE donations ALTER COLUMN amount DROP NOT NULL;
      EXCEPTION WHEN others THEN NULL;
      END $$;
    `);
    console.log('✅ Compliance schema verified.');
  } catch (err) {
    console.error('❌ Compliance schema migration failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { ensureComplianceSchema };
