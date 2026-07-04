import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CriticalField, ExtractResponse, ReviewDonationRow } from "@/lib/ai-upload-types";
import { PAYMENT_MODES } from "@/lib/ai-upload-types";
import {
  buildUploadPayload,
  extractDocument,
  mapExtractToReviewRows,
  rowNeedsAttention,
  uploadReviewedData,
  validateRowsForSubmit,
} from "@/lib/ai-upload-api";
import {
  clearUploadDraft,
  formatDraftSavedAt,
  loadUploadDraft,
  saveUploadDraft,
} from "@/lib/upload-draft-storage";

type FlowStep = "idle" | "extracting" | "review" | "submitting" | "success";

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.csv";

const FIELD_LABELS: Record<CriticalField, string> = {
  donor_name: "Donor Name",
  amount: "Amount",
  date: "Date",
  payment_mode: "Payment Mode",
};

type FlowState = {
  step: FlowStep;
  fileName: string | null;
  extractResult: ExtractResponse | null;
  rows: ReviewDonationRow[];
  submitResult: { count: number; draft: boolean } | null;
};

function createInitialState(): FlowState {
  const draft = loadUploadDraft();
  if (draft) {
    return {
      step: "review",
      fileName: draft.fileName,
      extractResult: draft.extractResult,
      rows: draft.rows,
      submitResult: null,
    };
  }
  return {
    step: "idle",
    fileName: null,
    extractResult: null,
    rows: [],
    submitResult: null,
  };
}

export function DocumentUploadFlow() {
  const inputRef = useRef<HTMLInputElement>(null);
  const restoredDraftRef = useRef(false);
  const [{ step, fileName, extractResult, rows, submitResult }, setFlowState] = useState(createInitialState);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(() => loadUploadDraft()?.savedAt ?? null);

  const setStep = (next: FlowStep) => setFlowState((prev) => ({ ...prev, step: next }));
  const setFileName = (next: string | null) => setFlowState((prev) => ({ ...prev, fileName: next }));
  const setExtractResult = (next: ExtractResponse | null) =>
    setFlowState((prev) => ({ ...prev, extractResult: next }));
  const setRows = (next: ReviewDonationRow[] | ((prev: ReviewDonationRow[]) => ReviewDonationRow[])) =>
    setFlowState((prev) => ({
      ...prev,
      rows: typeof next === "function" ? next(prev.rows) : next,
    }));
  const setSubmitResult = (next: { count: number; draft: boolean } | null) =>
    setFlowState((prev) => ({ ...prev, submitResult: next }));

  useEffect(() => {
    if (restoredDraftRef.current) return;
    const draft = loadUploadDraft();
    if (draft) {
      restoredDraftRef.current = true;
      toast.info(`Resumed your review of "${draft.fileName}". Your edits are saved while you navigate.`);
    }
  }, []);

  useEffect(() => {
    if (step !== "review" || !extractResult || !fileName || rows.length === 0) return;
    saveUploadDraft({ fileName, extractResult, rows });
    setDraftSavedAt(new Date().toISOString());
  }, [step, fileName, extractResult, rows]);

  const missingFields = extractResult?.ai_analysis.missing_fields ?? [];

  const handleFile = useCallback(async (file: File) => {
    clearUploadDraft();
    setFileName(file.name);
    setStep("extracting");
    setExtractResult(null);
    setRows([]);
    setSubmitResult(null);

    try {
      const result = await extractDocument(file);
      setExtractResult(result);
      setRows(mapExtractToReviewRows(result));
      setStep("review");
      if (!result.ai_analysis.is_complete) {
        toast.warning("Some fields need your review before submitting.");
      } else {
        toast.success(`Extracted ${result.extracted_data.length} records.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Extraction failed.");
      setStep("idle");
      setFileName(null);
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  const updateRow = (id: string, field: CriticalField, value: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (field === "amount") {
          const num = value === "" ? null : Number(value);
          return { ...row, amount: Number.isNaN(num as number) ? null : num };
        }
        return { ...row, [field]: value || null };
      }),
    );
  };

  const submit = async (draft: boolean) => {
    if (!extractResult) return;

    if (!draft) {
      const err = validateRowsForSubmit(rows);
      if (err) {
        toast.error(err);
        return;
      }
    }

    setStep("submitting");
    try {
      const payload = buildUploadPayload(rows, extractResult.document_type, { draft });
      const res = await uploadReviewedData(payload);
      setSubmitResult({ count: res.records_processed, draft });
      setStep("success");
      clearUploadDraft();
      setDraftSavedAt(null);
      toast.success(res.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
      setStep("review");
    }
  };

  const reset = () => {
    clearUploadDraft();
    setDraftSavedAt(null);
    setStep("idle");
    setFileName(null);
    setExtractResult(null);
    setRows([]);
    setSubmitResult(null);
  };

  return (
    <div className="space-y-6">
      {(step === "idle" || step === "extracting") && (
        <Card className="rounded-2xl border-2 border-dashed border-primary/30 bg-accent/40 shadow-soft">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground">
              {step === "extracting" ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <Upload className="h-7 w-7" />
              )}
            </span>
            <div>
              <h2 className="font-display text-2xl font-semibold">
                {step === "extracting" ? "AI is reading your document…" : "Drop files here, or click to upload"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {step === "extracting"
                  ? `Processing ${fileName ?? "file"} — this may take a moment.`
                  : "PDF, JPG, PNG, XLSX up to 50MB each."}
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={onInputChange}
            />
            <Button
              className="rounded-full px-7"
              disabled={step === "extracting"}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-4 w-4" /> Choose file
            </Button>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              {[
                { icon: FileText, label: "Registers" },
                { icon: ImageIcon, label: "Receipts" },
                { icon: FileText, label: "PDFs" },
                { icon: FileSpreadsheet, label: "Excel / CSV" },
              ].map((a) => (
                <Badge key={a.label} variant="secondary" className="rounded-full">
                  <a.icon className="mr-1 h-3 w-3" /> {a.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && extractResult && (
        <Card className="rounded-2xl border-border shadow-soft">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Review extracted data
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {fileName} · {extractResult.document_type.replace(/_/g, " ")} · {rows.length} rows
                {draftSavedAt ? (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Draft saved {formatDraftSavedAt(draftSavedAt)}
                  </span>
                ) : null}
              </p>
              {!extractResult.ai_analysis.is_complete && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-amber-700">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Missing or low-confidence fields are highlighted.
                  {missingFields.length > 0 && (
                    <span>Flagged: {missingFields.join(", ")}</span>
                  )}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" className="rounded-full shrink-0" onClick={reset}>
              Upload another
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">#</th>
                    {CRITICAL_FIELD_KEYS.map((f) => (
                      <th key={f} className="px-3 py-2.5 font-medium">
                        {FIELD_LABELS[f]}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <ReviewRow
                      key={row.id}
                      index={index + 1}
                      row={row}
                      highlight={rowNeedsAttention(row, missingFields)}
                      onChange={updateRow}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-border pt-4">
              <Button className="rounded-full" onClick={() => void submit(false)}>
                Confirm & Submit
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => void submit(true)}>
                Save as Draft / Do Later
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Confirm validates all fields. Draft saves incomplete rows with{" "}
              <code className="rounded bg-muted px-1">manual_review_required</code> for later sorting.
            </p>
          </CardContent>
        </Card>
      )}

      {step === "submitting" && (
        <Card className="rounded-2xl border-border shadow-soft">
          <CardContent className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving to your trust ledger…
          </CardContent>
        </Card>
      )}

      {step === "success" && submitResult && (
        <Card className="rounded-2xl border-success/30 bg-success/5 shadow-soft">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <div>
              <h2 className="font-display text-xl font-semibold">
                {submitResult.draft ? "Draft saved" : "Records submitted"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {submitResult.count} donation{submitResult.count === 1 ? "" : "s"} saved
                {submitResult.draft
                  ? " with missing values. Open Donor Audit to complete them."
                  : " to your database"}.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {submitResult.draft ? (
                <Button asChild className="rounded-full">
                  <Link to="/dashboard/compliance">Open Donor Audit</Link>
                </Button>
              ) : null}
              <Button variant={submitResult.draft ? "outline" : "default"} className="rounded-full" onClick={reset}>
                Upload another document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const CRITICAL_FIELD_KEYS = ["donor_name", "amount", "date", "payment_mode"] as const;

function ReviewRow({
  index,
  row,
  highlight,
  onChange,
}: {
  index: number;
  row: ReviewDonationRow;
  highlight: Partial<Record<CriticalField, boolean>>;
  onChange: (id: string, field: CriticalField, value: string) => void;
}) {
  const highlightClass = "border-amber-400 bg-amber-50 ring-1 ring-amber-300/60";

  return (
    <tr className="border-t border-border align-top">
      <td className="px-3 py-2 text-muted-foreground">{index}</td>
      <td className="px-3 py-2">
        <Input
          value={row.donor_name ?? ""}
          onChange={(e) => onChange(row.id, "donor_name", e.target.value)}
          className={cn("h-8 rounded-lg text-sm", highlight.donor_name && highlightClass)}
          placeholder="Donor name"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min={0}
          value={row.amount ?? ""}
          onChange={(e) => onChange(row.id, "amount", e.target.value)}
          className={cn("h-8 rounded-lg text-sm", highlight.amount && highlightClass)}
          placeholder="Amount"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          type="date"
          value={row.date ?? ""}
          onChange={(e) => onChange(row.id, "date", e.target.value)}
          className={cn("h-8 rounded-lg text-sm", highlight.date && highlightClass)}
        />
      </td>
      <td className="px-3 py-2">
        <Select
          value={row.payment_mode ?? ""}
          onValueChange={(v) => onChange(row.id, "payment_mode", v)}
        >
          <SelectTrigger className={cn("h-8 rounded-lg text-sm", highlight.payment_mode && highlightClass)}>
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_MODES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2">
        <Badge
          variant="secondary"
          className={cn(
            "rounded-full text-[10px]",
            row._low_confidence && "bg-amber-100 text-amber-800",
          )}
        >
          {row.confidence_score != null
            ? `${Math.round(row.confidence_score * 100)}%`
            : "—"}
        </Badge>
      </td>
    </tr>
  );
}
