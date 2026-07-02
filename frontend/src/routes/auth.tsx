import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Flower2, Mail, Lock, User, Phone, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
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
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/>
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"/>
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.7l4-3z"/>
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 7 8.9 4.8 12 4.8z"/>
    </svg>
  );
}

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    orgName: z.string().trim().min(2, "Enter your temple / trust name").max(150),
    email: z.string().trim().email("Enter a valid email").max(255),
    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72)
      .regex(/[A-Z]/, "Include one uppercase letter")
      .regex(/[a-z]/, "Include one lowercase letter")
      .regex(/\d/, "Include one number"),
    confirmPassword: z.string(),
    agree: z.literal(true, { errorMap: () => ({ message: "Please accept the terms" }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

function AuthPage() {
  const navigate = useNavigate();
  const initial =
    typeof window !== "undefined" && window.location.hash === "#signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initial);

  const [signInErrors, setSignInErrors] = useState<Record<string, string>>({});
  const [signUpErrors, setSignUpErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSignIn = (e: React.FormEvent<HTMLFormElement>) => {
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
    setTimeout(() => {
      setLoading(false);
      toast.success("Welcome back 🙏");
      navigate({ to: "/dashboard" });
    }, 600);
  };

  const handleSignUp = (e: React.FormEvent<HTMLFormElement>) => {
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
    setTimeout(() => {
      setLoading(false);
      toast.success("Account created — Jai Shree Krishna 🙏");
      navigate({ to: "/dashboard" });
    }, 700);
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
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        {/* Left — brand pitch */}
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
            <Flower2 className="h-3.5 w-3.5" /> Made for temples & trusts
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1]">
            Digitize your temple in minutes 🙏
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Join 200+ temples, trusts and NGOs managing donations, accounts and
            audit-ready reports on TrustSaathi.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "AI reads your handwritten donation registers",
              "80G receipts in one click",
              "Audit-ready reports for trustees",
              "Works in Hindi & English",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — auth card */}
        <Card className="relative rounded-3xl border-border bg-card p-6 shadow-card sm:p-8">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-secondary p-1">
              <TabsTrigger value="signin" className="rounded-full">Sign in</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full">Sign up</TabsTrigger>
            </TabsList>

            {/* SIGN IN */}
            <TabsContent value="signin" className="mt-6">
              <h2 className="font-display text-2xl font-semibold">Welcome back</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to continue to your TrustSaathi workspace.
              </p>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="mt-6 w-full rounded-full"
                disabled={loading}
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    setLoading(false);
                    toast.success("Signed in with Google 🙏");
                    navigate({ to: "/dashboard" });
                  }, 600);
                }}
              >
                <GoogleIcon className="h-4 w-4" />
                Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="si-email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="si-email" name="email" type="email" placeholder="you@temple.org" className="pl-9" autoComplete="email" />
                  </div>
                  {signInErrors.email && <p className="text-xs text-destructive">{signInErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="si-password">Password</Label>
                    <a href="#" className="text-xs text-primary hover:underline">Forgot?</a>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="si-password" name="password" type="password" placeholder="••••••••" className="pl-9" autoComplete="current-password" />
                  </div>
                  {signInErrors.password && <p className="text-xs text-destructive">{signInErrors.password}</p>}
                </div>
                <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
                  {loading ? "Signing in..." : (<>Sign in <ArrowRight className="ml-1 h-4 w-4" /></>)}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  New here?{" "}
                  <button type="button" onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">
                    Create an account
                  </button>
                </p>
              </form>
            </TabsContent>

            {/* SIGN UP */}
            <TabsContent value="signup" className="mt-6">
              <h2 className="font-display text-2xl font-semibold">Create your account</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Free to start. No card required.
              </p>
              <form onSubmit={handleSignUp} className="mt-6 space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="su-name">Full name</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="su-name" name="fullName" placeholder="Ramesh Joshi" className="pl-9" autoComplete="name" />
                    </div>
                    {signUpErrors.fullName && <p className="text-xs text-destructive">{signUpErrors.fullName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-org">Temple / Trust name</Label>
                    <Input id="su-org" name="orgName" placeholder="Shree Ganesh Mandir" autoComplete="organization" />
                    {signUpErrors.orgName && <p className="text-xs text-destructive">{signUpErrors.orgName}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="su-email" name="email" type="email" placeholder="you@temple.org" className="pl-9" autoComplete="email" />
                  </div>
                  {signUpErrors.email && <p className="text-xs text-destructive">{signUpErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-phone">Mobile number</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="su-phone" name="phone" inputMode="numeric" maxLength={10} placeholder="98XXXXXXXX" className="pl-9" autoComplete="tel" />
                  </div>
                  {signUpErrors.phone && <p className="text-xs text-destructive">{signUpErrors.phone}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="su-password">Password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="su-password" name="password" type="password" placeholder="••••••••" className="pl-9" autoComplete="new-password" />
                    </div>
                    {signUpErrors.password && <p className="text-xs text-destructive">{signUpErrors.password}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-confirm">Confirm password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="su-confirm" name="confirmPassword" type="password" placeholder="••••••••" className="pl-9" autoComplete="new-password" />
                    </div>
                    {signUpErrors.confirmPassword && <p className="text-xs text-destructive">{signUpErrors.confirmPassword}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="su-agree" name="agree" className="mt-0.5" />
                  <Label htmlFor="su-agree" className="text-xs font-normal leading-relaxed text-muted-foreground">
                    I agree to the <a href="#" className="text-primary hover:underline">Terms</a> and{" "}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                  </Label>
                </div>
                {signUpErrors.agree && <p className="text-xs text-destructive">{signUpErrors.agree}</p>}
                <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
                  {loading ? "Creating..." : (<>Create account <ArrowRight className="ml-1 h-4 w-4" /></>)}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setMode("signin")} className="font-medium text-primary hover:underline">
                    Sign in
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
