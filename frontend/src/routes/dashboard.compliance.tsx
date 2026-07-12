import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Search,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/page-shell";
import { toast } from "sonner";
import {
  fetchComplianceSummary,
  type ComplianceAlert,
  type ComplianceSummary,
} from "@/lib/compliance-api";
import {
  fetchDonors,
  fetchDonorDonations,
  updateDonor,
  deleteDonor,
  donorInitial,
  type DonorFilter,
  type DonorRecord,
  type DonorDonation,
  type ComplianceFilter,
} from "@/lib/donors-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_MODES } from "@/lib/ai-upload-types";
import { formatDonationDate, formatInr, updateDonation } from "@/lib/donations-api";

export const Route = createFileRoute("/dashboard/compliance")({
  head: () => ({
    meta: [{ title: "Donor Audit — TrustSaathi" }, { name: "robots", content: "noindex" }],
  }),
  component: CompliancePage,
});

const FILTERS: { label: string; value: DonorFilter }[] = [
  { label: "All", value: "all" },
  { label: "Repeat", value: "repeat" },
  { label: "New", value: "new" },
  { label: "Corporate", value: "corporate" },
  { label: "Trust", value: "trust" },
];

const COMPLIANCE_FILTER_LABELS: Record<string, string> = {
  missing_phone: "Missing mobile number",
  missing_pan: "Missing PAN card",
  pending_review: "Pending review",
  "draft_missing_donor_name": "Draft missing donor name",
  "draft_missing_amount": "Draft missing amount",
  "draft_missing_date": "Draft missing date",
  "draft_missing_payment_mode": "Draft missing payment mode",
};

function complianceFilterLabel(key: ComplianceFilter): string {
  return COMPLIANCE_FILTER_LABELS[key] ?? key.replace(/_/g, " ");
}

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

function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

function CompliancePage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<DonorFilter>("all");
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilter | null>(null);

  const [editDonor, setEditDonor] = useState<DonorRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPan, setEditPan] = useState("");
  const [donorDonations, setDonorDonations] = useState<DonorDonation[]>([]);
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPaymentMode, setEditPaymentMode] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DonorRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const queryClient = useQueryClient();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["complianceSummary"],
    queryFn: fetchComplianceSummary,
  });

  const { data: donorsRes, isLoading: donorsLoading } = useQuery({
    queryKey: ["complianceDonors", debouncedSearch, filter, complianceFilter],
    queryFn: () => fetchDonors(debouncedSearch, filter, complianceFilter),
  });

  const donors = donorsRes?.donors ?? [];

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const handleAlertAction = (alert: ComplianceAlert) => {
    if (alert.filter_key) {
      setComplianceFilter(alert.filter_key as ComplianceFilter);
      toast.info(`Showing donors: ${complianceFilterLabel(alert.filter_key as ComplianceFilter)}`);
    }
  };

  const selectDonation = (donation: DonorDonation) => {
    setSelectedDonationId(donation.id);
    setEditAmount(String(donation.amount));
    setEditDate(toDateInputValue(donation.date));
    setEditPaymentMode(donation.payment_mode ?? "Unknown");
  };

  const openEdit = (donor: DonorRecord) => {
    setEditDonor(donor);
    setEditName(donor.name);
    setEditPhone(donor.phone ?? "");
    setEditPan(donor.pan ?? "");
    setDonorDonations([]);
    setSelectedDonationId(null);
    setEditAmount("");
    setEditDate("");
    setEditPaymentMode("");
    setDonationsLoading(true);

    void (async () => {
      try {
        const res = await fetchDonorDonations(donor.id);
        setDonorDonations(res.donations);
        if (res.donations.length > 0) {
          selectDonation(res.donations[0]);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load donations.");
        setEditDonor(null);
      } finally {
        setDonationsLoading(false);
      }
    })();
  };

  const handleSave = async () => {
    if (!editDonor || !editName.trim()) {
      toast.error("Donor name is required.");
      return;
    }

    if (selectedDonationId) {
      const amountNum = Number(editAmount);
      if (!editDate.trim()) {
        toast.error("Donation date is required.");
        return;
      }
      if (Number.isNaN(amountNum) || amountNum <= 0) {
        toast.error("Enter a valid donation amount greater than zero.");
        return;
      }
      if (!editPaymentMode.trim()) {
        toast.error("Payment mode is required.");
        return;
      }
    }

    setSaving(true);
    try {
      await updateDonor(editDonor.id, {
        name: editName.trim(),
        phone: editPhone.trim() || null,
        pan: editPan.trim() || null,
      });

      if (selectedDonationId) {
        await updateDonation(selectedDonationId, {
          donor_name: editName.trim(),
          amount: Number(editAmount),
          date: editDate,
          payment_mode: editPaymentMode,
        });
      }

      toast.success("Donor and donation updated.");
      setEditDonor(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["complianceDonors"] }),
        queryClient.invalidateQueries({ queryKey: ["complianceSummary"] }),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDonor(deleteTarget.id);
      toast.success(`${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["complianceDonors"] }),
        queryClient.invalidateQueries({ queryKey: ["complianceSummary"] }),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete donor.");
    } finally {
      setDeleting(false);
    }
  };

  const score = summary?.score ?? 0;
  const scoreMessage =
    summary?.message ??
    "You're in good shape! Fix issues below to reach 95+.";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Donor Audit"
        subtitle="Review completeness, fix missing mobile & PAN, and edit donor records."
        icon={ShieldCheck}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-accent via-card to-card shadow-soft lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-display text-lg">Audit Readiness Score</CardTitle>
            <p className="text-sm text-muted-foreground">
              {summaryLoading ? "Updating…" : "Updated just now"}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {summaryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <span className="font-display text-6xl font-semibold text-primary">{score}</span>
                  <span className="mb-2 text-sm text-muted-foreground">/ 100</span>
                </div>
                <Progress value={score} className="h-2" />
                <p className="text-sm text-muted-foreground">{scoreMessage}</p>
                {summary?.counts.total_donors ? (
                  <p className="text-xs text-muted-foreground">
                    {summary.counts.complete_donors} of {summary.counts.total_donors} donors have
                    mobile &amp; PAN on file
                  </p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Important Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">What needs your attention</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {summaryLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading alerts…</p>
            ) : summary?.alerts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No alerts right now.</p>
            ) : (
              summary?.alerts.map((alert) => {
                const Icon = toneIcon[alert.tone];
                const isActive = alert.filter_key && complianceFilter === alert.filter_key;
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 rounded-xl border p-4 ${toneCls[alert.tone]} ${isActive ? "ring-2 ring-primary/40" : ""}`}
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-foreground/80" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      className="shrink-0 rounded-full"
                      onClick={() => handleAlertAction(alert)}
                      disabled={!alert.filter_key && alert.tone === "success"}
                    >
                      {isActive ? "Filtered" : alert.action}
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-lg">Donor Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Search, filter and fix donor records highlighted by alerts above.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {complianceFilter ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                Alert filter: {complianceFilterLabel(complianceFilter)}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-2 text-muted-foreground"
                onClick={() => setComplianceFilter(null)}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border">
            {donorsLoading ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">Loading donors…</p>
            ) : donors.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                {complianceFilter
                  ? "No donors match this alert filter."
                  : debouncedSearch || filter !== "all"
                    ? "No donors match your search or filter."
                    : "No donors yet."}
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
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
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
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-full px-3"
                            onClick={() => openEdit(d)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Update
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-full px-3 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(d)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDonor != null} onOpenChange={(open) => !open && setEditDonor(null)}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 space-y-1.5 px-6 pb-4 pt-6">
            <DialogTitle className="font-display">Update Donor</DialogTitle>
            {editDonor && editDonor.donation_count > 1 ? (
              <p className="text-sm text-muted-foreground">
                Select a donation below to edit its amount, date, and payment mode.
              </p>
            ) : null}
          </DialogHeader>
          {donationsLoading ? (
            <div className="flex min-h-0 flex-1 items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-2">
            <div className="space-y-2">
              <Label htmlFor="donor-name">Name</Label>
              <Input
                id="donor-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="donor-phone">Mobile number</Label>
                <Input
                  id="donor-phone"
                  placeholder="10-digit mobile"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="donor-pan">PAN</Label>
                <Input
                  id="donor-pan"
                  placeholder="ABCDE1234F"
                  value={editPan}
                  onChange={(e) => setEditPan(e.target.value.toUpperCase())}
                  className="rounded-xl"
                />
              </div>
            </div>
            {donorDonations.length > 0 ? (
              <>
                {donorDonations.length > 1 ? (
                  <div className="border-t border-border pt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Donations ({donorDonations.length})
                    </p>
                    <div className="max-h-28 space-y-1.5 overflow-y-auto rounded-xl border border-border p-1 sm:max-h-32">
                      {donorDonations.map((donation) => {
                        const isSelected = donation.id === selectedDonationId;
                        return (
                          <button
                            key={donation.id}
                            type="button"
                            onClick={() => selectDonation(donation)}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              isSelected
                                ? "bg-primary/10 ring-1 ring-primary/30"
                                : "hover:bg-accent"
                            }`}
                          >
                            <span className="font-medium">
                              {formatDonationDate(donation.date)}
                            </span>
                            <span className="text-muted-foreground">
                              {formatInr(donation.amount)} · {donation.payment_mode}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                <div className="border-t border-border pt-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {donorDonations.length > 1 ? "Edit selected donation" : "Donation"}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="donation-amount">Amount (₹)</Label>
                      <Input
                        id="donation-amount"
                        type="number"
                        min={1}
                        placeholder="5000"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="donation-date">Date</Label>
                      <Input
                        id="donation-date"
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="donation-mode">Payment mode</Label>
                    <Select value={editPaymentMode} onValueChange={setEditPaymentMode}>
                      <SelectTrigger id="donation-mode" className="rounded-xl">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            ) : null}
          </div>
          )}
          <DialogFooter className="shrink-0 border-t border-border px-6 pb-6 pt-4">
            <Button variant="outline" className="rounded-full" onClick={() => setEditDonor(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-full"
              disabled={saving || donationsLoading}
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete donor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> and all associated
              donation records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
