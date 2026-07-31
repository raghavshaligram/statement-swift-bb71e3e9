/**
 * Shared pdf.js document-open helper.
 *
 * Ported from PDFMacro (counsel-s-lovable, src/lib/pdf/pdf-open.ts), where
 * this has been shipping and debugged in production. Adapted here to use
 * LedgerLocal's own loadPdfJs loader rather than PDFMacro's worker module.
 *
 * Solves a real gap: LedgerLocal previously reported one vague message --
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
  /** Extra parameters forwarded to pdfjs.getDocument. */
  extra?: Record<string, unknown>;
}

const defaultPrompt: PasswordPrompt = (reason) => {
  if (typeof window === "undefined") return null;
  const msg =
    reason === "incorrectPassword"
      ? "Incorrect password — try again:"
      : "This PDF is password-protected. Enter the password:";
  return window.prompt(msg) ?? null;
};

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
  const prompt = opts.onPassword ?? defaultPrompt;
  const task = pdfjsLib.getDocument({
    data: data instanceof Uint8Array ? data : new Uint8Array(data),
    ...(opts.extra ?? {}),
  });

  const anyTask = task as unknown as {
    onPassword?: (updateCallback: (pw: string) => void, reason: number) => void;
    destroy?: () => void;
    promise: Promise<unknown>;
  };

  // pdf.js reason codes: 1 = needs a password, 2 = the one supplied was wrong.
  anyTask.onPassword = (updateCallback, reason) => {
    Promise.resolve(prompt(reason === 2 ? "incorrectPassword" : "needPassword"))
      .then((pw) => {
        if (pw == null || pw === "") {
          // Cancelled: destroy the task so its promise rejects rather than
          // hanging forever waiting for a password that isn't coming.
          try {
            anyTask.destroy?.();
          } catch {
            /* noop */
          }
          return;
        }
        updateCallback(pw);
      })
      .catch(() => {
        try {
          anyTask.destroy?.();
        } catch {
          /* noop */
        }
      });
  };

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
