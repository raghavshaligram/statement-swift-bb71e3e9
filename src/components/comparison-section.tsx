/**
 * Section 6: "Manual entry vs. LedgerLocal" comparison.
 */
import { X, Check, ArrowRight } from "lucide-react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/scroll-reveal";

const ROWS: Array<[string, string]> = [
  ["Hours per statement", "Seconds per statement"],
  ["Typos and transposed digits", "Editable preview before export"],
  ["Uploaded to someone else's server", "Never leaves your device"],
  ["One page at a time", "Batch upload, multiple statements at once"],
  ["No accounting-software-ready file", "Excel, CSV, Tally, OFX, QIF, QBO"],
];

export function ComparisonSection() {
  return (
    <section className="border-b border-border bg-surface-muted/40 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Manual entry vs. LedgerLocal
          </h2>
        </ScrollReveal>

        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-2 border-b border-border text-center text-xs font-semibold uppercase tracking-wider">
            <div className="border-r border-border px-4 py-3 text-muted-foreground">Manual entry</div>
            <div className="px-4 py-3 text-emerald">With LedgerLocal</div>
          </div>
          <ScrollRevealGroup>
            {ROWS.map(([left, right]) => (
              <ScrollRevealItem key={left}>
                <div className="grid grid-cols-2 border-b border-border text-sm last:border-b-0">
                  <div className="flex items-start gap-2.5 border-r border-border px-4 py-4 text-muted-foreground">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive/60" />
                    <span>{left}</span>
                  </div>
                  <div className="flex items-start gap-2.5 px-4 py-4 text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                    <span>{right}</span>
                  </div>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        </div>

        <div className="mt-8 text-center">
          <a
            href="#converter"
            className="inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-semibold text-background transition hover:bg-ink/90"
          >
            Try it on your statement <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
