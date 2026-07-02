import { createFileRoute } from "@tanstack/react-router";
import { Upload, FileSpreadsheet, FileText, ImageIcon, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/upload")({
  head: () => ({ meta: [{ title: "AI Document Upload — TrustSaathi" }, { name: "robots", content: "noindex" }] }),
  component: UploadPage,
});

const accepted = [
  { icon: FileText, label: "Handwritten Registers" },
  { icon: ImageIcon, label: "Receipt Images" },
  { icon: FileText, label: "PDFs" },
  { icon: FileSpreadsheet, label: "Excel Files" },
  { icon: FileSpreadsheet, label: "Bank Statements" },
];

const jobs = [
  { name: "Donation Register · June 2026.pdf", status: "done", records: 214, progress: 100 },
  { name: "Bank Statement · May.xlsx", status: "processing", records: 86, progress: 64 },
  { name: "Receipts batch · 22 photos", status: "processing", records: 12, progress: 28 },
  { name: "Annadaan Register · Apr.pdf", status: "done", records: 138, progress: 100 },
];

function UploadPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="AI Document Upload"
        subtitle="Upload registers and receipts — our AI extracts every entry."
        icon={Upload}
      />

      <Card className="rounded-2xl border-2 border-dashed border-primary/30 bg-accent/40 shadow-soft">
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Upload className="h-7 w-7" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold">Drop files here, or click to upload</h2>
            <p className="mt-1 text-sm text-muted-foreground">PDF, JPG, PNG, XLSX up to 50MB each.</p>
          </div>
          <Button className="rounded-full px-7"><Upload className="mr-1.5 h-4 w-4" /> Choose files</Button>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {accepted.map((a) => (
              <Badge key={a.label} variant="secondary" className="rounded-full">
                <a.icon className="mr-1 h-3 w-3" /> {a.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display text-lg">Recent Uploads</CardTitle>
            <p className="text-sm text-muted-foreground">AI extraction status</p>
          </div>
          <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
            <Sparkles className="mr-1 h-3 w-3" /> AI Powered
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.map((j) => (
            <div key={j.name} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{j.name}</p>
                  <p className="text-xs text-muted-foreground">{j.records} records extracted so far</p>
                </div>
                {j.status === "done" ? (
                  <Badge className="shrink-0 rounded-full bg-success/15 text-success hover:bg-success/15">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Done
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0 rounded-full">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Processing
                  </Badge>
                )}
              </div>
              <Progress value={j.progress} className="mt-3 h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
