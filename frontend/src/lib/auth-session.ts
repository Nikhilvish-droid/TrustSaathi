/** JWT storage key — matches backend API documentation. */
export const AUTH_TOKEN_KEY = "token";
export const AUTH_USER_KEY = "user";
export const AUTH_RETURN_TO_KEY = "auth_return_to";

export type AuthUser = {
  id: number;
  name?: string;
  email: string;
  role?: string;
  organization_id?: number | null;
  organization_name?: string | null;
  reg_number?: string | null;
};

export function setAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function logout() {
  clearAuthSession();
  if (typeof window !== "undefined") {
    window.location.href = "/auth";
  }
}

export function saveReturnUrl(url: string) {
  if (typeof window === "undefined") return;
  if (url && url !== "/auth" && !url.startsWith("/auth/")) {
    sessionStorage.setItem(AUTH_RETURN_TO_KEY, url);
  }
}

export function consumeReturnUrl(): string {
  if (typeof window === "undefined") return "/dashboard";
  const url = sessionStorage.getItem(AUTH_RETURN_TO_KEY);
  sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  if (url && url.startsWith("/") && url !== "/auth" && !url.startsWith("/auth/")) {
    return url;
  }
  return "/dashboard";
}

export function isProfileComplete(user: AuthUser): boolean {
  return user.organization_id != null;
}
