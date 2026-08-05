import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, X, ArrowRight } from "lucide-react";

/**
 * Funnel from the free format converters to the PDF statement converter.
 *
 * The format pages (QBO->CSV, OFX->CSV, QIF->CSV...) are the cheap traffic:
 * low keyword difficulty, high commercial intent, and they cost nothing to
 * serve because the conversion runs on the visitor's own device. But they were
 * a dead end -- someone converted their file and left, with nothing pointing
 * at the product that actually earns money.
 *
 * Two placements, deliberately different in tone:
 *
 *  - StatementFunnel: an inline block, shown once, mid-page. Framed as "the
 *    harder problem you probably also have" rather than an upsell, because the
 *    person reading a QBO->CSV page is by definition someone who wrangles bank
 *    data and very likely has PDFs they can't use either.
 *
 *  - StickyStatementBar: appears only AFTER the visitor scrolls past the
 *    converter, i.e. after they've had the free thing work. Dismissible, and
 *    the dismissal sticks for the session. Showing it immediately would be an
 *    interstitial on a page whose whole promise is "no signup, just convert" --
 *    that promise is the reason these pages convert at all, and breaking it to
 *    chase a click would cost more than it earns.
 */

const DISMISS_KEY = "ll-statement-bar-dismissed";

export function StatementFunnel({
  sourceFormat,
  targetFormat,
}: {
  /** e.g. "QBO" — the format this page converts FROM. */
  sourceFormat: string;
  /** e.g. "CSV" — the format this page converts TO. */
  targetFormat: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="rounded-2xl border border-emerald/30 bg-emerald-soft/40 p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="hidden shrink-0 rounded-xl bg-emerald/10 p-3 sm:block">
            <FileText className="h-6 w-6 text-emerald" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-ink">
              Only have a PDF statement? That converts too.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">
              A {sourceFormat} file means your bank gave you structured data — which most banks only
              do for the last few months. Beyond that you get a PDF, and a PDF won&apos;t open in
              Excel. BalanceExtract reads those directly: it works out the column layout from the
              document itself, handles scanned statements with OCR, checks that every running
              balance reconciles, and flags any row it isn&apos;t confident about before you export.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">
              Same {targetFormat} output, same on-device processing, nothing uploaded.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-background transition hover:bg-ink/90"
              >
                Convert a PDF statement
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-xs text-ink/60">
                6 pages free, no signup, no card
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StickyStatementBar() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // sessionStorage rather than localStorage: a dismissal should last the
    // visit, not follow someone around for weeks. Guarded because SSR has no
    // window and some privacy modes throw on access.
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (dismissed) return;
    // Show once the visitor is past the fold and has had a chance to use the
    // converter. 700px is roughly hero + dropzone on a laptop.
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  if (dismissed || !visible) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* non-fatal — the bar just reappears next page */
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
        <FileText className="hidden h-5 w-5 shrink-0 text-emerald sm:block" />
        <p className="min-w-0 flex-1 text-sm text-ink">
          <span className="font-semibold">Got PDF statements too?</span>{" "}
          <span className="text-muted-foreground">
            Convert them to Excel or CSV on-device — 6 pages free, no signup.
          </span>
        </p>
        <Link
          to="/upload"
          className="shrink-0 rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-background transition hover:bg-ink/90"
        >
          Try it
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-surface-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
