import type { Transaction } from "@/lib/statement-store";

/**
 * Statement-level reconciliation.
 *
 * The parser already does this arithmetic per row -- parse-transactions.ts
 * checks whether each row's running balance equals the previous balance plus
 * the current amount, and nudges that row's confidence up or down. But it
 * discards the result immediately, so the single most useful thing for a
 * bookkeeper (does this statement actually tie out, and if not, exactly
 * where does it break?) was computed and then thrown away.
 *
 * This re-runs the same check and keeps the answer. Pure function over
 * transactions -- no parsing, no extraction, no new failure modes.
 */

/** Currency rounding noise; matches the tolerance parse-transactions uses. */
const TOLERANCE = 0.02;

export type ReconciliationResult =
  | { status: "not-applicable"; reason: string }
  | {
      status: "balanced" | "discrepancy";
      /** Balance the statement started from, implied by the first row. */
      openingBalance: number;
      /** Running balance on the final row. */
      closingBalance: number;
      /** Sum of every transaction amount. */
      netChange: number;
      /** openingBalance + netChange -- what the closing balance should be. */
      expectedClosing: number;
      /** expectedClosing - closingBalance. Zero (within tolerance) when balanced. */
      difference: number;
      /** Row pairs where the running balance doesn't follow from the previous. */
      breaks: Array<{ id: string; date: string; description: string; expected: number; actual: number }>;
      rowsChecked: number;
    };

export function reconcileTransactions(transactions: Transaction[]): ReconciliationResult {
  if (transactions.length < 2) {
    return { status: "not-applicable", reason: "Needs at least two transactions to check." };
  }

  const withBalance = transactions.filter((t) => t.balance !== null);
  if (withBalance.length < 2) {
    return {
      status: "not-applicable",
      reason: "This statement doesn't include a running balance column, so there's nothing to check against.",
    };
  }

  const first = withBalance[0];
  const last = withBalance[withBalance.length - 1];

  // The first row's balance is already post-transaction, so the opening
  // balance is that balance minus that row's own amount.
  const openingBalance = (first.balance as number) - first.amount;
  const closingBalance = last.balance as number;
  const netChange = withBalance.reduce((sum, t) => sum + t.amount, 0);
  const expectedClosing = openingBalance + netChange;
  const difference = expectedClosing - closingBalance;

  const breaks: Array<{ id: string; date: string; description: string; expected: number; actual: number }> = [];
  for (let i = 1; i < withBalance.length; i++) {
    const prev = withBalance[i - 1];
    const curr = withBalance[i];
    const expected = (prev.balance as number) + curr.amount;
    const actual = curr.balance as number;
    if (Math.abs(expected - actual) >= TOLERANCE) {
      breaks.push({
        id: curr.id,
        date: curr.date,
        description: curr.description,
        expected: Math.round(expected * 100) / 100,
        actual: Math.round(actual * 100) / 100,
      });
    }
  }

  const balanced = Math.abs(difference) < TOLERANCE && breaks.length === 0;

  return {
    status: balanced ? "balanced" : "discrepancy",
    openingBalance: Math.round(openingBalance * 100) / 100,
    closingBalance: Math.round(closingBalance * 100) / 100,
    netChange: Math.round(netChange * 100) / 100,
    expectedClosing: Math.round(expectedClosing * 100) / 100,
    difference: Math.round(difference * 100) / 100,
    breaks,
    rowsChecked: withBalance.length,
  };
}
