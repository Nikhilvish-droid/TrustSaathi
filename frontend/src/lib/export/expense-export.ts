import { apiJson } from "../api-client";
import type { ExportPayload } from "./export-templates";

export type ExpenseExportRow = {
  date: string;
  category: string;
  note: string | null;
  amount: number;
};

export type ExpenseExportStats = {
  total_amount: number;
  total_entries: number;
  this_month: number;
  categories: number;
};

export type ExpenseExportResponse = ExportPayload & {
  message: string;
  stats: ExpenseExportStats;
  rows: ExpenseExportRow[];
};

export function fetchExpenseExport() {
  return apiJson<ExpenseExportResponse>("/api/income-expenses/export?type=Expense");
}

export async function exportExpenseReportPdf() {
  const { getExportTemplate } = await import("./export-templates");
  const { generatePdfFromTemplate } = await import("./pdf-export");

  const template = getExportTemplate("expense-report");
  if (!template) throw new Error("Export template not found.");

  const payload = await fetchExpenseExport();
  generatePdfFromTemplate(template, payload);
  return payload;
}

export async function exportExpenseReportCsv() {
  const { getExportTemplate } = await import("./export-templates");
  const { downloadCsvFromTemplate } = await import("./table-export");

  const template = getExportTemplate("expense-report");
  if (!template) throw new Error("Export template not found.");

  const payload = await fetchExpenseExport();
  downloadCsvFromTemplate(template, payload.rows);
  return payload;
}

export async function exportExpenseReportExcel() {
  const { getExportTemplate } = await import("./export-templates");
  const { downloadExcelFromTemplate } = await import("./table-export");

  const template = getExportTemplate("expense-report");
  if (!template) throw new Error("Export template not found.");

  const payload = await fetchExpenseExport();
  downloadExcelFromTemplate(template, payload.rows);
  return payload;
}
