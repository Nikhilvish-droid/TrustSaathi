import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Flower2, Mail, Lock, User, Phone, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase, getAuthCallbackUrl } from "@/lib/supabase";
import {
  consumeReturnUrl,
  isProfileComplete,
  loginWithEmail,
  setAuthSession,
  signupWithEmail,
  type AuthUser,
} from "@/lib/auth-api";

export const Route = createFileRoute("/auth/")({
  head: () => ({
    meta: [
      { title: "Sign in or Sign up — TrustSaathi" },
      {
        name: "description",
        content:
          "Sign in to your TrustSaathi account or create a new one to digitize your temple, trust or NGO in minutes.",
      },
      { property: "og:title", content: "Sign in or Sign up — TrustSaathi" },
      {
        property: "og:description",
        content: "Access your TrustSaathi finance and compliance workspace.",
      },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"
      />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.7l4-3z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 7 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}

function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const initial =
    typeof window !== "undefined" && window.location.hash === "#signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initial);

  const [signInErrors, setSignInErrors] = useState<Record<string, string>>({});
  const [signUpErrors, setSignUpErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const signInSchema = z.object({
    email: z.string().trim().email(t("validation.emailInvalid")).max(255),
    password: z.string().min(6, t("validation.passwordMin")).max(72),
  });

  const signUpSchema = z
    .object({
      fullName: z.string().trim().min(2, t("validation.nameRequired")).max(100),
      orgName: z.string().trim().min(2, t("validation.orgRequired")).max(150),
      email: z.string().trim().email(t("validation.emailInvalid")).max(255),
      phone: z
        .string()
        .trim()
        .regex(/^[6-9]\d{9}$/, t("validation.phoneInvalid")),
      password: z
        .string()
        .min(8, t("validation.passwordMin8"))
        .max(72)
        .regex(/[A-Z]/, t("validation.passwordUppercase"))
        .regex(/[a-z]/, t("validation.passwordLowercase"))
        .regex(/\d/, t("validation.passwordNumber")),
      confirmPassword: z.string(),
      agree: z.literal(true, { errorMap: () => ({ message: t("validation.termsRequired") }) }),
    })
    .refine((d) => d.password === d.confirmPassword, {
      path: ["confirmPassword"],
      message: t("validation.passwordsNoMatch"),
    });

  const goAfterAuth = (token: string | undefined, user: AuthUser) => {
    if (!isProfileComplete(user)) {
      if (token) setAuthSession(token, user);
      navigate({ to: "/auth/complete-profile", search: { email: user.email } });
      return;
    }
    if (token) setAuthSession(token, user);
    toast.success(t("toast.welcomeBack"));
    void navigate({ href: consumeReturnUrl() });
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setSignInErrors(errs);
      return;
    }
    setSignInErrors({});
    setLoading(true);
    try {
      const result = await loginWithEmail(parsed.data.email, parsed.data.password);
      goAfterAuth(result.token, result.user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.signInFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAuthCallbackUrl(),
        },
      });

      if (error) {
        console.error("Google Login Error:", error.message);
        toast.error(t("toast.googleFailed"));
        setLoading(false);
      }
    } catch (err) {
      console.error("Google Login Error:", err);
      toast.error(t("toast.googleFailed"));
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: fd.get("fullName"),
      orgName: fd.get("orgName"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      password: fd.get("password"),
      confirmPassword: fd.get("confirmPassword"),
      agree: fd.get("agree") === "on" ? true : false,
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setSignUpErrors(errs);
      return;
    }
    setSignUpErrors({});
    setLoading(true);
    try {
      await signupWithEmail({
        organization_name: parsed.data.orgName,
        user_name: parsed.data.fullName,
        email: parsed.data.email,
        password: parsed.data.password,
      });
      const loginResult = await loginWithEmail(parsed.data.email, parsed.data.password);
      setAuthSession(loginResult.token, loginResult.user);
      toast.success(t("toast.accountCreated"));
      void navigate({ href: consumeReturnUrl() });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.signUpFailed"));
    } finally {
      setLoading(false);
    }
  };

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
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            {t("auth.backToHome")}
          </Link>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
            <Flower2 className="h-3.5 w-3.5" /> {t("auth.madeForTemples")}
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1]">
            {t("auth.authHeroTitle")}
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">{t("auth.authHeroSubtitle")}</p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              t("auth.authBullet1"),
              t("auth.authBullet2"),
              t("auth.authBullet3"),
              t("auth.authBullet4"),
            ].map((bullet) => (
              <li key={bullet} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <Card className="relative rounded-3xl border-border bg-card p-6 shadow-card sm:p-8">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-secondary p-1">
              <TabsTrigger value="signin" className="rounded-full">
                {t("auth.signInTab")}
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full">
                {t("auth.signUpTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <h2 className="font-display text-2xl font-semibold">{t("auth.welcomeBack")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("auth.signInSubtitle")}</p>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="mt-6 w-full rounded-full"
                disabled={loading}
                onClick={() => void handleGoogleLogin()}
              >
                <GoogleIcon className="h-4 w-4" />
                {t("auth.continueWithGoogle")}
              </Button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t("auth.or")}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={(e) => void handleSignIn(e)} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="si-email">{t("auth.emailLabel")}</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="si-email"
                      name="email"
                      type="email"
                      placeholder="you@temple.org"
                      className="pl-9"
                      autoComplete="email"
                    />
                  </div>
                  {signInErrors.email && (
                    <p className="text-xs text-destructive">{signInErrors.email}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="si-password">{t("auth.passwordLabel")}</Label>
                    <a href="#" className="text-xs text-primary hover:underline">
                      {t("auth.forgotPassword")}
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="si-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      autoComplete="current-password"
                    />
                  </div>
                  {signInErrors.password && (
                    <p className="text-xs text-destructive">{signInErrors.password}</p>
                  )}
                </div>
                <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
                  {loading ? (
                    t("auth.signInLoading")
                  ) : (
                    <>
                      {" "}
                      {t("auth.signInButton")} <ArrowRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {t("auth.newHere")}{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-medium text-primary hover:underline"
                  >
                    {t("auth.createAccount")}
                  </button>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <h2 className="font-display text-2xl font-semibold">
                {t("auth.createAccountTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("auth.createAccountSubtitle")}
              </p>
              <form onSubmit={(e) => void handleSignUp(e)} className="mt-6 space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="su-name">{t("auth.fullNameLabel")}</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="su-name"
                        name="fullName"
                        placeholder="Ramesh Joshi"
                        className="pl-9"
                        autoComplete="name"
                      />
                    </div>
                    {signUpErrors.fullName && (
                      <p className="text-xs text-destructive">{signUpErrors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-org">{t("auth.orgNameLabel")}</Label>
                    <Input
                      id="su-org"
                      name="orgName"
                      placeholder="Shree Ganesh Mandir"
                      autoComplete="organization"
                    />
                    {signUpErrors.orgName && (
                      <p className="text-xs text-destructive">{signUpErrors.orgName}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">{t("auth.emailLabel")}</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="su-email"
                      name="email"
                      type="email"
                      placeholder="you@temple.org"
                      className="pl-9"
                      autoComplete="email"
                    />
                  </div>
                  {signUpErrors.email && (
                    <p className="text-xs text-destructive">{signUpErrors.email}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-phone">{t("auth.mobileLabel")}</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="su-phone"
                      name="phone"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="98XXXXXXXX"
                      className="pl-9"
                      autoComplete="tel"
                    />
                  </div>
                  {signUpErrors.phone && (
                    <p className="text-xs text-destructive">{signUpErrors.phone}</p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="su-password">{t("auth.passwordLabel")}</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="su-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9"
                        autoComplete="new-password"
                      />
                    </div>
                    {signUpErrors.password && (
                      <p className="text-xs text-destructive">{signUpErrors.password}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-confirm">{t("auth.confirmPasswordLabel")}</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="su-confirm"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9"
                        autoComplete="new-password"
                      />
                    </div>
                    {signUpErrors.confirmPassword && (
                      <p className="text-xs text-destructive">{signUpErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="su-agree" name="agree" className="mt-0.5" />
                  <Label
                    htmlFor="su-agree"
                    className="text-xs font-normal leading-relaxed text-muted-foreground"
                  >
                    {t("auth.agreeTerms")}{" "}
                    <a href="#" className="text-primary hover:underline">
                      {t("auth.terms")}
                    </a>{" "}
                    {t("auth.and")}{" "}
                    <a href="#" className="text-primary hover:underline">
                      {t("auth.privacy")}
                    </a>
                    .
                  </Label>
                </div>
                {signUpErrors.agree && (
                  <p className="text-xs text-destructive">{signUpErrors.agree}</p>
                )}
                <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
                  {loading ? (
                    t("auth.createLoading")
                  ) : (
                    <>
                      {" "}
                      {t("auth.createButton")} <ArrowRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {t("auth.alreadyHaveAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="font-medium text-primary hover:underline"
                  >
                    {t("auth.signInLink")}
                  </button>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}
