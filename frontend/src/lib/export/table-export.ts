import * as XLSX from "xlsx";
import type { ExportColumnDef, ExportTemplate } from "./export-templates";

function formatDateDisplay(value: unknown): string {
  if (!value) return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Excel CSV: formula-style text so dates are not auto-parsed (avoids ########). */
function formatDateForCsv(value: unknown): string {
  const display = formatDateDisplay(value);
  return display ? `="${display}"` : "";
}

function cellValue(
  row: Record<string, unknown>,
  col: ExportColumnDef,
  target: "csv" | "excel",
): string | number {
  const raw = row[col.field];
  if (raw == null || raw === "") return "";

  switch (col.format) {
    case "inr":
      return Math.round(Number(raw) || 0);
    case "date":
      return target === "csv" ? formatDateForCsv(raw) : formatDateDisplay(raw);
    default:
      return String(raw);
  }
}

function buildSheetRows(
  template: ExportTemplate,
  rows: Record<string, unknown>[],
  target: "csv" | "excel",
) {
  const headers = template.columns.map((c) => c.header);
  const body = rows.map((row) => template.columns.map((col) => cellValue(row, col, target)));
  return { headers, body };
}

function stampFilename(base: string, ext: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${base}-${stamp}.${ext}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsvField(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Table-only CSV — no title, stats, or org header. */
export function downloadCsvFromTemplate(
  template: ExportTemplate,
  rows: Record<string, unknown>[],
): void {
  const { headers, body } = buildSheetRows(template, rows, "csv");
  const lines = [
    headers.map(escapeCsvField).join(","),
    ...body.map((row) => row.map(escapeCsvField).join(",")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, stampFilename(template.filename, "csv"));
}

function columnWidthFor(field: string, format?: ExportColumnDef["format"]): number {
  if (format === "date") return 14;
  if (field === "donor_name") return 22;
  if (field === "category") return 18;
  if (field === "note") return 24;
  if (field === "contact" || field === "pan") return 16;
  if (field === "amount") return 12;
  return 14;
}

/** Table-only Excel — no title, stats, or org header. */
export function downloadExcelFromTemplate(
  template: ExportTemplate,
  rows: Record<string, unknown>[],
): void {
  const { headers, body } = buildSheetRows(template, rows, "excel");
  const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);

  const dateColIndexes = template.columns
    .map((col, i) => (col.format === "date" ? i : -1))
    .filter((i) => i >= 0);

  for (let r = 1; r <= body.length; r++) {
    for (const c of dateColIndexes) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (ws[ref]) ws[ref].t = "s";
    }
  }

  ws["!cols"] = template.columns.map((col) => ({
    wch: columnWidthFor(col.field, col.format),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, stampFilename(template.filename, "xlsx"));
}
