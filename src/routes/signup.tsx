import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileText, LayoutGrid, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create your account — LedgerLocal" },
      { name: "description", content: "Start free with LedgerLocal. Convert bank statements to Excel on-device — no credit card required." },
      { property: "og:title", content: "Create your account — LedgerLocal" },
      { property: "og:description", content: "Start free — no credit card required." },
      { property: "og:url", content: "/signup" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/signup" }],
  }),
  component: SignUpPage,
});

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.7 2.3 2.5 6.6 2.5 12S6.7 21.7 12 21.7c6.9 0 9.5-4.8 9.5-7.3 0-.5-.1-.9-.1-1.3H12z" />
    </svg>
  );
}

function SignUpPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const destination = redirect ?? "/upload";

  // Record the intended destination as soon as this page loads, so it
  // survives regardless of which sign-in route the user takes. The
  // ?redirect= param alone is lost on the Google OAuth round-trip, and
  // relying on two different mechanisms for two paths is what let this
  // regress twice.
  useEffect(() => {
    try {
      if (destination && destination !== "/upload") {
        sessionStorage.setItem("ledgerlocal.postAuthRedirect", destination);
      }
    } catch {
      /* storage blocked -- falls back to the default destination */
    }
  }, [destination]);
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created — welcome!");
      navigate({ to: destination });
    } else {
      toast.success("Check your email to confirm your account.");
    }
  }

  const [googleLoading, setGoogleLoading] = useState(false);
  async function onGoogle() {
    setGoogleLoading(true);
    // Google OAuth returns to the site origin, which discards the
    // ?redirect= search param -- and the homepage then sends any logged-in
    // user straight to /upload. Stash the intended destination so it can
    // survive the round-trip.
    try {
      if (destination && destination !== "/upload") {
        sessionStorage.setItem("ledgerlocal.postAuthRedirect", destination);
      }
    } catch {
      /* storage can be blocked; falls back to the default destination */
    }
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) {
      setGoogleLoading(false);
      toast.error(res.error.message ?? "Google sign-in failed.");
      return;
    }
    if (res.redirected) return;
    navigate({ to: destination });
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* LEFT — form */}
      <div className="flex min-h-screen flex-col px-6 py-8 lg:px-16 lg:py-10">

        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-ink">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald text-primary-foreground">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <span className="text-[17px] font-bold tracking-tight">
              Ledger<span className="text-emerald">Local</span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <h1 className="text-3xl font-bold tracking-tight text-ink">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start free with 10 pages on us. No credit card required.
          </p>

          <button
            type="button"
            onClick={onGoogle}
            disabled={googleLoading}
            className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-background text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-surface-muted/60 disabled:opacity-60"
          >
            {googleLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" aria-hidden />
                Connecting to Google…
              </>
            ) : (
              <>
                <GoogleIcon className="h-4 w-4" />
                Continue with Google
              </>
            )}
          </button>

          <div className="my-6 flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-5" onSubmit={onEmailSignUp}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-ink placeholder:text-muted-foreground focus:border-emerald focus:outline-none focus:ring-4 focus:ring-emerald/15"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-11 text-sm text-ink placeholder:text-muted-foreground focus:border-emerald focus:outline-none focus:ring-4 focus:ring-emerald/15"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-ink"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-emerald/90 disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/signin" search={{ redirect }} className="font-bold text-emerald hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-auto text-center text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <a href="#" className="underline hover:text-ink">Terms</a> and{" "}
          <a href="#" className="underline hover:text-ink">Privacy</a>.
        </p>
      </div>

      {/* RIGHT — brand panel */}
      <BrandPanel />
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-ink lg:block">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            "radial-gradient(1200px 600px at 90% -10%, color-mix(in oklab, var(--emerald) 30%, transparent), transparent 60%), radial-gradient(900px 500px at 0% 110%, color-mix(in oklab, var(--emerald) 22%, transparent), transparent 55%)",
        }}
        aria-hidden
      />
      <div className="grid-fintech absolute inset-0 opacity-20" aria-hidden />

      <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald" aria-hidden />
            100% on-device
          </div>
          <h2 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-background xl:text-5xl">
            Bank statements in.
            <br />
            <span className="text-background/70">Clean spreadsheets out.</span>
          </h2>

          <ul className="mt-8 space-y-3 text-sm text-background/85">
            {[
              "Works with 30+ banks across the US, UK & India",
              "Parses entirely in your browser — nothing uploaded",
              "Exports to Excel, CSV, Tally, OFX, QIF & QBO",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald/20 ring-1 ring-emerald/40">
                  <Check className="h-3 w-3 text-emerald" />
                </span>
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-2">
            {["CSV", "XLSX", "QBO", "OFX", "QIF", "Tally"].map((f) => (
              <span
                key={f}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] font-semibold text-background/80"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald/15 text-emerald">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-background">statement_march.pdf</div>
                <div className="font-mono text-[11px] text-background/60">Chase · 4 pages</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald">
              <Check className="h-3 w-3" /> Converted
            </div>
          </div>
          <div className="divide-y divide-white/5 font-mono text-[12px]">
            {[
              ["Mar 14", "PAYROLL ACME INC", "+$4,250.00", "text-emerald"],
              ["Mar 15", "AMZN MKTP US", "−$86.42", "text-background/85"],
              ["Mar 18", "TRANSFER TO SAVINGS", "−$1,200.00", "text-background/85"],
            ].map(([date, desc, amt, cls]) => (
              <div key={desc} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-4">
                  <span className="w-14 text-background/55">{date}</span>
                  <span className="text-background/90">{desc}</span>
                </div>
                <span className={`font-semibold ${cls}`}>{amt}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-xs text-background/60">
          Trusted by accountants, bookkeepers & finance teams.
        </div>
      </div>
    </div>
  );
}
