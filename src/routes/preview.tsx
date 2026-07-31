import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Download, Check, X, AlertCircle, AlertTriangle, TableProperties, FileText, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { SideBySidePane } from "@/components/side-by-side-pane";
import { useStatementStore } from "@/lib/statement-store";
import { formatAmount } from "@/lib/pdf/detect-currency";
import { getConfidenceTier } from "@/lib/pdf/confidence";
import { reconcileTransactions } from "@/lib/pdf/reconciliation";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/statement-store";


export const Route = createFileRoute("/preview")({
  head: () => ({
    meta: [
      { title: "Preview & edit · LedgerLocal" },
      { name: "description", content: "Review extracted transactions before export." },
      { property: "og:title", content: "Preview & edit · LedgerLocal" },
      { property: "og:description", content: "Editable transaction table with inline correction." },
    ],
  }),
  component: PreviewPage,
});

type FilterTab = "all" | "credits" | "debits" | "flagged";

function PreviewPage() {
  const nav = useNavigate();
  const statements = useStatementStore((s) => s.statements);
  const updateTransaction = useStatementStore((s) => s.updateTransaction);
  const deleteTransaction = useStatementStore((s) => s.deleteTransaction);
  const [q, setQ] = useState("");
  // Which statement is being reviewed. Defaults to all, but with more than
  // one file the merged view is misleading -- two statements' rows sit
  // interleaved with no indication of where one ends and the next begins.
  const [activeFile, setActiveFile] = useState<string>("__all__");
  // Confidence floor. 0 shows everything; anything higher shows only rows
  // scoring BELOW it, i.e. the ones worth checking. Thresholds mirror the
  // tiers in confidence.ts (90 = high, 75 = medium) so the filter and the
  // colour coding can't disagree.
  const [maxConfidence, setMaxConfidence] = useState<number>(0);
  // Row highlighted after jumping to it from a reconciliation break.
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);

  // Take the user straight to the offending row: switch to the statement it
  // belongs to, clear any filters that would hide it, scroll it into view and
  // highlight it. A break is only useful if you can act on it -- reporting
  // "first break at <description>" and leaving someone to find it by eye in a
  // few hundred rows isn't much better than not reporting it.
  function jumpToRow(fileName: string, rowId: string) {
    setActiveFile(fileName);
    setTab("all");
    setMaxConfidence(0);
    setQ("");
    setFocusedRowId(rowId);
    requestAnimationFrame(() => {
      const el = document.getElementById(`row-${rowId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
  const [tab, setTab] = useState<FilterTab>("all");
  const [view, setView] = useState<"table" | "sidebyside">("table");
  const [editing, setEditing] = useState<{ id: string; field: keyof Transaction } | null>(null);

  const rows = useMemo(() => statements.flatMap((st) => st.transactions), [statements]);
  // The parser already does this arithmetic per row for confidence scoring
  // and discards it. Surfacing it is the point: an accountant's first
  // question is whether the statement ties out, not how many rows parsed.
  // Reconcile each statement on its own. Running this across the flattened
  // list was wrong: one statement's closing balance doesn't continue into the
  // next one's opening, so every boundary between statements registered as a
  // balance break and a multi-statement batch reported a false discrepancy.
  const reconciliations = useMemo(
    () => statements.map((st) => ({ fileName: st.fileName, result: reconcileTransactions(st.transactions) })),
    [statements]
  );

  // Roll the per-statement results into one headline for the banner.
  const reconciliation = useMemo(() => {
    const applicable = reconciliations.filter((r) => r.result.status !== "not-applicable");
    if (applicable.length === 0) return { kind: "none" as const };
    const failed = applicable.filter((r) => r.result.status === "discrepancy");
    return { kind: failed.length === 0 ? ("all-balanced" as const) : ("some-failed" as const), applicable, failed };
  }, [reconciliations]);
  const warnings = useMemo(() => statements.flatMap((st) => st.warnings), [statements]);
  const currency = useMemo(() => statements.find((st) => st.currency)?.currency ?? null, [statements]);
  const flaggedCount = useMemo(
    () => (activeFile === "__all__" ? rows : rows.filter((r) => r.sourceFile === activeFile)).filter((r) => getConfidenceTier(r.confidence) === "low").length,
    [rows, activeFile]
  );

  // No parsed statements in the store (e.g. direct nav, or a page refresh which
  // clears in-memory state) — send back to upload rather than show an empty table.
  useEffect(() => {
    if (statements.length === 0) nav({ to: "/upload" });
  }, [statements.length, nav]);

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => {
          const haystack = [
            r.description,
            r.date,
            r.amount.toFixed(2),
            r.balance !== null ? r.balance.toFixed(2) : "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q.toLowerCase());
        })
        .filter((r) => activeFile === "__all__" || r.sourceFile === activeFile)
        .filter((r) => maxConfidence === 0 || r.confidence < maxConfidence)
        .filter((r) => {
          if (tab === "credits") return r.amount > 0;
          if (tab === "debits") return r.amount < 0;
          if (tab === "flagged") return getConfidenceTier(r.confidence) === "low";
          return true;
        }),
    [rows, q, tab, activeFile, maxConfidence]
  );

  // Scoped to the statement being viewed. These were computed across every
  // statement regardless of the active tab, so the totals and closing
  // balance didn't change when switching -- showing one statement's rows
  // above another statement's numbers. Memoised as well: they previously
  // recomputed over every row on each render, which is what made switching
  // tabs feel sluggish.
  const scopedRows = useMemo(
    () => (activeFile === "__all__" ? rows : rows.filter((r) => r.sourceFile === activeFile)),
    [rows, activeFile]
  );
  const { credits, debits, lastWithBalance } = useMemo(() => {
    let c = 0;
    let d = 0;
    for (const r of scopedRows) {
      if (r.amount > 0) c += r.amount;
      else d += -r.amount;
    }
    let last: Transaction | undefined;
    for (let i = scopedRows.length - 1; i >= 0; i--) {
      if (scopedRows[i].balance !== null) {
        last = scopedRows[i];
        break;
      }
    }
    return { credits: c, debits: d, lastWithBalance: last };
  }, [scopedRows]);

  function update(t: Transaction, field: keyof Transaction, value: string) {
    const patch: Partial<Transaction> =
      field === "amount" || field === "balance" ? { [field]: parseFloat(value) || 0 } : { [field]: value };
    updateTransaction(t.sourceFile, t.id, patch);
  }

  if (statements.length === 0) return null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-muted/40">
      <TopNav />
      <div className="flex min-h-0 flex-1 flex-col">
        {reconciliation.kind !== "none" && (
          <div
            className={cn(
              "flex-none border-b px-4 py-2.5 text-xs sm:px-5",
              reconciliation.kind === "all-balanced"
                ? "border-emerald/30 bg-emerald-soft/50 text-emerald"
                : "border-amber-300 bg-amber-50 text-amber-900"
            )}
          >
            {reconciliation.kind === "all-balanced" ? (
              <span className="flex items-center gap-2 font-medium">
                <Check className="h-3.5 w-3.5 shrink-0" />
                {reconciliation.applicable.length === 1
                  ? (() => {
                      const r = reconciliation.applicable[0].result;
                      if (r.status === "not-applicable") return null;
                      return (
                        <>
                          Balances tie out — opening {formatAmount(r.openingBalance, currency)} plus{" "}
                          {formatAmount(r.netChange, currency)} net equals the closing balance of{" "}
                          {formatAmount(r.closingBalance, currency)} across {r.rowsChecked} rows.
                        </>
                      );
                    })()
                  : `All ${reconciliation.applicable.length} statements tie out — each checked separately against its own opening and closing balance.`}
              </span>
            ) : (
              <span className="flex items-start gap-2 font-medium">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {reconciliation.failed.map(({ fileName, result }) => {
                    if (result.status === "not-applicable") return null;
                    const first = result.breaks[0];
                    return (
                      <span key={fileName} className="block">
                        <span className="font-semibold">{fileName}</span> doesn't tie out — expected{" "}
                        {formatAmount(result.expectedClosing, currency)} but the statement shows{" "}
                        {formatAmount(result.closingBalance, currency)} (off by{" "}
                        {formatAmount(Math.abs(result.difference), currency)})
                        {first && (
                          <>
                            . First break at{" "}
                            <button
                              onClick={() => jumpToRow(fileName, first.id)}
                              className="font-semibold underline decoration-dotted underline-offset-2 hover:decoration-solid"
                              title="Jump to this row"
                            >
                              {first.date} · {first.description.slice(0, 40)}
                            </button>{" "}
                            (expected {formatAmount(first.expected, currency)}, got{" "}
                            {formatAmount(first.actual, currency)})
                            {result.breaks.length > 1 && ` and ${result.breaks.length - 1} other row(s)`}
                          </>
                        )}
                        .
                      </span>
                    );
                  })}
                  {reconciliation.applicable.length > reconciliation.failed.length && (
                    <span className="block opacity-80">
                      The other {reconciliation.applicable.length - reconciliation.failed.length} statement(s) tie
                      out correctly.
                    </span>
                  )}
                </span>
              </span>
            )}
          </div>
        )}

        {/* Sticky header: metrics + Export */}
        <div className="flex-none border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-ink px-4 py-3 text-background sm:px-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <StatItem label="Transactions" value={scopedRows.length.toString()} />
              <StatItem label="Credits" value={formatAmount(credits, currency)} tone="pos" />
              <StatItem label="Debits" value={formatAmount(debits, currency)} tone="neg" />
              <StatItem
                label="Closing bal."
                value={lastWithBalance ? formatAmount(lastWithBalance.balance!, currency) : "—"}
              />
              <StatItem label="Flagged" value={flaggedCount.toString()} tone={flaggedCount > 0 ? "warn" : undefined} />
            </div>
            <Link
              to="/export"
              className="inline-flex items-center gap-2 rounded-md bg-emerald px-3.5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-emerald/90"
            >
              <Download className="h-4 w-4" /> Export
            </Link>
          </div>
        </div>

        {/* Scrollable workspace */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="space-y-3 px-4 py-3 sm:px-5">
            {statements.some((s) => /\.iif$/i.test(s.fileName)) && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald/30 bg-emerald-soft/40 px-4 py-2.5">
                <span className="text-sm text-accent-foreground">
                  Also dealing with a bank statement? Convert it to Excel free — no signup for up to 6 pages.
                </span>
                <Link
                  to="/upload"
                  className="shrink-0 rounded-md bg-emerald px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-emerald/90"
                >
                  Try it free
                </Link>
              </div>
            )}


        {/* Per-statement tabs. Only shown for a multi-file batch, where the
            merged list genuinely obscures which rows came from which
            statement -- and where reconciliation is per-statement anyway. */}
        {statements.length > 1 && (
          <div className="flex-none border-b border-border bg-surface-muted/30 px-4 py-2 sm:px-5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Statement
              </span>
              <button
                onClick={() => setActiveFile("__all__")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition",
                  activeFile === "__all__"
                    ? "bg-ink text-background"
                    : "text-muted-foreground hover:bg-card hover:text-ink"
                )}
              >
                All ({rows.length})
              </button>
              {statements.map((st) => {
                const rec = reconciliations.find((r) => r.fileName === st.fileName)?.result;
                const failed = rec?.status === "discrepancy";
                return (
                  <button
                    key={st.fileName}
                    onClick={() => setActiveFile(st.fileName)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition",
                      activeFile === st.fileName
                        ? "bg-ink text-background"
                        : "text-muted-foreground hover:bg-card hover:text-ink"
                    )}
                  >
                    {failed && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />}
                    <span className="max-w-[16ch] truncate">{st.fileName}</span>
                    <span className="opacity-60">({st.transactions.length})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Per-statement tabs. Only rendered for a multi-file batch -- with a
            single statement there's nothing to separate, and the merged view
            is the right one. */}
        {statements.length > 1 && (
          <div className="flex-none border-b border-border bg-surface-muted/30 px-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-1 py-2">
              <button
                onClick={() => setActiveFile("__all__")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                  activeFile === "__all__"
                    ? "bg-ink text-background"
                    : "text-muted-foreground hover:bg-card hover:text-ink"
                )}
              >
                All {statements.length} statements
              </button>
              {statements.map((st) => {
                const rec = reconciliations.find((r) => r.fileName === st.fileName)?.result;
                const failed = rec?.status === "discrepancy";
                return (
                  <button
                    key={st.fileName}
                    onClick={() => setActiveFile(st.fileName)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
                      activeFile === st.fileName
                        ? "bg-ink text-background"
                        : "text-muted-foreground hover:bg-card hover:text-ink"
                    )}
                  >
                    {failed && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />}
                    <span className="max-w-[16ch] truncate">{st.fileName}</span>
                    <span className="opacity-60">{st.transactions.length}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Shared toolbar: view toggle + search + filters + row count */}
        <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-5 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
              {(
                [
                  ["table", "Table", TableProperties],
                  ["sidebyside", "Side-by-side", FileText],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    view === id ? "bg-surface-muted text-ink" : "text-muted-foreground hover:text-ink"
                  )}
                >
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </div>
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-md border border-border bg-card py-1.5 pl-9 pr-3 text-sm outline-none focus:border-emerald"
              />
            </div>
            <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
              {(
                [
                  ["all", "All"],
                  ["credits", "Credits"],
                  ["debits", "Debits"],
                  ["flagged", "Flagged"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-semibold transition",
                    tab === key
                      ? "bg-emerald text-primary-foreground"
                      : "text-muted-foreground hover:text-ink"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Confidence floor. Thresholds mirror confidence.ts (90 = high,
                75 = medium) so this can't drift from the row colouring. */}
            <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
              <span className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Conf.
              </span>
              {(
                [
                  [0, "Any"],
                  [90, "< 90%"],
                  [75, "< 75%"],
                  [50, "< 50%"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setMaxConfidence(value)}
                  title={value === 0 ? "Show every row" : `Only rows scoring below ${value}% confidence`}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-semibold transition",
                    maxConfidence === value
                      ? "bg-amber-500 text-white"
                      : "text-muted-foreground hover:text-ink"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-mono">{filtered.length}</span> rows · dbl-click to edit
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{warnings.join(" · ")}</span>
          </div>
        )}


        {view === "table" ? (
        <div className="w-full overflow-x-hidden">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-10" />
              <col className="w-[110px]" />
              <col />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[130px]" />
              <col className="w-[90px]" />
              <col className="w-10" />
            </colgroup>
            <thead>
              <tr className="border-y border-border bg-surface-muted/60 text-left text-sm font-semibold text-muted-foreground">
                <th className="px-2 py-2"><input type="checkbox" /></th>
                <th className="px-2 py-2"><span className="inline-flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3 opacity-50" /></span></th>
                <th className="px-2 py-2"><span className="inline-flex items-center gap-1">Description <ArrowUpDown className="h-3 w-3 opacity-50" /></span></th>

                <th className="px-2 py-2 text-right"><span className="inline-flex items-center gap-1">Debit <ArrowUpDown className="h-3 w-3 opacity-50" /></span></th>
                <th className="px-2 py-2 text-right"><span className="inline-flex items-center gap-1">Credit <ArrowUpDown className="h-3 w-3 opacity-50" /></span></th>
                <th className="px-2 py-2 text-right"><span className="inline-flex items-center gap-1">Balance <ArrowUpDown className="h-3 w-3 opacity-50" /></span></th>
                <th className="px-2 py-2 text-right"><span className="inline-flex items-center gap-1">Conf. <ArrowUpDown className="h-3 w-3 opacity-50" /></span></th>
                <th className="w-10 px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => {
                const flagged = getConfidenceTier(r.confidence) === "low";
                const debit = r.amount < 0 ? -r.amount : null;
                const credit = r.amount > 0 ? r.amount : null;
                return (
                  <tr
                    key={r.id}
                    id={`row-${r.id}`}
                    className={cn(
                      "group hover:bg-surface-muted/50",
                      flagged && "border-l-2 border-l-amber-500 bg-amber-50/40",
                      // Ring rather than a background change so it reads as
                      // "here it is" without masking the flagged styling that
                      // may already apply to the same row.
                      focusedRowId === r.id && "ring-2 ring-inset ring-emerald"
                    )}
                  >
                    <td className="px-2 py-1.5">
                      <input type="checkbox" />
                    </td>
                    <td className="px-2 py-1.5">
                      <EditableCell
                        value={r.date}
                        editing={editing?.id === r.id && editing.field === "date"}
                        onEdit={() => setEditing({ id: r.id, field: "date" })}
                        onCommit={(v) => { update(r, "date", v); setEditing(null); }}
                        className="font-mono text-xs text-ink"
                      />
                    </td>
                    <td className="min-w-0 px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        {flagged && (
                          <span title="Low confidence — please verify">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                          </span>
                        )}
                        <EditableCell
                          value={r.description}
                          editing={editing?.id === r.id && editing.field === "description"}
                          onEdit={() => setEditing({ id: r.id, field: "description" })}
                          onCommit={(v) => { update(r, "description", v); setEditing(null); }}
                          className="block max-w-full truncate whitespace-nowrap text-ink"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-destructive">
                      {debit !== null ? formatAmount(debit, currency) : <span className="text-muted-foreground/50">–</span>}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-emerald">
                      {credit !== null ? formatAmount(credit, currency) : <span className="text-muted-foreground/50">–</span>}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-ink/80">
                      {r.balance !== null ? formatAmount(r.balance, currency) : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <ConfidenceBadge score={r.confidence} />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        onClick={() => deleteTransaction(r.sourceFile, r.id)}
                        className="opacity-0 transition group-hover:opacity-100"
                        aria-label="Row actions"
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground hover:text-ink" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        ) : (
        <div className="rounded-lg bg-surface-muted/40 p-3">
          <SideBySidePane
            transactions={filtered}
            currency={currency}
            headerLine={statements[0] ? `${statements[0].detectedBank ?? "Statement"} — ${statements[0].fileName}` : undefined}
          />
          <p className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
            Showing {filtered.length} of {rows.length} parsed transactions · hover either panel to sync-highlight · switch to Table view to edit
          </p>
        </div>
        )}
          </div>
        </div>

        {/* Sticky bottom legend */}
        <div className="flex-none flex flex-wrap items-center justify-between gap-3 border-t border-background/10 bg-ink px-4 py-2.5 text-xs text-background/80 sm:px-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono uppercase tracking-wider text-background/50">confidence</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald/30 bg-emerald-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-accent-foreground">
              ≥90% high
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-700">
              75-89% medium
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-destructive">
              &lt;75% low
            </span>
          </div>
          <span className="font-mono text-background/50">
            {view === "table" ? "double-click any cell to edit" : "side-by-side — read-only · switch to Table to edit"}
          </span>
        </div>
      </div>
    </div>
  );
}


function StatItem({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" | "warn" }) {
  return (
    <div>
      <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-background/50">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 font-mono text-lg font-semibold tabular-nums",
          tone === "pos" && "text-emerald",
          tone === "neg" && "text-destructive",
          tone === "warn" && "text-amber-400",
          !tone && "text-background"
        )}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * Real weighted confidence score (see parse-transactions.ts), bucketed into
 * the same three tiers shown in the confidence-key legend below the table:
 * >=90% high (green), 75-89% medium (amber), <75% low (red).
 */
function ConfidenceBadge({ score }: { score: number }) {
  const tier = getConfidenceTier(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold",
        tier === "high" && "border-emerald/30 bg-emerald-soft text-accent-foreground",
        tier === "medium" && "border-amber-400/40 bg-amber-50 text-amber-700",
        tier === "low" && "border-destructive/30 bg-destructive/10 text-destructive"
      )}
    >
      {tier === "low" ? <X className="h-2.5 w-2.5" /> : <Check className="h-2.5 w-2.5" />}
      {score}%
    </span>
  );
}

function EditableCell({
  value, editing, onEdit, onCommit, className,
}: {
  value: string; editing: boolean; onEdit: () => void; onCommit: (v: string) => void; className?: string;
}) {
  if (editing) {
    return (
      <input
        autoFocus
        defaultValue={value}
        onBlur={(e) => onCommit(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onCommit((e.target as HTMLInputElement).value)}
        className={`w-full rounded border border-emerald bg-background px-1.5 py-0.5 outline-none ${className ?? ""}`}
      />
    );
  }
  return (
    <span onClick={onEdit} className={`cursor-text rounded px-1.5 py-0.5 hover:bg-surface-muted ${className ?? ""}`}>
      {value}
    </span>
  );
}
