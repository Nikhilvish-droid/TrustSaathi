import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  head: () => ({ meta: [{ title: "Settings — TrustSaathi" }, { name: "robots", content: "noindex" }] }),
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
      setError("Full name, email, and organization name are required.");
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
      toast.success("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage temple, trust and user information."
        icon={Settings}
        action={
          !loading && !editing ? (
            <Button className="rounded-full" onClick={startEdit}>
              <Pencil className="mr-1.5 h-4 w-4" /> Edit profile
            </Button>
          ) : editing ? (
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={cancelEdit} disabled={saving}>
                <X className="mr-1.5 h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" form="profile-form" className="rounded-full" disabled={saving}>
                <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          ) : null
        }
      />

      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-lg">Profile & Organization</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading your profile…</p>
          ) : editing ? (
            <form id="profile-form" onSubmit={(e) => void handleSave(e)} className="grid gap-4 sm:grid-cols-2">
              {error && (
                <p className="sm:col-span-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Field label="Full name *">
                <Input name="user_name" value={form.user_name} onChange={handleChange} className="rounded-xl" required />
              </Field>
              <Field label="Email *">
                <Input name="email" type="email" value={form.email} onChange={handleChange} className="rounded-xl" required />
              </Field>
              <Field label="Temple / Trust name *">
                <Input
                  name="organization_name"
                  value={form.organization_name}
                  onChange={handleChange}
                  className="rounded-xl"
                  required
                />
              </Field>
              <Field label="Registration number">
                <Input name="reg_number" value={form.reg_number} onChange={handleChange} className="rounded-xl" />
              </Field>
              <Field label="New password" full>
                <Input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current password"
                  className="rounded-xl"
                  minLength={8}
                />
              </Field>
              <Field label="Role" full>
                <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm capitalize">
                  {profile?.role ?? "admin"}
                </p>
              </Field>
            </form>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Full name" value={profile?.name ?? "—"} />
              <InfoItem label="Email" value={profile?.email ?? "—"} />
              <InfoItem label="Temple / Trust name" value={profile?.organization_name ?? "—"} />
              <InfoItem label="Registration number" value={profile?.reg_number ?? "—"} />
              <InfoItem label="Role" value={profile?.role ?? "admin"} className="capitalize" />
            </dl>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border shadow-soft">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Sign out</p>
            <p className="text-sm text-muted-foreground">End your session on this device.</p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={logout}>
            <LogOut className="mr-1.5 h-4 w-4" /> Sign out
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

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}
