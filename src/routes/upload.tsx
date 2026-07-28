import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatementDropzone } from "@/components/statement-dropzone";
import { ParseQueue } from "@/components/parse-queue";
import { useStatementStore } from "@/lib/statement-store";
import { parseStatementFile } from "@/lib/pdf/parse-statement";
import { validateUploadBatch } from "@/lib/pdf/upload-validation";
import { usePageUsage } from "@/hooks/use-page-usage";
import { ANONYMOUS_MAX_PAGES, SIGNED_IN_MAX_PAGES } from "@/lib/pricing-constants";
import { useAuth } from "@/hooks/use-auth";
import { OCR_LANGUAGES } from "@/lib/pdf/ocr-languages";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Convert · LedgerLocal" },
      { name: "description", content: "Upload a bank statement — PDF, scan, or photo. Processing happens on your device." },
      { property: "og:title", content: "Convert · LedgerLocal" },
      { property: "og:description", content: "On-device bank statement to Excel conversion — PDF, scan, or photo." },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const maxPages = user ? SIGNED_IN_MAX_PAGES : ANONYMOUS_MAX_PAGES;
  const [pageLimitError, setPageLimitError] = useState<{ message: string; requiresSignIn: boolean } | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState<string>("eng");
  const [usageRefresh, setUsageRefresh] = useState(0);
  const pageUsage = usePageUsage(usageRefresh);

  const pendingFiles = useStatementStore((s) => s.pendingFiles);
  const setPendingFiles = useStatementStore((s) => s.setPendingFiles);
  const removePendingFile = useStatementStore((s) => s.removePendingFile);
  const phase = useStatementStore((s) => s.phase);
  const reset = useStatementStore((s) => s.reset);
  const startProcessing = useStatementStore((s) => s.startProcessing);
  const setProgress = useStatementStore((s) => s.setProgress);
  const finishProcessing = useStatementStore((s) => s.finishProcessing);
  const failProcessing = useStatementStore((s) => s.failProcessing);

  // Same reset-on-sign-out fix as HeroUploadCard (index.tsx) -- without
  // this, logging out while a parsed statement is still showing left the
  // page in a stale "ready to review" state despite no longer being
  // signed in. Tracks the actual SIGNED-IN -> SIGNED-OUT transition via a
  // ref, not just "user is currently null" -- firing on every mount would
  // also wipe legitimate results when navigating back to this page.
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

  async function handleFiles(list: FileList | File[]) {
    const arr = Array.from(list).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.type === "image/jpeg" ||
        f.type === "image/png" ||
        f.type === "image/webp" ||
        /\.(pdf|jpe?g|png|webp|iif|csv|ofx|qfx|qif|sta|mt940|940)$/i.test(f.name)
    );
    if (!arr.length) return;
    setPageLimitError(null);

    const validation = await validateUploadBatch(arr, !!user);
    if (!validation.ok) {
      setPageLimitError({ message: validation.message, requiresSignIn: validation.requiresSignIn });
      return;
    }

    reset();
    setPendingFiles(arr);
    startProcessing();

    const statements = [];
    try {
      for (let i = 0; i < arr.length; i++) {
        const statement = await parseStatementFile(
          arr[i],
          (page, total) => setProgress(i, page, total),
          [ocrLanguage]
        );
        statements.push(statement);
      }
      finishProcessing(statements);
      setUsageRefresh((n) => n + 1);
    } catch (err) {
      failProcessing(err instanceof Error ? err.message : "Something went wrong while parsing.");
    }
  }

  const showQueue = phase !== "idle" && pendingFiles.length > 0;

  return (
    <AppShell title="Convert statements">
      <div className="mx-auto max-w-4xl space-y-6">
        <StatementDropzone variant="full" onFiles={handleFiles} />

        {!showQueue && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <label htmlFor="ocr-language">If a scanned statement is dropped, read it as:</label>
            <select
              id="ocr-language"
              value={ocrLanguage}
              onChange={(e) => setOcrLanguage(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-ink"
            >
              {OCR_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {!showQueue && pageUsage.isSignedIn && pageUsage.used !== null && (
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
              <>{pageUsage.used} of {pageUsage.limit} free lifetime pages used (PDFs and photos/scans combined).</>
            )}
          </p>
        )}

        {pageLimitError && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <div className="font-semibold text-amber-900">
                  {pageLimitError.requiresSignIn
                    ? "Sign in required for photos and scans"
                    : `Your current plan supports up to ${maxPages} pages`}
                </div>
                <div className="text-sm text-amber-800">{pageLimitError.message}</div>
              </div>
            </div>
            <Link
              to={user ? "/account/billing" : "/signup"}
              className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              {user ? "Upgrade to Pro" : "Sign up free"}
            </Link>
          </div>
        )}

        {showQueue && (
          <div className="rounded-2xl border border-border bg-card p-2">
            <ParseQueue
              onReview={() => nav({ to: "/preview" })}
              onRemove={(i) => removePendingFile(i)}
            />
            {(phase === "done" || phase === "error") && (
              <div className="px-3 pb-3 pt-1 text-center">
                <button
                  onClick={() => reset()}
                  className="text-xs font-medium text-muted-foreground hover:text-ink"
                >
                  Convert another statement
                </button>
              </div>
            )}
          </div>
        )}

        {!showQueue && (
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Multi-bank bundles", "Drop statements from different banks together."],
              ["23+ banks, 4 countries", "Named detection across the US, UK, Canada, and India, plus a generic parser for any other bank."],
              ["PDF, scan, or photo", "Text-based PDFs read directly; scanned pages and JPG/PNG/WEBP photos fall back to on-device OCR."],
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

