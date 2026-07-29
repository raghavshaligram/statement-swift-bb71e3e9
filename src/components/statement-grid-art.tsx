/**
 * Featured-image illustration for content pages (bank guides, format
 * converters) and the blog index. Deliberately one signature visual reused
 * consistently rather than a different illustration per page -- the motif
 * (a statement's lines resolving into a clean data grid) IS the product's
 * actual job, not a decorative stand-in for it. Built entirely from the
 * existing brand palette (emerald/ink/surface) -- no new colors introduced.
 */
export function StatementGridArt({
  className,
  titleText,
  label,
}: {
  className?: string;
  titleText?: string;
  /** Small format label overlaid bottom-left (e.g. "CSV → IIF") -- lets cards reusing this same illustration in a grid (the blog index) read as distinct from one another, without a different illustration per format. */
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 480 270"
      className={className}
      role={titleText ? "img" : "presentation"}
      aria-label={titleText}
    >
      <rect width="480" height="270" rx="16" fill="var(--emerald)" />
      <rect width="480" height="270" rx="16" fill="url(#slgGradient)" />
      <defs>
        <linearGradient id="slgGradient" x1="0" y1="0" x2="480" y2="270" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0e5a40" />
          <stop offset="1" stopColor="#0a3f2c" />
        </linearGradient>
      </defs>

      {/* Statement, left side -- rotated slightly for depth */}
      <g transform="translate(48 40) rotate(-6)">
        <rect width="140" height="180" rx="8" fill="#f7f9fc" />
        <rect x="16" y="20" width="70" height="8" rx="2" fill="#0b1520" opacity="0.35" />
        <rect x="16" y="40" width="108" height="4" rx="2" fill="#5c6d82" opacity="0.4" />
        <rect x="16" y="52" width="90" height="4" rx="2" fill="#5c6d82" opacity="0.4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <g key={i}>
            <rect x="16" y={78 + i * 16} width="60" height="5" rx="2" fill="#0b1520" opacity="0.5" />
            <rect x="98" y={78 + i * 16} width="26" height="5" rx="2" fill="#0e5a40" opacity="0.7" />
          </g>
        ))}
      </g>

      {/* Transformation arrow */}
      <g transform="translate(216 128)" stroke="#deeae4" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M0 7 H44" />
        <path d="M34 -4 L46 7 L34 18" />
      </g>

      {/* Spreadsheet grid, right side */}
      <g transform="translate(288 45) rotate(4)">
        <rect width="150" height="170" rx="8" fill="#f7f9fc" />
        <rect width="150" height="26" rx="8" fill="#deeae4" />
        <rect y="18" width="150" height="8" fill="#deeae4" />
        {[0, 1, 2, 3, 4].map((row) => (
          <g key={row}>
            <rect x="10" y={38 + row * 24} width="60" height="14" rx="3" fill="#0b1520" opacity="0.12" />
            <rect x="78" y={38 + row * 24} width="30" height="14" rx="3" fill="#0e5a40" opacity="0.18" />
            <rect x="114" y={38 + row * 24} width="26" height="14" rx="3" fill="#0b1520" opacity="0.12" />
          </g>
        ))}
        <line x1="75" y1="0" x2="75" y2="170" stroke="#e2e7f0" strokeWidth="2" />
        <line x1="0" y1="26" x2="150" y2="26" stroke="#e2e7f0" strokeWidth="2" />
      </g>

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
