import { useState } from "react";
import { SITE_ORIGIN } from "@/lib/site";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Paperclip, ShieldAlert } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const ISSUE_TYPES = [
  "A statement isn't converting correctly",
  "Refund request",
  "Billing or account question",
  "Sign-in or account access",
  "Feature request",
  "Something else",
];

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024; // 15 MB

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>): { issue?: string } => ({
    issue: typeof search.issue === "string" ? search.issue : undefined,
  }),
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/contact` }],
    meta: [
      { title: "Contact Us — BalanceExtract" },
      {
        name: "description",
        content:
          "Get help with a statement that isn't converting correctly, a billing question, or anything else — search our help articles or reach the team directly.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const { issue } = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [issueType, setIssueType] = useState(
    issue && ISSUE_TYPES.includes(issue) ? issue : ISSUE_TYPES[0],
  );
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [consentToUpload, setConsentToUpload] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const needsConsent = file !== null;
  const canSubmit =
    email.trim() !== "" && message.trim() !== "" && (!needsConsent || consentToUpload);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      let attachmentPath: string | null = null;

      if (file) {
        // Attachments are stored per-user under a folder named after the
        // user's id -- storage policies only allow a signed-in user to write
        // to (and read) their own folder, so an anonymous visitor cannot
        // upload arbitrary files to the bucket at all.
        if (!user) {
          throw new Error(
            "Please sign in to attach a file, or send the message without an attachment.",
          );
        }
        if (file.size > MAX_ATTACHMENT_BYTES) {
          throw new Error(
            "That file is larger than 15 MB — please attach a smaller file or split it up.",
          );
        }
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("support-attachments")
          .upload(path, file);
        if (uploadError) throw uploadError;
        attachmentPath = path;
      }


      const { error: insertError } = await supabase.from("contact_submissions").insert({
        name: name.trim() || null,
        email: email.trim(),
        issue_type: issueType,
        message: message.trim(),
        attachment_path: attachmentPath,
        user_id: user?.id ?? null,
      });
      if (insertError) throw insertError;

      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong sending your message. Please try again.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border py-16 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Contact us</h1>
          <p className="mt-4 text-muted-foreground">
            Try the chat bubble in the corner for quick questions, or send us a message directly
            below — including a statement that isn't converting correctly, if that's what's going
            on.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            Still need help? Send us a message
          </h2>

          {status === "done" ? (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald/30 bg-emerald-soft/40 p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald" />
              <div>
                <div className="font-semibold text-ink">Message sent</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Thanks — we'll get back to you at the email you provided.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="text-sm font-semibold text-ink">
                    Name <span className="font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="text-sm font-semibold text-ink">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="issueType" className="text-sm font-semibold text-ink">
                  What's this about?
                </label>
                <select
                  id="issueType"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald"
                >
                  {ISSUE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="text-sm font-semibold text-ink">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    issueType === ISSUE_TYPES[0]
                      ? "What does the statement look like, and what's coming out wrong? The more specific, the faster we can help."
                      : "How can we help?"
                  }
                  className="mt-1.5 w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  Attach a statement{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1.5 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
                />

                {file && (
                  <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <label className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={consentToUpload}
                        onChange={(e) => setConsentToUpload(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0"
                      />
                      <span>
                        Unlike converting a statement, which never leaves your device, this file{" "}
                        <strong>will</strong> be uploaded to our support team specifically to help
                        diagnose the issue. I understand and want to attach it anyway.
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {status === "error" && errorMessage && (
                <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit || status === "submitting"}
                className="inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-semibold text-background transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "submitting" ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
