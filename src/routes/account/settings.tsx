import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { User as UserIcon, FileText, Download, Trash2, Mail } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { AccountShell } from "@/components/account-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/account/settings")({
  head: () => ({
    meta: [
      { title: "Settings — LedgerLocal" },
      { name: "description", content: "Configure your LedgerLocal parsing defaults, export preferences, and account information." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

const TABS = [
  { id: "account", label: "Account", icon: UserIcon },
  { id: "parsing", label: "Parsing", icon: FileText },
  { id: "export", label: "Export defaults", icon: Download },
] as const;

function SettingsPage() {
  const { user } = useAuth();
  const { isPro, loading: subLoading } = useSubscription();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("account");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  // parsing / export defaults (client-side prefs)
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [detectTransfers, setDetectTransfers] = useState(true);
  const [defaultFormat, setDefaultFormat] = useState<"xlsx" | "csv" | "ofx">("xlsx");
  const [dateFormat, setDateFormat] = useState<"iso" | "us" | "eu">("iso");
  const [decimalSep, setDecimalSep] = useState<"." | ",">(".");

  async function saveAccount() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, email: user.email, display_name: displayName || null });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
  }

  return (
    <AccountShell eyebrow="Account" title="Settings" subtitle="Customize how LedgerLocal parses and exports your statements.">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        {/* Sub-tabs */}
        <aside className="space-y-4">
          <nav className="flex flex-col gap-1">
            {TABS.map((t) => {
              const active = tab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
                    active ? "bg-emerald/10 text-emerald" : "text-muted-foreground hover:bg-surface-muted",
                  )}
                >
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-border pt-4">
            <button
              onClick={() =>
                toast.info("Account deletion requires email confirmation.")
              }
              className="flex items-center gap-2 text-sm font-semibold text-destructive hover:underline"
            >
              <Trash2 className="h-4 w-4" /> Danger zone
            </button>
          </div>
        </aside>

        <section>
          {tab === "account" ? (
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <div className="text-base font-bold text-ink">Account details</div>
              <p className="text-sm text-muted-foreground">Update your name and email.</p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Display name</label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={user?.email?.split("@")[0]}
                      className="h-11 w-full rounded-lg border border-border bg-surface-muted/60 pl-10 pr-4 text-sm text-ink focus:border-emerald focus:outline-none focus:ring-4 focus:ring-emerald/15"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      disabled
                      value={user?.email ?? ""}
                      className="h-11 w-full rounded-lg border border-border bg-surface-muted/60 pl-10 pr-4 text-sm text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                {/* Third place the plan was hardcoded to "Free". Reads real
                    subscription state now, and the upgrade link is rendered
                    conditionally rather than class-toggled. */}
                <div className="flex items-center gap-3">
                  {subLoading ? (
                    <span className="inline-block h-[18px] w-20 animate-pulse rounded-full bg-surface-muted" aria-hidden />
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                        isPro ? "bg-emerald-soft text-emerald" : "bg-surface-muted text-muted-foreground"
                      }`}
                    >
                      {isPro ? "Pro plan" : "Free plan"}
                    </span>
                  )}
                  {!subLoading && !isPro && (
                    <Link to="/account/billing" className="text-sm font-semibold text-emerald hover:underline">
                      Upgrade to Pro →
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-5">
                <div>
                  <div className="text-sm font-bold text-ink">Password</div>
                  <div className="text-xs text-muted-foreground">Change your account password</div>
                </div>
                <Link to="/account" className="text-sm font-semibold text-emerald hover:underline">
                  Change password
                </Link>
              </div>

              <div className="mt-6 flex justify-end border-t border-border pt-5">
                <button
                  onClick={saveAccount}
                  disabled={saving}
                  className="inline-flex h-10 items-center rounded-lg bg-emerald px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-emerald/90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          ) : null}

          {tab === "parsing" ? (
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <div className="text-base font-bold text-ink">Parsing defaults</div>
              <p className="text-sm text-muted-foreground">Fine-tune how new statements are parsed.</p>

              <div className="mt-6 space-y-5">
                <Toggle
                  label="Auto-categorize transactions"
                  hint="Detect common merchants and assign categories automatically."
                  value={autoCategorize}
                  onChange={setAutoCategorize}
                />
                <Toggle
                  label="Detect transfers between accounts"
                  hint="Flag matching credits and debits across statements."
                  value={detectTransfers}
                  onChange={setDetectTransfers}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">
                    Confidence threshold · <span className="font-mono">{confidenceThreshold}%</span>
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={99}
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                    className="w-full accent-emerald"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Rows below this confidence are flagged for review.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "export" ? (
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <div className="text-base font-bold text-ink">Export defaults</div>
              <p className="text-sm text-muted-foreground">Set the default file format and formatting for exports.</p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Default format</label>
                  <select
                    value={defaultFormat}
                    onChange={(e) => setDefaultFormat(e.target.value as typeof defaultFormat)}
                    className="h-11 w-full rounded-lg border border-border bg-surface-muted/60 px-4 text-sm text-ink focus:border-emerald focus:outline-none focus:ring-4 focus:ring-emerald/15"
                  >
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="csv">CSV</option>
                    <option value="ofx">OFX</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Date format</label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value as typeof dateFormat)}
                    className="h-11 w-full rounded-lg border border-border bg-surface-muted/60 px-4 text-sm text-ink focus:border-emerald focus:outline-none focus:ring-4 focus:ring-emerald/15"
                  >
                    <option value="iso">ISO — 2024-12-15</option>
                    <option value="us">US — 12/15/2024</option>
                    <option value="eu">EU — 15/12/2024</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">Decimal separator</label>
                  <div className="flex gap-2">
                    {[".", ","].map((v) => (
                      <button
                        key={v}
                        onClick={() => setDecimalSep(v as "." | ",")}
                        className={cn(
                          "h-11 flex-1 rounded-lg border text-sm font-semibold transition",
                          decimalSep === v
                            ? "border-emerald bg-emerald/10 text-emerald"
                            : "border-border bg-background text-muted-foreground hover:bg-surface-muted",
                        )}
                      >
                        1,234{v}56
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </AccountShell>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-semibold text-ink">{label}</div>
        {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
      </div>
      <button
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          value ? "bg-emerald" : "bg-surface-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            value ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}
