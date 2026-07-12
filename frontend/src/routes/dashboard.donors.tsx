import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Search, Download, UserPlus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-shell";
import { toast } from "sonner";
import {
  fetchDonors,
  donorInitial,
  type DonorFilter,
  type DonorRecord,
  type DonorStats,
} from "@/lib/donors-api";
import { formatDonationDate, formatInr } from "@/lib/donations-api";
import { exportDonorsPdf } from "@/lib/export/donors-export";

export const Route = createFileRoute("/dashboard/donors")({
  head: () => ({ meta: [{ title: "Donor Management — TrustSaathi" }, { name: "robots", content: "noindex" }] }),
  component: DonorsPage,
});

const FILTERS: { label: string; value: DonorFilter }[] = [
  { label: "All", value: "all" },
  { label: "Repeat", value: "repeat" },
  { label: "New", value: "new" },
  { label: "Corporate", value: "corporate" },
  { label: "Trust", value: "trust" },
];

function DonorsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<DonorFilter>("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data: res, isLoading: loading } = useQuery({
    queryKey: ["donors", debouncedSearch, filter],
    queryFn: () => fetchDonors(debouncedSearch, filter),
  });

  const stats = res?.stats ?? null;
  const donors = res?.donors ?? [];

  const statCards = useMemo(() => {
    if (!stats) {
      return [
        { l: "Total Donors", v: "—" },
        { l: "Repeat Donors", v: "—" },
        { l: "New This Month", v: "—" },
        { l: "Total Raised", v: "—" },
      ];
    }
    return [
      { l: "Total Donors", v: stats.total_donors.toLocaleString("en-IN") },
      { l: "Repeat Donors", v: stats.repeat_donors.toLocaleString("en-IN") },
      { l: "New This Month", v: stats.new_this_month.toLocaleString("en-IN") },
      { l: "Total Raised", v: formatInr(stats.lifetime_value), hint: "All-time · your trust" },
    ];
  }, [stats]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const payload = await exportDonorsPdf(debouncedSearch, filter);
      toast.success(`PDF downloaded · ${payload.rows.length} donation${payload.rows.length === 1 ? "" : "s"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Donor Management"
        subtitle="Search, filter and manage every donor in one place."
        icon={Users}
        action={
          <>
            <Button
              variant="outline"
              className="rounded-full"
              disabled={exporting || loading}
              onClick={() => void handleExport()}
            >
              {exporting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              Export
            </Button>
            <Button asChild className="rounded-full">
              <Link to="/dashboard/donations">
                <UserPlus className="mr-1.5 h-4 w-4" /> Add Donor
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.l} className="rounded-2xl border-border shadow-soft">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.l}</p>
              <p className="mt-1 font-display text-2xl font-semibold">{s.v}</p>
              {"hint" in s && s.hint ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{s.hint}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-border shadow-soft">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name"
                className="rounded-full pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <Button
                  key={f.value}
                  variant={filter === f.value ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            {loading ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">Loading donors…</p>
            ) : donors.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                {debouncedSearch || filter !== "all" ? "No donors match your search or filter." : "No donors yet."}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Donor</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">PAN</th>
                    <th className="px-4 py-3 font-medium">Donations</th>
                    <th className="px-4 py-3 font-medium">Last Donation</th>
                    <th className="px-4 py-3 text-right font-medium">Lifetime</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.map((d) => (
                    <tr key={d.id} className="border-t border-border hover:bg-accent/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {donorInitial(d.name)}
                          </span>
                          <div>
                            <p className="font-medium">{d.name}</p>
                            <Badge variant="secondary" className="mt-0.5 rounded-full text-[10px]">
                              {d.category}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{d.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.pan ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.donation_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {d.last_donation_date ? formatDonationDate(d.last_donation_date) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">
                        {formatInr(d.lifetime_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
