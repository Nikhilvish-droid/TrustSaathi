import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env",
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

/** Public site origin for OAuth callbacks — set on Vercel to your production URL. */
function getSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function getAuthCallbackUrl() {
  const origin = getSiteOrigin();
  if (!origin) return "/auth/callback";
  return `${origin}/auth/callback`;
}
