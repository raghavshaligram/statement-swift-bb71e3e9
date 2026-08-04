import { Link } from "@tanstack/react-router";

/**
 * Our own pricing, stated plainly, for use on comparison pages.
 *
 * These are first-party figures we control and can always stand behind, which
 * is exactly why they belong on the page while competitors' do not. The
 * editorial rule on those pages is "don't publish a competitor's price we
 * can't verify" -- it was never "hide ours".
 *
 * The claim that actually differentiates is structural rather than numeric:
 * every competitor in this space meters by page, so their cost scales with
 * usage and ours doesn't. That framing survives a competitor changing their
 * prices next week, whereas "cheaper than X" doesn't.
 *
 * If pricing changes, this component and src/routes/pricing.tsx must change
 * together -- they are the two places a number appears.
 */
export function PricingCallout({ competitorModel }: { competitorModel: string }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-4">
      <div className="rounded-2xl border border-emerald/30 bg-emerald-soft/40 p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald">
          What LedgerLocal costs
        </div>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-bold text-ink">$19</span>
              <span className="text-sm text-muted-foreground">/ month · flat</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-ink">Unlimited pages</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Not a large allowance — no page limit at all. The same $19 whether you convert ten
              pages this month or ten thousand. All seven export formats included.
            </p>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-bold text-ink">$0</span>
              <span className="text-sm text-muted-foreground">to try</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-ink">No signup for the first 6 pages</p>
            <p className="mt-1 text-sm text-muted-foreground">
              6 pages per conversion with no account and no persistent tracking, or 10 pages as a
              lifetime pool once you sign up. No credit card on Free, ever.
            </p>
          </div>
        </div>

        <p className="mt-5 border-t border-emerald/20 pt-4 text-sm text-ink/80">
          {competitorModel} That means their bill grows as your workload does. Ours doesn&apos;t —
          which is the whole reason we price this way.
        </p>

        <Link
          to="/pricing"
          className="mt-4 inline-block text-sm font-semibold text-emerald hover:underline"
        >
          See the full pricing comparison →
        </Link>
      </div>
    </div>
  );
}
