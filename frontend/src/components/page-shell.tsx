import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-primary">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <Card className="rounded-2xl border-dashed border-border bg-card">
      <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary">
          <Construction className="h-6 w-6" />
        </span>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {note ?? "This area is part of the full TrustSaathi experience. Connect Lovable Cloud to enable saving, editing and exporting your data."}
        </p>
        <Button asChild variant="outline" className="mt-2 rounded-full">
          <Link to="/dashboard">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
