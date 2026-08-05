import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useStatementStore } from "@/lib/statement-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, History, User as UserIcon, CreditCard, Zap, Settings, ChevronDown } from "lucide-react";

type Variant = "dark" | "light";

export function AuthActions({ variant = "dark" }: { variant?: Variant }) {
  const { user, loading, signOut } = useAuth();
  const { isPro, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const resetStatements = useStatementStore((s) => s.reset);

  if (loading) {
    return <div className="h-8 w-24 animate-pulse rounded-md bg-white/5" aria-hidden />;
  }

  if (!user) {
    const textCls = variant === "dark" ? "text-background/85 hover:text-background" : "text-ink/80 hover:text-ink";
    return (
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <Link to="/signin" className={`whitespace-nowrap text-sm font-semibold transition-colors ${textCls}`}>
          Log In
        </Link>
        <Link
          to="/signup"
          className="inline-flex items-center whitespace-nowrap rounded-lg bg-emerald px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-emerald/90"
        >
          <span className="sm:hidden">Sign up</span>
          <span className="hidden sm:inline">Sign up for free</span>
        </Link>
      </div>
    );
  }

  const initial = (user.email ?? "?").charAt(0).toUpperCase();
  const displayName =
    (user.user_metadata?.display_name as string) ||
    (user.user_metadata?.full_name as string) ||
    (user.email?.split("@")[0] ?? "");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-emerald/50"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald text-sm font-bold text-primary-foreground">
          {initial}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-background/70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 border-white/10 bg-ink p-0 text-background shadow-2xl">
        <div className="px-4 pb-3 pt-4">
          <div className="truncate text-sm font-bold text-background">{displayName}</div>
          <div className="truncate font-mono text-[11px] text-background/60">{user.email}</div>
          {/* Rendered from real subscription state. It was hardcoded "Free",
              so a paying customer saw Free here while Billing correctly said
              Pro. Nothing is shown until the status is known -- flashing
              "Free" and then correcting to "Pro" is what read as the badge
              flickering. */}
          {subLoading ? (
            <span className="mt-2 inline-block h-[18px] w-14 animate-pulse rounded-full bg-white/10" aria-hidden />
          ) : (
            <span
              className={`mt-2 inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                isPro ? "bg-emerald/20 text-emerald" : "bg-white/10 text-background/80"
              }`}
            >
              {isPro ? "Pro" : "Free"}
            </span>
          )}
        </div>
        <DropdownMenuSeparator className="my-0 bg-white/10" />
        <div className="py-1">
          <MenuLink to="/account/history" icon={History} label="Conversion history" />
          <MenuLink to="/account" icon={UserIcon} label="Account" />
          <MenuLink to="/account/billing" icon={CreditCard} label="Billing" />
          <MenuLink to="/account/billing" icon={Zap} label="Subscription" />
          <MenuLink to="/account/settings" icon={Settings} label="Settings" />
        </div>
        <DropdownMenuSeparator className="my-0 bg-white/10" />
        <DropdownMenuItem
          onClick={async () => {
            // Sign out FIRST, then navigate. Navigating to "/" while still
            // authenticated causes the landing page's own effect to bounce
            // signed-in users straight back to /upload -- reported as
            // "sign out sends me to /upload". Flipping auth state before
            // routing avoids that redirect.
            resetStatements();
            await signOut();
            navigate({ to: "/", replace: true });
          }}
          className="cursor-pointer gap-3 rounded-none px-4 py-3 text-sm font-semibold text-rose-400 focus:bg-rose-500/10 focus:text-rose-300"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuLink({
  to,
  icon: Icon,
  label,
}: {
  to: "/account" | "/account/history" | "/account/billing" | "/account/settings";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <DropdownMenuItem asChild className="cursor-pointer rounded-none px-4 py-2.5 text-background/90 focus:bg-white/5 focus:text-background">
      <Link to={to} className="flex items-center gap-3 text-sm font-semibold">
        <Icon className="h-4 w-4 text-background/70" /> {label}
      </Link>
    </DropdownMenuItem>
  );
}
