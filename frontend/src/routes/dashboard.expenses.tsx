import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Receipt, Plus, TrendingUp, TrendingDown, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-shell";
import { formatDonationDate, formatInr } from "@/lib/donations-api";
import {
  createIncomeExpense,
  deleteIncomeExpense,
  fetchIncomeExpenses,
  mapIncomeExpenseRecord,
  updateIncomeExpense,
  type IncomeExpenseType,
} from "@/lib/income-expenses-api";

export const Route = createFileRoute("/dashboard/expenses")({
  head: () => ({
    meta: [{ title: "Income & Expenses — TrustSaathi" }, { name: "robots", content: "noindex" }],
  }),
  component: ExpensesPage,
});

type TransactionType = IncomeExpenseType;
type TimeFilter = "Today" | "Month" | "Year" | "Lifetime";

type Transaction = {
  id: string;
  date: string;
  category: string;
  type: TransactionType;
  note: string;
  amount: number;
};

type EntryForm = {
  date: string;
  category: string;
  note: string;
  amount: string;
};

const TIME_FILTERS: TimeFilter[] = ["Today", "Month", "Year", "Lifetime"];

const CATEGORY_SUGGESTIONS = [
  "Annadaan",
  "Donations",
  "Electricity",
  "Hundi",
  "Salaries",
  "Maintenance",
  "Festival",
  "Rent",
  "Supplies",
];

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDate(dateStr: string): Date | null {
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function filterTransactions(transactions: Transaction[], timeFilter: TimeFilter, now = new Date()) {
  return transactions.filter((t) => {
    const d = parseLocalDate(t.date);
    if (!d) return false;

    switch (timeFilter) {
      case "Today":
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      case "Month":
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      case "Year":
        return d.getFullYear() === now.getFullYear();
      case "Lifetime":
      default:
        return true;
    }
  });
}

function filterPeriodLabel(timeFilter: TimeFilter, t: (key: string) => string): string {
  switch (timeFilter) {
    case "Today":
      return t("expenses.periods.today");
    case "Month":
      return t("expenses.periods.month");
    case "Year":
      return t("expenses.periods.year");
    case "Lifetime":
      return t("expenses.periods.lifetime");
  }
}

function emptyForm(): EntryForm {
  return { date: todayIsoDate(), category: "", note: "", amount: "" };
}

function ExpensesPage() {
  const { t } = useTranslation();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Lifetime");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>("Income");
  const [form, setForm] = useState<EntryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const queryClient = useQueryClient();

  const { data: res, isLoading: loading } = useQuery({
    queryKey: ["incomeExpenses"],
    queryFn: fetchIncomeExpenses,
  });

  const allTransactions = useMemo(
    () => (res?.transactions ?? []).map(mapIncomeExpenseRecord),
    [res],
  );

  const filteredTransactions = useMemo(() => {
    return filterTransactions(allTransactions, timeFilter).sort(
      (a, b) => (parseLocalDate(b.date)?.getTime() ?? 0) - (parseLocalDate(a.date)?.getTime() ?? 0),
    );
  }, [allTransactions, timeFilter]);

  const { totalIncome, totalExpenses, net } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const t of filteredTransactions) {
      if (t.type === "Income") income += t.amount;
      else expenses += t.amount;
    }
    return { totalIncome: income, totalExpenses: expenses, net: income - expenses };
  }, [filteredTransactions]);

  const periodLabel = filterPeriodLabel(timeFilter, t);

  const openModal = (type: TransactionType) => {
    setEditingId(null);
    setModalType(type);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setModalType(transaction.type);
    setForm({
      date: transaction.date,
      category: transaction.category,
      note: transaction.note,
      amount: String(transaction.amount),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.date) {
      toast.error(t("expenses.validation.dateRequired"));
      return;
    }
    if (!form.category.trim()) {
      toast.error(t("expenses.validation.categoryRequired"));
      return;
    }
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      toast.error(t("expenses.validation.amountInvalid"));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: modalType,
        date: form.date,
        category: form.category.trim(),
        note: form.note.trim() || undefined,
        amount,
      };

      if (editingId) {
        const res = await updateIncomeExpense(editingId, payload);
        queryClient.invalidateQueries({ queryKey: ["incomeExpenses"] });
        closeModal();
        toast.success(res.message);
      } else {
        const res = await createIncomeExpense(payload);
        queryClient.invalidateQueries({ queryKey: ["incomeExpenses"] });
        closeModal();
        toast.success(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("expenses.toast.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteIncomeExpense(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: ["incomeExpenses"] });
      toast.success(t("expenses.toast.deleted"));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("expenses.toast.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={t("expenses.pageTitle")}
        subtitle={t("expenses.pageSubtitle")}
        icon={Receipt}
        action={
          <>
            <Button
              className="rounded-full border-success/30 bg-success/10 text-success hover:bg-success/20"
              variant="outline"
              onClick={() => openModal("Income")}
            >
              <Plus className="mr-1.5 h-4 w-4" /> {t("expenses.addIncome")}
            </Button>
            <Button
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => openModal("Expense")}
            >
              <Plus className="mr-1.5 h-4 w-4" /> {t("expenses.addExpense")}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {TIME_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setTimeFilter(filter)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              timeFilter === filter
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {t(`expenses.timeFilters.${filter.toLowerCase()}`)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            l: t("expenses.summary.income", { period: periodLabel }),
            v: formatInr(totalIncome),
            icon: TrendingUp,
            tone: "text-success",
          },
          {
            l: t("expenses.summary.expenses", { period: periodLabel }),
            v: formatInr(totalExpenses),
            icon: TrendingDown,
            tone: "text-destructive",
          },
          {
            l: t("expenses.summary.net", { period: periodLabel }),
            v: formatInr(net),
            icon: net >= 0 ? TrendingUp : TrendingDown,
            tone: "text-primary",
          },
        ].map((s) => (
          <Card key={s.l} className="rounded-2xl border-border shadow-soft">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.l}</p>
                <p className={`mt-1 font-display text-2xl font-semibold ${s.tone}`}>{s.v}</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                <s.icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-border shadow-soft">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">{t("expenses.table.date")}</th>
                  <th className="px-5 py-3 font-medium">{t("expenses.table.category")}</th>
                  <th className="px-5 py-3 font-medium">{t("expenses.table.type")}</th>
                  <th className="px-5 py-3 font-medium">{t("expenses.table.note")}</th>
                  <th className="px-5 py-3 text-right font-medium">{t("expenses.table.amount")}</th>
                  <th className="px-5 py-3 text-right font-medium">{t("expenses.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                      {t("expenses.emptyState", { period: periodLabel.toLowerCase() })}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-b border-border last:border-0 ${
                        r.type === "Income"
                          ? "bg-success/5 hover:bg-success/10"
                          : "bg-destructive/5 hover:bg-destructive/10"
                      }`}
                    >
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDonationDate(r.date)}
                      </td>
                      <td className="px-5 py-3 font-medium">{r.category}</td>
                      <td className="px-5 py-3">
                        <Badge
                          variant="secondary"
                          className={`rounded-full ${r.type === "Income" ? "text-success" : "text-destructive"}`}
                        >
                          {t(`expenses.type.${r.type.toLowerCase()}`)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{r.note || "—"}</td>
                      <td
                        className={`px-5 py-3 text-right font-semibold ${
                          r.type === "Income" ? "text-success" : "text-destructive"
                        }`}
                      >
                        {r.type === "Income" ? "+" : "-"} {formatInr(r.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-full px-3"
                            onClick={() => openEdit(r)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            {t("common.edit")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-full px-3 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(r)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            {t("common.delete")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? t("expenses.dialog.edit") : t("expenses.dialog.add")} {t(`expenses.type.${modalType.toLowerCase()}`)}
            </DialogTitle>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            {editingId && (
              <div className="grid gap-2">
                <Label htmlFor="entry-type">{t("expenses.dialog.type")}</Label>
                <Select value={modalType} onValueChange={(v) => setModalType(v as TransactionType)}>
                  <SelectTrigger id="entry-type" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Income">{t("expenses.type.income")}</SelectItem>
                    <SelectItem value="Expense">{t("expenses.type.expense")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="entry-date">{t("expenses.dialog.date")}</Label>
              <Input
                id="entry-date"
                type="date"
                className="rounded-xl"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entry-category">{t("expenses.dialog.category")}</Label>
              <Input
                id="entry-category"
                list="expense-categories"
                placeholder={t("expenses.dialog.categoryPlaceholder")}
                className="rounded-xl"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              />
              <datalist id="expense-categories">
                {CATEGORY_SUGGESTIONS.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entry-note">{t("expenses.dialog.note")}</Label>
              <Input
                id="entry-note"
                placeholder={t("expenses.dialog.notePlaceholder")}
                className="rounded-xl"
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entry-amount">{t("expenses.dialog.amount")}</Label>
              <Input
                id="entry-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                className="rounded-xl"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="rounded-full" onClick={closeModal}>
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className={`rounded-full ${
                  modalType === "Income"
                    ? "bg-success text-success-foreground hover:bg-success/90"
                    : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                }`}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId ? (
                  t("expenses.dialog.saveChanges")
                ) : (
                  t("expenses.dialog.saveType", { type: t(`expenses.type.${modalType.toLowerCase()}`) })
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("expenses.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("expenses.delete.description", {
                type: deleteTarget?.type?.toLowerCase() ?? "",
                category: deleteTarget?.category ?? "",
                amount: deleteTarget ? formatInr(deleteTarget.amount) : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
