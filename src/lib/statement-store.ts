import { create } from "zustand";
import type { Category } from "./enrich/categorize";

export type Transaction = {
  id: string;
  date: string; // ISO YYYY-MM-DD when parseable, else raw string
  description: string;
  amount: number; // signed: positive = credit, negative = debit
  balance: number | null; // null when a running balance wasn't found on that row
  sourceFile: string;
  sourcePage: number;
  confidence: number; // 0-99, never 100 (never claim certainty from a heuristic) -- see confidence.ts for tier bucketing
  sourceLines: string[]; // raw PDF text lines that produced this transaction, for the side-by-side review view
  // Optional fields, only populated when the statement's own header row has
  // a distinct column for them (confirmed via a real sample statement) --
  // null when the statement doesn't have that column at all.
  valueDate: string | null;
  tranType: string | null;
  tranId: string | null;
  chequeDetails: string | null;
  // Always computable from the amount's sign, regardless of whether the
  // statement has its own explicit DR/CR column.
  drCr: "Dr" | "Cr";
  // Derived by src/lib/enrich, never parsed from the statement. `description`
  // stays the bank's own text verbatim; these are additive readable fields on
  // top of it. Always populated (enrichment runs at every assembly site), so
  // no optionality -- `payee` falls back to the cleaned description and
  // `category` is null when no rule matched, which the review screen flags.
  payee: string;
  paymentMethod: string | null;
  category: Category | null;
  categoryConfidence: number; // 0-99, 0 when uncategorised
};

export type ParsedStatement = {
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  detectedBank: string | null; // e.g. "Chase", "HDFC Bank", or null if unrecognized
  currency: string | null; // ISO code (e.g. "INR", "USD"), or null if undetected -- never assume USD
  transactions: Transaction[];
  warnings: string[];
};

type Phase = "idle" | "processing" | "done" | "error";

type StatementStore = {
  phase: Phase;
  pendingFiles: File[];
  currentFileIndex: number;
  currentPage: number;
  totalPagesAcrossFiles: number;
  statements: ParsedStatement[];
  errorMessage: string | null;

  setPendingFiles: (files: File[]) => void;
  clearPendingFiles: () => void;
  removePendingFile: (index: number) => void;

  startProcessing: () => void;
  setProgress: (fileIndex: number, page: number, totalPages: number) => void;
  finishProcessing: (statements: ParsedStatement[]) => void;
  failProcessing: (message: string) => void;

  updateTransaction: (fileName: string, id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (fileName: string, id: string) => void;

  reset: () => void;
};

export const useStatementStore = create<StatementStore>((set) => ({
  phase: "idle",
  pendingFiles: [],
  currentFileIndex: 0,
  currentPage: 0,
  totalPagesAcrossFiles: 0,
  statements: [],
  errorMessage: null,

  setPendingFiles: (files) => set((s) => ({ pendingFiles: [...s.pendingFiles, ...files] })),
  clearPendingFiles: () => set({ pendingFiles: [] }),
  removePendingFile: (index) =>
    set((s) => ({ pendingFiles: s.pendingFiles.filter((_, i) => i !== index) })),

  startProcessing: () => set({ phase: "processing", currentFileIndex: 0, currentPage: 0, errorMessage: null }),
  setProgress: (fileIndex, page, totalPages) =>
    set({ currentFileIndex: fileIndex, currentPage: page, totalPagesAcrossFiles: totalPages }),
  finishProcessing: (statements) => set({ phase: "done", statements }),
  failProcessing: (message) => set({ phase: "error", errorMessage: message }),

  updateTransaction: (fileName, id, patch) =>
    set((s) => ({
      statements: s.statements.map((st) =>
        st.fileName !== fileName
          ? st
          : { ...st, transactions: st.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) }
      ),
    })),

  deleteTransaction: (fileName, id) =>
    set((s) => ({
      statements: s.statements.map((st) =>
        st.fileName !== fileName ? st : { ...st, transactions: st.transactions.filter((t) => t.id !== id) }
      ),
    })),

  reset: () =>
    set({
      phase: "idle",
      pendingFiles: [],
      currentFileIndex: 0,
      currentPage: 0,
      totalPagesAcrossFiles: 0,
      statements: [],
      errorMessage: null,
    }),
}));

/** Flattened view of every transaction across all parsed statements, for the preview/export screens. */
export function useAllTransactions() {
  return useStatementStore((s) => s.statements.flatMap((st) => st.transactions));
}
