import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, User as UserIcon, Trash2 } from "lucide-react";
import { useSubscription, planLabel } from "@/hooks/use-subscription";
import { AccountShell } from "@/components/account-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "Account — BalanceExtract" },
      {
        name: "description",
        content: "Manage your BalanceExtract account, profile, and connected sign-in methods.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const { subscription, isPro, loading: subLoading } = useSubscription();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const initial = (user?.email ?? "?").charAt(0).toUpperCase();
  const googleLinked =
    user?.app_metadata?.providers?.includes?.("google") ??
    user?.app_metadata?.provider === "google";

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name ?? ""));
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, email: user.email, display_name: displayName || null });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setNewPassword("");
      setPasswordOpen(false);
    }
  }

  return (
    <AccountShell
      eyebrow="Account"
      title="Account management"
      subtitle="Your profile and sign-in options."
    >
      <div className="space-y-6">
        {/* Profile card */}
        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald text-2xl font-bold text-primary-foreground">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold text-ink">
                {displayName || user?.email?.split("@")[0]}
              </div>
              <div className="truncate text-sm text-muted-foreground">{user?.email}</div>
              {subLoading ? (
                <span
                  className="mt-2 inline-block h-[18px] w-20 animate-pulse rounded-full bg-surface-muted"
                  aria-hidden
                />
              ) : (
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                    isPro
                      ? "bg-emerald-soft text-emerald"
                      : "bg-surface-muted text-muted-foreground"
                  }`}
                >
                  {planLabel(subscription, isPro)} plan
                </span>
              )}
            </div>
            {/* Rendered conditionally rather than toggled with a `hidden`
                class: `hidden` and `inline-flex` are both display utilities,
                so they collide and the button stayed visible for Pro users. */}
            {!subLoading && !isPro && (
              <a
                href="/account/billing"
                className="inline-flex h-10 items-center rounded-lg border-2 border-emerald px-4 text-sm font-semibold text-emerald transition hover:bg-emerald/5"
              >
                Upgrade to Lifetime
              </a>
            )}
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <div className="text-base font-bold text-ink">Profile details</div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">Display name</label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="h-11 w-full rounded-lg border border-border bg-surface-muted/60 pl-10 pr-4 text-sm text-ink focus:border-emerald focus:outline-none focus:ring-4 focus:ring-emerald/15"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">Email address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    disabled
                    value={user?.email ?? ""}
                    className="h-11 w-full rounded-lg border border-border bg-surface-muted/60 pl-10 pr-4 text-sm text-muted-foreground"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex h-10 items-center rounded-lg bg-emerald px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-emerald/90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <button
            onClick={() => setPasswordOpen((v) => !v)}
            className="flex w-full items-center justify-between px-6 py-5 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-base font-bold text-ink">Change password</span>
            </div>
            <span className="text-muted-foreground">{passwordOpen ? "▲" : "▼"}</span>
          </button>
          {passwordOpen ? (
            <form onSubmit={updatePassword} className="space-y-4 border-t border-border px-6 py-5">
              <input
                type="password"
                minLength={8}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (at least 8 characters)"
                className="h-11 w-full rounded-lg border border-border bg-surface-muted/60 px-4 text-sm text-ink focus:border-emerald focus:outline-none focus:ring-4 focus:ring-emerald/15"
              />
              <div className="flex justify-end">
                <button className="inline-flex h-10 items-center rounded-lg bg-emerald px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-emerald/90">
                  Update password
                </button>
              </div>
            </form>
          ) : null}
        </div>

        {/* Connected accounts */}
        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="text-base font-bold text-ink">Connected accounts</div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface-muted/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-lg font-bold">
                G
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">Google</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
            </div>
            {googleLinked ? (
              <span className="rounded-full border border-emerald/40 bg-emerald/10 px-2.5 py-1 text-xs font-semibold text-emerald">
                Connected
              </span>
            ) : (
              <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                Not connected
              </span>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/[0.02] p-6">
          <div className="text-base font-bold text-destructive">Danger zone</div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-ink">Delete account</div>
              <div className="text-xs text-muted-foreground">
                Permanently remove your account, history, and all associated data.
              </div>
            </div>
            <button
              onClick={() =>
                toast.info("Account deletion requires email confirmation — check your inbox soon.")
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg border-2 border-destructive px-4 text-sm font-semibold text-destructive transition hover:bg-destructive/5"
            >
              <Trash2 className="h-4 w-4" /> Delete account
            </button>
          </div>
        </div>
      </div>
    </AccountShell>
  );
}
