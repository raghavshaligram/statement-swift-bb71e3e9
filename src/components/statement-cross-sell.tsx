import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, X, ArrowRight } from "lucide-react";
import { EmbeddedConverter } from "@/components/embedded-converter";

/**
 * Cross-sell from the free format converters to the PDF statement converter.
 *
 * The format pages (/qbo-to-csv, /ofx-to-csv and the rest) were dead ends:
 * twelve of thirteen mentioned the PDF converter nowhere at all. They are the
 * pages with the cheapest keywords and the most reachable rankings, and they
 * were sending everyone who landed on them straight back out.
 *
 * That is backwards. Format conversion is the acquisition surface -- someone
 * searching "qbo to csv converter free" has a financial file and a problem --
 * and PDF statement conversion is the product. The free tool should hand the
 * visitor to the paid one.
 *
 * Deliberately embeds a REAL working dropzone rather than linking to one.
 * Someone who converts a QBO file here and is then asked to click through to
 * try a PDF mostly won't. Someone who can drag the PDF straight in might.
 */
export function StatementCrossSell() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="rounded-2xl border border-emerald/30 bg-emerald-soft/40 p-6">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-emerald" />
          <div>
            <h2 className="text-lg font-bold text-ink">Got a PDF statement instead?</h2>
            <p className="mt-1.5 text-sm text-ink/75">
              Banks only hand out structured files for recent history — anything older usually comes
              as a PDF. Drop one below and it converts to Excel, CSV, QBO, OFX, QIF, IIF or Tally
              XML, on your device, with no upload. Six pages free, no signup.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <EmbeddedConverter />
        </div>
      </div>
    </div>
  );
}

const DISMISS_KEY = "ll:statement-bar-dismissed";

/**
 * Slim sticky bar promoting the statement converter.
 *
 * Appears only after the visitor has scrolled past the converter they came
 * for, so it never covers the tool while they're using it. Dismissible, and
 * the dismissal is remembered for the session via sessionStorage -- the same
 * mechanism the conversion history already uses, so nothing new is persisted
 * to disk and nothing survives the tab closing.
 *
 * A permanently-visible bar on a page whose job is a free tool is an
 * irritation; one that shows up after the task is done is a suggestion.
 */
export function StatementStickyBar() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      // Private-mode browsers can throw on sessionStorage access. Showing the
      // bar is the safe fallback -- worst case it reappears next page load.
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed || !visible) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* nothing to persist to; the bar simply returns next load */
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald/30 bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
        <FileText className="hidden h-4 w-4 shrink-0 text-emerald sm:block" />
        <p className="min-w-0 flex-1 truncate text-sm text-background/90">
          <span className="font-semibold text-background">Have a PDF statement?</span>{" "}
          <span className="hidden sm:inline">
            Convert it to Excel or CSV on your device — nothing uploaded.
          </span>
        </p>
        <Link
          to="/upload"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald px-4 py-1.5 text-sm font-semibold text-background transition hover:opacity-90"
        >
          Convert free
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-full p-1.5 text-background/50 transition hover:bg-background/10 hover:text-background"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
