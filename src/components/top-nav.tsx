/**
 * Persistent top navbar for the app's workflow pages (Upload/Preview/Export).
 * Nav is centered; brand sits left; auth actions sit right.
 */
import { Link, useLocation } from "@tanstack/react-router";
import { FileSpreadsheet, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthActions } from "@/components/user-menu";

const NAV_LINKS = [
  { to: "/upload", label: "Upload" },
  { to: "/preview", label: "Preview" },
  { to: "/export", label: "Export" },
] as const;

export function TopNav() {
  const loc = useLocation();

  return (
    <header className="sticky top-0 z-40 grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-white/10 bg-ink px-4 sm:px-6">
      {/* Left: brand */}
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald text-primary-foreground">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-white">BalanceExtract</span>
        </Link>
        <span className="hidden h-4 w-px shrink-0 bg-white/15 sm:block" aria-hidden />
        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] font-medium text-white/60 sm:inline-flex">
          <Lock className="h-2.5 w-2.5" /> on-device
        </span>
      </div>

      {/* Center: workflow nav */}
      <nav className="hidden items-center gap-1 md:flex">
        {NAV_LINKS.map((item) => {
          const active = loc.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-emerald text-primary-foreground" : "text-white/60 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right: local indicator + auth */}
      <div className="flex shrink-0 items-center justify-end gap-4">
        <div className="hidden items-center gap-1.5 font-mono text-xs text-white/70 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" aria-hidden />
          local
        </div>
        <AuthActions variant="dark" />
      </div>
    </header>
  );
}
