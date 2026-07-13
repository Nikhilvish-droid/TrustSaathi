import type { ChatMessage } from "./types";

const RATE_LIMIT_WINDOW = 60_000;
const MAX_REQUESTS_PER_WINDOW = 15;
const STORAGE_KEY = "trustsaathi-chat-rate";

interface RateEntry {
  timestamps: number[];
}

function getRateEntry(): RateEntry {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { timestamps: [] };
    return JSON.parse(raw);
  } catch {
    return { timestamps: [] };
  }
}

function saveRateEntry(entry: RateEntry) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
}

export function checkRateLimit(): boolean {
  const now = Date.now();
  const entry = getRateEntry();
  entry.timestamps = entry.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);

  if (entry.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.timestamps.push(now);
  saveRateEntry(entry);
  return true;
}

export function getRateLimitResetMs(): number {
  const entry = getRateEntry();
  if (entry.timestamps.length === 0) return 0;
  const oldest = entry.timestamps[0];
  return Math.max(0, RATE_LIMIT_WINDOW - (Date.now() - oldest));
}

export function sanitizeMarkdown(text: string): string {
  let sanitized = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");

  sanitized = sanitized.replace(/\[([^\]]*)\]\((?!https?:\/\/|#|mailto:)([^)]*)\)/gi, "[$1]($2)");

  return sanitized;
}

export function sanitizeHistory(history: ChatMessage[]): ChatMessage[] {
  return history.map((msg) => ({
    ...msg,
    content: msg.content.slice(0, 4000),
  }));
}

export function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
