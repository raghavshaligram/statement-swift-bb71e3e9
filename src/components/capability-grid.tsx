/**
 * Section 5: capability grid. 6 cards, 3x2 on desktop, 1 column on mobile.
 */
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/scroll-reveal";
import {
  OnDeviceMiniVisual,
  BankCoverageVisual,
  ExportFormatsVisual,
  BatchUploadVisual,
  EditableVisual,
  NoAccountVisual,
} from "@/components/capability-icons";
import type { ReactNode } from "react";

const CAPABILITIES: Array<{ visual: ReactNode; title: string; body: string }> = [
  {
    visual: <OnDeviceMiniVisual />,
    title: "On-device processing",
    body: "Every statement is parsed locally in your browser. Nothing is transmitted to a server, ever.",
  },
  {
    visual: <BankCoverageVisual />,
    title: "Global bank coverage",
    body: "Parser profiles for major US, Indian, UK and European banks, plus a generic layout engine for the rest.",
  },
  {
    visual: <ExportFormatsVisual />,
    title: "6 export formats",
    body: "Excel, CSV, Tally XML, OFX, QIF, QBO — export straight into the format your ledger already expects.",
  },
  {
    visual: <BatchUploadVisual />,
    title: "Multi-statement batch upload",
    body: "Drop several PDFs — even from different banks — and convert them together in one pass.",
  },
  {
    visual: <EditableVisual />,
    title: "Editable before export",
    body: "Every extracted row is editable inline. Fix a date, split a line, or delete a row before you export.",
  },
  {
    visual: <NoAccountVisual />,
    title: "No account required to try it",
    body: "Convert your first statements without signing up. An account is only needed to upgrade to Lifetime.",
  },
];

export function CapabilityGrid() {
  return (
    <section className="border-b border-border py-20">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Real software, not a converter website
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything you'd expect from desktop tools — running entirely in your browser.
          </p>
        </ScrollReveal>

        <ScrollRevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <ScrollRevealItem key={c.title} className="h-full">
              <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6">
                {c.visual}
                <h3 className="mt-4 text-base font-semibold text-ink">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              </div>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  );
}
