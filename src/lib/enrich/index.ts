/**
 * Enrichment pass.
 *
 * One place where payee, payment method and category get derived, called from
 * every transaction assembly site (PDF, CSV, OFX, QIF, IIF, MT940) so all six
 * input formats behave identically. Deriving it here rather than in each
 * parser keeps the format parsers doing one job.
 *
 * Purely additive: `description` is never modified. Everything here is a new
 * field alongside it, and every one is reversible by reading the raw
 * description back.
 */

import { extractPayee } from "./extract-payee";
import { categorize, type CategoryResolver } from "./categorize";
import type { Transaction } from "../statement-store";

/**
 * A transaction before enrichment has run. The format parsers build this shape
 * -- requiring them to stub `payee: ""` and `category: null` just to satisfy
 * the type would be noise, and a stub that accidentally survived would be a
 * silent bug.
 */
export type UnenrichedTransaction = Omit<
  Transaction,
  "payee" | "paymentMethod" | "category" | "categoryConfidence"
>;

export type { Category, CategoryResult, CategoryResolver } from "./categorize";
export type { PayeeParts } from "./extract-payee";
export { extractPayee } from "./extract-payee";
export { categorize, measureCoverage } from "./categorize";

/**
 * Derives payee/method/category for one transaction.
 *
 * Synchronous and pure -- no network, no model, no device capability check.
 * That is what lets it run inside the existing parse pipeline without adding
 * a loading state or an await to any of the six call sites.
 */
export function enrichTransaction(
  t: UnenrichedTransaction,
  resolver?: CategoryResolver
): Transaction {
  const { payee, method } = extractPayee(t.description);
  const { category, confidence } = categorize(t.description, t.amount, resolver);
  return {
    ...t,
    payee,
    paymentMethod: method,
    category,
    categoryConfidence: confidence,
  };
}

export function enrichTransactions(
  transactions: UnenrichedTransaction[],
  resolver?: CategoryResolver
): Transaction[] {
  return transactions.map((t) => enrichTransaction(t, resolver));
}
