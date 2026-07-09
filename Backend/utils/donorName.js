/**
 * Unicode-safe donor name helpers (Marathi, Hindi, Gujarati, English, etc.).
 */

function normalizeDonorName(name) {
  if (name == null) return '';
  return String(name).trim().normalize('NFC');
}

function namesMatch(a, b) {
  const left = normalizeDonorName(a);
  const right = normalizeDonorName(b);
  if (!left || !right) return false;
  return left.toLocaleLowerCase('en-US') === right.toLocaleLowerCase('en-US');
}

/** Skip register header rows where AI extracted the trust/temple name as a donor. */
function isOrganizationHeaderRow(donorName, organizationName) {
  return namesMatch(donorName, organizationName);
}

module.exports = { normalizeDonorName, namesMatch, isOrganizationHeaderRow };
