/**
 * Shared pdf.js document-open helper.
 *
 * Ported from PDFMacro (counsel-s-lovable, src/lib/pdf/pdf-open.ts), where
 * this has been shipping and debugged in production. Adapted here to use
 * BalanceExtract's own loadPdfJs loader rather than PDFMacro's worker module.
 *
 * Solves a real gap: BalanceExtract previously reported one vague message --
 * "It may be password-protected, scanned/image-only, or corrupted" -- for
 * three completely different failures, and had no way to actually open a
 * password-protected PDF at all. That's a hard blocker for Indian bank
 * statements in particular (ICICI, HDFC, SBI routinely email statements
 * locked with a DOB/PAN-derived password).
 *
 * Decryption happens inside pdf.js, in the browser, so this changes nothing
 * about the on-device privacy guarantee -- the file and its password never
 * leave the machine.
 */
import { loadPdfJs } from "@/lib/pdf/extract-text";

export class EncryptedPdfError extends Error {
  constructor(message = "This PDF is password-protected.") {
    super(message);
    this.name = "EncryptedPdfError";
  }
}

export class MalformedPdfError extends Error {
  constructor(message = "This PDF appears to be corrupted or unreadable.") {
    super(message);
    this.name = "MalformedPdfError";
  }
}

export type PasswordPrompt = (
  reason: "needPassword" | "incorrectPassword",
) => Promise<string | null> | string | null;

export interface OpenPdfjsOpts {
  /** Called when the PDF is encrypted. Return a password to retry, or null
   *  to cancel (which raises EncryptedPdfError). Defaults to window.prompt. */
  onPassword?: PasswordPrompt;
  /** Known password, collected by in-app UI. Preferred over onPassword. */
  password?: string;
  /** Extra parameters forwarded to pdfjs.getDocument. */
  extra?: Record<string, unknown>;
}

// NOTE: there is deliberately no default prompt. A browser window.prompt is
// poor UX, and it let the flow continue past an unanswered prompt straight
// into parsing. Callers supply the password via `password`, collected by real
// in-app UI; an encrypted file with no password raises EncryptedPdfError so
// the caller can stop and ask properly.

/**
 * Open a PDF with pdf.js, handling encryption and malformed input cleanly.
 * Every path that opens a PDF should go through this -- calling
 * getDocument directly leaks PasswordException as an uncaught error on the
 * main thread.
 */
export async function openPdfjs(
  data: Uint8Array | ArrayBuffer,
  opts: OpenPdfjsOpts = {},
) {
  const pdfjsLib = await loadPdfJs();
  const task = pdfjsLib.getDocument({
    data: data instanceof Uint8Array ? data : new Uint8Array(data),
    ...(opts.password ? { password: opts.password } : {}),
    ...(opts.extra ?? {}),
  });

  // Only install an onPassword handler when a caller explicitly supplies
  // one. Installing it unconditionally and then destroy()-ing the task on
  // cancel made the promise reject with a *destroy* error rather than
  // pdf.js's PasswordException -- which silently defeated encryption
  // detection. Left alone, pdf.js rejects with PasswordException, which maps
  // cleanly to EncryptedPdfError below.
  if (opts.onPassword) {
    const prompt = opts.onPassword;
    const anyTask = task as unknown as {
      onPassword?: (updateCallback: (pw: string) => void, reason: number) => void;
      destroy?: () => void;
    };
    // pdf.js reason codes: 1 = needs a password, 2 = the one given was wrong.
    anyTask.onPassword = (updateCallback, reason) => {
      Promise.resolve(prompt(reason === 2 ? "incorrectPassword" : "needPassword"))
        .then((pw) => {
          if (pw == null || pw === "") {
            try { anyTask.destroy?.(); } catch { /* noop */ }
            return;
          }
          updateCallback(pw);
        })
        .catch(() => {
          try { anyTask.destroy?.(); } catch { /* noop */ }
        });
    };
  }

  try {
    return await task.promise;
  } catch (err) {
    const name = (err as { name?: string })?.name ?? "";
    const message = (err as { message?: string })?.message ?? String(err);
    if (name === "PasswordException" || /password/i.test(message)) {
      throw new EncryptedPdfError();
    }
    if (
      name === "InvalidPDFException" ||
      name === "MissingPDFException" ||
      name === "UnexpectedResponseException" ||
      /invalid pdf|corrupt|malformed/i.test(message)
    ) {
      throw new MalformedPdfError();
    }
    throw err;
  }
}

/** True when the error is one of the graceful cases worth showing the user
 *  a specific, actionable message for. */
export function isFriendlyPdfError(err: unknown): err is EncryptedPdfError | MalformedPdfError {
  return err instanceof EncryptedPdfError || err instanceof MalformedPdfError;
}

/**
 * Returns true if the PDF needs a password, without prompting for one.
 * Lets the caller collect a password up front rather than discovering the
 * problem midway through a parse.
 */
export async function isPdfEncrypted(file: File): Promise<boolean> {
  try {
    // Fail-open with a hard timeout. This probe opens the PDF a second time,
    // and if it ever fails to settle it would hang the whole upload -- which
    // it did, silently blocking normal uploads entirely. A probe is a
    // convenience for showing the unlock panel up front; it must never be
    // able to stop a file being processed. If it doesn't answer quickly we
    // assume "not encrypted" and let the real parse decide, since that path
    // raises EncryptedPdfError properly anyway.
    const probe = (async () => {
      const doc = await openPdfjs(await file.arrayBuffer(), { onPassword: () => null });
      // Release the worker document -- leaving these open leaks pdf.js
      // resources across a multi-file batch.
      try {
        await (doc as unknown as { destroy?: () => Promise<void> }).destroy?.();
      } catch {
        /* noop */
      }
      return false;
    })();
    const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 4000));
    return await Promise.race([probe, timeout]);
  } catch (err) {
    if (err instanceof EncryptedPdfError) return true;
    return false;
  }
}
