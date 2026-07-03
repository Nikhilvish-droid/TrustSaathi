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

export const EXPORT_TEMPLATES: Record<string, ExportTemplate> = {
  "donors-ledger": DONORS_LEDGER_TEMPLATE,
};

export function getExportTemplate(id: string): ExportTemplate | undefined {
  return EXPORT_TEMPLATES[id];
}
