import { createFileRoute } from "@tanstack/react-router";
import { Receipt, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/expenses")({
  head: () => ({ meta: [{ title: "Income & Expenses — TrustSaathi" }, { name: "robots", content: "noindex" }] }),
  component: ExpensesPage,
});

const rows = [
  { date: "30 Jun 2026", cat: "Annadaan", type: "Expense", amount: "₹18,400", note: "Daily prasadam" },
  { date: "29 Jun 2026", cat: "Donations", type: "Income", amount: "₹2,84,500", note: "Festival collection" },
  { date: "28 Jun 2026", cat: "Electricity", type: "Expense", amount: "₹12,210", note: "MSEB June bill" },
  { date: "27 Jun 2026", cat: "Hundi", type: "Income", amount: "₹46,300", note: "Weekly count" },
  { date: "26 Jun 2026", cat: "Salaries", type: "Expense", amount: "₹38,500", note: "Pandit + staff" },
  { date: "25 Jun 2026", cat: "Maintenance", type: "Expense", amount: "₹6,900", note: "Plumbing" },
];

function ExpensesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Income & Expenses"
        subtitle="Track every rupee that comes in and goes out."
        icon={Receipt}
        action={
          <>
            <Button variant="outline" className="rounded-full"><Plus className="mr-1.5 h-4 w-4" /> Add Income</Button>
            <Button className="rounded-full"><Plus className="mr-1.5 h-4 w-4" /> Add Expense</Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { l: "Income (This Month)", v: "₹3,84,200", icon: TrendingUp, tone: "text-success" },
          { l: "Expenses (This Month)", v: "₹74,210", icon: TrendingDown, tone: "text-destructive" },
          { l: "Net (This Month)", v: "₹3,09,990", icon: TrendingUp, tone: "text-primary" },
        ].map((s) => (
          <Card key={s.l} className="rounded-2xl border-border shadow-soft">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.l}</p>
                <p className={`mt-1 font-display text-2xl font-semibold ${s.tone}`}>{s.v}</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                <s.icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-border shadow-soft">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Note</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-accent/40">
                    <td className="px-5 py-3 text-muted-foreground">{r.date}</td>
                    <td className="px-5 py-3 font-medium">{r.cat}</td>
                    <td className="px-5 py-3">
                      <Badge variant="secondary" className={`rounded-full ${r.type === "Income" ? "text-success" : "text-destructive"}`}>
                        {r.type}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{r.note}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${r.type === "Income" ? "text-success" : "text-destructive"}`}>
                      {r.type === "Income" ? "+" : "-"} {r.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
