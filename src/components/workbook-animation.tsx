import { motion } from "framer-motion";
import { FileText } from "lucide-react";

/**
 * Shows several statement PDFs collapsing into a single workbook with one
 * tab per statement.
 *
 * This capability already shipped -- to-xlsx.ts groups by source file and
 * builds a sheet per statement, with a user-facing toggle on the export
 * screen -- but nothing on the site said so. The homepage mentioned
 * converting files "in one pass" and never that the result is a tabbed
 * workbook, which is the part that actually saves an accountant an hour.
 *
 * Deliberately built from divs and framer-motion (already a dependency)
 * rather than a video or Lottie file: it stays crisp at any size, respects
 * theme tokens, adds no network weight, and honours reduced-motion for free
 * via framer-motion's own handling.
 */

const FILES = ["January.pdf", "February.pdf", "March.pdf"];
const TABS = ["January", "February", "March"];

export function WorkbookAnimation() {
  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col items-center gap-3 py-2">
      {/* Incoming statements */}
      <div className="flex w-full flex-col gap-2">
        {FILES.map((name, i) => (
          <motion.div
            key={name}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 shadow-sm"
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: i * 0.18, duration: 0.45, ease: "easeOut" }}
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-xs font-medium text-ink">{name}</span>
            <motion.span
              className="ml-auto text-[10px] font-semibold text-emerald"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9 + i * 0.12, duration: 0.3 }}
            >
              parsed
            </motion.span>
          </motion.div>
        ))}
      </div>

      {/* Connector */}
      <motion.div
        className="h-6 w-px bg-gradient-to-b from-border to-emerald/60"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.3, duration: 0.35, ease: "easeOut" }}
        style={{ transformOrigin: "top" }}
        aria-hidden
      />

      {/* Resulting workbook */}
      <motion.div
        className="w-full overflow-hidden rounded-xl border border-emerald/30 bg-card shadow-md"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.5, duration: 0.5, ease: "easeOut" }}
      >
        {/* Tab strip -- one tab per statement, which is the actual point */}
        <div className="flex gap-1 border-b border-border bg-surface-muted/50 px-2 pt-2">
          {TABS.map((tab, i) => (
            <motion.div
              key={tab}
              className={`rounded-t-md px-3 py-1.5 text-[11px] font-semibold ${
                i === 0 ? "bg-card text-ink shadow-sm" : "text-muted-foreground"
              }`}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.8 + i * 0.14, duration: 0.35, ease: "easeOut" }}
            >
              {tab}
            </motion.div>
          ))}
        </div>

        {/* Suggestion of spreadsheet rows */}
        <div className="space-y-1.5 p-3">
          {[0, 1, 2, 3].map((row) => (
            <motion.div
              key={row}
              className="flex gap-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 2.2 + row * 0.08, duration: 0.3 }}
            >
              <div className="h-2 w-14 rounded-sm bg-surface-muted" />
              <div className="h-2 flex-1 rounded-sm bg-surface-muted" />
              <div className="h-2 w-12 rounded-sm bg-emerald/25" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.p
        className="text-center text-[11px] text-muted-foreground"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 2.6, duration: 0.4 }}
      >
        One workbook · one tab per statement
      </motion.p>
    </div>
  );
}
