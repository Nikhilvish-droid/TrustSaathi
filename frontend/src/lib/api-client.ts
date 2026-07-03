import { apiUrl } from "./api";
import { clearAuthSession, getAuthToken, saveReturnUrl } from "./auth-session";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiFetchOptions = RequestInit & {
  /** Skip Authorization header (public routes like login/signup). */
  skipAuth?: boolean;
  /** Do not redirect on 401 (e.g. during login attempt). */
  skipAuthRedirect?: boolean;
};

/**
 * Authenticated fetch wrapper per backend API contract.
 * - Sends Accept: application/json
 * - Sends Authorization: Bearer <token> on protected requests
 * - On 401: clears session and redirects to /auth
 */
export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { skipAuth = false, skipAuthRedirect = false, headers, body, ...rest } = options;

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  if (body != null && !requestHeaders.has("Content-Type") && !(body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(apiUrl(path), {
    ...rest,
    body,
    headers: requestHeaders,
  });

  if (response.status === 401 && !skipAuth && !skipAuthRedirect) {
    handleUnauthorized();
  }

  return response;
}

export function handleUnauthorized() {
  if (typeof window === "undefined") return;

  const returnTo = window.location.pathname + window.location.search;
  saveReturnUrl(returnTo);
  clearAuthSession();
  window.location.href = "/auth";
}

export async function apiJson<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T & { error?: string }> {
  const response = await apiFetch(path, options);
  const result = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    const message =
      result.error ??
      (response.status === 401
        ? "Your session has expired. Please log in again."
        : "Request failed.");
    throw new ApiError(response.status, message);
  }

  return result;
}
