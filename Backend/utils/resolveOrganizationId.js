const pool = require('../config/db');

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/**
 * Resolves organization UUID — prefers live DB value on the user row over JWT
 * (JWT can be stale after profile/org changes or shared-browser sessions).
 * Returns UUID string, or { error, message } on failure.
 */
async function resolveOrganizationId(req, bodyOrganizationId) {
  if (req.user?.userId) {
    const result = await pool.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [req.user.userId],
    );
    const dbOrgId = result.rows[0]?.organization_id;
    if (isValidUuid(dbOrgId)) return dbOrgId;
    if (result.rows[0] && !dbOrgId) {
      return {
        error: 'no_org',
        message:
          'Your account has no organization linked. Complete signup or complete-profile first, then log in again.',
      };
    }
  }

  const jwtOrgId = req.user?.organizationId;
  if (isValidUuid(jwtOrgId)) return jwtOrgId;

  if (isValidUuid(bodyOrganizationId)) return bodyOrganizationId;

  if (bodyOrganizationId && !isValidUuid(bodyOrganizationId)) {
    return {
      error: 'invalid_org',
      message: `"${bodyOrganizationId}" is not a valid UUID. Use organization_id from GET /api/auth/me.`,
    };
  }

  if (!req.user) {
    return {
      error: 'no_auth',
      message: 'Authorization Bearer token required.',
    };
  }

  return {
    error: 'missing_org',
    message: 'Could not resolve organization_id. Log in again via POST /api/auth/login.',
  };
}

/** Returns { organizationId, organizationName } for the authenticated user's trust. */
async function resolveOrganizationContext(req, bodyOrganizationId) {
  const orgId = await resolveOrganizationId(req, bodyOrganizationId);
  if (typeof orgId === 'object' && orgId?.error) return orgId;

  const orgResult = await pool.query('SELECT name FROM organizations WHERE id = $1', [orgId]);
  return {
    organizationId: orgId,
    organizationName: orgResult.rows[0]?.name ?? null,
  };
}

module.exports = { resolveOrganizationId, resolveOrganizationContext, isValidUuid };
