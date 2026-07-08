import { apiJson } from "../api-client";
import type { ExportPayload } from "./export-templates";

export type IncomeExportRow = {
  date: string;
  category: string;
  note: string | null;
  amount: number;
};

export type IncomeExportStats = {
  total_amount: number;
  total_entries: number;
  this_month: number;
  categories: number;
};

export type IncomeExportResponse = ExportPayload & {
  message: string;
  stats: IncomeExportStats;
  rows: IncomeExportRow[];
};

export function fetchIncomeExport() {
  return apiJson<IncomeExportResponse>("/api/income-expenses/export?type=Income");
}

export async function exportIncomeReportPdf() {
  const { getExportTemplate } = await import("./export-templates");
  const { generatePdfFromTemplate } = await import("./pdf-export");

  const template = getExportTemplate("income-report");
  if (!template) throw new Error("Export template not found.");

  const payload = await fetchIncomeExport();
  await generatePdfFromTemplate(template, payload);
  return payload;
}

export async function exportIncomeReportCsv() {
  const { getExportTemplate } = await import("./export-templates");
  const { downloadCsvFromTemplate } = await import("./table-export");

  const template = getExportTemplate("income-report");
  if (!template) throw new Error("Export template not found.");

  const payload = await fetchIncomeExport();
  downloadCsvFromTemplate(template, payload.rows);
  return payload;
}

export async function exportIncomeReportExcel() {
  const { getExportTemplate } = await import("./export-templates");
  const { downloadExcelFromTemplate } = await import("./table-export");

  const template = getExportTemplate("income-report");
  if (!template) throw new Error("Export template not found.");

  const payload = await fetchIncomeExport();
  downloadExcelFromTemplate(template, payload.rows);
  return payload;
}
