import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import brandLogoUrl from "../../assets/trustsaathi-logo.png";
import type { ExportColumnDef, ExportPayload, ExportStatDef, ExportTemplate } from "./export-templates";

const BRAND_NAME = "TrustSaathi";
const BRAND_TAGLINE = "Temple & Trust OS";

let cachedLogoDataUrl: string | null | undefined;

async function loadBrandLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl !== undefined) return cachedLogoDataUrl;

  try {
    // Prefer Vite-bundled asset (works in prod), then public path fallback.
    const candidates = [brandLogoUrl, "/trustsaathi-logo.png", "/favicon.png"];
    for (const src of candidates) {
      const response = await fetch(src);
      if (!response.ok) continue;
      const blob = await response.blob();
      cachedLogoDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      return cachedLogoDataUrl;
    }
    cachedLogoDataUrl = null;
    return null;
  } catch {
    cachedLogoDataUrl = null;
    return null;
  }
}

/** Draws the TrustSaathi flower mark if PNG embedding fails. */
function drawBrandMarkFallback(doc: jsPDF, x: number, y: number, size: number): void {
  doc.setFillColor(181, 130, 60);
  doc.roundedRect(x, y, size, size, 2.5, 2.5, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.7);
  const cx = x + size / 2;
  const cy = y + size * 0.42;
  const pr = size * 0.12;
  const dist = size * 0.18;
  for (const [dx, dy] of [
    [0, -dist],
    [dist, 0],
    [0, dist],
    [-dist, 0],
  ] as const) {
    doc.circle(cx + dx, cy + dy, pr, "S");
  }
  doc.circle(cx, cy, size * 0.07, "S");
  doc.line(cx, cy + dist + 1, cx, y + size * 0.82);
}

/** ASCII-safe INR — jsPDF Helvetica cannot render the ₹ glyph. */
function formatInrPdf(value: number): string {
  const n = Math.round(Number(value) || 0);
  return `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatNumberPdf(value: number): string {
  return Math.round(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function formatDatePdf(value: unknown): string {
  if (!value) return "-";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatCellValue(row: Record<string, unknown>, col: ExportColumnDef): string {
  const raw = row[col.field];
  if (raw == null || raw === "") return "-";

  switch (col.format) {
    case "inr":
      return formatInrPdf(Number(raw));
    case "date":
      return formatDatePdf(raw);
    default:
      return String(raw);
  }
}

function formatStatValue(stat: ExportStatDef, stats: Record<string, number>): string {
  const raw = stats[stat.field];
  if (raw == null) return "-";
  if (stat.format === "inr") return formatInrPdf(raw);
  return formatNumberPdf(raw);
}

/** Relative column weights — scaled to fill the full content width. */
function columnWeightFor(field: string): number {
  switch (field) {
    case "donor_name":
      return 3;
    case "donor_type":
      return 1.5;
    case "contact":
      return 2;
    case "pan":
      return 2;
    case "date":
      return 1.8;
    case "category":
      return 2;
    case "note":
      return 3;
    case "payment_mode":
      return 1.5;
    case "amount":
      return 1.8;
    default:
      return 2;
  }
}

function buildColumnStyles(template: ExportTemplate, tableWidth: number) {
  const weights = template.columns.map((col) => columnWeightFor(col.field));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  return Object.fromEntries(
    template.columns.map((col, i) => [
      i,
      {
        halign: col.align === "right" ? "right" : col.align === "center" ? "center" : "left",
        cellWidth: (weights[i] / totalWeight) * tableWidth,
      },
    ]),
  );
}

export async function generatePdfFromTemplate(
  template: ExportTemplate,
  payload: ExportPayload,
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 14;

  const logoSize = 12;
  const logoDataUrl = await loadBrandLogoDataUrl();
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", margin, y - 2, logoSize, logoSize);
    } catch {
      drawBrandMarkFallback(doc, margin, y - 2, logoSize);
    }
  } else {
    drawBrandMarkFallback(doc, margin, y - 2, logoSize);
  }

  const brandX = margin + logoSize + 3.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text(BRAND_NAME, brandX, y + 3.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(BRAND_TAGLINE, brandX, y + 8.5);

  y += logoSize + 6;
  doc.setDrawColor(220, 215, 205);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30);
  doc.text(template.title, margin, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100);

  const orgName = payload.meta?.organization_name;
  const generatedAt = payload.meta?.generated_at
    ? formatDatePdf(payload.meta.generated_at)
    : formatDatePdf(new Date().toISOString());

  const metaParts = [
    orgName ? `Trust: ${orgName}` : null,
    `Generated: ${generatedAt}`,
    payload.meta?.filter && payload.meta.filter !== "all" ? `Filter: ${payload.meta.filter}` : null,
    payload.meta?.search ? `Search: ${payload.meta.search}` : null,
  ].filter(Boolean);

  doc.text(metaParts.join("  |  "), margin, y);
  if (template.subtitle) {
    y += 4.5;
    doc.text(template.subtitle, margin, y);
  }

  y += 8;
  doc.setTextColor(30);

  const statCount = template.stats.length;
  if (statCount > 0) {
    const statGap = 3;
    const statBoxWidth = (pageWidth - margin * 2 - statGap * (statCount - 1)) / statCount;

    template.stats.forEach((stat, i) => {
      const x = margin + i * (statBoxWidth + statGap);
      doc.setDrawColor(200, 195, 185);
      doc.setFillColor(248, 246, 242);
      doc.roundedRect(x, y, statBoxWidth, 16, 1.5, 1.5, "FD");
      doc.setFontSize(6.5);
      doc.setTextColor(120);
      doc.text(stat.label.toUpperCase(), x + 3, y + 5.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30);
      doc.text(formatStatValue(stat, payload.stats), x + 3, y + 12);
      doc.setFont("helvetica", "normal");
    });

    y += 22;
  }

  const head = [template.columns.map((c) => c.header)];
  const body = payload.rows.map((row) =>
    template.columns.map((col) => formatCellValue(row, col)),
  );

  const tableWidth = pageWidth - margin * 2;
  const columnStyles = buildColumnStyles(template, tableWidth);

  autoTable(doc, {
    startY: y,
    head,
    body,
    tableWidth,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
      lineColor: [190, 185, 175],
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [181, 130, 60],
      textColor: 255,
      fontStyle: "bold",
      lineColor: [150, 110, 50],
      lineWidth: 0.25,
    },
    bodyStyles: {
      lineColor: [210, 205, 195],
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: [252, 250, 247] },
    columnStyles,
  });

  const footerY = doc.internal.pageSize.getHeight() - 8;
  doc.setFontSize(7);
  doc.setTextColor(140);
  doc.text(`${BRAND_NAME} - Made in India`, margin, footerY);

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`${template.filename}-${stamp}.pdf`);
}
