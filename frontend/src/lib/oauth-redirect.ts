/** If Supabase lands OAuth tokens on / instead of /auth/callback, forward them. */
export function redirectOAuthHashToCallback() {
  if (typeof window === "undefined") return;

  const { pathname, hash, search } = window.location;
  if (pathname === "/auth/callback") return;

  const hasImplicitTokens = hash.includes("access_token=");
  const hasPkceCode = search.includes("code=");
  if (!hasImplicitTokens && !hasPkceCode) return;

  window.location.replace(`/auth/callback${search}${hash}`);
}
