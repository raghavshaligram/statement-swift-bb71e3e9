/**
 * Conversion history — device-local, metadata only.
 *
 * Replaces a hardcoded array of fake rows that shipped on /account/history
 * while the Free-vs-Pro table advertised "Conversion history" as a real
 * feature.
 *
 * Deliberately stored in localStorage rather than in Supabase. Statement
 * contents never leave the device, so sending even a summary of someone's
 * banking activity to a server would quietly undercut the core promise the
 * whole product is built on. This keeps history exactly as private as the
 * conversion itself, and means it works signed-out too -- which matters
 * because the pricing table lists this as available on Free, not just Pro.
 *
 * What is stored: file name, detected bank, page count, transaction count,
 * export format, timestamp.
 * What is NOT stored: any transaction, amount, balance, description, or any
 * part of the statement itself.
 */

export type ConversionRecord = {
  id: string;
  fileName: string;
  bank: string | null;
  pages: number;
  transactions: number;
  format: string;
  /** ISO timestamp. */
  at: string;
};

const KEY = "ledgerlocal.conversion-history.v1";
/** Cap the log so it can't grow without bound in localStorage. */
const MAX_ENTRIES = 100;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getConversionHistory(): ConversionRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ConversionRecord[]) : [];
  } catch {
    // Corrupt or unreadable history should never break the page it's shown
    // on -- treat it as empty.
    return [];
  }
}

export function recordConversion(entry: Omit<ConversionRecord, "id" | "at">): void {
  if (!isBrowser()) return;
  try {
    const record: ConversionRecord = {
      ...entry,
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
    };
    const next = [record, ...getConversionHistory()].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage can be full or blocked (private browsing, strict settings).
    // History is a convenience -- never let it break an export.
  }
}

export function clearConversionHistory(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
