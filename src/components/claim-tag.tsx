import type { ReactNode } from "react";

/**
 * Claim tags.
 *
 * The brief was "tags like sale tags on an e-comm store". The templated answer
 * is a rounded pill with a green fill, which is what the app already had and
 * what the eye skips.
 *
 * Grounded in the subject instead: this product's audience is bookkeepers and
 * accountants, whose paper world is ledger sheets, cheque stubs, file index
 * tabs and rubber stamps. So the tag is a NOTCHED FLAG -- a rectangle with a
 * chevron cut into its right edge, the shape of a physical tag or a ledger
 * tab -- rather than a capsule.
 *
 * The signature detail is the perforation: a column of dots down the left
 * edge, the way a cheque stub tears away from its book. It is the one piece of
 * decoration here and it earns its place by being specific to the subject
 * rather than to "badges in general".
 *
 * Type is mono, uppercase, wide-tracked. Not a new decision -- it is already
 * this app's utility voice (StatItem labels, the confidence legend), so the
 * tags read as part of the same system rather than as an import.
 *
 * Two claims deserve this treatment and no others: no page cap, and
 * on-device. Both are structural things competitors cannot match. Applying it
 * to a third claim would make it decoration.
 */

type Tone = "unlimited" | "local" | "free";

const TONES: Record<Tone, { bg: string; fg: string; perf: string }> = {
  // Emerald: the pricing claim. Loudest, because it is the newest argument.
  unlimited: { bg: "bg-emerald", fg: "text-primary-foreground", perf: "bg-emerald" },
  // Ink: the privacy claim. Quieter and heavier -- it reads as a fact stated,
  // not an offer made, which is the right register for a security promise.
  local: { bg: "bg-ink", fg: "text-background", perf: "bg-ink" },
  // Amber: the free tier. Warm, and distinct from both differentiators.
  free: { bg: "bg-amber-500", fg: "text-ink", perf: "bg-amber-500" },
};

/**
 * Inline tag. The notch is a clip-path rather than a pseudo-element so the
 * shape survives any background behind it.
 */
export function ClaimTag({
  tone = "unlimited",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const t = TONES[tone];
  return (
    <span className="relative inline-flex items-stretch align-middle">
      {/* Perforation strip: three dots punched out of the tag's left edge. */}
      <span
        className={`flex w-2 flex-col items-center justify-center gap-[3px] rounded-l-[3px] ${t.perf}`}
        aria-hidden
      >
        <span className="h-[3px] w-[3px] rounded-full bg-background/40" />
        <span className="h-[3px] w-[3px] rounded-full bg-background/40" />
        <span className="h-[3px] w-[3px] rounded-full bg-background/40" />
      </span>
      <span
        className={`${t.bg} ${t.fg} py-1 pl-1.5 pr-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em]`}
        style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 7px) 50%, 100% 100%, 0 100%)" }}
      >
        {children}
      </span>
    </span>
  );
}

/**
 * Corner ribbon, for the one card that should shout.
 *
 * This is the literal e-commerce treatment and it is used exactly once -- on
 * the Pro plan. A ribbon on every card is wallpaper; a ribbon on one card is a
 * signal. Chanel's rule: take one accessory off before leaving.
 */
export function CornerRibbon({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute -right-12 top-5 z-10 w-40 rotate-45" aria-hidden={false}>
      <div className="bg-emerald py-1 text-center font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-sm">
        {children}
      </div>
    </div>
  );
}
