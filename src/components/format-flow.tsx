/**
 * Format-flow diagram: source file → target file.
 *
 * Inline SVG rather than an image file, for three reasons that matter here:
 * it inherits the page's colours so it can't drift from the theme, it costs no
 * extra network request on a page we're trying to keep fast for Core Web
 * Vitals, and the labels stay real text so they're readable to a screen
 * reader and to a crawler.
 *
 * The job is orientation, not decoration. Someone landing on "QBO to Excel"
 * from search should confirm in under a second that this page is about the
 * thing they typed.
 */

const PALETTE = {
  QBO: { fill: "#2CA01C", label: "QBO" },
  OFX: { fill: "#0F7B6C", label: "OFX" },
  QFX: { fill: "#5B4FC4", label: "QFX" },
  QIF: { fill: "#B45309", label: "QIF" },
  IIF: { fill: "#0369A1", label: "IIF" },
  CSV: { fill: "#475569", label: "CSV" },
  Excel: { fill: "#217346", label: "XLS" },
  MT940: { fill: "#7C2D12", label: "940" },
  PDF: { fill: "#B91C1C", label: "PDF" },
} as const;

type FormatKey = keyof typeof PALETTE;

function FileCard({ x, format }: { x: number; format: FormatKey }) {
  const { fill, label } = PALETTE[format];
  return (
    <g transform={`translate(${x}, 30)`}>
      <rect x="0" y="0" width="120" height="96" rx="12" fill="var(--card, #fff)" stroke="currentColor" strokeOpacity="0.12" />
      <rect x="24" y="20" width="40" height="48" rx="6" fill={fill} fillOpacity="0.12" />
      <path d="M24 26a6 6 0 0 1 6-6h20l14 14v28a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6z" fill={fill} fillOpacity="0.9" />
      <path d="M50 20l14 14H56a6 6 0 0 1-6-6z" fill="#fff" fillOpacity="0.35" />
      <text x="44" y="52" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="ui-monospace, monospace">
        {label}
      </text>
      <text x="82" y="50" fill="currentColor" fontSize="15" fontWeight="700" fontFamily="ui-sans-serif, system-ui">
        {format}
      </text>
    </g>
  );
}

export function FormatFlow({ from, to }: { from: FormatKey; to: FormatKey }) {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-6">
      <div className="rounded-2xl border border-border bg-surface-muted/40 py-4">
        <svg
          viewBox="0 0 560 156"
          className="mx-auto h-auto w-full max-w-lg text-ink"
          role="img"
          aria-label={`Converting a ${from} file to ${to}`}
        >
          <FileCard x={80} format={from} />
          <g transform="translate(266, 68)">
            <path d="M0 10h24" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 4l7 6-7 6" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          <FileCard x={330} format={to} />
        </svg>
      </div>
    </div>
  );
}
