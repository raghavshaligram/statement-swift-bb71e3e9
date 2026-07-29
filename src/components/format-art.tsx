import type { ReactNode } from "react";

/**
 * Format-specific illustrations, one genuinely distinct concept per format
 * rather than the same artwork relabeled -- each grounded in something real
 * about that format (IIF's ledger structure, QIF's payee tags, OFX's
 * bank-neutral exchange role, QFX's real expiry behavior, MT940's SWIFT
 * network). Same background treatment and brand palette as
 * StatementGridArt for visual family resemblance, different foreground
 * icon work for each.
 */
function ArtBase({
  className,
  titleText,
  label,
  children,
}: {
  className?: string;
  titleText?: string;
  label?: string;
  children: ReactNode;
}) {
  return (
    <svg viewBox="0 0 480 270" className={className} role={titleText ? "img" : "presentation"} aria-label={titleText}>
      <rect width="480" height="270" rx="16" fill="url(#g)" />
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="480" y2="270" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0e5a40" />
          <stop offset="1" stopColor="#0a3f2c" />
        </linearGradient>
      </defs>
      {children}
      {label && (
        <g transform="translate(24 232)">
          <rect width={label.length * 7.2 + 20} height="26" rx="13" fill="#f7f9fc" opacity="0.95" />
          <text x="10" y="18" fontSize="13" fontWeight="700" fontFamily="var(--font-sans)" fill="#0e5a40">
            {label}
          </text>
        </g>
      )}
    </svg>
  );
}

/** IIF -- a bound ledger book, open, with a tab-delimited-style colored divider between columns. */
export function LedgerBookArt({ className, titleText, label }: { className?: string; titleText?: string; label?: string }) {
  return (
    <ArtBase className={className} titleText={titleText} label={label}>
      <g transform="translate(140 55)">
        {/* Book spine + covers */}
        <path d="M100 0 L20 12 Q10 14 10 24 L10 150 Q10 160 20 158 L100 146 Z" fill="#f7f9fc" />
        <path d="M100 0 L180 12 Q190 14 190 24 L190 150 Q190 160 180 158 L100 146 Z" fill="#eef2f6" />
        <rect x="97" y="4" width="6" height="150" fill="#0b1520" opacity="0.15" />
        {/* Ruled lines, left page */}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="24" y={34 + i * 20} width="66" height="4" rx="2" fill="#0b1520" opacity={i === 0 ? 0.4 : 0.2} />
        ))}
        {/* Ruled lines + amount tags, right page */}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect x="112" y={34 + i * 20} width="40" height="4" rx="2" fill="#0b1520" opacity={i === 0 ? 0.4 : 0.2} />
            <rect x="158" y={34 + i * 20} width="22" height="10" rx="3" fill="#0e5a40" opacity="0.5" />
          </g>
        ))}
      </g>
    </ArtBase>
  );
}

/** QIF -- a payee tag tied to a transaction receipt, evoking Quicken's tagged-field structure. */
export function TaggedReceiptArt({ className, titleText, label }: { className?: string; titleText?: string; label?: string }) {
  return (
    <ArtBase className={className} titleText={titleText} label={label}>
      <g transform="translate(150 40) rotate(-3)">
        <rect width="120" height="170" rx="6" fill="#f7f9fc" />
        <path d="M0 0 L12 10 L24 0 L36 10 L48 0 L60 10 L72 0 L84 10 L96 0 L108 10 L120 0 L120 170 L0 170 Z" fill="#f7f9fc" />
        <rect x="14" y="26" width="92" height="6" rx="3" fill="#0b1520" opacity="0.35" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x="14" y={48 + i * 14} width={i % 2 === 0 ? 80 : 60} height="4" rx="2" fill="#0b1520" opacity="0.18" />
        ))}
      </g>
      {/* Payee tag, tied on with a string */}
      <g transform="translate(300 90) rotate(8)">
        <line x1="-30" y1="-20" x2="0" y2="0" stroke="#deeae4" strokeWidth="2" />
        <path d="M0 -14 L54 -14 L68 0 L54 14 L0 14 Z" fill="#deeae4" />
        <circle cx="12" cy="0" r="4" fill="#0a3f2c" />
        <rect x="26" y="-5" width="34" height="10" rx="3" fill="#0e5a40" />
      </g>
    </ArtBase>
  );
}

/** OFX -- a shield, marking the bank-neutral, standardized exchange role the format plays. */
export function ExchangeShieldArt({ className, titleText, label }: { className?: string; titleText?: string; label?: string }) {
  return (
    <ArtBase className={className} titleText={titleText} label={label}>
      <g transform="translate(190 40)">
        <path d="M50 0 L100 18 L100 78 Q100 130 50 160 Q0 130 0 78 L0 18 Z" fill="#f7f9fc" opacity="0.95" />
        <path d="M50 14 L86 27 L86 78 Q86 118 50 143 Q14 118 14 78 L14 27 Z" fill="none" stroke="#0e5a40" strokeWidth="3" opacity="0.5" />
        <path d="M32 76 L45 89 L70 60" fill="none" stroke="#0e5a40" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* Data flowing in/out either side */}
      <g stroke="#deeae4" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
        <line x1="60" y1="90" x2="110" y2="90" />
        <line x1="60" y1="110" x2="95" y2="110" />
        <line x1="60" y1="130" x2="120" y2="130" />
        <line x1="370" y1="90" x2="420" y2="90" />
        <line x1="385" y1="110" x2="420" y2="110" />
        <line x1="360" y1="130" x2="420" y2="130" />
      </g>
    </ArtBase>
  );
}

/** QFX -- a statement with a clock/expiry marker, matching the format's real 3-year import cutoff in Quicken. */
export function ExpiringClockArt({ className, titleText, label }: { className?: string; titleText?: string; label?: string }) {
  return (
    <ArtBase className={className} titleText={titleText} label={label}>
      <g transform="translate(150 42) rotate(-4)">
        <rect width="130" height="170" rx="8" fill="#f7f9fc" />
        <rect x="16" y="22" width="70" height="7" rx="3" fill="#0b1520" opacity="0.35" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x="16" y={48 + i * 18} width="98" height="5" rx="2" fill="#0b1520" opacity="0.16" />
        ))}
      </g>
      {/* Clock face, overlapping the corner */}
      <g transform="translate(300 150)">
        <circle r="46" fill="#f7f9fc" stroke="#0e5a40" strokeWidth="3" />
        <circle r="3" fill="#0e5a40" />
        <line x1="0" y1="0" x2="0" y2="-28" stroke="#0e5a40" strokeWidth="4" strokeLinecap="round" />
        <line x1="0" y1="0" x2="18" y2="10" stroke="#0e5a40" strokeWidth="4" strokeLinecap="round" />
        <path d="M46 0 A46 46 0 0 1 14 44" fill="none" stroke="#deeae4" strokeWidth="6" strokeLinecap="round" />
      </g>
    </ArtBase>
  );
}

/** Bank guide pages -- a bank building with a statement sliding out, distinct from the document-to-grid motif used elsewhere. */
export function BankBuildingArt({ className, titleText, label }: { className?: string; titleText?: string; label?: string }) {
  return (
    <ArtBase className={className} titleText={titleText} label={label}>
      <g transform="translate(150 50)">
        {/* Building */}
        <path d="M0 40 L90 0 L180 40 L180 44 L0 44 Z" fill="#f7f9fc" />
        <rect x="10" y="44" width="160" height="110" fill="#f7f9fc" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={26 + i * 24} y="60" width="10" height="80" fill="#0e5a40" opacity="0.25" />
        ))}
        <rect x="0" y="154" width="180" height="10" rx="2" fill="#eef2f6" />
      </g>
      {/* Statement sliding out */}
      <g transform="translate(300 150) rotate(6)">
        <rect width="90" height="58" rx="6" fill="#deeae4" />
        <rect x="12" y="14" width="50" height="5" rx="2" fill="#0a3f2c" opacity="0.6" />
        <rect x="12" y="26" width="66" height="4" rx="2" fill="#0a3f2c" opacity="0.35" />
        <rect x="12" y="36" width="66" height="4" rx="2" fill="#0a3f2c" opacity="0.35" />
        <rect x="12" y="46" width="40" height="4" rx="2" fill="#0a3f2c" opacity="0.35" />
      </g>
    </ArtBase>
  );
}

export function SwiftGlobeArt({ className, titleText, label }: { className?: string; titleText?: string; label?: string }) {
  return (
    <ArtBase className={className} titleText={titleText} label={label}>
      <g transform="translate(240 130)">
        <circle r="70" fill="none" stroke="#f7f9fc" strokeWidth="2.5" opacity="0.85" />
        <ellipse rx="70" ry="26" fill="none" stroke="#f7f9fc" strokeWidth="2" opacity="0.6" />
        <ellipse rx="70" ry="26" fill="none" stroke="#f7f9fc" strokeWidth="2" opacity="0.6" transform="rotate(60)" />
        <ellipse rx="70" ry="26" fill="none" stroke="#f7f9fc" strokeWidth="2" opacity="0.6" transform="rotate(120)" />
        <line x1="-70" y1="0" x2="70" y2="0" stroke="#f7f9fc" strokeWidth="2" opacity="0.6" />
        {[
          [-48, -30],
          [40, -42],
          [58, 22],
          [-30, 46],
          [10, -8],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === 4 ? 6 : 4.5} fill="#deeae4" />
        ))}
        <path d="M-48 -30 L10 -8 L40 -42 M10 -8 L58 22 M10 -8 L-30 46" stroke="#deeae4" strokeWidth="1.5" opacity="0.8" />
      </g>
    </ArtBase>
  );
}
