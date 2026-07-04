import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileBarChart, Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-shell";
import { toast } from "sonner";
import {
  exportDonationReportCsv,
  exportDonationReportExcel,
  exportDonationReportPdf,
  exportDonorReportCsv,
  exportDonorReportExcel,
  exportDonorReportPdf,
} from "@/lib/export/donors-export";
import {
  exportIncomeReportCsv,
  exportIncomeReportExcel,
  exportIncomeReportPdf,
} from "@/lib/export/income-export";
import {
  exportExpenseReportCsv,
  exportExpenseReportExcel,
  exportExpenseReportPdf,
} from "@/lib/export/expense-export";

export const Route = createFileRoute("/dashboard/reports")({
  head: () => ({ meta: [{ title: "Reports — TrustSaathi" }, { name: "robots", content: "noindex" }] }),
  component: ReportsPage,
});

type ReportFormat = "pdf" | "excel" | "csv";

type ReportCard = {
  id: string;
  title: string;
  desc: string;
  exportable: boolean;
};

const reports: ReportCard[] = [
  { id: "donation", title: "Donation Report", desc: "All donations with donor, mode and purpose.", exportable: true },
  { id: "donor", title: "Donor Report", desc: "Lifetime donations and contact details.", exportable: true },
  { id: "income", title: "Income Report", desc: "All income heads with categories.", exportable: true },
  { id: "expense", title: "Expense Report", desc: "Category-wise expense breakdown.", exportable: true },
  { id: "audit", title: "Audit Report", desc: "Audit-ready, with all required schedules.", exportable: false },
  { id: "80g", title: "80G Receipts Bundle", desc: "Bulk download of 80G receipts.", exportable: false },
];

async function runReportExport(id: string, format: ReportFormat) {
  switch (id) {
    case "donation":
      if (format === "pdf") return exportDonationReportPdf();
      if (format === "excel") return exportDonationReportExcel();
      return exportDonationReportCsv();
    case "donor":
      if (format === "pdf") return exportDonorReportPdf();
      if (format === "excel") return exportDonorReportExcel();
      return exportDonorReportCsv();
    case "income":
      if (format === "pdf") return exportIncomeReportPdf();
      if (format === "excel") return exportIncomeReportExcel();
      return exportIncomeReportCsv();
    case "expense":
      if (format === "pdf") return exportExpenseReportPdf();
      if (format === "excel") return exportExpenseReportExcel();
      return exportExpenseReportCsv();
    default:
      throw new Error("Report not available yet.");
  }
}

const FORMAT_LABELS: Record<ReportFormat, string> = {
  pdf: "PDF",
  excel: "Excel",
  csv: "CSV",
};

function ReportsPage() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const handleExport = async (reportId: string, format: ReportFormat) => {
    const key = `${reportId}-${format}`;
    setLoadingKey(key);
    try {
      const payload = await runReportExport(reportId, format);
      const count = payload.rows.length;
      const label =
        reportId === "donor"
          ? `${count} entr${count === 1 ? "y" : "ies"}`
          : reportId === "income"
            ? `${count} income entr${count === 1 ? "y" : "ies"}`
            : reportId === "expense"
              ? `${count} expense entr${count === 1 ? "y" : "ies"}`
              : `${count} donation${count === 1 ? "" : "s"}`;
      toast.success(`${FORMAT_LABELS[format]} downloaded · ${label}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to export ${FORMAT_LABELS[format]}.`);
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate beautiful, audit-ready reports in PDF, Excel or CSV."
        icon={FileBarChart}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.id} className="rounded-2xl border-border shadow-soft">
            <CardContent className="space-y-4 p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary">
                <FileBarChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {(["pdf", "excel", "csv"] as const).map((format) => {
                  const key = `${r.id}-${format}`;
                  const busy = loadingKey === key;
                  const Icon = format === "pdf" ? FileText : format === "excel" ? FileSpreadsheet : Download;

                  return (
                    <Button
                      key={format}
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={!r.exportable || loadingKey != null}
                      onClick={() => {
                        if (r.exportable) void handleExport(r.id, format);
                      }}
                    >
                      {busy ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Icon className="mr-1 h-3.5 w-3.5" />
                      )}
                      {FORMAT_LABELS[format]}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
