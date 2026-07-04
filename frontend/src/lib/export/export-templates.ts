/**
 * JSON-driven export templates. Add new entries here for other pages
 * (donations ledger, expenses, compliance reports, etc.).
 */
export type ExportColumnFormat = "text" | "inr" | "date";

export type ExportColumnDef = {
  header: string;
  field: string;
  align?: "left" | "right" | "center";
  format?: ExportColumnFormat;
};

export type ExportStatDef = {
  label: string;
  field: string;
  format?: "number" | "inr";
};

export type ExportTemplate = {
  id: string;
  title: string;
  subtitle?: string;
  filename: string;
  stats: ExportStatDef[];
  columns: ExportColumnDef[];
};

export type ExportPayload = {
  template: string;
  meta?: {
    organization_name?: string | null;
    generated_at?: string;
    filter?: string;
    search?: string | null;
    row_count?: number;
  };
  stats: Record<string, number>;
  rows: Record<string, unknown>[];
};

export const DONORS_LEDGER_TEMPLATE: ExportTemplate = {
  id: "donors-ledger",
  title: "Donor Management Report",
  subtitle: "All donations · one row per entry",
  filename: "trustsaathi-donors-report",
  stats: [
    { label: "Total Donors", field: "total_donors", format: "number" },
    { label: "Repeat Donors", field: "repeat_donors", format: "number" },
    { label: "New This Month", field: "new_this_month", format: "number" },
    { label: "Total Raised", field: "lifetime_value", format: "inr" },
  ],
  columns: [
    { header: "Donor", field: "donor_name", align: "left" },
    { header: "Donor Type", field: "donor_type", align: "left" },
    { header: "Contact", field: "contact", align: "left" },
    { header: "PAN", field: "pan", align: "left" },
    { header: "Date", field: "date", align: "left", format: "date" },
    { header: "Mode", field: "payment_mode", align: "left" },
    { header: "Amount", field: "amount", align: "right", format: "inr" },
  ],
};

/** Donor report — same as donation ledger but without Donor Type column. */
export const DONOR_REPORT_TEMPLATE: ExportTemplate = {
  id: "donor-report",
  title: "Donor Report",
  subtitle: "Lifetime donations and contact details",
  filename: "trustsaathi-donor-report",
  stats: [
    { label: "Total Donors", field: "total_donors", format: "number" },
    { label: "Repeat Donors", field: "repeat_donors", format: "number" },
    { label: "New This Month", field: "new_this_month", format: "number" },
    { label: "Total Raised", field: "lifetime_value", format: "inr" },
  ],
  columns: [
    { header: "Donor", field: "donor_name", align: "left" },
    { header: "Contact", field: "contact", align: "left" },
    { header: "PAN", field: "pan", align: "left" },
    { header: "Date", field: "date", align: "left", format: "date" },
    { header: "Mode", field: "payment_mode", align: "left" },
    { header: "Amount", field: "amount", align: "right", format: "inr" },
  ],
};

/** Same columns as donors ledger; table-only exports use this filename. */
export const DONATION_REPORT_TEMPLATE: ExportTemplate = {
  ...DONORS_LEDGER_TEMPLATE,
  id: "donation-report",
  title: "Donation Report",
  subtitle: "All donations with donor, mode and purpose",
  filename: "trustsaathi-donation-report",
  stats: [],
};

export const INCOME_REPORT_TEMPLATE: ExportTemplate = {
  id: "income-report",
  title: "Income Report",
  subtitle: "All income heads with categories",
  filename: "trustsaathi-income-report",
  stats: [
    { label: "Total Income", field: "total_amount", format: "inr" },
    { label: "Total Entries", field: "total_entries", format: "number" },
    { label: "This Month", field: "this_month", format: "inr" },
    { label: "Categories", field: "categories", format: "number" },
  ],
  columns: [
    { header: "Date", field: "date", align: "left", format: "date" },
    { header: "Category", field: "category", align: "left" },
    { header: "Note", field: "note", align: "left" },
    { header: "Amount", field: "amount", align: "right", format: "inr" },
  ],
};

export const EXPENSE_REPORT_TEMPLATE: ExportTemplate = {
  id: "expense-report",
  title: "Expense Report",
  subtitle: "Category-wise expense breakdown",
  filename: "trustsaathi-expense-report",
  stats: [
    { label: "Total Expenses", field: "total_amount", format: "inr" },
    { label: "Total Entries", field: "total_entries", format: "number" },
    { label: "This Month", field: "this_month", format: "inr" },
    { label: "Categories", field: "categories", format: "number" },
  ],
  columns: [
    { header: "Date", field: "date", align: "left", format: "date" },
    { header: "Category", field: "category", align: "left" },
    { header: "Note", field: "note", align: "left" },
    { header: "Amount", field: "amount", align: "right", format: "inr" },
  ],
};

export const EXPORT_TEMPLATES: Record<string, ExportTemplate> = {
  "donors-ledger": DONORS_LEDGER_TEMPLATE,
  "donation-report": DONATION_REPORT_TEMPLATE,
  "donor-report": DONOR_REPORT_TEMPLATE,
  "income-report": INCOME_REPORT_TEMPLATE,
  "expense-report": EXPENSE_REPORT_TEMPLATE,
};

export function getExportTemplate(id: string): ExportTemplate | undefined {
  return EXPORT_TEMPLATES[id];
}
