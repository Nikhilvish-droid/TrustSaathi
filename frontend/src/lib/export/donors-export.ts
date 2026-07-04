import { apiJson } from "../api-client";
import type { DonorStats } from "../donors-api";
import type { ExportPayload } from "./export-templates";

export type DonorExportRow = {
  donation_id: string;
  donor_name: string;
  donor_type: string;
  contact: string | null;
  pan: string | null;
  date: string;
  payment_mode: string;
  amount: number;
};

export type DonorsExportResponse = ExportPayload & {
  message: string;
  stats: DonorStats;
  rows: DonorExportRow[];
};

export function fetchDonorsExport(search = "", filter = "all") {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (filter !== "all") params.set("filter", filter);
  const qs = params.toString();
  return apiJson<DonorsExportResponse>(`/api/donors/export${qs ? `?${qs}` : ""}`);
}

export async function exportDonorsPdf(search = "", filter = "all") {
  const { getExportTemplate } = await import("./export-templates");
  const { generatePdfFromTemplate } = await import("./pdf-export");

  const template = getExportTemplate("donors-ledger");
  if (!template) throw new Error("Export template not found.");

  const payload = await fetchDonorsExport(search, filter);
  generatePdfFromTemplate(template, payload);
  return payload;
}

export async function exportDonationReportPdf() {
  return exportDonorsPdf();
}

export async function exportDonationReportCsv() {
  const { getExportTemplate } = await import("./export-templates");
  const { downloadCsvFromTemplate } = await import("./table-export");

  const template = getExportTemplate("donation-report");
  if (!template) throw new Error("Export template not found.");

  const payload = await fetchDonorsExport();
  downloadCsvFromTemplate(template, payload.rows);
  return payload;
}

export async function exportDonationReportExcel() {
  const { getExportTemplate } = await import("./export-templates");
  const { downloadExcelFromTemplate } = await import("./table-export");

  const template = getExportTemplate("donation-report");
  if (!template) throw new Error("Export template not found.");

  const payload = await fetchDonorsExport();
  downloadExcelFromTemplate(template, payload.rows);
  return payload;
}

export async function exportDonorReportPdf() {
  const { getExportTemplate } = await import("./export-templates");
  const { generatePdfFromTemplate } = await import("./pdf-export");

  const template = getExportTemplate("donor-report");
  if (!template) throw new Error("Export template not found.");

  const payload = await fetchDonorsExport();
  generatePdfFromTemplate(template, payload);
  return payload;
}

export async function exportDonorReportCsv() {
  const { getExportTemplate } = await import("./export-templates");
  const { downloadCsvFromTemplate } = await import("./table-export");

  const template = getExportTemplate("donor-report");
  if (!template) throw new Error("Export template not found.");

  const payload = await fetchDonorsExport();
  downloadCsvFromTemplate(template, payload.rows);
  return payload;
}

export async function exportDonorReportExcel() {
  const { getExportTemplate } = await import("./export-templates");
  const { downloadExcelFromTemplate } = await import("./table-export");

  const template = getExportTemplate("donor-report");
  if (!template) throw new Error("Export template not found.");

  const payload = await fetchDonorsExport();
  downloadExcelFromTemplate(template, payload.rows);
  return payload;
}
