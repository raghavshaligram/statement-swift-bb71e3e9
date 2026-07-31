import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmbeddedConverter } from "@/components/embedded-converter";
import { usePageUsage } from "@/hooks/use-page-usage";
import { useStatementStore } from "@/lib/statement-store";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Convert statements — LedgerLocal" },
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
  const phase = useStatementStore((s) => s.phase);
  const pendingFiles = useStatementStore((s) => s.pendingFiles);
  const showQueue = phase !== "idle" && pendingFiles.length > 0;

  return (
    <AppShell title="Convert statements">
      <div className="mx-auto max-w-4xl space-y-6">
        <EmbeddedConverter showOcrLanguage />

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
