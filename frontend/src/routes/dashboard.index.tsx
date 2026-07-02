import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HandCoins,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  Upload,
  Plus,
  Receipt,
  FileBarChart,
  UserPlus,
  ListChecks,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
  Legend,
} from "recharts";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — TrustSaathi" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardHome,
});

const kpis = [
  { label: "Total Donations", value: "₹28,45,000", delta: "+12.4%", up: true, icon: HandCoins },
  { label: "Total Donors", value: "1,248", delta: "+38 this month", up: true, icon: Users },
  { label: "Total Income", value: "₹32,10,000", delta: "+9.2%", up: true, icon: TrendingUp },
  { label: "Total Expenses", value: "₹7,42,100", delta: "-3.1%", up: false, icon: TrendingDown },
  { label: "Net Surplus", value: "₹24,67,900", delta: "+18.0%", up: true, icon: Wallet },
];

const donationData = [
  { m: "Apr", donations: 180, donors: 120 },
  { m: "May", donations: 220, donors: 140 },
  { m: "Jun", donations: 260, donors: 155 },
  { m: "Jul", donations: 240, donors: 165 },
  { m: "Aug", donations: 320, donors: 198 },
  { m: "Sep", donations: 290, donors: 188 },
  { m: "Oct", donations: 360, donors: 220 },
  { m: "Nov", donations: 410, donors: 245 },
  { m: "Dec", donations: 480, donors: 290 },
  { m: "Jan", donations: 360, donors: 240 },
  { m: "Feb", donations: 340, donors: 230 },
  { m: "Mar", donations: 420, donors: 280 },
];

const modeData = [
  { name: "UPI", value: 48 },
  { name: "Cash", value: 22 },
  { name: "Bank Transfer", value: 18 },
  { name: "Cheque", value: 8 },
  { name: "Card", value: 4 },
];
const MODE_COLORS = ["hsl(38 70% 42%)", "hsl(150 50% 45%)", "hsl(220 50% 55%)", "hsl(280 45% 55%)", "hsl(25 75% 55%)"];

const incomeExpense = [
  { m: "Apr", income: 240, expense: 90 },
  { m: "May", income: 280, expense: 110 },
  { m: "Jun", income: 320, expense: 130 },
  { m: "Jul", income: 290, expense: 100 },
  { m: "Aug", income: 380, expense: 150 },
  { m: "Sep", income: 350, expense: 140 },
  { m: "Oct", income: 420, expense: 170 },
  { m: "Nov", income: 480, expense: 180 },
];

const topDonors = [
  { name: "Shri Anil Mehta", phone: "+91 98200 11234", total: "₹2,50,000", count: 8 },
  { name: "Smt. Radha Iyer", phone: "+91 98765 43210", total: "₹1,80,000", count: 12 },
  { name: "Sundar Foundation", phone: "+91 80800 99000", total: "₹1,50,000", count: 3 },
  { name: "Shri Rajesh Kapoor", phone: "+91 99887 76655", total: "₹1,25,000", count: 6 },
  { name: "Devi Charitable Trust", phone: "+91 98111 22334", total: "₹95,000", count: 4 },
];

const recent = [
  { name: "Priya Sharma", amount: "₹5,100", mode: "UPI", date: "Today, 11:24 AM", purpose: "Annadaan" },
  { name: "Karthik N.", amount: "₹2,500", mode: "Cash", date: "Today, 10:02 AM", purpose: "Pooja Seva" },
  { name: "Meena Gupta", amount: "₹11,000", mode: "Bank", date: "Yesterday", purpose: "Construction" },
  { name: "Suresh Patel", amount: "₹501", mode: "UPI", date: "Yesterday", purpose: "General" },
  { name: "Anand Rao", amount: "₹25,000", mode: "Cheque", date: "2 days ago", purpose: "Festival" },
];

const alerts = [
  { tone: "danger", title: "12 donations missing receipts", desc: "Last 30 days · click to fix" },
  { tone: "warning", title: "3 large cash transactions need PAN", desc: "Over ₹50,000 limit" },
  { tone: "warning", title: "FCRA quarterly report due in 9 days", desc: "Filing deadline: 30 Jun 2026" },
  { tone: "success", title: "Trust registration is valid", desc: "Renews on 14 Mar 2028" },
];

const toneStyles: Record<string, string> = {
  danger: "bg-destructive/5 border-destructive/20 text-destructive",
  warning: "bg-warning/10 border-warning/30 text-warning-foreground",
  success: "bg-success/10 border-success/30 text-success",
};
const toneIcon: Record<string, typeof AlertTriangle> = {
  danger: AlertTriangle,
  warning: AlertCircle,
  success: CheckCircle2,
};

function DashboardHome() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Jai Shree Krishna 🙏</p>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Welcome back, Ramesh ji</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening at your temple today — Tuesday, 30 June 2026.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Today", "This Month", "Financial Year", "Custom"].map((p, i) => (
            <Button key={p} variant={i === 1 ? "default" : "outline"} size="sm" className="rounded-full">
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="rounded-2xl border-border shadow-soft">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-primary">
                  <k.icon className="h-4 w-4" />
                </div>
                <span
                  className={`text-xs font-medium ${
                    k.up ? "text-success" : "text-destructive"
                  }`}
                >
                  {k.delta}
                </span>
              </div>
              <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border shadow-soft lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">Donations Overview</CardTitle>
              <p className="text-sm text-muted-foreground">Last 12 months · ₹ in thousands</p>
            </div>
            <Badge variant="secondary" className="rounded-full">FY 2025-26</Badge>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={donationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" vertical={false} />
                <XAxis dataKey="m" stroke="hsl(0 0% 50%)" fontSize={12} />
                <YAxis stroke="hsl(0 0% 50%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(0 0% 90%)",
                    boxShadow: "0 8px 24px rgba(0,0,0,.06)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="donations" name="Donations" fill="hsl(38 70% 42%)" radius={[6, 6, 0, 0]} barSize={18} />
                <Line type="monotone" dataKey="donors" name="Donors" stroke="hsl(150 50% 40%)" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Payment Mode</CardTitle>
            <p className="text-sm text-muted-foreground">How donors are paying</p>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={modeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {modeData.map((_, i) => (
                    <Cell key={i} fill={MODE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(0 0% 90%)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Income vs expense + compliance alerts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Income vs Expenses</CardTitle>
            <p className="text-sm text-muted-foreground">Monthly comparison · ₹ in thousands</p>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeExpense}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" vertical={false} />
                <XAxis dataKey="m" stroke="hsl(0 0% 50%)" fontSize={12} />
                <YAxis stroke="hsl(0 0% 50%)" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(0 0% 90%)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Income" fill="hsl(150 50% 45%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="hsl(25 75% 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Important Alerts</CardTitle>
            <Link to="/dashboard/compliance" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((a) => {
              const Icon = toneIcon[a.tone];
              return (
                <div key={a.title} className={`flex items-start gap-3 rounded-xl border p-3 ${toneStyles[a.tone]}`}>
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions + AI upload */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground">Common tasks · one tap away</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Upload Documents", icon: Upload, to: "/dashboard/upload" },
              { label: "Add Donation", icon: Plus, to: "/dashboard/donations" },
              { label: "Add Expense", icon: Receipt, to: "/dashboard/expenses" },
              { label: "Add Donor", icon: UserPlus, to: "/dashboard/donors" },
              { label: "Generate Report", icon: FileBarChart, to: "/dashboard/reports" },
              { label: "View Donors", icon: ListChecks, to: "/dashboard/donors" },
            ].map((a) => (
              <Button key={a.label} asChild variant="outline" className="h-auto justify-start gap-3 rounded-xl border-border p-4 text-left">
                <Link to={a.to}>
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-primary">
                    <a.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium">{a.label}</span>
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-accent via-card to-card shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">AI Upload Center</span>
            </div>
            <CardTitle className="font-display text-lg">Let AI do the data entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload handwritten registers, receipts, PDFs or bank statements. We'll extract every entry.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5">
                <span>Donation Register · Jun.pdf</span>
                <Badge className="rounded-full bg-success/15 text-success hover:bg-success/15">214 entries</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5">
                <span>Bank Statement · May.xlsx</span>
                <Badge variant="secondary" className="rounded-full">Processing…</Badge>
              </div>
            </div>
            <Button asChild className="w-full rounded-full">
              <Link to="/dashboard/upload">
                Upload documents <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Top Donors</CardTitle>
            <Link to="/dashboard/donors" className="text-xs font-medium text-primary hover:underline">
              See all
            </Link>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Donor</th>
                  <th className="px-5 py-3 font-medium">Donations</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {topDonors.map((d) => (
                  <tr key={d.name} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{d.count}</td>
                    <td className="px-5 py-3 text-right font-semibold text-primary">{d.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Recent Donations</CardTitle>
            <Link to="/dashboard/donations" className="text-xs font-medium text-primary hover:underline">
              See all
            </Link>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Donor</th>
                  <th className="px-5 py-3 font-medium">Purpose</th>
                  <th className="px-5 py-3 font-medium">Mode</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.date}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{r.purpose}</td>
                    <td className="px-5 py-3">
                      <Badge variant="secondary" className="rounded-full">{r.mode}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">{r.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
