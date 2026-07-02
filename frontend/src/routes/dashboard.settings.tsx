import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — TrustSaathi" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Settings" subtitle="Manage temple, trust and user information." icon={Settings} />

      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader><CardTitle className="font-display text-lg">Temple / Trust Information</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><Input defaultValue="Shree Ganesh Mandir Trust" className="rounded-xl" /></Field>
          <Field label="Trust Registration No."><Input defaultValue="MH/PUN/E-1234" className="rounded-xl" /></Field>
          <Field label="80G Number"><Input defaultValue="AAATS1234L/01/2024" className="rounded-xl" /></Field>
          <Field label="12A Number"><Input defaultValue="AAATS1234L/12A/2020" className="rounded-xl" /></Field>
          <Field label="Financial Year Start"><Input defaultValue="01 April" className="rounded-xl" /></Field>
          <Field label="Address" full><Input defaultValue="Sadashiv Peth, Pune, MH 411030" className="rounded-xl" /></Field>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader><CardTitle className="font-display text-lg">Users & Roles</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { n: "Ramesh Joshi", r: "Trustee / Admin" },
            { n: "Sunita Iyer", r: "Accountant" },
            { n: "Mohan Sharma", r: "Data Entry Operator" },
            { n: "CA Verma & Co.", r: "Auditor (Read Only)" },
          ].map((u) => (
            <div key={u.n} className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="font-medium">{u.n}</p>
                <p className="text-xs text-muted-foreground">{u.r}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full">Manage</Button>
            </div>
          ))}
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
