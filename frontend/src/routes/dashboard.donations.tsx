import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HandCoins, Loader2, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-shell";
import { createDonation } from "@/lib/donations-api";
import { PAYMENT_MODES } from "@/lib/ai-upload-types";

export const Route = createFileRoute("/dashboard/donations")({
  head: () => ({ meta: [{ title: "Donations — TrustSaathi" }, { name: "robots", content: "noindex" }] }),
  component: DonationsPage,
});

const PURPOSES = ["General", "Annadaan", "Pooja Seva", "Construction", "Festival", "Education", "Healthcare"] as const;

type DonationForm = {
  donor_name: string;
  phone: string;
  pan: string;
  amount: string;
  date: string;
  payment_mode: string;
  purpose: string;
  receipt_number: string;
  remarks: string;
};

const EMPTY_FORM: DonationForm = {
  donor_name: "",
  phone: "",
  pan: "",
  amount: "",
  date: "",
  payment_mode: "",
  purpose: "",
  receipt_number: "",
  remarks: "",
};

function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

function validateForm(form: DonationForm): string | null {
  if (!form.donor_name.trim()) return "Donor name is required.";
  const amount = Number(form.amount);
  if (!form.amount || Number.isNaN(amount) || amount <= 0) return "Enter a valid donation amount.";
  if (!form.date) return "Date is required.";
  if (!form.payment_mode) return "Payment method is required.";
  return null;
}

function DonationsPage() {
  const [form, setForm] = useState<DonationForm>({ ...EMPTY_FORM, date: todayIsoDate() });
  const [saving, setSaving] = useState(false);

  const updateField = <K extends keyof DonationForm>(key: K, value: DonationForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const validationError = validateForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    try {
      const res = await createDonation({
        donor_name: form.donor_name.trim(),
        amount: Number(form.amount),
        date: form.date,
        payment_mode: form.payment_mode,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(form.pan.trim() ? { pan: form.pan.trim() } : {}),
        ...(form.purpose ? { purpose: form.purpose } : {}),
        ...(form.receipt_number.trim() ? { receipt_number: form.receipt_number.trim() } : {}),
        ...(form.remarks.trim() ? { remarks: form.remarks.trim() } : {}),
      });

      toast.success(res.message);
      setForm({ ...EMPTY_FORM, date: todayIsoDate() });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save donation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Add a Donation"
        subtitle="Fill in the details below — we'll generate a printable receipt instantly."
        icon={HandCoins}
      />

      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-lg">Donation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-5 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
          >
            <Field label="Donor Name *">
              <Input
                placeholder="e.g. Shri Anil Mehta"
                className="rounded-xl"
                value={form.donor_name}
                onChange={(e) => updateField("donor_name", e.target.value)}
                required
              />
            </Field>
            <Field label="Phone Number">
              <Input
                placeholder="+91 98xxx xxxxx"
                className="rounded-xl"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </Field>
            <Field label="PAN (for 80G)">
              <Input
                placeholder="ABCDE1234F"
                className="rounded-xl"
                value={form.pan}
                onChange={(e) => updateField("pan", e.target.value)}
              />
            </Field>
            <Field label="Donation Amount (₹) *">
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="5100"
                className="rounded-xl"
                value={form.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                required
              />
            </Field>
            <Field label="Date *">
              <Input
                type="date"
                className="rounded-xl"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                required
              />
            </Field>
            <Field label="Payment Method *">
              <Select value={form.payment_mode || undefined} onValueChange={(v) => updateField("payment_mode", v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.filter((m) => m !== "Unknown").map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Purpose">
              <Select value={form.purpose || undefined} onValueChange={(v) => updateField("purpose", v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a purpose" />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Receipt Number">
              <Input
                placeholder="Auto-generated · TS-2026-00482"
                className="rounded-xl"
                value={form.receipt_number}
                onChange={(e) => updateField("receipt_number", e.target.value)}
              />
            </Field>
            <Field label="Remarks" full>
              <Textarea
                placeholder="Any extra notes…"
                className="min-h-[90px] rounded-xl"
                value={form.remarks}
                onChange={(e) => updateField("remarks", e.target.value)}
              />
            </Field>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-3 border-t border-border pt-5">
              <Button type="submit" className="rounded-full" disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                Save Donation
              </Button>
              <Button type="button" variant="outline" className="rounded-full" disabled={saving}>
                <Printer className="mr-1.5 h-4 w-4" /> Save & Print Receipt
              </Button>
              <p className="text-xs text-muted-foreground">
                An 80G receipt is generated automatically when PAN is provided.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}
