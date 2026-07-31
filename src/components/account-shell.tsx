import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { History, User, CreditCard, Settings } from "lucide-react";

const NAV = [
  { to: "/account", label: "Account", icon: User },
  { to: "/account/history", label: "Conversion history", icon: History },
  { to: "/account/billing", label: "Billing & subscription", icon: CreditCard },
  { to: "/account/settings", label: "Settings", icon: Settings },
] as const;

export function AccountShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  // Captured once at mount: without this, adding pathname to the effect's
  // deps made it re-fire after navigating to /signin and overwrite the real
  // destination with "/signin" itself -- confirmed as a real bug in
  // testing, not a hypothetical one.
  const returnTo = useRef(pathname);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/signin", search: { redirect: returnTo.current } });
  }, [loading, user, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <div className="mb-8">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald">
            {eyebrow ?? "Account"}
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside>
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "bg-emerald/10 text-emerald"
                        : "text-muted-foreground hover:bg-white hover:text-ink",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <section className="min-w-0">{children}</section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
