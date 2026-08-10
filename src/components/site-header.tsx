import { Link } from "@tanstack/react-router";
import { Scale, FileSpreadsheet } from "lucide-react";
import { AuthActions } from "@/components/user-menu";
import { LifetimeDealBanner } from "@/components/lifetime-deal-banner";

/**
 * Marketing site header — dark navbar matching the reference:
 * brand left, primary sections centered, local + auth actions right.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      <LifetimeDealBanner />
      <div className="border-b border-white/5 bg-ink">
        <div className="flex h-16 w-full items-center justify-between gap-4 px-6 sm:px-8 md:grid md:grid-cols-[1fr_auto_1fr]">
          {/* Left: brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 text-background">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald text-primary-foreground">
                <Scale className="h-4 w-4" />
              </div>
              <span className="text-[17px] font-bold tracking-tight">
                Balance<span className="text-emerald">Extract</span>
              </span>
            </Link>
          </div>

          {/* Center: primary marketing nav */}
          <nav className="hidden items-center gap-10 text-sm font-semibold md:flex">
            <a
              href="/#how-it-works"
              className="text-background/80 transition-colors hover:text-background"
            >
              How it works
            </a>
            <Link
              to="/pricing"
              className="text-background/80 transition-colors hover:text-background"
            >
              Pricing
            </Link>
            <Link to="/blog" className="text-background/80 transition-colors hover:text-background">
              Blog
            </Link>
          </nav>

          {/* Right: local indicator + auth actions */}
          <div className="flex items-center justify-end gap-5">
            <div className="hidden items-center gap-1.5 font-mono text-xs text-background/70 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald" aria-hidden />
              local
            </div>
            <AuthActions variant="dark" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-muted/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 text-sm text-muted-foreground md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-ink">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FileSpreadsheet className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold">BalanceExtract</span>
          </div>
          <p className="mt-3 max-w-xs text-xs leading-relaxed">
            Bank statement to Excel software. Processed on your device — never uploaded to a server.
          </p>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink">
            Product
          </div>
          <ul className="space-y-2">
            <li>
              <Link to="/upload" className="hover:text-ink">
                Convert a statement
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="hover:text-ink">
                Pricing
              </Link>
            </li>
            <li>
              <a href="/#banks" className="hover:text-ink">
                Supported banks
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink">
            Formats
          </div>
          <ul className="space-y-2">
            <li>
              <Link to="/upload" className="hover:text-ink">
                Excel (.xlsx)
              </Link>
            </li>
            <li>
              <Link to="/bank-statement-to-csv" className="hover:text-ink">
                CSV
              </Link>{" "}
              ·{" "}
              <Link to="/csv-to-ofx" className="hover:text-ink">
                OFX
              </Link>{" "}
              ·{" "}
              <Link to="/csv-to-qif" className="hover:text-ink">
                QIF
              </Link>
            </li>
            <li>
              <Link to="/bank-statement-to-tally" className="hover:text-ink">
                Tally XML
              </Link>{" "}
              ·{" "}
              <Link to="/qbo-to-csv" className="hover:text-ink">
                QBO
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink">
            Company
          </div>
          <ul className="space-y-2">
            <li>
              <Link to="/privacy" className="hover:text-ink">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-ink">
                Terms & conditions
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-ink">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 font-semibold text-ink hover:text-emerald"
          >
            Guides &amp; converters
          </Link>
          <p className="mt-1.5 max-w-md text-xs">
            Bank-specific statement guides and free format converters (IIF, QIF, OFX, QFX, MT940,
            CSV).
          </p>
        </div>
      </div>

      <div className="border-t border-border/60 px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BalanceExtract. Your statements never leave your device.
      </div>
    </footer>
  );
}
