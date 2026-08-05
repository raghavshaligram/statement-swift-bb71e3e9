import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Scale, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — BalanceExtract" },
      { name: "description", content: "Choose a new password for your BalanceExtract account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery link automatically and fires PASSWORD_RECOVERY
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. You're signed in.");
    navigate({ to: "/upload" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-8 lg:px-16">
      <Link to="/" className="flex items-center gap-2.5 text-ink">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald text-primary-foreground">
          <Scale className="h-4 w-4" />
        </div>
        <span className="text-[17px] font-bold tracking-tight">
          Balance<span className="text-emerald">Extract</span>
        </span>
      </Link>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick something strong — at least 8 characters.
        </p>

        {!ready ? (
          <p className="mt-8 rounded-xl border border-border bg-surface-muted/40 p-5 text-sm text-muted-foreground">
            Verifying reset link… If this page doesn't advance, request a new link from the sign-in page.
          </p>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">New password</label>
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
              {loading ? "Updating…" : "Update password"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
