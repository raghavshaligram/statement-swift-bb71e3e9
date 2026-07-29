/**
 * The real, functional drop-parse-review widget, extracted from the
 * homepage hero so any content page can embed it directly -- dropping a
 * file starts real parsing immediately, right there, with no detour
 * through a separate landing page first. Only the actual review screen
 * (once parsing finishes) is a real navigation, to /preview, same as the
 * homepage's own established pattern. Sign-in gating for photos/scans is
 * enforced by the same validateUploadBatch() the homepage uses -- this
 * doesn't bypass that policy, it's the same real check.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Upload, AlertTriangle } from "lucide-react";
import { StatementDropzone } from "@/components/statement-dropzone";
import { ParseQueue } from "@/components/parse-queue";
import { useStatementStore } from "@/lib/statement-store";
import { parseStatementFile } from "@/lib/pdf/parse-statement";
import { validateUploadBatch } from "@/lib/pdf/upload-validation";
import { usePageUsage } from "@/hooks/use-page-usage";
import { useAuth } from "@/hooks/use-auth";
import { ANONYMOUS_MAX_PAGES, SIGNED_IN_MAX_PAGES } from "@/lib/pricing-constants";

export function EmbeddedConverter({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const maxPages = user ? SIGNED_IN_MAX_PAGES : ANONYMOUS_MAX_PAGES;
  const phase = useStatementStore((s) => s.phase);
  const pendingFiles = useStatementStore((s) => s.pendingFiles);
  const reset = useStatementStore((s) => s.reset);
  const removePendingFile = useStatementStore((s) => s.removePendingFile);
  const setPendingFiles = useStatementStore((s) => s.setPendingFiles);
  const startProcessing = useStatementStore((s) => s.startProcessing);
  const setProgress = useStatementStore((s) => s.setProgress);
  const finishProcessing = useStatementStore((s) => s.finishProcessing);
  const failProcessing = useStatementStore((s) => s.failProcessing);
  const [, setLiveFileName] = useState("");
  const [pageLimitError, setPageLimitError] = useState<{ message: string; requiresSignIn: boolean } | null>(null);
  const [usageRefresh, setUsageRefresh] = useState(0);
  const pageUsage = usePageUsage(usageRefresh);

  // This widget is embedded on many separate marketing/content pages that all
  // share one global store. Without this, a completed conversion on page A
  // (or the homepage) stays visible when landing on page B's dropzone --
  // including via the browser back button after visiting /preview -- which
  // reads as stale/broken rather than a fresh instance of the tool. Each
  // mount treats itself as a new, isolated session; the real multi-step
  // /upload -> /preview -> /export app flow doesn't use this component, so
  // it's unaffected.
  useEffect(() => {
    reset();
    setPageLimitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wasSignedIn = useRef(false);
  useEffect(() => {
    if (user) {
      wasSignedIn.current = true;
    } else if (wasSignedIn.current) {
      wasSignedIn.current = false;
      reset();
      setPageLimitError(null);
    }
  }, [user]);

  async function handleFiles(files: File[]) {
    setPageLimitError(null);

    const validation = await validateUploadBatch(files, !!user);
    if (!validation.ok) {
      setPageLimitError({ message: validation.message, requiresSignIn: validation.requiresSignIn });
      return;
    }

    reset();
    setPendingFiles(files);
    startProcessing();
    const parsed = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setLiveFileName(files[i].name);
        const statement = await parseStatementFile(files[i], (page, total) => setProgress(i, page, total));
        parsed.push(statement);
      }
      finishProcessing(parsed);
      setUsageRefresh((n) => n + 1);
    } catch (err) {
      failProcessing(err instanceof Error ? err.message : "Something went wrong while parsing.");
    }
  }

  const showQueue = phase !== "idle" && pendingFiles.length > 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-lg shadow-slate-900/5 ${className ?? ""}`}>
      {!showQueue && (
        <div className="absolute right-4 top-4 hidden text-emerald/20 sm:block" aria-hidden>
          <Upload className="h-16 w-16 animate-bounce-slow" />
        </div>
      )}
      {showQueue ? (
        <>
          <ParseQueue onReview={() => navigate({ to: "/preview" })} onRemove={(i) => removePendingFile(i)} />
          {(phase === "done" || phase === "error") && (
            <div className="px-3 pb-3 pt-1 text-center">
              <button onClick={() => reset()} className="text-xs font-medium text-muted-foreground hover:text-ink">
                Convert another statement
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <StatementDropzone variant="full" onFiles={handleFiles} className="border-2 border-dashed border-border/80 bg-surface/50" />
          {pageLimitError ? (
            <div className="mx-2 mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
              <div className="flex items-start gap-2.5 text-left">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <div className="text-sm font-semibold text-amber-900">
                    {pageLimitError.requiresSignIn ? "Sign in required for photos and scans" : `Your current plan supports up to ${maxPages} pages`}
                  </div>
                  <div className="text-xs text-amber-800">{pageLimitError.message}</div>
                </div>
              </div>
              <Link to={user ? "/account/billing" : "/signup"} className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600">
                {user ? "Upgrade to Pro" : "Sign up free"}
              </Link>
            </div>
          ) : null}
          {pageUsage.isSignedIn && pageUsage.used !== null && (
            <p className="mt-2 px-2 text-center text-xs text-muted-foreground">
              {pageUsage.used} of {pageUsage.limit} free lifetime pages used (PDFs and photos/scans combined)
              {pageUsage.used >= pageUsage.limit && (
                <>
                  {" — "}
                  <Link to="/account/billing" className="font-semibold text-emerald underline hover:no-underline">
                    upgrade to Pro
                  </Link>
                </>
              )}
            </p>
          )}
        </>
      )}
    </div>
  );
}
