import { apiJson } from "./api-client";
import type { Session } from "@supabase/supabase-js";
import type { AuthUser } from "./auth-session";

export {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  AUTH_RETURN_TO_KEY,
  clearAuthSession,
  consumeReturnUrl,
  getAuthToken,
  getAuthUser,
  isProfileComplete,
  logout,
  saveReturnUrl,
  setAuthSession,
  type AuthUser,
} from "./auth-session";

export type LoginResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

export type SignupResponse = {
  message: string;
  user: AuthUser;
};

export type GoogleLoginResponse = {
  message: string;
  is_profile_complete: boolean;
  token?: string;
  user: AuthUser;
};

export type CompleteProfileResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

export async function loginWithEmail(email: string, password: string): Promise<LoginResponse> {
  return apiJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    skipAuth: true,
    skipAuthRedirect: true,
    body: JSON.stringify({ email, password }),
  });
}

export async function signupWithEmail(payload: {
  organization_name: string;
  reg_number?: string;
  user_name: string;
  email: string;
  password: string;
}): Promise<SignupResponse> {
  return apiJson<SignupResponse>("/api/auth/signup", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function loginWithGoogle(accessToken: string): Promise<GoogleLoginResponse> {
  return apiJson<GoogleLoginResponse>("/api/auth/google", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ access_token: accessToken }),
  });
}

export async function completeProfile(payload: {
  email: string;
  organization_name: string;
  reg_number?: string;
  password: string;
}): Promise<CompleteProfileResponse> {
  return apiJson<CompleteProfileResponse>("/api/auth/complete-profile", {
    method: "PUT",
    skipAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function fetchProfile(): Promise<{ user: AuthUser }> {
  return apiJson<{ user: AuthUser }>("/api/auth/me");
}

export async function updateProfile(payload: {
  organization_name: string;
  reg_number?: string;
  user_name: string;
  email: string;
  password?: string;
}): Promise<{ message: string; user: AuthUser & { organization_name?: string; reg_number?: string } }> {
  return apiJson("/api/auth/update", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getSupabaseSessionFromCallback() {
  const { supabase } = await import("./supabase");

  const code = new URLSearchParams(window.location.search).get("code");
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }

  const { data: initial, error: initialError } = await supabase.auth.getSession();
  if (initialError) throw initialError;
  if (initial.session) return initial.session;

  return new Promise<Session>((resolve, reject) => {
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      reject(new Error("No active session found after Google sign-in."));
    }, 12000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        clearTimeout(timeout);
        subscription.unsubscribe();
        resolve(session);
      }
    });
  });
}
