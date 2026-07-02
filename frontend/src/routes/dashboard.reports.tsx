import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart, Download, FileText, FileSpreadsheet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/reports")({
  head: () => ({ meta: [{ title: "Reports — TrustSaathi" }, { name: "robots", content: "noindex" }] }),
  component: ReportsPage,
});

const reports = [
  { title: "Donation Report", desc: "All donations with donor, mode and purpose." },
  { title: "Donor Report", desc: "Lifetime donations and contact details." },
  { title: "Income Report", desc: "All income heads with categories." },
  { title: "Expense Report", desc: "Category-wise expense breakdown." },
  { title: "Audit Report", desc: "Audit-ready, with all required schedules." },
  { title: "80G Receipts Bundle", desc: "Bulk download of 80G receipts." },
];

function ReportsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate beautiful, audit-ready reports in PDF, Excel or CSV."
        icon={FileBarChart}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.title} className="rounded-2xl border-border shadow-soft">
            <CardContent className="space-y-4 p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary">
                <FileBarChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" className="rounded-full"><FileText className="mr-1 h-3.5 w-3.5" /> PDF</Button>
                <Button size="sm" variant="outline" className="rounded-full"><FileSpreadsheet className="mr-1 h-3.5 w-3.5" /> Excel</Button>
                <Button size="sm" variant="outline" className="rounded-full"><Download className="mr-1 h-3.5 w-3.5" /> CSV</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
