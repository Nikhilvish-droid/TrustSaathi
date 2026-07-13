import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Loader2, Flower2 } from "lucide-react";
import { toast } from "sonner";
import {
  consumeReturnUrl,
  getSupabaseSessionFromCallback,
  isProfileComplete,
  loginWithGoogle,
  setAuthSession,
} from "@/lib/auth-api";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Signing in — TrustSaathi" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const processGoogleLogin = async () => {
      try {
        const session = await getSupabaseSessionFromCallback();

        if (!session?.access_token) {
          throw new Error("No active session found after Google sign-in.");
        }

        const result = await loginWithGoogle(session.access_token);

        const profileDone = result.is_profile_complete === true || isProfileComplete(result.user);

        if (profileDone && result.token) {
          setAuthSession(result.token, result.user);
          toast.success("Signed in with Google 🙏");
          void navigate({ href: consumeReturnUrl() });
          return;
        }

        if (result.token) {
          setAuthSession(result.token, result.user);
        }

        toast.info("Please complete your trust profile to continue.");
        navigate({
          to: "/auth/complete-profile",
          search: { email: result.user.email },
        });
      } catch (err) {
        console.error("Google auth callback error:", err);
        toast.error(
          err instanceof Error ? err.message : "Authentication failed. Please try again.",
        );
        navigate({ to: "/auth" });
      }
    };

    void processGoogleLogin();
  }, [navigate]);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 bg-grain opacity-60" />
      <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary-soft blur-3xl" />
      <div className="absolute -right-32 top-40 h-72 w-72 rounded-full bg-accent blur-3xl" />

      <header className="relative border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <Flower2 className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-semibold">TrustSaathi</span>
          </Link>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h1 className="mt-6 font-display text-2xl font-semibold">Authenticating…</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please wait while we sign you in with Google.
        </p>
      </main>
    </div>
  );
}
