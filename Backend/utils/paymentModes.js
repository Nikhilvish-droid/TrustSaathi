/** Canonical payment modes — must match frontend PAYMENT_MODES. */
const CANONICAL = ['UPI', 'Cash', 'Bank Transfer', 'Cheque', 'Card', 'Unknown'];

const ALIASES = {
  upi: 'UPI',
  gpay: 'UPI',
  'google pay': 'UPI',
  googlepay: 'UPI',
  phonepe: 'UPI',
  'phone pe': 'UPI',
  paytm: 'UPI',
  bhim: 'UPI',
  cash: 'Cash',
  cash_legacy: 'Cash',
  bank: 'Bank Transfer',
  'bank transfer': 'Bank Transfer',
  bank_transfer: 'Bank Transfer',
  neft: 'Bank Transfer',
  rtgs: 'Bank Transfer',
  imps: 'Bank Transfer',
  online: 'Bank Transfer',
  'online transfer': 'Bank Transfer',
  cheque: 'Cheque',
  check: 'Cheque',
  chq: 'Cheque',
  cheque_legacy: 'Cheque',
  demand_draft: 'Cheque',
  dd: 'Cheque',
  card: 'Card',
  'debit card': 'Card',
  'credit card': 'Card',
  debit: 'Card',
  credit: 'Card',
  pos: 'Card',
  unknown: 'Unknown',
  other: 'Unknown',
  na: 'Unknown',
  'n/a': 'Unknown',
};

function normalizePaymentMode(raw) {
  if (raw == null || String(raw).trim() === '') return 'Unknown';

  const cleaned = String(raw).trim().toLowerCase();
  if (CANONICAL.includes(String(raw).trim())) return String(raw).trim();
  if (ALIASES[cleaned]) return ALIASES[cleaned];

  if (/(upi|gpay|phonepe|paytm|bhim)/i.test(cleaned)) return 'UPI';
  if (/cash|naqad/i.test(cleaned)) return 'Cash';
  if (/(neft|rtgs|imps|bank|wire|online transfer)/i.test(cleaned)) return 'Bank Transfer';
  if (/(cheque|check|chq|demand draft|draft)/i.test(cleaned)) return 'Cheque';
  if (/(card|debit|credit|pos|swipe)/i.test(cleaned)) return 'Card';

  return 'Unknown';
}

module.exports = { CANONICAL, normalizePaymentMode };
