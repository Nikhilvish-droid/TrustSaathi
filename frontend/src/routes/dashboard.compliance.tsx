import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, AlertTriangle, CheckCircle2, AlertCircle, FileWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/compliance")({
  head: () => ({ meta: [{ title: "Compliance Center — TrustSaathi" }, { name: "robots", content: "noindex" }] }),
  component: CompliancePage,
});

const items = [
  { tone: "danger", title: "12 donations missing receipts", desc: "Generate receipts for the last 30 days.", action: "Fix now" },
  { tone: "warning", title: "3 large cash transactions need PAN", desc: "Cash donations above ₹50,000 must have PAN on file.", action: "Add PAN" },
  { tone: "warning", title: "FCRA quarterly report due in 9 days", desc: "Filing deadline: 30 Jun 2026.", action: "Start filing" },
  { tone: "success", title: "Trust registration is valid", desc: "Renews on 14 Mar 2028.", action: "View" },
  { tone: "success", title: "12A & 80G certificates uploaded", desc: "All audit-required certificates are on file.", action: "View" },
];

const toneCls: Record<string, string> = {
  danger: "border-destructive/30 bg-destructive/5",
  warning: "border-warning/40 bg-warning/10",
  success: "border-success/30 bg-success/10",
};
const toneIcon: Record<string, typeof AlertTriangle> = {
  danger: AlertTriangle,
  warning: AlertCircle,
  success: CheckCircle2,
};

function CompliancePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Compliance Center"
        subtitle="Stay audit-ready. We'll tell you exactly what to fix."
        icon={ShieldCheck}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-accent via-card to-card shadow-soft lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-display text-lg">Audit Readiness Score</CardTitle>
            <p className="text-sm text-muted-foreground">Updated just now</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-2">
              <span className="font-display text-6xl font-semibold text-primary">82</span>
              <span className="mb-2 text-sm text-muted-foreground">/ 100</span>
            </div>
            <Progress value={82} className="h-2" />
            <p className="text-sm text-muted-foreground">
              You're in good shape! Fix 3 issues below to reach <span className="font-semibold text-foreground">95+</span>.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Important Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">What needs your attention</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((it) => {
              const Icon = toneIcon[it.tone];
              return (
                <div key={it.title} className={`flex items-start gap-3 rounded-xl border p-4 ${toneCls[it.tone]}`}>
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-foreground/80" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{it.title}</p>
                    <p className="text-sm text-muted-foreground">{it.desc}</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full">{it.action}</Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-lg">Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            { title: "Collect PAN for donors above ₹10,000", badge: "Tax" },
            { title: "Reconcile bank statement weekly", badge: "Best practice" },
            { title: "Backup donation registers monthly", badge: "Safety" },
          ].map((r) => (
            <div key={r.title} className="rounded-xl border border-border bg-card p-4">
              <Badge variant="secondary" className="rounded-full">{r.badge}</Badge>
              <p className="mt-3 text-sm font-medium">{r.title}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
