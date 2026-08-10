/**
 * Page-per-statement limits, per the real product model (confirmed directly
 * against CapyParse's actual free tier): no monthly/total conversion cap
 * ever, on any tier -- "unlimited conversions" is real and applies
 * everywhere. What's capped is pages PER STATEMENT, and that cap depends on
 * whether the user is signed in:
 *
 *   - Not signed in: 6 pages per statement (matches CapyParse's real limit)
 *   - Signed in (free account): 10 pages per statement
 *   - Pro: unlimited pages per statement
 *
 * ENFORCEMENT STATUS: there is no real auth/session system yet (login is
 * being built separately). Until that exists, there is no way to tell
 * "signed in" from "not signed in" at all, so ANONYMOUS_MAX_PAGES is the
 * only limit actually enforced anywhere right now (see upload.tsx and
 * hero-demo.tsx) -- SIGNED_IN_MAX_PAGES is defined here so the moment real
 * auth state exists, wiring in the higher limit for signed-in users is a
 * small, obvious change, not a redesign.
 */
export const ANONYMOUS_MAX_PAGES = 6;
export const SIGNED_IN_MAX_PAGES = 10;

/** @deprecated use ANONYMOUS_MAX_PAGES or SIGNED_IN_MAX_PAGES explicitly -- kept temporarily so nothing importing the old name breaks mid-refactor. */
export const FREE_TIER_MAX_PAGES = ANONYMOUS_MAX_PAGES;

/**
 * Lifetime Pro price, USD. Single source of truth for display -- the
 * amount PayPal actually charges is hardcoded server-side in
 * supabase/functions/paypal-create-order, independently, since a client
 * could otherwise tamper with whatever number this constant holds. Keep
 * both in sync by hand when the price changes; there are only two places.
 */
export const LIFETIME_PRICE_USD = 79;
