import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  CalendarIcon,
  Download,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-shell";
import { toast } from "sonner";
import { createLedgerTransaction, fetchLedger } from "@/lib/ledger-api";

export const Route = createFileRoute("/dashboard/ledger")({
  head: () => ({
    meta: [{ title: "Accounting & Ledger — TrustSaathi" }, { name: "robots", content: "noindex" }],
  }),
  component: LedgerPage,
});

// ---------- Types ----------
type TxType = "Income" | "Expense";
type PaymentMode = "UPI" | "Cash" | "Bank Transfer" | "Cheque";

interface Transaction {
  id: string;
  date: string; // ISO yyyy-MM-dd
  name: string;
  category: string;
  type: TxType;
  mode: PaymentMode;
  amount: number;
  description?: string;
}

const INCOME_CATEGORIES = ["Donation", "Grant", "Membership", "Other"] as const;
const EXPENSE_CATEGORIES = [
  "Salary",
  "Maintenance",
  "Electricity",
  "Charity",
  "Festival",
  "Miscellaneous",
] as const;
const PAYMENT_MODES: PaymentMode[] = ["UPI", "Cash", "Bank Transfer", "Cheque"];

// ---------- Helpers ----------
const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

function LedgerPage() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<DateRange | undefined>();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const response = await fetchLedger();
        setTransactions(response.transactions);
      } catch (error) {
        const message = error instanceof Error ? error.message : t("ledger.toast.loadFailed");
        toast.error(message);
      }
    };

    loadTransactions();
  }, [t]);

  // ---------- Derived ----------
  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        const q = query.trim().toLowerCase();
        if (q && !`${t.name} ${t.description ?? ""} ${t.category}`.toLowerCase().includes(q))
          return false;
        if (range?.from) {
          const d = new Date(t.date);
          if (d < range.from) return false;
          if (range.to && d > range.to) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, query, range]);

  const metrics = useMemo(() => {
    const income = filtered.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense, count: filtered.length };
  }, [filtered]);

  // ---------- Actions ----------
  const addTransaction = async (tx: Omit<Transaction, "id">) => {
    const response = await createLedgerTransaction(tx);
    setTransactions((prev) => [response.transaction, ...prev]);
    toast.success(t("ledger.toast.saved"));
  };

  const exportCsv = () => {
    const header = [
      t("ledger.csv.date"),
      t("ledger.csv.name"),
      t("ledger.csv.category"),
      t("ledger.csv.type"),
      t("ledger.csv.paymentMode"),
      t("ledger.csv.amount"),
      t("ledger.csv.description"),
    ];
    const rows = filtered.map((t) => [
      t.date,
      t.name,
      t.category,
      t.type,
      t.mode,
      t.amount,
      t.description ?? "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trustsaathi-ledger-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={t("ledger.pageTitle")}
        subtitle={t("ledger.pageSubtitle")}
        icon={BookOpen}
      />

      {/* Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={t("ledger.totalIncome")}
          value={inr(metrics.income)}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={
            <span className="inline-flex items-center gap-1 text-success">
              <ArrowUpRight className="h-3.5 w-3.5" /> +12.4%
            </span>
          }
          tone="text-success"
        />
        <MetricCard
          label={t("ledger.totalExpenses")}
          value={inr(metrics.expense)}
          icon={<TrendingDown className="h-5 w-5" />}
          trend={
            <span className="inline-flex items-center gap-1 text-destructive">
              <ArrowDownRight className="h-3.5 w-3.5" /> -4.1%
            </span>
          }
          tone="text-destructive"
        />
        <MetricCard
          label={t("ledger.currentBalance")}
          value={inr(metrics.balance)}
          icon={<Wallet className="h-5 w-5" />}
          tone="text-primary"
        />
        <MetricCard
          label={t("ledger.totalTransactions")}
          value={String(metrics.count)}
          icon={<FileText className="h-5 w-5" />}
          tone="text-foreground"
        />
      </div>

      {/* Action bar */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("ledger.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-full pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "rounded-full justify-start font-normal",
                    !range && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {range?.from
                    ? range.to
                      ? `${format(range.from, "d LLL")} – ${format(range.to, "d LLL")}`
                      : format(range.from, "d LLL yyyy")
                    : t("ledger.filterByDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
                {range && (
                  <div className="flex justify-end border-t border-border p-2">
                    <Button variant="ghost" size="sm" onClick={() => setRange(undefined)}>
                      {t("common.cancel")}
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Button variant="outline" className="rounded-full" onClick={exportCsv}>
              <Download className="mr-1.5 h-4 w-4" /> {t("ledger.exportCsv")}
            </Button>
            <Button className="rounded-full" onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> {t("ledger.addTransaction")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">{t("ledger.table.date")}</th>
                  <th className="px-5 py-3 font-medium">{t("ledger.table.name")}</th>
                  <th className="px-5 py-3 font-medium">{t("ledger.table.category")}</th>
                  <th className="px-5 py-3 font-medium">{t("ledger.table.type")}</th>
                  <th className="px-5 py-3 font-medium">{t("ledger.table.paymentMode")}</th>
                  <th className="px-5 py-3 text-right font-medium">{t("ledger.table.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-border last:border-0 hover:bg-accent/40"
                  >
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(t.date), "d MMM yyyy")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{t.name}</div>
                      {t.description && (
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{t.category}</td>
                    <td className="px-5 py-3">
                      <TypeBadge type={t.type} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{t.mode}</td>
                    <td
                      className={cn(
                        "px-5 py-3 text-right font-semibold whitespace-nowrap",
                        t.type === "Income" ? "text-success" : "text-destructive",
                      )}
                    >
                      {t.type === "Income" ? "+" : "−"} {inr(t.amount)}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-muted-foreground"
                    >
                      {t("ledger.noTransactions")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddTransactionDialog open={open} onOpenChange={setOpen} onSubmit={addTransaction} />
    </div>
  );
}

// ---------- Sub-components ----------
function MetricCard({
  label,
  value,
  icon,
  trend,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: React.ReactNode;
  tone?: string;
}) {
  return (
    <Card className="rounded-2xl border-border shadow-soft">
      <CardContent className="flex items-start justify-between p-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn("mt-1 font-display text-2xl font-semibold truncate", tone)}>{value}</p>
          {trend && <p className="mt-1 text-xs">{trend}</p>}
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}

function TypeBadge({ type }: { type: TxType }) {
  const { t } = useTranslation();
  if (type === "Income") {
    return (
      <Badge className="rounded-full bg-success/15 text-success hover:bg-success/20 border-0">
        <ArrowUpRight className="mr-1 h-3 w-3" /> {t("ledger.badgeIncome")}
      </Badge>
    );
  }
  return (
    <Badge className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 border-0">
      <ArrowDownRight className="mr-1 h-3 w-3" /> {t("ledger.badgeExpense")}
    </Badge>
  );
}

// ---------- Add Transaction Dialog ----------
function AddTransactionDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (tx: Omit<Transaction, "id">) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [type, setType] = useState<TxType>("Income");
  const [date, setDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [mode, setMode] = useState<PaymentMode | "">("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const categories = type === "Income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const reset = () => {
    setType("Income");
    setDate(new Date());
    setAmount("");
    setCategory("");
    setMode("");
    setName("");
    setDescription("");
  };

  const handleSave = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error(t("ledger.validation.amountInvalid"));
    if (!category) return toast.error(t("ledger.validation.categoryRequired"));
    if (!mode) return toast.error(t("ledger.validation.paymentModeRequired"));

    try {
      await onSubmit({
        date: format(date, "yyyy-MM-dd"),
        name: name.trim() || (type === "Income" ? "Anonymous Donor" : "Payee"),
        category,
        type,
        mode: mode as PaymentMode,
        amount: amt,
        description: description.trim() || undefined,
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("ledger.toast.saveFailed");
      toast.error(message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t("ledger.dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("ledger.dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Type */}
          <div className="space-y-2">
            <Label>{t("ledger.transactionType")}</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => {
                setType(v as TxType);
                setCategory("");
              }}
              className="grid grid-cols-2 gap-2"
            >
              {(["Income", "Expense"] as const).map((t_) => (
                <label
                  key={t_}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition",
                    type === t_ &&
                      (t_ === "Income"
                        ? "border-success bg-success/10 text-success"
                        : "border-destructive bg-destructive/10 text-destructive"),
                  )}
                >
                  <RadioGroupItem value={t_} className="sr-only" />
                  {t_ === "Income" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {t_ === "Income" ? t("ledger.income") : t("ledger.expense")}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Date */}
            <div className="space-y-1.5">
              <Label>{t("ledger.date")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start rounded-xl font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "d MMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label>{t("ledger.amount")}</Label>
              <Input
                type="number"
                min={0}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>{t("ledger.category")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t("ledger.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Mode */}
            <div className="space-y-1.5">
              <Label>{t("ledger.paymentMode")}</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t("ledger.selectMode")} />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label>
              {type === "Income" ? t("ledger.donorName") : t("ledger.payeeName")}{" "}
              <span className="text-muted-foreground font-normal">({t("ledger.optional")})</span>
            </Label>
            <Input
              placeholder={type === "Income" ? "e.g. Anil Mehta" : "e.g. MSEB"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>{t("ledger.description")}</Label>
            <Textarea
              placeholder={t("ledger.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button className="rounded-full" onClick={handleSave}>
            {t("ledger.saveTransaction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
