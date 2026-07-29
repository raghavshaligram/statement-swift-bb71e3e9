/**
 * Site-wide floating chat widget -- the standard collapsed-bubble,
 * expands-into-a-panel pattern most SaaS sites use, mounted once in the
 * root layout so it's available on every page. Explicitly NOT connected to
 * any AI/LLM API: every answer comes from plain client-side keyword
 * scoring against a curated set of real answers already established
 * across the site's own FAQs. The panel says so outright, so the familiar
 * chat-bubble presentation doesn't imply real conversational AI.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bot, MessageCircle, Send, User, X } from "lucide-react";

type Entry = { q: string; a: string; href?: string; hrefLabel?: string };

const ENTRIES: Entry[] = [
  { q: "Is my data uploaded anywhere?", a: "No. Every conversion — PDF, photo, or scan — runs entirely in your browser, on your device. Nothing is sent to a server. You can confirm this yourself by opening your browser's DevTools Network tab during a conversion and watching for outbound requests. There won't be any." },
  { q: "Do I need to sign up to use LedgerLocal?", a: "Not for PDF statements — up to 6 pages per conversion, unlimited conversions, no account needed. Signing up gets you a 10-page lifetime allowance (PDFs and photos/scans combined). Converting a photo or scanned image specifically does require a free account, since OCR takes real processing time." },
  { q: "How much does LedgerLocal cost?", a: "Free to try — 6 pages per conversion with no signup, or a 10-page lifetime allowance once you sign up. Pro is $19/month flat: unlimited conversions, no page cap, all seven export formats, no per-page fees." },
  { q: "What file formats can I export to?", a: "Excel (.xlsx), CSV, OFX, QFX, QBO, QIF, IIF, and Tally XML — covering QuickBooks Desktop, QuickBooks Online, Quicken, Xero, and Tally." },
  { q: "What banks does LedgerLocal support?", a: "23+ banks with named layout detection across the US, UK, Canada, and India — including Chase, Bank of America, Wells Fargo, Lloyds, NatWest, ICICI, HDFC, SBI, Axis, and Kotak. Any other bank's text-based PDF falls back to a generic layout parser." },
  { q: "Why is a row marked low confidence?", a: "Every extracted transaction gets a confidence score. Low-confidence rows usually come from a blurry photo, an unusual layout, or a merged/split line the parser had to make a judgment call on — worth checking that specific row against the original statement before exporting." },
  { q: "Can I convert a scanned or photographed statement?", a: "Yes — LedgerLocal falls back to on-device OCR automatically for scans and photos (JPG, PNG, WEBP), and for any PDF page with no real text layer. This does require a free account, unlike text-based PDF conversion." },
  { q: "Will the dates come out right?", a: "LedgerLocal infers the real date order (DD/MM/YYYY vs MM/DD/YYYY) from the statement itself rather than assuming one, and normalises output dates to ISO (YYYY-MM-DD) by default — a format Excel reads unambiguously regardless of your regional settings." },
  { q: "Can I combine statements from different banks in one export?", a: "Yes. Drop PDFs from multiple banks into the same batch — LedgerLocal detects each one and processes them together into a single export." },
  { q: "How do I cancel or change my Pro subscription?", a: "From your account's Billing page. If you can't find that option or something looks wrong, send us a message via Contact and we'll sort it out directly.", href: "/contact", hrefLabel: "Contact us" },
  { q: "Why does QuickBooks Desktop need an IIF or QBO file instead of a CSV?", a: "QuickBooks Desktop has no built-in way to import a CSV or Excel file of transactions at all — confirmed directly via Intuit's own support community. IIF and QBO are the real paths in.", href: "/csv-to-iif", hrefLabel: "CSV to IIF guide" },
  { q: "Why does my QFX file stop importing into Quicken?", a: "Quicken ties QFX import to your software version's age — once it's roughly three years old, QFX downloads stop being accepted, forcing an upgrade. Converting to CSV sidesteps that limit entirely.", href: "/qfx-to-csv", hrefLabel: "QFX to CSV guide" },
  { q: "What's the difference between QIF, QFX, and OFX for Quicken?", a: "QIF is the only one of the three that carries categories and split transactions into Quicken — QFX and OFX both drop category data entirely.", href: "/csv-to-qif", hrefLabel: "CSV to QIF guide" },
  { q: "Does any bank export directly to Tally XML?", a: "No — it isn't one of the formats banks offer at all (CSV, Excel, OFX, QIF, and QBO cover almost everyone's native export list, but never Tally). Converting a PDF statement is the real path in.", href: "/bank-statement-to-tally", hrefLabel: "Bank statement to Tally guide" },
  { q: "What is a QBO file, and how is it different from IIF?", a: "QBO is QuickBooks' Web Connect format, built on the same underlying structure as OFX — it imports as a live bank-feed match on both QuickBooks Desktop and Online. IIF is a QuickBooks Desktop-only format with simpler, unmatched transaction entries.", href: "/qbo-to-csv", hrefLabel: "QBO to CSV guide" },
  { q: "How accurate is converting a photo of a statement?", a: "It depends on the photo — a clean, well-lit, straight-on scan reads nearly as well as a real PDF. Blur, poor lighting, or an angled shot increases how many rows get flagged as low-confidence, which is why every row is scored rather than silently accepted.", href: "/image-to-excel", hrefLabel: "Image to Excel guide" },
  { q: "How do I contact support or report a statement that isn't converting?", a: "Head to our Contact page — you can attach the actual statement that's giving you trouble, which helps us diagnose it much faster than a description alone.", href: "/contact", hrefLabel: "Contact us" },
];

const STARTER_QUESTIONS = [
  "Is my data uploaded anywhere?",
  "How much does it cost?",
  "What banks are supported?",
  "What formats can I export to?",
];

const FALLBACK =
  "I don't have an article on that specific question yet. Head to Contact with a bit more detail and we'll get back to you directly.";

const GREETING = "Hi there! Ask me a question about converting statements, pricing, security, or export formats — or tap one of the suggestions below.";
const GREETING_WORDS = new Set(["hi", "hello", "hey", "hiya", "yo", "sup", "howdy", "hola"]);

// Naive .includes() matching was scoring false hits from short query words
// appearing as substrings of unrelated words (e.g. "hi" matching inside
// "this", "nothing", "watching") -- a real, confirmed bug, not a hypothetical
// one. Word-boundary matching only counts a real, whole-word match.
function hasWord(haystack: string, word: string): boolean {
  return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(haystack);
}

function score(entry: Entry, queryWords: string[]): number {
  const haystackA = entry.a.toLowerCase();
  const haystackQ = entry.q.toLowerCase();
  let s = 0;
  for (const w of queryWords) {
    if (hasWord(haystackQ, w)) s += 3;
    else if (hasWord(haystackA, w)) s += 1;
  }
  return s;
}

// A real match needs at least one whole-word hit against the FAQ's own
// question (score 3+) -- a couple of stray 1-point body-text hits alone
// isn't enough confidence to hand back an answer.
const MIN_MATCH_SCORE = 3;

function bestMatch(query: string): Entry | null {
  const words = query.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return null;
  const ranked = ENTRIES.map((e) => ({ entry: e, s: score(e, words) }))
    .filter((r) => r.s >= MIN_MATCH_SCORE)
    .sort((a, b) => b.s - a.s);
  return ranked[0]?.entry ?? null;
}

type Message = { role: "assistant" | "user"; text: string; href?: string; hrefLabel?: string };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I can answer common questions about converting statements, pricing, security, and export formats. Ask me anything, or tap a question below to get started.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    const isGreeting = GREETING_WORDS.has(trimmed.toLowerCase().replace(/[!.?]+$/, ""));
    const match = isGreeting ? null : bestMatch(trimmed);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      isGreeting
        ? { role: "assistant", text: GREETING }
        : match
          ? { role: "assistant", text: match.a, href: match.href, hrefLabel: match.hrefLabel }
          : { role: "assistant", text: FALLBACK },
    ]);
    setInput("");
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:w-96">
          <div className="flex items-center justify-between gap-2.5 border-b border-border px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-soft">
                <Bot className="h-4 w-4 text-emerald" />
              </div>
              <div>
                <div className="text-sm font-bold text-ink">Ledger Assistant</div>
                <div className="text-[11px] text-muted-foreground">Matched from our help articles — not AI</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-surface-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    m.role === "user" ? "bg-ink" : "bg-emerald-soft"
                  }`}
                >
                  {m.role === "user" ? <User className="h-3 w-3 text-background" /> : <Bot className="h-3 w-3 text-emerald" />}
                </div>
                <div
                  className={`max-w-[82%] rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === "user" ? "bg-ink text-background" : "bg-surface-muted text-ink"
                  }`}
                >
                  {m.text}
                  {m.href && (
                    <Link to={m.href} className="mt-1.5 block text-xs font-semibold text-emerald hover:underline">
                      {m.hrefLabel} →
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-ink transition hover:border-emerald/50 hover:text-emerald"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 border-t border-border p-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-emerald"
            />
            <button
              type="submit"
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-background transition hover:bg-ink/90"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-background shadow-xl transition hover:bg-ink/90"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
