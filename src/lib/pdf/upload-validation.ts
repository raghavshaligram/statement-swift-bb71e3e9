/**
 * Shared upload validation -- page-limit + sign-in checks, used by both
 * real upload entry points (upload.tsx, HeroUploadCard in index.tsx).
 * Deliberately factored out into one place: this exact kind of logic
 * living separately in two files is what caused two real bugs earlier
 * this session (a stale file-type filter in one location that never got
 * updated when the other one did). One function, one source of truth.
 *
 * Free-tier model, resolved after checking real competitor practice
 * directly (CapyParse, DocuClipper, bankstatementconverter.com,
 * usstatementconverter.com all use a cumulative pool -- lifetime or
 * monthly -- never "unlimited separate conversions, each capped
 * individually," which is what this app's PDF path was doing before this
 * fix):
 *
 *   - Anonymous: 6 pages per PDF, checked per-file, NO persistent
 *     tracking -- there's no stable identity to track against without
 *     requiring sign-in, and this tier is deliberately kept as a
 *     no-friction "try it instantly" hook (CapyParse itself has a
 *     separate, even-stricter daily-reset anonymous demo tier alongside
 *     its real account-based lifetime pool).
 *   - Signed in, Free: ONE shared lifetime pool of 10 pages, covering
 *     BOTH PDF pages and image conversions combined -- matching
 *     CapyParse's real free tier exactly ("10 pages, lifetime, no
 *     expiry," no distinction by file type). Enforced server-side via a
 *     Postgres RPC (increment_page_usage), not just a client-side check,
 *     since a client-only check can't actually stop someone from calling
 *     Supabase directly to bypass it. The RPC is atomic (row-locked), so
 *     two simultaneous uploads from the same user (e.g. two open tabs)
 *     can't both succeed past the limit by racing each other.
 *   - Pro: unlimited pages, unlimited conversions, no tracking needed.
 *
 * Format-conversion files (IIF/CSV/OFX/QFX/QIF/MT940) remain fully
 * exempt, per the pricing decision from an earlier session -- structured
 * text parsing is cheap to run and the real competitive norm for that
 * category is free/unlimited, unlike PDF/image parsing.
 */

import { getPdfPageCount, isPageLimitExempt } from "./extract-text";
import { EncryptedPdfError } from "@/lib/pdf/pdf-open";
import { ANONYMOUS_MAX_PAGES, SIGNED_IN_MAX_PAGES } from "../pricing-constants";
import { supabase } from "@/integrations/supabase/client";


/**
 * Page counting opens the PDF, so an encrypted file raises EncryptedPdfError
 * here -- before parsing ever runs. That's not a validation failure: the user
 * simply hasn't entered the password yet, and parseStatementFile handles that
 * case properly with a real prompt. Returning null lets validation skip the
 * page check and hand off to parsing, instead of the error escaping as an
 * uncaught rejection (which is exactly what it did before this).
 */
async function safePageCount(file: File): Promise<number | null> {
  try {
    return await getPdfPageCount(file);
  } catch (err) {
    if (err instanceof EncryptedPdfError) return null;
    throw err;
  }
}

const IMAGE_EXT_RE = /\.(jpe?g|png|webp)$/i;

function isImageFile(f: File): boolean {
  return f.type.startsWith("image/") || IMAGE_EXT_RE.test(f.name);
}

export type UploadValidation =
  | { ok: true }
  | { ok: false; message: string; requiresSignIn: boolean };

export async function validateUploadBatch(files: File[], isSignedIn: boolean): Promise<UploadValidation> {
  const images = files.filter((f) => isImageFile(f) && !isPageLimitExempt(f));
  const pdfs = files.filter((f) => !isImageFile(f) && !isPageLimitExempt(f));

  if (images.length > 0 && !isSignedIn) {
    return {
      ok: false,
      requiresSignIn: true,
      message:
        images.length === 1
          ? "Sign up free to convert a photo or scanned image."
          : `Sign up free to convert photos or scanned images (${images.length} in this batch).`,
    };
  }

  if (!isSignedIn) {
    // Anonymous: PDFs only at this point (images already required sign-in
    // above). Per-file check only, no lifetime tracking -- the "try it
    // instantly" hook.
    for (const pdf of pdfs) {
      const pages = await safePageCount(pdf);
      if (pages === null) continue;
      if (pages > ANONYMOUS_MAX_PAGES) {
        return {
          ok: false,
          requiresSignIn: false,
          message: `${pdf.name} is too large for the free demo (${pages} pages, limit ${ANONYMOUS_MAX_PAGES}). Sign up free for a higher limit, or upgrade to Pro for no limit at all.`,
        };
      }
    }
    return { ok: true };
  }

  // Signed in: PDFs and images share one lifetime pool.
  const pdfPageCounts = await Promise.all(pdfs.map(async (f) => ({ file: f, pages: await safePageCount(f) ?? 0 })));

  // A single file bigger than the entire lifetime allowance gets a clearer,
  // more specific message than a generic "limit reached" would.
  const tooLargeAlone = pdfPageCounts.find((p) => p.pages > SIGNED_IN_MAX_PAGES);
  if (tooLargeAlone) {
    return {
      ok: false,
      requiresSignIn: false,
      message: `${tooLargeAlone.file.name} has ${tooLargeAlone.pages} pages -- more than your entire ${SIGNED_IN_MAX_PAGES}-page lifetime free allowance on its own. Upgrade to Pro for unlimited pages.`,
    };
  }

  const totalCost = pdfPageCounts.reduce((sum, p) => sum + p.pages, 0) + images.length;
  if (totalCost === 0) return { ok: true };

  // Real server-side check: atomically verifies remaining lifetime quota
  // and reserves it in the same call, rather than trusting a client-side
  // count that could just be skipped by calling Supabase directly.
  const { data: allowed, error } = await supabase.rpc("increment_page_usage", {
    p_count: totalCost,
    p_limit: SIGNED_IN_MAX_PAGES,
  });

  if (error) {
    // Fail closed on a real error (not "limit reached", but something
    // actually broke -- e.g. the migration hasn't been run yet) rather
    // than silently letting the upload through unchecked.
    return {
      ok: false,
      requiresSignIn: false,
      message: "Couldn't verify your conversion quota right now. Please try again in a moment.",
    };
  }

  if (!allowed) {
    return {
      ok: false,
      requiresSignIn: false,
      message: `You've used your free lifetime allowance (${SIGNED_IN_MAX_PAGES} pages, PDFs and images combined). Upgrade to Pro for unlimited pages and conversions.`,
    };
  }

  return { ok: true };
}
