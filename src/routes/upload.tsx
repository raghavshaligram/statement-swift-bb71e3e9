import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SITE_ORIGIN } from "@/lib/site";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmbeddedConverter } from "@/components/embedded-converter";
import { usePageUsage } from "@/hooks/use-page-usage";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useStatementStore } from "@/lib/statement-store";

export const Route = createFileRoute("/upload")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/upload` }],
    meta: [
      { title: "Convert statements — BalanceExtract" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UploadPage,
});

/**
 * The full-page converter.
 *
 * This used to carry its own duplicated copy of the drop -> validate ->
 * parse -> review flow, which is how it drifted out of sync: the password
 * unlock flow and the multi-file append fix both landed in
 * EmbeddedConverter and never reached this page, so encrypted PDFs simply
 * failed here. It now renders the same component every other page uses, so
 * there is one implementation to fix rather than two to keep aligned.
 *
 * The OCR language picker that was unique to this page is preserved via
 * showOcrLanguage -- it was ported into EmbeddedConverter first specifically
 * so this consolidation wouldn't silently drop it, which would have been a
 * real regression for non-English statements.
 */
function UploadPage() {
  const [usageRefresh] = useState(0);
  const pageUsage = usePageUsage(usageRefresh);
  const { isPro, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Final catch for a pending post-sign-in destination. Sign-in can route
  // here through several paths -- the email redirect, the OAuth round-trip
  // via the homepage, or a plain visit -- and the destination has been lost
  // at more than one of them. Honouring it here means it no longer matters
  // which path was taken: whoever asked to go to billing gets there.
  useEffect(() => {
    // Only ever act on this once signed in. It's a POST-auth redirect, and
    // firing it for a signed-out visitor would bounce them off /upload --
    // breaking anonymous conversion, which needs no account at all.
    // Confirmed that directly in testing before it shipped.
    if (authLoading || !user) return;
    try {
      const pending = sessionStorage.getItem("balanceextract.postAuthRedirect");
      if (pending && pending !== "/upload") {
        sessionStorage.removeItem("balanceextract.postAuthRedirect");
        navigate({ to: pending, replace: true });
      }
    } catch {
      /* storage blocked -- stay on /upload */
    }
  }, [navigate, user, authLoading]);
  const phase = useStatementStore((s) => s.phase);
  const pendingFiles = useStatementStore((s) => s.pendingFiles);
  const showQueue = phase !== "idle" && pendingFiles.length > 0;

  return (
    <AppShell title="Convert statements">
      <div className="mx-auto max-w-4xl space-y-6">
        <EmbeddedConverter showOcrLanguage />

        {/* A persistent, low-key upgrade path for signed-in free accounts.
            Previously the only way to reach billing from here was to first
            exhaust the free allowance, which meant the people most likely to
            pay had no route to doing so. */}
        {!showQueue && !subLoading && pageUsage.isSignedIn && !isPro && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald/25 bg-emerald-soft/40 px-5 py-4">
            <div>
              <div className="text-sm font-semibold text-ink">You're on the free plan</div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pro removes the page cap entirely — a full year of statements in one sitting, all seven export
                formats.
              </p>
            </div>
            <Link
              to="/account/billing"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-emerald px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-emerald/90"
            >
              Upgrade to Pro <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {!showQueue && !subLoading && !isPro && pageUsage.isSignedIn && pageUsage.used !== null && (
          <p className="text-xs text-muted-foreground">
            {pageUsage.used >= pageUsage.limit ? (
              <span className="text-amber-700">
                {pageUsage.used} of {pageUsage.limit} free lifetime pages used —{" "}
                <Link to="/account/billing" className="font-semibold underline hover:no-underline">
                  upgrade to Pro
                </Link>{" "}
                for unlimited.
              </span>
            ) : (
              <>
                {pageUsage.used} of {pageUsage.limit} free lifetime pages used (PDFs and photos/scans combined).
              </>
            )}
          </p>
        )}

        {!showQueue && (
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Multi-bank bundles", "Drop statements from different banks together."],
              [
                "23+ banks, 4 countries",
                "Named detection across the US, UK, Canada, and India, plus a generic parser for any other bank.",
              ],
              [
                "PDF, scan, or photo",
                "Text-based PDFs read directly; scanned pages and JPG/PNG/WEBP photos fall back to on-device OCR.",
              ],
            ].map(([t, b]) => (
              <div key={t} className="rounded-lg border border-border bg-card p-4">
                <div className="text-sm font-semibold text-ink">{t}</div>
                <div className="mt-1 text-xs text-muted-foreground">{b}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
