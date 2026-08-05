import type { PageText } from "../pdf/extract-text";
import type { Transaction } from "../statement-store";
import { redactPages, type DiagnosticBundle } from "./redact";

/**
 * Holds the page geometry of the most recent parse so a bug report can be
 * generated after the fact.
 *
 * ParsedStatement deliberately does not carry TextItems -- keeping every
 * token's coordinates on every statement in the store would balloon memory for
 * data the UI never reads. But a useful bug report needs exactly that
 * geometry, so it is stashed here instead.
 *
 * Deliberately module-level and NOT in the zustand store, and never persisted:
 *
 *  - It must not survive a reload. This is the raw text of somebody's bank
 *    statement; it should live exactly as long as the tab is on the review
 *    screen and no longer.
 *  - It must not reach localStorage, IndexedDB, or any store that might later
 *    be persisted by a middleware someone adds without thinking about it.
 *
 * Capacity is capped at the most recent file. Reporting a bad conversion is a
 * thing you do about the statement in front of you.
 */

let lastPages: PageText[] | null = null;
let lastFileName: string | null = null;
let lastOcrUsed = false;

export function captureForDiagnostics(fileName: string, pages: PageText[], ocrUsed: boolean) {
  lastPages = pages;
  lastFileName = fileName;
  lastOcrUsed = ocrUsed;
}

export function clearDiagnostics() {
  lastPages = null;
  lastFileName = null;
  lastOcrUsed = false;
}

export function hasDiagnostics(fileName?: string): boolean {
  if (!lastPages) return false;
  return fileName ? lastFileName === fileName : true;
}

/**
 * Finds rows where the running balance doesn't move by the transaction amount.
 * Returns 1-based row positions only -- never the values, which are the
 * sensitive part and aren't needed to locate the bug.
 */
function reconciliationBreaks(transactions: Transaction[]): number[] {
  const breaks: number[] = [];
  for (let i = 1; i < transactions.length; i++) {
    const prev = transactions[i - 1].balance;
    const curr = transactions[i].balance;
    if (prev === null || curr === null) continue;
    if (Math.abs(prev + transactions[i].amount - curr) > 0.01) breaks.push(i + 1);
  }
  return breaks;
}

export function buildDiagnosticBundle(input: {
  detectedBank: string | null;
  currency: string | null;
  transactions: Transaction[];
  warnings: string[];
  lowConfidenceThreshold?: number;
}): DiagnosticBundle | null {
  if (!lastPages) return null;
  const threshold = input.lowConfidenceThreshold ?? 70;

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    meta: {
      detectedBank: input.detectedBank,
      currency: input.currency,
      pageCount: lastPages.length,
      transactionsFound: input.transactions.length,
      flaggedRows: input.transactions.filter((t) => t.confidence < threshold).length,
      reconciliationBreaks: reconciliationBreaks(input.transactions),
      warnings: input.warnings,
      ocrUsed: lastOcrUsed,
    },
    // The filename is NOT included. It routinely contains an account number or
    // the account holder's name, and it tells a maintainer nothing.
    pages: redactPages(lastPages),
  };
}

export function downloadDiagnosticBundle(bundle: DiagnosticBundle) {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `balanceextract-report-${bundle.createdAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
