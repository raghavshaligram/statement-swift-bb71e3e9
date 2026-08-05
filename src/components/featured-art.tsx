/**
 * Featured-image illustration, redesigned to match a real reference brief:
 * soft light background with a dot-grid texture (not a solid dark-green
 * block), an eyebrow pill, a realistic source document, an arrow into one
 * or more destination-format badges, and a small brand mark in the corner
 * -- the same structural language a real product blog uses for its
 * featured images, built from LedgerLocal's own tokens rather than copied
 * colors.
 */

import { SITE_HOST } from "@/lib/site";
export function FeaturedArt({
  className,
  titleText,
  eyebrow = "Bank guide",
  sourceLabel = "PDF",
  destinations = [{ label: "CSV", color: "#0e5a40" }],
}: {
  className?: string;
  titleText?: string;
  eyebrow?: string;
  /** Small extension badge shown on the source document corner (e.g. "PDF", "CSV", "IIF"). */
  sourceLabel?: string;
  /** One or two destination-format badges on the right (e.g. [{label:"CSV", color:"#0e5a40"}, {label:"XLSX", color:"#1f6f4a"}]). */
  destinations?: Array<{ label: string; color: string }>;
}) {
  const badgeY = destinations.length === 1 ? [108] : [70, 146];

  return (
    <svg viewBox="0 0 480 270" className={className} role={titleText ? "img" : "presentation"} aria-label={titleText}>
      <defs>
        <linearGradient id="fa-bg" x1="0" y1="0" x2="480" y2="270" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f7f9fc" />
          <stop offset="1" stopColor="#eef4f0" />
        </linearGradient>
        <radialGradient id="fa-glow" cx="0.5" cy="0.35" r="0.65">
          <stop offset="0" stopColor="#deeae4" stopOpacity="0.8" />
          <stop offset="1" stopColor="#deeae4" stopOpacity="0" />
        </radialGradient>
        <pattern id="fa-dots" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.3" fill="#0b1520" opacity="0.06" />
        </pattern>
      </defs>

      <rect width="480" height="270" rx="16" fill="url(#fa-bg)" />
      <rect width="480" height="270" rx="16" fill="url(#fa-dots)" />
      <rect width="480" height="270" rx="16" fill="url(#fa-glow)" />

      {/* Eyebrow pill */}
      <g transform="translate(24 22)">
        <rect width={eyebrow.length * 7.4 + 26} height="26" rx="13" fill="#deeae4" />
        <text x="13" y="18" fontSize="11" fontWeight="800" letterSpacing="0.06em" fontFamily="var(--font-sans)" fill="#0e5a40">
          {eyebrow.toUpperCase()}
        </text>
      </g>

      {/* Source statement document */}
      <g transform="translate(56 66) rotate(-4)">
        <rect width="150" height="176" rx="10" fill="#ffffff" stroke="#e2e7f0" />
        <rect width="150" height="176" rx="10" fill="none" stroke="#0b1520" strokeOpacity="0.04" />
        <rect x="18" y="22" width="80" height="8" rx="4" fill="#0b1520" opacity="0.55" />
        <rect x="18" y="38" width="56" height="5" rx="2.5" fill="#5c6d82" opacity="0.5" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect x="18" y={64 + i * 20} width="62" height="5" rx="2.5" fill="#0b1520" opacity="0.16" />
            <rect x="104" y={64 + i * 20} width="30" height="7" rx="3" fill="#0e5a40" opacity="0.35" />
          </g>
        ))}
        {/* Source format tag */}
        <g transform="translate(18 150)">
          <rect width={sourceLabel.length * 8 + 20} height="20" rx="5" fill="#f1f4f8" stroke="#e2e7f0" />
          <text x="10" y="14" fontSize="10" fontWeight="800" fontFamily="var(--font-sans)" fill="#5c6d82">
            {sourceLabel}
          </text>
        </g>
      </g>

      {/* Arrow */}
      <g transform="translate(238 135)" stroke="#9aa7b8" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M0 0 H58" />
        <path d="M46 -13 L60 0 L46 13" />
      </g>

      {/* Destination badges */}
      {destinations.map((d, i) => (
        <g key={d.label} transform={`translate(320 ${badgeY[i]})`}>
          <rect width="130" height="48" rx="12" fill="#ffffff" stroke="#e2e7f0" />
          <rect x="12" y="14" width="20" height="20" rx="5" fill={d.color} />
          <text x="42" y="29" fontSize="16" fontWeight="800" fontFamily="var(--font-sans)" fill="#0b1520">
            {d.label}
          </text>
        </g>
      ))}

      {/* Brand mark */}
      <g transform="translate(24 224)">
        <rect width="22" height="22" rx="6" fill="#0e5a40" />
        <rect x="5" y="5" width="12" height="12" rx="2" fill="none" stroke="#ffffff" strokeWidth="1.4" />
        <line x1="5" y1="11" x2="17" y2="11" stroke="#ffffff" strokeWidth="1.2" />
        <line x1="11" y1="5" x2="11" y2="17" stroke="#ffffff" strokeWidth="1.2" />
        <text x="30" y="16" fontSize="13" fontWeight="700" fontFamily="var(--font-sans)" fill="#0b1520" opacity="0.7">
          {SITE_HOST}
        </text>
      </g>
    </svg>
  );
}
