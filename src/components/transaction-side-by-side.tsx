/**
 * Section 3 of the homepage: "Review every transaction, side by side."
 *
 * Fixed illustrative example (not live user data) — demonstrates the pattern
 * of the real preview screen. Reveals once via the shared stagger pattern on
 * scroll-into-view, then sits static. The load-bearing interaction is the
 * synchronized hover highlight between the raw statement line and its
 * matching extracted row; row-number chips on both sides reinforce the pairing.
 */
import { useState } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/scroll-reveal";

const RAW_LINES = [
  "02/03  PAYROLL ACME INC                    4,250.00",
  "02/05  COFFEE HOUSE #21                       -6.40",
  "02/07  ACH TRANSFER SAVINGS                 -500.00",
  "02/09  CARD 4421 GROCERY MART                -82.17",
  "02/12  INTEREST PAYMENT                        1.12",
];

const EXTRACTED = [
  { date: "02/03", description: "Payroll — Acme Inc", amount: 4250.0, confidence: "high" as const, pct: 99 },
  { date: "02/05", description: "Coffee House #21", amount: -6.4, confidence: "high" as const, pct: 98 },
  { date: "02/07", description: "Transfer — Savings", amount: -500.0, confidence: "high" as const, pct: 99 },
  { date: "02/09", description: "Grocery Mart", amount: -82.17, confidence: "high" as const, pct: 97 },
  { date: "02/12", description: "Interest Payment", amount: 1.12, confidence: "low" as const },
];

const flaggedCount = EXTRACTED.filter((r) => r.confidence === "low").length;

function rowClass(active: boolean, tone: "left" | "right") {
  if (active) {
    return "border-emerald/50 bg-emerald-soft/40";
  }
  return tone === "left" ? "border-transparent" : "border-border bg-background";
}

function chipClass(active: boolean) {
  return cn(
    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold transition-colors",
    active ? "bg-emerald text-primary-foreground" : "bg-surface-muted text-muted-foreground"
  );
}

export function TransactionSideBySide() {
  const [hovered, setHovered] = useState<number | null>(null);

  // Touchscreens have no hover state, so the sync-highlight interaction this
  // section is built around (and describes in its own copy: "Hover a row...")
  // would silently do nothing on mobile without this. Tapping a row toggles
  // the same highlight state hover gives on desktop; tapping the active row
  // again clears it.
  function toggleTap(i: number) {
    setHovered((current) => (current === i ? null : i));
  }

  return (
    <section className="border-b border-border bg-surface-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald">See it in action</div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Review every transaction, side by side
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every row in your spreadsheet traces back to a line in the original statement — nothing is a
            black box. Hover or tap a row on either side to see it match.
          </p>
        </ScrollReveal>

        <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid md:grid-cols-[11fr_9fr]">
            {/* Left: original statement (styled mock).
                min-w-0 is load-bearing. Grid children default to
                min-width:auto, so the min-w-max mock lines below (which exist
                so the pane can be swiped horizontally) were expanding the
                whole grid track past the viewport on mobile. The card's
                overflow-hidden then clipped the RIGHT pane's amounts --
                +4250, -500 and the rest were cut off screen. */}
            <div className="min-w-0 border-b border-border md:border-b-0 md:border-r">
              <div className="truncate border-b border-border bg-surface-muted/60 px-5 py-3 font-mono text-xs text-muted-foreground">
                FIRST NATIONAL BANK · Statement of Account · Feb 1 – Feb 28
              </div>
              <div className="overflow-x-auto">
                <ScrollRevealGroup className="min-w-max space-y-1 p-5">
                  {RAW_LINES.map((line, i) => (
                    <ScrollRevealItem key={i}>
                      <div
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => toggleTap(i)}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 font-mono text-[12px] leading-relaxed transition-colors sm:text-[13px]",
                          rowClass(hovered === i, "left"),
                          hovered === i ? "text-ink" : "text-muted-foreground"
                        )}
                      >
                        <span className={chipClass(hovered === i)}>{i + 1}</span>
                        <span className="whitespace-pre">{line}</span>
                      </div>
                    </ScrollRevealItem>
                  ))}
                </ScrollRevealGroup>
              </div>
              <div className="px-5 pb-3 text-[10px] text-muted-foreground/70 sm:hidden">
                Swipe to see full line →
              </div>
            </div>

            {/* Right: extracted transactions. min-w-0 for the same reason --
                a grid child must be told it may be narrower than its content
                before its own truncation can take effect. */}
            <div className="min-w-0">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="text-sm font-semibold text-ink">Extracted transactions</div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald/30 bg-emerald-soft px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                  <Check className="h-3 w-3 text-emerald" /> Totals verified
                </span>
              </div>
              <ScrollRevealGroup className="space-y-1.5 p-5">
                {EXTRACTED.map((row, i) => (
                  <ScrollRevealItem key={i}>
                    <div
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => toggleTap(i)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                        rowClass(hovered === i, "right")
                      )}
                    >
                      <span className={chipClass(hovered === i)}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-ink">{row.description}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{row.date}</div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 font-mono text-sm tabular-nums",
                          row.amount > 0 ? "text-emerald" : "text-destructive"
                        )}
                      >
                        {row.amount > 0 ? "+" : ""}
                        {row.amount.toFixed(2)}
                      </span>
                      {row.confidence === "low" ? (
                        <span title="Flagged for review" className="shrink-0">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        </span>
                      ) : (
                        <span className="w-8 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                          {row.pct}%
                        </span>
                      )}
                    </div>
                  </ScrollRevealItem>
                ))}
              </ScrollRevealGroup>
              <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
                {flaggedCount} of {EXTRACTED.length} rows flagged for a second look
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-4 max-w-5xl text-center text-xs text-muted-foreground">
          Illustrative example, shown once you scroll into view — not live data from your own statements.
        </div>
      </div>
    </section>
  );
}
