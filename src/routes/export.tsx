import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  FileSpreadsheet, FileText, FileCode, FileType, Check, ShieldCheck, Download, ArrowLeft,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { recordConversion } from "@/lib/conversion-history";
import { useStatementStore } from "@/lib/statement-store";
import { runExport, DEFAULT_EXPORT_OPTIONS, type ExportFormat, type ExportOptions } from "@/lib/export";
import { getConfidenceTier } from "@/lib/pdf/confidence";

export const Route = createFileRoute("/export")({
  head: () => ({
    meta: [
      { title: "Export · LedgerLocal" },
      { name: "description", content: "Export to Excel, CSV, Tally XML, OFX, QIF, QBO." },
      { property: "og:title", content: "Export · LedgerLocal" },
      { property: "og:description", content: "Six export formats. All generated on your device." },
    ],
  }),
  component: ExportPage,
});

const FORMATS: Array<{
  key: ExportFormat; name: string; ext: string; icon: typeof FileSpreadsheet; desc: string; tone: string; pro: boolean;
}> = [
  { key: "xlsx", name: "Excel", ext: ".xlsx", icon: FileSpreadsheet, desc: "Native Microsoft Excel workbook with formatted columns.", tone: "emerald", pro: false },
  { key: "csv",  name: "CSV",   ext: ".csv",  icon: FileText,        desc: "Universal comma-separated. Opens in anything.",       tone: "slate", pro: false },
  { key: "tally", name: "Tally XML", ext: ".xml", icon: FileCode,    desc: "Direct import into Tally Prime / ERP 9 daybook.",     tone: "slate", pro: true },
  { key: "ofx", name: "OFX",   ext: ".ofx",  icon: FileType,        desc: "Open Financial Exchange — Quicken, Money.",           tone: "slate", pro: true },
  { key: "qif", name: "QIF",   ext: ".qif",  icon: FileType,        desc: "Legacy Quicken import format.",                       tone: "slate", pro: true },
  { key: "qbo", name: "QBO",   ext: ".qbo",  icon: FileType,        desc: "QuickBooks Web Connect — imports as a bank feed.",    tone: "slate", pro: true },
  { key: "iif", name: "IIF",   ext: ".iif",  icon: FileType,        desc: "QuickBooks Desktop import format.",                   tone: "slate", pro: true },
];

function ExportPage() {
  const nav = useNavigate();
  const statements = useStatementStore((s) => s.statements);
  const rows = useMemo(() => statements.flatMap((st) => st.transactions), [statements]);
  const currency = useMemo(() => statements.find((st) => st.currency)?.currency ?? null, [statements]);

  useEffect(() => {
    if (statements.length === 0) nav({ to: "/upload" });
  }, [statements.length, nav]);

  const [selected, setSelected] = useState<ExportFormat>("xlsx");
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>({});
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [oneSheetPerStatement, setOneSheetPerStatement] = useState(true);

  const baseFileName = useMemo(() => {
    const first = statements[0]?.fileName?.replace(/\.pdf$/i, "");
    return statements.length > 1 ? `${first}-and-${statements.length - 1}-more` : first || "statement";
  }, [statements]);

  const includedRows = useMemo(
    () => (options.omitLowConfidence ? rows.filter((r) => getConfidenceTier(r.confidence) !== "low") : rows),
    [rows, options.omitLowConfidence]
  );
  const columnList = useMemo(() => {
    const cols = ["Date", "Description"];
    if (options.splitDebitCredit) cols.push("Debit", "Credit");
    else cols.push("Amount");
    if (options.includeBalance) cols.push("Balance");
    if (options.includeSourcePage) cols.push("Source Page");
    return cols;
  }, [options]);

  function handleDownload() {
    runExport(selected, rows, baseFileName, options, oneSheetPerStatement, currency);
    setDownloaded((s) => ({ ...s, [selected]: true }));
    // Log the conversion once the user actually downloads -- that's the point
    // the conversion is genuinely "done". Metadata only; nothing from the
    // statement itself is recorded.
    for (const st of statements) {
      recordConversion({
        fileName: st.fileName,
        bank: st.detectedBank,
        pages: st.pageCount,
        transactions: st.transactions.length,
        format: selected.toUpperCase(),
      });
    }
  }

  if (statements.length === 0) return null;

  return (
    <AppShell
      toolbar={
        <Link
          to="/preview"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-muted"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to preview
        </Link>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald">Export</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">Export transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a format, configure options, then download.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Left: format grid + options */}
          <div className="space-y-4 lg:col-span-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Format</div>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                {FORMATS.map((f) => {
                  const active = selected === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setSelected(f.key)}
                      className={`group relative rounded-lg border p-3 text-left transition ${
                        active
                          ? "border-emerald bg-emerald-soft/40 shadow-sm"
                          : "border-border bg-card hover:border-emerald/50"
                      }`}
                    >
                      {f.pro && (
                        <span className="absolute right-2 top-2 rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-700">
                          PRO
                        </span>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                          f.tone === "emerald" ? "bg-emerald text-primary-foreground" : "bg-surface-muted text-ink"
                        }`}>
                          <f.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold text-ink">{f.name}</span>
                            <span className="font-mono text-[11px] text-muted-foreground">{f.ext}</span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{f.desc}</p>
                        </div>
                        {active && (
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald text-primary-foreground">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Options</div>
              <div className="mt-2 divide-y divide-border rounded-lg border border-border bg-card">
                <Toggle
                  label="Header row"
                  sub="First row contains column labels"
                  checked={true}
                  onChange={() => {}}
                />
                <Toggle
                  label="Currency symbol"
                  sub={`Include ${currency ?? "₹"} in amount columns`}
                  checked={options.includeCurrencySymbol}
                  onChange={(v) => setOptions((o) => ({ ...o, includeCurrencySymbol: v }))}
                />
                <Toggle
                  label="Running balance column"
                  sub="Balance-after-transaction column"
                  checked={options.includeBalance}
                  onChange={(v) => setOptions((o) => ({ ...o, includeBalance: v }))}
                />
                <Toggle
                  label="Split debit / credit"
                  sub="Separate debit and credit columns"
                  checked={options.splitDebitCredit}
                  onChange={(v) => setOptions((o) => ({ ...o, splitDebitCredit: v }))}
                />
                <Toggle
                  label="Normalize dates to ISO"
                  sub="YYYY-MM-DD format"
                  checked={options.normalizeDatesIso}
                  onChange={(v) => setOptions((o) => ({ ...o, normalizeDatesIso: v }))}
                />
                <Toggle
                  label="Source-page reference"
                  sub="Include PDF page number column"
                  checked={options.includeSourcePage}
                  onChange={(v) => setOptions((o) => ({ ...o, includeSourcePage: v }))}
                />
                <Toggle
                  label="One sheet per statement"
                  sub="Excel only"
                  checked={oneSheetPerStatement}
                  onChange={setOneSheetPerStatement}
                />
                <Toggle
                  label="Omit low-confidence rows"
                  sub="Skip amber/red flagged rows"
                  checked={options.omitLowConfidence}
                  onChange={(v) => setOptions((o) => ({ ...o, omitLowConfidence: v }))}
                />
                <Toggle
                  label="Payee & Category columns"
                  sub="Derived on-device — Description is still exported unchanged"
                  checked={options.includeEnrichment}
                  onChange={(v) => setOptions((o) => ({ ...o, includeEnrichment: v }))}
                />
              </div>
            </div>
          </div>

          {/* Right: sticky summary + trust note */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20 space-y-3">
              <div className="rounded-xl border border-border bg-ink p-4 text-background">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-background/50">
                  Export summary
                </div>
                <dl className="mt-3 space-y-2 text-xs">
                  <SummaryRow label="Format" value={`${FORMATS.find((f) => f.key === selected)?.name} (${FORMATS.find((f) => f.key === selected)?.ext})`} />
                  <SummaryRow label="Rows" value={`${includedRows.length} transactions`} />
                  <SummaryRow label="Columns" value={columnList.join(", ")} />
                  <SummaryRow label="Header row" value="Yes" />
                  <SummaryRow label="Source" value={statements[0]?.fileName ?? baseFileName} mono />
                </dl>
                <button
                  onClick={handleDownload}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-emerald/90"
                >
                  <Download className="h-4 w-4" />
                  {downloaded[selected] ? `Re-download ${FORMATS.find((f) => f.key === selected)?.ext}` : `Download ${FORMATS.find((f) => f.key === selected)?.ext}`}
                </button>
                {FORMATS.find((f) => f.key === selected)?.pro && (
                  <p className="mt-2 text-center text-[11px] text-amber-400/90">
                    {FORMATS.find((f) => f.key === selected)?.name} requires Pro
                  </p>
                )}
              </div>

              <Link
                to="/upload"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-muted"
              >
                <ArrowLeft className="h-4 w-4 rotate-180" /> Convert another file
              </Link>

              <div className="flex items-start gap-2 rounded-lg border border-emerald/30 bg-emerald-soft/40 px-3 py-2.5 text-xs text-accent-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                <span>File is generated on this device and downloaded directly. No data is transmitted.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink">{label}</div>
        {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? "bg-emerald" : "bg-border"}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition ${checked ? "left-4" : "left-0.5"}`} />
      </button>
    </label>
  );
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-background/50">{label}</dt>
      <dd className={`text-right text-background ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

