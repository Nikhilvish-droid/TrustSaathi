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
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_donations_org_date ON donations (organization_id, date DESC, id DESC);
      CREATE INDEX IF NOT EXISTS idx_donations_org_review ON donations (organization_id, requires_review) WHERE requires_review = true;
      CREATE INDEX IF NOT EXISTS idx_donations_donor_review ON donations (donor_id, organization_id) WHERE requires_review = true;
      CREATE INDEX IF NOT EXISTS idx_donors_org ON donors (organization_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_donors_name_org ON donors (name, organization_id);
      CREATE INDEX IF NOT EXISTS idx_income_expenses_org_type_date ON income_expenses (organization_id, type, date DESC);
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
