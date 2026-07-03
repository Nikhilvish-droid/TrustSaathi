const DEFAULT_API_URL = "http://localhost:5000";
const PRODUCTION_API_URL = "https://trustsaathi.onrender.com";

/** Normalize VITE_API_URL — strips whitespace and trailing slashes. */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw) {
    return import.meta.env.PROD ? PRODUCTION_API_URL : DEFAULT_API_URL;
  }
  return raw.replace(/\/+$/, "");
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
