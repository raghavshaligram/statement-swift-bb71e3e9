/**
 * Canonical site origin.
 *
 * Previously hardcoded in three TypeScript files and two static ones, which
 * meant a domain change was a hunt rather than an edit. Every runtime
 * reference now comes from here.
 *
 * NOT covered, because they are static files served as-is: public/robots.txt
 * and public/llms.txt. Both contain absolute URLs and must be updated with a
 * find-and-replace alongside this constant. scripts/link-check.ts warns if
 * llms.txt stops matching the sitemap, which catches the llms.txt half.
 *
 * Changing domain also means: updating the deployment's custom domain, adding
 * 301 redirects from the old host if it was ever indexed, and resubmitting the
 * sitemap in Search Console. The constant is the easy part.
 */
export const SITE_ORIGIN = "https://ledgerlocal.com";

/** Bare host, for copy that shouldn't show a scheme. */
export const SITE_HOST = SITE_ORIGIN.replace(/^https?:\/\//, "");

/** Builds an absolute URL from a route path. */
export function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}
