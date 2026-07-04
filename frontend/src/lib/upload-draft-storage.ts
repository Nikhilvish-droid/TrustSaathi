import { getAuthUser } from "./auth-session";
import type { ExtractResponse, ReviewDonationRow } from "./ai-upload-types";

const STORAGE_PREFIX = "trustsaathi.upload-draft";
export { STORAGE_PREFIX };
const DRAFT_VERSION = 1;

export type UploadDraftSnapshot = {
  version: typeof DRAFT_VERSION;
  savedAt: string;
  fileName: string;
  extractResult: ExtractResponse;
  rows: ReviewDonationRow[];
};

const DRAFT_EVENT = "trustsaathi:upload-draft-changed";

function notifyDraftChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DRAFT_EVENT));
}

export function subscribeUploadDraftChanges(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(DRAFT_EVENT, listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith(STORAGE_PREFIX)) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(DRAFT_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function hasUploadDraft(): boolean {
  return loadUploadDraft() != null;
}

function storageKey(): string | null {
  const orgId = getAuthUser()?.organization_id;
  if (!orgId) return null;
  return `${STORAGE_PREFIX}.${orgId}`;
}

function isValidDraft(value: unknown): value is UploadDraftSnapshot {
  if (!value || typeof value !== "object") return false;
  const draft = value as UploadDraftSnapshot;
  return (
    draft.version === DRAFT_VERSION &&
    typeof draft.savedAt === "string" &&
    typeof draft.fileName === "string" &&
    draft.extractResult != null &&
    Array.isArray(draft.rows) &&
    draft.rows.length > 0
  );
}

export function loadUploadDraft(): UploadDraftSnapshot | null {
  if (typeof window === "undefined") return null;
  const key = storageKey();
  if (!key) return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidDraft(parsed)) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function saveUploadDraft(snapshot: Omit<UploadDraftSnapshot, "version" | "savedAt">): void {
  if (typeof window === "undefined") return;
  const key = storageKey();
  if (!key) return;

  const payload: UploadDraftSnapshot = {
    version: DRAFT_VERSION,
    savedAt: new Date().toISOString(),
    ...snapshot,
  };

  try {
    localStorage.setItem(key, JSON.stringify(payload));
    notifyDraftChange();
  } catch {
    // Quota exceeded or private mode — ignore silently.
  }
}

export function clearUploadDraft(): void {
  if (typeof window === "undefined") return;
  const key = storageKey();
  if (!key) return;
  localStorage.removeItem(key);
  notifyDraftChange();
}

export function formatDraftSavedAt(savedAt: string): string {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return "recently";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
