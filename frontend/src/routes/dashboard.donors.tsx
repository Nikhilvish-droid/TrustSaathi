import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Search, Download, UserPlus, Phone, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-shell";

export const Route = createFileRoute("/dashboard/donors")({
  head: () => ({ meta: [{ title: "Donor Management — TrustSaathi" }, { name: "robots", content: "noindex" }] }),
  component: DonorsPage,
});

const donors = [
  { name: "Shri Anil Mehta", phone: "+91 98200 11234", pan: "ABCPM1234X", total: "₹2,50,000", count: 8, last: "12 Jun 2026", tag: "Repeat" },
  { name: "Smt. Radha Iyer", phone: "+91 98765 43210", pan: "BXYIR4567K", total: "₹1,80,000", count: 12, last: "28 Jun 2026", tag: "Repeat" },
  { name: "Sundar Foundation", phone: "+91 80800 99000", pan: "AAFCS9090Q", total: "₹1,50,000", count: 3, last: "02 May 2026", tag: "Corporate" },
  { name: "Shri Rajesh Kapoor", phone: "+91 99887 76655", pan: "DKPRK7788L", total: "₹1,25,000", count: 6, last: "20 Jun 2026", tag: "Repeat" },
  { name: "Devi Charitable Trust", phone: "+91 98111 22334", pan: "AAATD2211M", total: "₹95,000", count: 4, last: "10 Apr 2026", tag: "Trust" },
  { name: "Karthik N.", phone: "+91 90000 12345", pan: "—", total: "₹42,000", count: 7, last: "30 Jun 2026", tag: "New" },
  { name: "Meena Gupta", phone: "+91 98887 11122", pan: "BGTPM9912P", total: "₹38,500", count: 5, last: "29 Jun 2026", tag: "Repeat" },
  { name: "Suresh Patel", phone: "+91 91234 56789", pan: "—", total: "₹12,300", count: 9, last: "29 Jun 2026", tag: "Regular" },
];

function DonorsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Donor Management"
        subtitle="Search, filter and manage every donor in one place."
        icon={Users}
        action={
          <>
            <Button variant="outline" className="rounded-full"><Download className="mr-1.5 h-4 w-4" /> Export</Button>
            <Button className="rounded-full"><UserPlus className="mr-1.5 h-4 w-4" /> Add Donor</Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { l: "Total Donors", v: "1,248" },
          { l: "Repeat Donors", v: "612" },
          { l: "New This Month", v: "38" },
          { l: "Lifetime Value", v: "₹84.2L" },
        ].map((s) => (
          <Card key={s.l} className="rounded-2xl border-border shadow-soft">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.l}</p>
              <p className="mt-1 font-display text-2xl font-semibold">{s.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-border shadow-soft">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, phone or PAN" className="rounded-full pl-9" />
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", "Repeat", "New", "Corporate", "Trust"].map((f, i) => (
                <Button key={f} variant={i === 0 ? "default" : "outline"} size="sm" className="rounded-full">{f}</Button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
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
                  <tr key={d.name} className="border-t border-border hover:bg-accent/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {d.name.split(" ").slice(-1)[0][0]}
                        </span>
                        <div>
                          <p className="font-medium">{d.name}</p>
                          <Badge variant="secondary" className="mt-0.5 rounded-full text-[10px]">{d.tag}</Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {d.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.pan}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.count}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.last}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{d.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            Connect Lovable Cloud to save real donors. <Link to="/dashboard" className="text-primary hover:underline">Back to Dashboard</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
