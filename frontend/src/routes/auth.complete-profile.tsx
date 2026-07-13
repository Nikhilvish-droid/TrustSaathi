import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Flower2, Lock, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { completeProfile, consumeReturnUrl, getAuthUser, setAuthSession } from "@/lib/auth-api";

const searchSchema = z.object({
  email: z.string().email().optional(),
});

export const Route = createFileRoute("/auth/complete-profile")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Complete Your Profile — TrustSaathi" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CompleteProfilePage,
});

function CompleteProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { email: emailFromSearch } = Route.useSearch();
  const email = emailFromSearch ?? getAuthUser()?.email ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    organization_name: "",
    reg_number: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError(t("auth.completeProfile.errorMissingEmail"));
      return;
    }
    if (!form.organization_name.trim() || !form.password) {
      setError(t("auth.completeProfile.errorRequired"));
      return;
    }

    if (form.password.length < 8) {
      setError(t("auth.completeProfile.errorPasswordMin"));
      return;
    }

    setLoading(true);

    try {
      const result = await completeProfile({
        email,
        organization_name: form.organization_name.trim(),
        reg_number: form.reg_number.trim() || undefined,
        password: form.password,
      });

      setAuthSession(result.token, result.user);
      toast.success(t("auth.completeProfile.toastSuccess"));
      void navigate({ href: consumeReturnUrl() });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.completeProfile.errorFailed"));
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
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
            {t("auth.backToSignIn")}
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-lg px-4 py-14 sm:px-6 lg:py-20">
        <Card className="rounded-3xl border-border bg-card p-6 shadow-card sm:p-8">
          <h1 className="font-display text-2xl font-semibold">{t("auth.completeProfile.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("auth.completeProfile.subtitle")}{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>

          {error && (
            <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="organization_name">{t("auth.completeProfile.orgLabel")}</Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="organization_name"
                  name="organization_name"
                  value={form.organization_name}
                  onChange={handleChange}
                  placeholder="Shree Ganesh Mandir Trust"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg_number">{t("auth.completeProfile.regLabel")}</Label>
              <Input
                id="reg_number"
                name="reg_number"
                value={form.reg_number}
                onChange={handleChange}
                placeholder="e.g. REG-123456"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.completeProfile.passwordLabel")}</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={t("auth.completeProfile.passwordPlaceholder")}
                  className="pl-9"
                  minLength={8}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("auth.completeProfile.passwordHint")}
              </p>
            </div>

            <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
              {loading ? (
                t("auth.completeProfile.saveButton")
              ) : (
                <>
                  {t("auth.completeProfile.submitButton")} <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
