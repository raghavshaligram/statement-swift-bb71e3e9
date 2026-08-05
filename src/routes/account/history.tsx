import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Upload, ShieldCheck, Trash2 } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import {
  getConversionHistory,
  clearConversionHistory,
  type ConversionRecord,
} from "@/lib/conversion-history";

export const Route = createFileRoute("/account/history")({
  head: () => ({
    meta: [
      { title: "Conversion history — BalanceExtract" },
      {
        name: "description",
        content:
          "Every statement you've converted with BalanceExtract — metadata only, files never leave your device.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HistoryPage,
});

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

/**
 * Real conversion history, replacing the hardcoded sample rows that used to
 * ship here while the Free-vs-Pro table advertised this as a feature.
 *
 * Read from localStorage rather than a server: the statements themselves
 * never leave the device, so sending even a summary of someone's banking
 * activity would undercut that. It's read in an effect rather than during
 * render because localStorage isn't available during server rendering.
 */
function HistoryPage() {
  const [rows, setRows] = useState<ConversionRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setRows(getConversionHistory());
    setLoaded(true);
  }, []);

  const subtitle = !loaded
    ? "Loading…"
    : rows.length === 0
      ? "No conversions yet"
      : `${rows.length} conversion${rows.length === 1 ? "" : "s"} on this device`;

  return (
    <AccountShell eyebrow="Account" title="Conversion history" subtitle={subtitle}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald" />
          Stored on this device only — file names and counts, never statement contents.
        </p>
        <div className="flex gap-2">
          {rows.length > 0 && (
            <button
              onClick={() => {
                clearConversionHistory();
                setRows([]);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-muted-foreground transition hover:text-ink"
            >
              <Trash2 className="h-4 w-4" /> Clear
            </button>
          )}
          <Link
            to="/upload"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-emerald/90"
          >
            <Upload className="h-4 w-4" /> New conversion
          </Link>
        </div>
      </div>

      {loaded && rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <div className="mt-3 font-semibold text-ink">No conversions yet</div>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Once you convert and download a statement, it'll be listed here. History is kept on this device,
            so it won't follow you to another browser.
          </p>
          <Link
            to="/upload"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-emerald px-4 text-sm font-semibold text-primary-foreground"
          >
            <Upload className="h-4 w-4" /> Convert a statement
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/60">
              <tr className="text-left font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">File</th>
                <th className="px-5 py-3">Bank detected</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Transactions</th>
                <th className="px-5 py-3">Pages</th>
                <th className="px-5 py-3">Format</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="transition hover:bg-surface-muted/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium text-ink">{r.fileName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{r.bank ?? "Not recognised"}</td>
                  <td className="px-5 py-4 text-muted-foreground">{formatDate(r.at)}</td>
                  <td className="px-5 py-4 font-mono text-ink">{r.transactions}</td>
                  <td className="px-5 py-4 font-mono text-muted-foreground">{r.pages}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-surface-muted px-2 py-1 font-mono text-[11px] font-semibold text-ink">
                      {r.format}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccountShell>
  );
}
