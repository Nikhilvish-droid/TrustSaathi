import { createFileRoute } from "@tanstack/react-router";
import { HandCoins, Printer, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/donations")({
  head: () => ({ meta: [{ title: "Donations — TrustSaathi" }, { name: "robots", content: "noindex" }] }),
  component: DonationsPage,
});

function DonationsPage() {
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
          <form className="grid gap-5 sm:grid-cols-2">
            <Field label="Donor Name *"><Input placeholder="e.g. Shri Anil Mehta" className="rounded-xl" /></Field>
            <Field label="Phone Number"><Input placeholder="+91 98xxx xxxxx" className="rounded-xl" /></Field>
            <Field label="PAN (for 80G)"><Input placeholder="ABCDE1234F" className="rounded-xl" /></Field>
            <Field label="Donation Amount (₹) *"><Input type="number" placeholder="5100" className="rounded-xl" /></Field>
            <Field label="Date *"><Input type="date" className="rounded-xl" /></Field>
            <Field label="Payment Method *">
              <Select>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a method" /></SelectTrigger>
                <SelectContent>
                  {["UPI", "Cash", "Bank Transfer", "Cheque", "Card"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Purpose">
              <Select>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a purpose" /></SelectTrigger>
                <SelectContent>
                  {["General", "Annadaan", "Pooja Seva", "Construction", "Festival", "Education", "Healthcare"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Receipt Number"><Input placeholder="Auto-generated · TS-2026-00482" className="rounded-xl" /></Field>
            <Field label="Remarks" full>
              <Textarea placeholder="Any extra notes…" className="min-h-[90px] rounded-xl" />
            </Field>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-3 border-t border-border pt-5">
              <Button type="button" className="rounded-full"><Save className="mr-1.5 h-4 w-4" /> Save Donation</Button>
              <Button type="button" variant="outline" className="rounded-full"><Printer className="mr-1.5 h-4 w-4" /> Save & Print Receipt</Button>
              <p className="text-xs text-muted-foreground">An 80G receipt is generated automatically when PAN is provided.</p>
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
