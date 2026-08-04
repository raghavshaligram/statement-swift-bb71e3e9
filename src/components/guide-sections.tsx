import type { ReactNode } from "react";
import { AlertTriangle, Check, X, Info, Lightbulb } from "lucide-react";

/**
 * Components for long-form guide pages.
 *
 * Deliberately separate from article-sections.tsx, which serves the short tool
 * pages. Those two page types have opposite jobs and should not share a
 * vocabulary:
 *
 *   Tool page  -- someone searching "qbo to csv converter free" who wants to
 *                 drop a file and leave. Chrome is subtracted, not added.
 *   Guide page -- someone searching "how to open a QBO file in Excel" who has
 *                 a problem they don't fully understand yet. Depth, worked
 *                 alternatives, and troubleshooting are the value.
 *
 * The guide tier exists because tool pages structurally cannot rank for
 * question-shaped queries -- there is nowhere on a dropzone to answer "why
 * won't Excel open my QBO file". Linking a guide down to its tool captures
 * both intents without compromising either.
 */

/** Numbered step with an icon, for procedures the reader will follow while working. */
export function StepCard({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald/10 font-mono text-sm font-bold text-emerald">
        {n}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-ink">{title}</div>
        <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export function StepList({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl space-y-3 px-6 py-4">{children}</div>;
}

type CalloutTone = "info" | "warning" | "tip";

const TONE = {
  info: { icon: Info, ring: "border-border", bg: "bg-surface-muted/50", fg: "text-muted-foreground" },
  warning: { icon: AlertTriangle, ring: "border-amber-300", bg: "bg-amber-50", fg: "text-amber-700" },
  tip: { icon: Lightbulb, ring: "border-emerald/30", bg: "bg-emerald-soft/40", fg: "text-emerald" },
} as const;

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: CalloutTone;
  title: string;
  children: ReactNode;
}) {
  const { icon: Icon, ring, bg, fg } = TONE[tone];
  return (
    <div className="mx-auto max-w-3xl px-6 py-3">
      <div className={`rounded-xl border ${ring} ${bg} p-5`}>
        <div className={`flex items-center gap-2 text-sm font-semibold ${fg}`}>
          <Icon className="h-4 w-4 shrink-0" />
          {title}
        </div>
        <div className="mt-2 text-sm leading-relaxed text-ink/80">{children}</div>
      </div>
    </div>
  );
}

/**
 * Raw file contents, shown verbatim.
 *
 * Worth the space on a format guide: someone who has opened their QBO file in
 * Notepad and seen this exact soup is looking for confirmation they're not
 * doing something wrong. Showing the real structure is also the cheapest way
 * to demonstrate the tool actually understands the format rather than
 * guessing at it.
 */
export function CodeBlock({ label, code }: { label?: string; code: string }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-3">
      {label && (
        <div className="mb-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      )}
      <pre className="overflow-x-auto rounded-xl border border-border bg-ink p-4 font-mono text-xs leading-relaxed text-background">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Two-column troubleshooting grid.
 *
 * Each entry is written to match how the problem is actually searched --
 * "dates look like 20260702", not "date format normalisation" -- because these
 * headings are the long-tail queries. A reader who lands here has already
 * converted something and got output they don't trust.
 */
export function TroubleshootGrid({
  items,
}: {
  items: Array<{ symptom: string; body: string }>;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map(({ symptom, body }) => (
          <div key={symptom} className="rounded-xl border border-border bg-card p-5">
            <div className="text-sm font-semibold text-ink">{symptom}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Comparison of approaches, including the ones that don't involve this product. */
export function MethodTable({
  methods,
}: {
  methods: Array<{
    name: string;
    handlesScans: boolean | string;
    needsUpload: boolean | string;
    effort: string;
    output: string;
  }>;
}) {
  const Cell = ({ v }: { v: boolean | string }) =>
    typeof v === "boolean" ? (
      v ? (
        <Check className="h-4 w-4 text-emerald" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground/50" />
      )
    ) : (
      <span>{v}</span>
    );

  return (
    <div className="mx-auto max-w-3xl px-6 py-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Method</th>
              <th className="px-4 py-3 font-semibold">Handles scans</th>
              <th className="px-4 py-3 font-semibold">Uploads your file</th>
              <th className="px-4 py-3 font-semibold">Effort</th>
              <th className="px-4 py-3 font-semibold">Output</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {methods.map((m) => (
              <tr key={m.name} className="align-top">
                <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
                <td className="px-4 py-3"><Cell v={m.handlesScans} /></td>
                <td className="px-4 py-3"><Cell v={m.needsUpload} /></td>
                <td className="px-4 py-3 text-muted-foreground">{m.effort}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.output}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * What to do after the conversion works.
 *
 * The moment someone decides whether a tool was actually useful is not when
 * the file downloads — it's ten minutes later when they're trying to do
 * something with it. Answering that is also how a guide earns links.
 */
export function NextSteps({
  items,
}: {
  items: Array<{ title: string; body: string }>;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map(({ title, body }) => (
          <div key={title} className="rounded-xl border border-border p-5">
            <div className="text-sm font-semibold text-ink">{title}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
