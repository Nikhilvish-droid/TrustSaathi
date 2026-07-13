import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Settings, LogOut, Pencil, X, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-shell";
import { getAuthToken, logout, setAuthSession, type AuthUser } from "@/lib/auth-session";
import { fetchProfile, updateProfile } from "@/lib/auth-api";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [{ title: "Settings — TrustSaathi" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsPage,
});

type ProfileForm = {
  user_name: string;
  email: string;
  organization_name: string;
  reg_number: string;
  password: string;
};

function toForm(user: AuthUser): ProfileForm {
  return {
    user_name: user.name ?? "",
    email: user.email ?? "",
    organization_name: user.organization_name ?? "",
    reg_number: user.reg_number ?? "",
    password: "",
  };
}

function SettingsPage() {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { data: profileRes, isLoading: loading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  const profile = profileRes?.user ?? null;
  const [form, setForm] = useState<ProfileForm>({
    user_name: "",
    email: "",
    organization_name: "",
    reg_number: "",
    password: "",
  });

  // Sync form when profile loads
  if (profile && !editing && !form.user_name && profile.name) {
    setForm(toForm(profile));
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const startEdit = () => {
    if (profile) setForm(toForm(profile));
    setError("");
    setEditing(true);
  };

  const cancelEdit = () => {
    if (profile) setForm(toForm(profile));
    setError("");
    setEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.user_name.trim() || !form.email.trim() || !form.organization_name.trim()) {
      setError(t("settings.validation.required"));
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile({
        user_name: form.user_name.trim(),
        email: form.email.trim(),
        organization_name: form.organization_name.trim(),
        reg_number: form.reg_number.trim() || undefined,
        password: form.password.trim() || undefined,
      });

      const token = getAuthToken();
      if (token) setAuthSession(token, result.user);
      setEditing(false);
      toast.success(t("settings.toast.updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.toast.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={t("settings.pageTitle")}
        subtitle={t("settings.pageSubtitle")}
        icon={Settings}
        action={
          !loading && !editing ? (
            <Button className="rounded-full" onClick={startEdit}>
              <Pencil className="mr-1.5 h-4 w-4" /> {t("settings.editProfile")}
            </Button>
          ) : editing ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={cancelEdit}
                disabled={saving}
              >
                <X className="mr-1.5 h-4 w-4" /> {t("settings.cancel")}
              </Button>
              <Button type="submit" form="profile-form" className="rounded-full" disabled={saving}>
                <Save className="mr-1.5 h-4 w-4" />{" "}
                {saving ? t("settings.saving") : t("settings.saveChanges")}
              </Button>
            </div>
          ) : null
        }
      />

      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-lg">{t("settings.profileTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("settings.loadingProfile")}</p>
          ) : editing ? (
            <form
              id="profile-form"
              onSubmit={(e) => void handleSave(e)}
              className="grid gap-4 sm:grid-cols-2"
            >
              {error && (
                <p className="sm:col-span-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Field label={t("settings.fullName")}>
                <Input
                  name="user_name"
                  value={form.user_name}
                  onChange={handleChange}
                  className="rounded-xl"
                  required
                />
              </Field>
              <Field label={t("settings.email")}>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="rounded-xl"
                  required
                />
              </Field>
              <Field label={t("settings.orgName")}>
                <Input
                  name="organization_name"
                  value={form.organization_name}
                  onChange={handleChange}
                  className="rounded-xl"
                  required
                />
              </Field>
              <Field label={t("settings.regNumber")}>
                <Input
                  name="reg_number"
                  value={form.reg_number}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </Field>
              <Field label={t("settings.newPassword")} full>
                <Input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={t("settings.passwordPlaceholder")}
                  className="rounded-xl"
                  minLength={8}
                />
              </Field>
              <Field label={t("settings.role")} full>
                <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm capitalize">
                  {profile?.role ?? t("settings.admin")}
                </p>
              </Field>
            </form>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoItem label={t("settings.fullName")} value={profile?.name ?? "—"} />
              <InfoItem label={t("settings.email")} value={profile?.email ?? "—"} />
              <InfoItem label={t("settings.orgName")} value={profile?.organization_name ?? "—"} />
              <InfoItem label={t("settings.regNumber")} value={profile?.reg_number ?? "—"} />
              <InfoItem
                label={t("settings.role")}
                value={profile?.role ?? t("settings.admin")}
                className="capitalize"
              />
            </dl>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border shadow-soft">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{t("settings.signOutTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("settings.signOutDesc")}</p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={logout}>
            <LogOut className="mr-1.5 h-4 w-4" /> {t("settings.signOutTitle")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`text-sm font-medium text-foreground ${className ?? ""}`}>{value}</dd>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}
