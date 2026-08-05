import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Scale, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — BalanceExtract" },
      { name: "description", content: "Get a password reset link for your BalanceExtract account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-8 lg:px-16">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-ink">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald text-primary-foreground">
            <Scale className="h-4 w-4" />
          </div>
          <span className="text-[17px] font-bold tracking-tight">
            Balance<span className="text-emerald">Extract</span>
          </span>
        </Link>
        <Link to="/signin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we'll send you a secure link to set a new password.
        </p>

        {sent ? (
          <div className="mt-8 rounded-xl border border-emerald/30 bg-emerald/5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald">
              <Check className="h-4 w-4" /> Check your inbox
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a reset link to <span className="font-semibold text-ink">{email}</span>. It expires in 1 hour.
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
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
            <button
              type="submit"
              disabled={loading}
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-emerald/90 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
