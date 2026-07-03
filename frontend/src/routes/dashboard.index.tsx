import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  HandCoins,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Upload,
  Plus,
  Receipt,
  FileBarChart,
  UserPlus,
  ListChecks,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
  Legend,
} from "recharts";
import { fetchProfile } from "@/lib/auth-api";
import {
  fetchDonationSummary,
  fetchTopDonors,
  fetchRecentDonations,
  formatInr,
  formatDonationDate,
  formatPercentChange,
  type DashboardPeriod,
  type DonationSummaryData,
  type ChartOverviewPoint,
  type TopDonor,
  type RecentDonation,
} from "@/lib/donations-api";
import { toast } from "sonner";
import { PricingSection } from "@/components/pricing-section";
import { FAQSection } from "@/components/faq-section";

const PERIOD_OPTIONS: { label: string; value: DashboardPeriod }[] = [
  { label: "Today", value: "today" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "fy" },
  { label: "Lifetime", value: "lifetime" },
];

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — TrustSaathi" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardHome,
});

const MODE_COLORS = ["hsl(38 70% 42%)", "hsl(150 50% 45%)", "hsl(220 50% 55%)", "hsl(280 45% 55%)", "hsl(25 75% 55%)", "hsl(200 60% 50%)", "hsl(340 55% 55%)"];

function modeColor(index: number): string {
  return MODE_COLORS[index % MODE_COLORS.length];
}

function buildPaymentModeChartData(modes: DonationSummaryData["payment_modes"]) {
  return modes.map((m) => ({
    name: m.mode,
    value: m.count,
    share: m.percent,
    amount: m.amount,
  }));
}

type PieLabelProps = {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  payload?: { share?: number };
};

function PaymentModeLabel(props: PieLabelProps) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, payload } = props;
  const share = payload?.share ?? 0;
  if (share < 5) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${share.toFixed(0)}%`}
    </text>
  );
}

const CHART_BAR_DEFAULT = "hsl(38 55% 68%)";
const CHART_BAR_HIGHLIGHT = "hsl(25 92% 48%)";
const CHART_BAR_HIGHLIGHT_STROKE = "hsl(25 95% 35%)";
const CHART_LINE_DEFAULT = "hsl(150 45% 48%)";
const CHART_LINE_HIGHLIGHT = "hsl(25 85% 42%)";

function DonationOverviewTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; payload?: ChartOverviewPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div
      className="rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-soft"
      style={{ border: "1px solid hsl(0 0% 90%)" }}
    >
      <p className="font-semibold">{label}</p>
      <p className="text-muted-foreground">
        Total donations: <span className="font-medium text-foreground">{formatInr(row.donation_amount)}</span>
      </p>
      <p className="text-muted-foreground">
        Donation records: <span className="font-medium text-foreground">{row.donation_count}</span>
      </p>
      <p className="text-muted-foreground">
        Avg donation: <span className="font-medium text-foreground">{formatInr(row.avg_donation)}</span>
      </p>
      <p className="text-muted-foreground">
        Unique donors: <span className="font-medium text-foreground">{row.donors}</span>
      </p>
    </div>
  );
}

function getFirstName(fullName?: string): string {
  if (!fullName) return "there";
  const parts = fullName.split(/[\s_]+/).filter((p) => /^[A-Za-z]{2,}$/.test(p));
  return parts[0] ?? "there";
}

function formatTodayDate(): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function buildKpis(data: DonationSummaryData, period: DashboardPeriod) {
  const donationCount = data.total_donations.toLocaleString("en-IN");
  const periodLabel = data.period_label;
  const isLifetime = period === "lifetime";

  return [
    {
      label: "Total Raised",
      value: formatInr(data.total_funds),
      sub: periodLabel,
      delta: formatPercentChange(data.changes.total_funds),
      icon: HandCoins,
    },
    {
      label: isLifetime ? "Total Donors" : "Active Donors",
      value: isLifetime
        ? (data.registered_donors ?? 0).toLocaleString("en-IN")
        : data.total_donors.toLocaleString("en-IN"),
      sub: `${donationCount} donation${data.total_donations === 1 ? "" : "s"} · ${periodLabel}`,
      delta: formatPercentChange(data.changes.total_donors),
      icon: Users,
    },
    {
      label: "Avg Donation",
      value: formatInr(data.avg_donation),
      sub: periodLabel,
      delta: formatPercentChange(data.changes.avg_donation),
      icon: TrendingUp,
    },
    {
      label: "Max Donation",
      value: formatInr(data.max_donation),
      sub: periodLabel,
      delta: formatPercentChange(data.changes.max_donation),
      icon: BarChart3,
    },
    {
      label: "Min Donation",
      value: formatInr(data.min_donation),
      sub: periodLabel,
      delta: formatPercentChange(data.changes.min_donation),
      icon: TrendingDown,
    },
  ];
}

function DashboardHome() {
  const [userName, setUserName] = useState<string>("");
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [summary, setSummary] = useState<DonationSummaryData | null>(null);
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(true);

  useEffect(() => {
    void fetchProfile()
      .then(({ user }) => setUserName(user.name ?? ""))
      .catch(() => setUserName(""));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await fetchDonationSummary(period);
        setSummary(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load dashboard stats.");
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [period]);

  useEffect(() => {
    const loadTables = async () => {
      setTablesLoading(true);
      try {
        const [donorsRes, recentRes] = await Promise.all([
          fetchTopDonors(5),
          fetchRecentDonations(5),
        ]);
        setTopDonors(donorsRes.donors);
        setRecentDonations(recentRes.donations);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load donor tables.");
        setTopDonors([]);
        setRecentDonations([]);
      } finally {
        setTablesLoading(false);
      }
    };
    void loadTables();
  }, []);

  const kpis = useMemo(
    () => (summary ? buildKpis(summary, period) : []),
    [summary, period],
  );
  const paymentModeData = useMemo(
    () => (summary?.payment_modes ? buildPaymentModeChartData(summary.payment_modes) : []),
    [summary],
  );
  const chartOverview = summary?.chart_overview ?? [];
  const avgLineMax = useMemo(() => {
    const peak = chartOverview.reduce((m, p) => Math.max(m, p.avg_donation_k ?? 0), 0);
    return Math.max(Math.ceil(peak * 1.25), 1);
  }, [chartOverview]);
  const firstName = getFirstName(userName);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Jai Shree Krishna 🙏</p>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">
            Welcome back, {firstName} ji
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening at your temple today — {formatTodayDate()}
            {summary?.period_label ? (
              <span className="text-foreground/70"> · Showing: {summary.period_label}</span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            {PERIOD_OPTIONS.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="rounded-2xl border-border shadow-soft">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Loading…</p>
                </CardContent>
              </Card>
            ))
          : kpis.map((k) => (
              <Card key={k.label} className="rounded-2xl border-border shadow-soft">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-primary">
                      <k.icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        k.delta.up ? "text-success" : "text-destructive"
                      }`}
                    >
                      {k.delta.text}
                    </span>
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
                  <p className="mt-1 font-display text-2xl font-semibold">{k.value}</p>
                  {"sub" in k && k.sub ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{k.sub}</p>
                  ) : null}
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
              <p className="text-sm text-muted-foreground">
                {summary?.chart_subtitle ?? "Loading chart…"}
              </p>
            </div>
            {summary?.chart_badge ? (
              <Badge variant="secondary" className="rounded-full">
                {summary.chart_badge}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartOverview} margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(0 0% 50%)"
                    fontSize={11}
                    interval={0}
                    angle={chartOverview.length > 8 ? -35 : 0}
                    textAnchor={chartOverview.length > 8 ? "end" : "middle"}
                    height={chartOverview.length > 8 ? 50 : 30}
                    tick={({ x, y, payload }) => {
                      const point = chartOverview.find((p) => p.label === payload?.value);
                      const active = point?.is_highlight;
                      return (
                        <text
                          x={x}
                          y={y}
                          dy={chartOverview.length > 8 ? 4 : 16}
                          textAnchor={chartOverview.length > 8 ? "end" : "middle"}
                          fill={active ? CHART_BAR_HIGHLIGHT : "hsl(0 0% 45%)"}
                          fontSize={11}
                          fontWeight={active ? 700 : 400}
                        >
                          {payload?.value}
                        </text>
                      );
                    }}
                  />
                  <YAxis yAxisId="amount" stroke="hsl(38 70% 42%)" fontSize={12} tickFormatter={(v) => `${v}k`} />
                  <YAxis
                    yAxisId="avg"
                    orientation="right"
                    stroke="hsl(150 50% 40%)"
                    fontSize={12}
                    domain={[0, avgLineMax]}
                    tickFormatter={(v) => `${v}k`}
                    allowDecimals={false}
                  />
                  <Tooltip content={<DonationOverviewTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    yAxisId="amount"
                    dataKey="donations_k"
                    name="Donations (₹ thousands)"
                    radius={[6, 6, 0, 0]}
                    barSize={chartOverview.length > 8 ? 14 : 22}
                  >
                    {chartOverview.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.is_highlight ? CHART_BAR_HIGHLIGHT : CHART_BAR_DEFAULT}
                        stroke={entry.is_highlight ? CHART_BAR_HIGHLIGHT_STROKE : "none"}
                        strokeWidth={entry.is_highlight ? 2 : 0}
                      />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="avg"
                    type="monotone"
                    dataKey="avg_donation_k"
                    name="Avg donation (₹ thousands)"
                    stroke={CHART_LINE_DEFAULT}
                    strokeWidth={2.5}
                    dot={(props) => {
                      const { cx, cy, payload } = props as { cx?: number; cy?: number; payload?: ChartOverviewPoint };
                      if (cx == null || cy == null) return <circle cx={0} cy={0} r={0} fill="none" />;
                      const highlighted = payload?.is_highlight;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={highlighted ? 6 : 3}
                          fill={highlighted ? CHART_LINE_HIGHLIGHT : CHART_LINE_DEFAULT}
                          stroke={highlighted ? CHART_BAR_HIGHLIGHT_STROKE : "none"}
                          strokeWidth={highlighted ? 2 : 0}
                        />
                      );
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Payment Mode</CardTitle>
            <p className="text-sm text-muted-foreground">
              How donors are paying
              {summary?.period_label ? ` · ${summary.period_label}` : ""}
            </p>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : paymentModeData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No donations in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentModeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={PaymentModeLabel}
                    labelLine={false}
                  >
                    {paymentModeData.map((_, i) => (
                      <Cell key={i} fill={modeColor(i)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const p = item.payload as { name: string; share: number; amount: number } | undefined;
                      if (!p) return value;
                      return [
                        `${value} donations (${p.share}%) · ${formatInr(p.amount)}`,
                        p.name,
                      ];
                    }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(0 0% 90%)",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value, entry) => {
                      const share = (entry.payload as { share?: number } | undefined)?.share;
                      return share != null ? `${value} (${share}%)` : String(value);
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
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
              Upload handwritten registers, receipts, PDFs or bank statements. We&apos;ll extract every entry.
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
            <div>
              <CardTitle className="font-display text-lg">Top Donors</CardTitle>
              <p className="text-sm text-muted-foreground">Lifetime · all-time totals for your trust</p>
            </div>
            <Link to="/dashboard/donors" className="text-xs font-medium text-primary hover:underline">
              See all
            </Link>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {tablesLoading ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : topDonors.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No donors yet</p>
            ) : (
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
                      <td className="px-5 py-3 font-medium">{d.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{d.donation_count}</td>
                      <td className="px-5 py-3 text-right font-semibold text-primary">
                        {formatInr(d.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">Recent Donations</CardTitle>
              <p className="text-sm text-muted-foreground">Latest entries in your ledger</p>
            </div>
            <Link to="/dashboard/donations" className="text-xs font-medium text-primary hover:underline">
              See all
            </Link>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {tablesLoading ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : recentDonations.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No donations yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Donor</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Mode</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDonations.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium">{r.donor_name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDonationDate(r.date)}</td>
                      <td className="px-5 py-3">
                        <Badge variant="secondary" className="rounded-full">{r.payment_mode}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">{formatInr(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <PricingSection embedded />
      <FAQSection embedded />
    </div>
  );
}
