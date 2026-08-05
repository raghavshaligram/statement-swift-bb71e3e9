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
  { q: "Is my data uploaded anywhere? What about security and privacy?", a: "No. Every conversion — PDF, photo, or scan — runs entirely in your browser, on your device. Nothing is sent to a server. You can confirm this yourself by opening your browser's DevTools Network tab during a conversion and watching for outbound requests. There won't be any." },
  { q: "Do I need to sign up to use BalanceExtract?", a: "Not for PDF statements — up to 6 pages per conversion, unlimited conversions, no account needed. Signing up gets you a 10-page lifetime allowance total (PDFs and photos/scans combined, not per conversion). Converting a photo or scanned image specifically does require a free account, since OCR takes real processing time." },
  { q: "How much does BalanceExtract cost? What is the price, and what are the pricing plans?", a: "Free to try — 6 pages per conversion with no signup, or a 10-page lifetime allowance total once you sign up (that's a cumulative pool across every statement, not 10 pages each time). Pro is $19/month flat: unlimited conversions, no page cap, all seven export formats, no per-page fees." },
  { q: "What file formats can I export to?", a: "Excel (.xlsx), CSV, OFX, QFX, QBO, QIF, IIF, and Tally XML — covering QuickBooks Desktop, QuickBooks Online, Quicken, Xero, and Tally." },
  { q: "What banks does BalanceExtract support?", a: "23+ banks with named layout detection across the US, UK, Canada, and India — including Chase, Bank of America, Wells Fargo, Lloyds, NatWest, ICICI, HDFC, SBI, Axis, and Kotak. Any other bank's text-based PDF falls back to a generic layout parser." },
  { q: "Why is a row marked low confidence?", a: "Every extracted transaction gets a confidence score. Low-confidence rows usually come from a blurry photo, an unusual layout, or a merged/split line the parser had to make a judgment call on — worth checking that specific row against the original statement before exporting." },
  { q: "Can I convert a scanned or photographed statement?", a: "Yes — BalanceExtract falls back to on-device OCR automatically for scans and photos (JPG, PNG, WEBP), and for any PDF page with no real text layer. This does require a free account, unlike text-based PDF conversion." },
  { q: "Will the dates come out right?", a: "BalanceExtract infers the real date order (DD/MM/YYYY vs MM/DD/YYYY) from the statement itself rather than assuming one, and normalises output dates to ISO (YYYY-MM-DD) by default — a format Excel reads unambiguously regardless of your regional settings." },
  { q: "Can I combine statements from different banks in one export?", a: "Yes. Drop PDFs from multiple banks into the same batch — BalanceExtract detects each one and processes them together into a single export." },
  { q: "How do I cancel or change my Pro subscription?", a: "From your account's Billing page. If you can't find that option or something looks wrong, send us a message via Contact and we'll sort it out directly.", href: "/contact", hrefLabel: "Contact us" },
  { q: "Why does QuickBooks Desktop need an IIF or QBO file instead of a CSV?", a: "QuickBooks Desktop has no built-in way to import a CSV or Excel file of transactions at all — confirmed directly via Intuit's own support community. IIF and QBO are the real paths in.", href: "/csv-to-iif", hrefLabel: "CSV to IIF guide" },
  { q: "Why does my QFX file stop importing into Quicken?", a: "Quicken ties QFX import to your software version's age — once it's roughly three years old, QFX downloads stop being accepted, forcing an upgrade. Converting to CSV sidesteps that limit entirely.", href: "/qfx-to-csv", hrefLabel: "QFX to CSV guide" },
  { q: "What's the difference between QIF, QFX, and OFX for Quicken?", a: "QIF is the only one of the three that carries categories and split transactions into Quicken — QFX and OFX both drop category data entirely.", href: "/csv-to-qif", hrefLabel: "CSV to QIF guide" },
  { q: "Does any bank export directly to Tally XML?", a: "No — it isn't one of the formats banks offer at all (CSV, Excel, OFX, QIF, and QBO cover almost everyone's native export list, but never Tally). Converting a PDF statement is the real path in.", href: "/bank-statement-to-tally", hrefLabel: "Bank statement to Tally guide" },
  { q: "What is a QBO file, and how is it different from IIF?", a: "QBO is QuickBooks' Web Connect format, built on the same underlying structure as OFX — it imports as a live bank-feed match on both QuickBooks Desktop and Online. IIF is a QuickBooks Desktop-only format with simpler, unmatched transaction entries.", href: "/qbo-to-csv", hrefLabel: "QBO to CSV guide" },
  { q: "How accurate is converting a photo of a statement?", a: "It depends on the photo — a clean, well-lit, straight-on scan reads nearly as well as a real PDF. Blur, poor lighting, or an angled shot increases how many rows get flagged as low-confidence, which is why every row is scored rather than silently accepted.", href: "/image-to-excel", hrefLabel: "Image to Excel guide" },
  { q: "How do I report a conversion issue or contact support if a statement isn't converting?", a: "Head to our Contact page — you can attach the actual statement that's giving you trouble, which helps us diagnose it much faster than a description alone.", href: "/contact", hrefLabel: "Contact us" },
];

const STARTER_QUESTIONS = [
  "Is my data uploaded anywhere?",
  "How much does it cost?",
  "What banks are supported?",
  "What formats can I export to?",
];

const FALLBACK =
  "I'm not sure I have an article on that specific question. Is it about one of these, or something else entirely?";

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

// Generic words like "what"/"are"/"does" appearing in nearly every FAQ
// question were causing false ties -- confirmed directly: "What banks are
// supported?" scored equally against the banks FAQ and the pricing FAQ,
// purely because "what" and "are" both happen to appear in the pricing
// question's wording too, and the stable sort's tie-break (array order)
// picked the wrong one. Excluding these from scoring means only the
// actual topic words drive a match.
const STOP_WORDS = new Set([
  "what", "are", "is", "does", "do", "the", "a", "an", "to", "for", "of",
  "in", "on", "and", "or", "can", "how", "much", "with", "my", "me", "you",
  "it", "this", "that", "there", "about",
]);

function rankEntries(query: string): Array<{ entry: Entry; s: number }> {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^\w]/g, ""))
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  if (words.length === 0) return [];
  return ENTRIES.map((e) => ({ entry: e, s: score(e, words) })).sort((a, b) => b.s - a.s);
}

function bestMatch(query: string): Entry | null {
  const top = rankEntries(query)[0];
  return top && top.s >= MIN_MATCH_SCORE ? top.entry : null;
}

// Distinguishes "scored something, just not enough to clear the threshold"
// from "scored literally zero, shares no real word with any entry" -- only
// the former is a reasonable candidate for context-carrying. A query that
// shares nothing with any entry on its own is a fresh, unrelated topic, not
// a continuation of the last one, even if the last topic's own words alone
// would happen to clear the threshold when blindly combined.
function hasAnyStandaloneSignal(query: string): boolean {
  const top = rankEntries(query)[0];
  return !!top && top.s > 0;
}

type Message = { role: "assistant" | "user"; text: string; href?: string; hrefLabel?: string; chips?: string[] };

const CLARIFY_CHIPS = ["Pricing", "Security & privacy", "Supported banks", "Export formats", "Report a conversion issue", "Something else"];
const SOMETHING_ELSE_REPLY = "No problem — head to Contact and tell us a bit more. We read every message.";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I can answer common questions about converting statements, pricing, security, and export formats. Ask me anything, or tap a question below to get started.",
      chips: STARTER_QUESTIONS,
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const lastMatchedQuery = useRef<string | null>(null);

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    const isGreeting = GREETING_WORDS.has(trimmed.toLowerCase().replace(/[!.?]+$/, ""));
    const isSomethingElse = trimmed.toLowerCase() === "something else";

    let match = isGreeting || isSomethingElse ? null : bestMatch(trimmed);
    let effectiveQuery = trimmed;

    // A short follow-up like "per month" doesn't carry enough of its own
    // topic words to match anything alone -- real conversations lean on
    // what was just said. But this must be gated on the new query showing
    // SOME real relevance on its own first: a genuinely fresh, unrelated
    // topic (zero shared words with anything) should never inherit the
    // previous topic just because the old question's own words alone
    // would clear the threshold when blindly combined -- confirmed this
    // was a real bug ("what is price" inheriting the previous
    // export-formats topic purely because "export formats" alone scores
    // high, with "price" contributing nothing).
    if (!match && !isGreeting && !isSomethingElse && lastMatchedQuery.current && hasAnyStandaloneSignal(trimmed)) {
      const combined = `${lastMatchedQuery.current} ${trimmed}`;
      const combinedMatch = bestMatch(combined);
      if (combinedMatch) {
        match = combinedMatch;
        effectiveQuery = combined;
      }
    }

    if (match) lastMatchedQuery.current = effectiveQuery;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      isGreeting
        ? { role: "assistant", text: GREETING, chips: STARTER_QUESTIONS }
        : isSomethingElse
          ? { role: "assistant", text: SOMETHING_ELSE_REPLY, href: "/contact", hrefLabel: "Contact us" }
          : match
            ? { role: "assistant", text: match.a, href: match.href, hrefLabel: match.hrefLabel, chips: CLARIFY_CHIPS }
            : { role: "assistant", text: FALLBACK, chips: CLARIFY_CHIPS },
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
              <div key={i}>
                <div className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
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

                {m.chips && i === messages.length - 1 && (
                  <div className="ml-8 mt-2 flex flex-wrap gap-1.5">
                    {m.chips.map((c) => (
                      <button
                        key={c}
                        onClick={() => ask(c)}
                        className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-ink transition hover:border-emerald/50 hover:text-emerald"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
