import type { TextItem } from "./extract-text";

export type ColumnRole =
  | "date"
  | "valueDate"
  | "description"
  | "amount"
  | "deposit"
  | "withdrawal"
  | "balance"
  | "tranType"
  | "tranId"
  | "chequeDetails"
  | "drCrColumn";

export type DetectedColumn = {
  role: ColumnRole;
  label: string;
  xStart: number; // inclusive left boundary for classifying a number into this column
  xEnd: number; // exclusive right boundary
};

export type HeaderInfo = {
  columns: DetectedColumn[];
  headerRowIndex: number; // index into the rows array this header was found on
};

// Keyword -> role mapping. Order matters for role priority when a single
// header label could plausibly match more than one (it generally won't, but
// e.g. "Amount" should never accidentally match "Withdrawal Amount" as both
// deposit and withdrawal — longer/more specific keywords are checked first).
//
// "Value Date" used to map to the same "date" role as the primary
// transaction date -- a real bug (both columns would collide into one
// role). Split out as its own role, since some statements (confirmed via a
// real sample) have both as genuinely distinct columns.
/**
 * Non-English column headers.
 *
 * Number and date parsing already handle comma-decimal and dot-separated
 * locales, but every header label above was English, so a German or Spanish
 * statement found no header row and fell through to positional inference.
 * That degrades rather than fails -- it still produces transactions -- but it
 * loses the explicit debit/credit column split, which is exactly what
 * positional inference is worst at.
 *
 * Diacritics are stripped before matching (see normaliseLabel), so patterns
 * here are written unaccented: "Libelle" matches "Libellé", "Descricao"
 * matches "Descrição". Writing both forms in every pattern would be noise.
 *
 * Covers German, French, Spanish, Italian, Dutch and Portuguese -- the six
 * languages behind the comma-decimal locales the number parser now supports.
 * Untested against real statements from these countries; this widens what CAN
 * be recognised, and the honest claim remains that named support is US, UK,
 * Canada and India.
 */
const LOCALISED_ROLE_KEYWORDS: Array<{ role: ColumnRole; patterns: RegExp[] }> = [
  {
    role: "valueDate",
    patterns: [
      /^wertstellung$/i, /^valuta$/i,            // de
      /^date de valeur$/i,                        // fr
      /^fecha valor$/i,                           // es
      /^data valuta$/i,                           // it
      /^valutadatum$/i,                           // nl
      /^data valor$/i,                            // pt
    ],
  },
  {
    role: "date",
    patterns: [
      /^datum$/i, /^buchungstag$/i, /^buchungsdatum$/i,   // de + nl
      /^date$/i, /^date operation$/i,                     // fr
      /^fecha$/i, /^fecha operacion$/i,                   // es
      /^data$/i, /^data operazione$/i,                    // it
      /^data lancamento$/i,                               // pt
    ],
  },
  {
    role: "description",
    patterns: [
      /^buchungstext$/i, /^verwendungszweck$/i, /^umsatzart$/i,  // de
      /^libelle$/i, /^operation$/i, /^nature de l.operation$/i,   // fr
      /^concepto$/i, /^descripcion$/i, /^detalle$/i,              // es
      /^descrizione$/i, /^causale$/i,                             // it
      /^omschrijving$/i, /^mededelingen$/i,                       // nl
      /^descricao$/i, /^historico$/i,                             // pt
    ],
  },
  {
    role: "withdrawal",
    patterns: [
      /^soll$/i, /^belastung$/i, /^lastschrift$/i,   // de
      /^debit$/i, /^retrait$/i,                       // fr
      /^cargo$/i, /^debe$/i, /^adeudo$/i,             // es
      /^dare$/i, /^addebito$/i, /^uscite$/i,          // it
      /^debet$/i, /^af$/i,                            // nl
      /^debito$/i, /^saida$/i,                        // pt
    ],
  },
  {
    role: "deposit",
    patterns: [
      /^haben$/i, /^gutschrift$/i,                    // de
      /^credit$/i, /^versement$/i,                    // fr
      /^abono$/i, /^haber$/i, /^ingreso$/i,           // es
      /^avere$/i, /^accredito$/i, /^entrate$/i,       // it
      /^credit$/i, /^bij$/i,                          // nl
      /^credito$/i, /^entrada$/i,                     // pt
    ],
  },
  {
    role: "balance",
    patterns: [
      /^saldo$/i, /^kontostand$/i, /^endsaldo$/i,     // de, es, it, nl, pt
      /^solde$/i,                                     // fr
      /^saldo final$/i, /^saldo contabile$/i,
    ],
  },
  {
    role: "amount",
    patterns: [
      /^betrag$/i, /^umsatz$/i,                       // de
      /^montant$/i,                                   // fr
      /^importe$/i,                                   // es
      /^importo$/i,                                   // it
      /^bedrag$/i,                                    // nl
      /^valor$/i, /^montante$/i,                      // pt
    ],
  },
];

const ROLE_KEYWORDS: Array<{ role: ColumnRole; patterns: RegExp[] }> = [
  { role: "valueDate", patterns: [/^value date$/i] },
  { role: "date", patterns: [/^date$/i, /^transaction date$/i, /^txn date$/i] },
  {
    role: "description",
    patterns: [
      /^particulars?$/i,
      /^description$/i,
      /^narration$/i,
      /^details?$/i,
      /^transaction details?$/i,
    ],
  },
  { role: "withdrawal", patterns: [/^withdrawals?$/i, /^debit$/i, /^dr\.?$/i] },
  { role: "deposit", patterns: [/^deposits?$/i, /^credit$/i, /^cr\.?$/i] },
  {
    role: "balance",
    patterns: [/^balance$/i, /^closing balance$/i, /^running balance$/i, /^bal\.?$/i],
  },
  { role: "amount", patterns: [/^amount$/i, /^amt\.?$/i] },
  // New optional columns, confirmed via a real sample (Federal Bank) --
  // not every statement has these, but when present they're real, distinct
  // columns, not something worth trying to infer from the description text.
  { role: "tranType", patterns: [/^tran(?:saction)? type$/i, /^txn type$/i] },
  {
    role: "tranId",
    patterns: [/^tran(?:saction)? id$/i, /^txn id$/i, /^reference no\.?$/i, /^ref\.? no\.?$/i],
  },
  {
    role: "chequeDetails",
    patterns: [/^cheque details$/i, /^cheque no\.?$/i, /^chq no\.?$/i, /^cheque number$/i],
  },
  // Recognized purely so its raw text (e.g. "Cr") gets excluded from the
  // description via consumedColumnText in parse-transactions.ts -- NOT used
  // as the source of the authoritative drCr field. A real Federal Bank
  // statement prints "Cr" on every row including withdrawals, confirming this
  // column reflects balance standing rather than transaction direction. The
  // exported drCr is derived from the amount's sign instead, after the
  // balance-continuity pass (see parse-transactions.ts).
  { role: "drCrColumn", patterns: [/^dr\s*\/?\s*cr\.?$/i, /^dr\/cr$/i] },
  ...LOCALISED_ROLE_KEYWORDS,
];


// Canonical words for fuzzy matching, used as a fallback when an OCR'd
// header doesn't exactly match the regex patterns above (e.g. "Date" ->
// "Dace", "Balance" -> "Batance" are real, observed OCR misreadings on a
// genuine scanned statement, not hypothetical edge cases). Kept separate
// from the regex patterns since those include real variations (e.g.
// "particulars?") that aren't meaningful as literal strings to diff against.
const FUZZY_CANONICAL: Array<{ role: ColumnRole; words: string[] }> = [
  { role: "date", words: ["date", "transaction date", "txn date"] },
  {
    role: "description",
    words: ["particulars", "description", "narration", "details", "transaction details"],
  },
  { role: "withdrawal", words: ["withdrawals", "withdrawal", "debit"] },
  { role: "deposit", words: ["deposits", "deposit", "credit"] },
  { role: "balance", words: ["balance", "closing balance", "running balance"] },
  { role: "amount", words: ["amount"] },
];

/** Plain Levenshtein edit distance -- small, self-contained, no dependency needed for this. */
function editDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/**
 * Fuzzy fallback for header matching -- tolerates small OCR misreadings
 * (1-2 character errors) that the exact regex patterns above would miss
 * entirely. Only tried when the exact match fails, and only accepts a
 * match when the edit distance is small relative to the word's length, so
 * a genuinely different, short word doesn't accidentally match.
 */
function fuzzyMatchRole(label: string): ColumnRole | null {
  const cleaned = label
    .trim()
    .toLowerCase()
    .replace(/[*:]+$/, "");
  if (cleaned.length < 3) return null; // too short to fuzzy-match safely
  let best: { role: ColumnRole; distance: number } | null = null;
  for (const { role, words } of FUZZY_CANONICAL) {
    for (const word of words) {
      const distance = editDistance(cleaned, word);
      const threshold = Math.max(1, Math.floor(word.length * 0.25));
      if (distance <= threshold && (!best || distance < best.distance)) {
        best = { role, distance };
      }
    }
  }
  return best?.role ?? null;
}

/**
 * Normalises a header label for matching: trims, drops trailing punctuation,
 * and strips diacritics via NFD decomposition so the localised patterns can be
 * written unaccented. "Libellé" -> "Libelle", "Descrição" -> "Descricao".
 */
function normaliseLabel(label: string): string {
  return label
    .trim()
    .replace(/[*:]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchRole(label: string): ColumnRole | null {
  const cleaned = normaliseLabel(label);
  for (const { role, patterns } of ROLE_KEYWORDS) {
    if (patterns.some((p) => p.test(cleaned))) return role;
  }
  return fuzzyMatchRole(label);
}

type Row = { y: number; items: TextItem[]; text: string };

/**
 * Scans a page's reconstructed rows for a header row — one containing at
 * least two recognizable column-role keywords (so a stray "Balance" mention
 * in a paragraph elsewhere doesn't get mistaken for the real header). Returns
 * the x-position boundaries for each detected column, derived from the
 * midpoints between adjacent header labels, so any number on a transaction
 * row can be classified by which column it visually falls under — instead of
 * assuming "last two numbers are amount then balance," which breaks the
 * moment a statement uses a different column order or a split debit/credit
 * layout.
 */
export function findHeaderRow(rows: Row[], pageWidth: number): HeaderInfo | null {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const matches: Array<{ role: ColumnRole; label: string; x: number }> = [];

    for (const item of row.items) {
      const role = matchRole(item.str);
      if (role) matches.push({ role, label: item.str, x: item.x });
    }

    // Require at least 2 DISTINCT roles, not just any 2 matched tokens --
    // a real header row has genuinely different columns (date, description,
    // amount, balance), whereas a summary line like "Opening balance ...
    // Closing balance" can otherwise falsely satisfy "2 matches" by matching
    // the same "balance" role twice. Confirmed as a real bug via a real
    // statement (Chase UK) that has exactly this kind of summary row above
    // the actual transaction table.
    const distinctRoles = new Set(matches.map((m) => m.role));
    if (distinctRoles.size < 2) continue; // not confident this is the header

    // Some banks stack a header label across two visual lines within one
    // cell (e.g. "Tran" / "Type", "Cheque" / "Details", "DR" / "/CR"),
    // rendered as separate PDF text items only a few px apart -- closer
    // together than a real two-line description wrap, but still wider than
    // the row-grouping tolerance, so each half lands as its own Row instead
    // of merging into the single-line header row. Left unhandled, this is
    // TWO real bugs, not one: the leftover fragment row (e.g. "Type Details
    // /CR") is dateless and amount-less, so it gets glued onto the very
    // first real transaction as a phantom prefix, shifting every field's
    // row alignment for the rest of the table -- and even after skipping
    // that row, "Tran Type" is never registered as its own column at all,
    // so its data (e.g. "TFR") collides with the neighboring "Tran ID"
    // column's x-range and corrupts both fields. Confirmed as a real,
    // table-wide-corrupting bug on a Federal Bank statement.
    //
    // Fix: look at the row immediately above (top halves, e.g. "Tran
    // Cheque DR") and immediately below (bottom halves, e.g. "Type Details
    // /CR") the detected single-line header row. Pair up items across those
    // two rows by x-proximity, join each pair's text ("Tran" + "Type" ->
    // "Tran Type"), and if that combined label matches a role not already
    // found, register it as a real column using the pair's x position --
    // rather than just discarding the fragment row's content.
    const above = rows[rowIndex - 1];
    const below = rows[rowIndex + 1];
    if (above && below) {
      const usedBelow = new Set<number>();
      for (const topItem of above.items) {
        let best: { item: TextItem; idx: number } | null = null;
        below.items.forEach((bottomItem, idx) => {
          if (usedBelow.has(idx)) return;
          const dx = Math.abs(bottomItem.x - topItem.x);
          if (dx <= 15 && (!best || dx < Math.abs(best.item.x - topItem.x))) {
            best = { item: bottomItem, idx };
          }
        });
        if (!best) continue;
        const combined = `${topItem.str} ${(best as { item: TextItem; idx: number }).item.str}`;
        const role = matchRole(combined);
        if (role && !matches.some((m) => m.role === role)) {
          usedBelow.add((best as { item: TextItem; idx: number }).idx);
          matches.push({
            role,
            label: combined,
            x: (topItem.x + (best as { item: TextItem; idx: number }).item.x) / 2,
          });
        }
      }
    }

    matches.sort((a, b) => a.x - b.x);
    const columns: DetectedColumn[] = matches.map((m, i) => {
      const prevX = i === 0 ? 0 : (matches[i - 1].x + m.x) / 2;
      const nextX = i === matches.length - 1 ? pageWidth : (m.x + matches[i + 1].x) / 2;
      return { role: m.role, label: m.label, xStart: prevX, xEnd: nextX };
    });

    // The bottom-half row (e.g. "Type Details /CR") is dateless and
    // amount-less, so on its own it wouldn't start a transaction block --
    // it must be treated as part of the header, not the first data row.
    let headerRowIndex = rowIndex;
    if (below && !ROW_HAS_DATE_RE.test(below.text) && !ROW_HAS_AMOUNT_RE.test(below.text)) {
      headerRowIndex = rowIndex + 1;
    }

    return { columns, headerRowIndex };
  }

  return null;
}

// Lightweight guards for header-continuation detection only -- not the
// authoritative date/amount parsing (that lives in parse-transactions.ts),
// just enough to tell "this row could not possibly be real transaction
// data" from "this might be".
const ROW_HAS_DATE_RE = /\d{1,4}[-/][A-Za-z0-9]{1,4}[-/]\d{2,4}/;
const ROW_HAS_AMOUNT_RE = /\d[\d,]*\.\d{2}/;

/** Finds which detected column a given x-coordinate falls under, if any. */
export function classifyByColumn(x: number, columns: DetectedColumn[]): DetectedColumn | null {
  return columns.find((c) => x >= c.xStart && x < c.xEnd) ?? null;
}

/**
 * Returns just the header labels found, in left-to-right order, e.g.
 * ["Date", "Value Date", "Particulars", "Tran Type", ...]. Used as a
 * secondary bank-identification signal (see bank-header-signatures.ts) --
 * some banks' statements use a distinctive enough column set/order that it
 * can help confirm or narrow down the issuing bank alongside the primary
 * text-signature detection.
 */
export function headerLabelsInOrder(header: HeaderInfo): string[] {
  return [...header.columns].sort((a, b) => a.xStart - b.xStart).map((c) => c.label.trim());
}
