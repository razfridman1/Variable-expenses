"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Plus, Clock, BarChart3, Wallet, LogOut, Loader2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/",          label: "ראשי",     icon: Home },
  { href: "/add",       label: "הוסף",     icon: Plus },
  { href: "/history",   label: "היסטוריה", icon: Clock },
  { href: "/analytics", label: "תובנות",   icon: BarChart3 },
  { href: "/budget",    label: "תקציב",    icon: Wallet },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { email, signOut, userId, loading } = useAuth();
  const router = useRouter();

  // Client-side auth gate — needed for the Capacitor build, where Next.js
  // middleware does not run (static export). On the web the middleware
  // already handles this, so the redirect is a no-op fast path.
  useEffect(() => {
    if (!loading && !userId) router.replace("/login");
  }, [loading, userId, router]);

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-base text-text">
            מעקב הוצאות
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-muted truncate max-w-[200px]">
              {email}
            </span>
            <ThemeToggle />
            <button
              type="button"
              aria-label="התנתק"
              onClick={() => {
                void signOut();
                router.replace("/login");
              }}
              className="btn-ghost h-10 w-10 !p-0 rounded-full"
              title="התנתק"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-4 pb-28 sm:pb-8">
        {children}
      </main>

      {/* ── Bottom nav (mobile) ──────────────────────────────────────────── */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur
                   border-t border-border pb-[env(safe-area-inset-bottom,0)]"
      >
        <ul className="grid grid-cols-5 max-w-3xl mx-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href} className="flex">
                <Link
                  href={href}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs",
                    active ? "text-primary" : "text-muted",
                  )}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Side nav (desktop) ───────────────────────────────────────────── */}
      <nav className="hidden sm:block sticky top-14 z-20 border-b border-border bg-bg/70 backdrop-blur">
        <ul className="max-w-3xl mx-auto px-4 flex items-center gap-1 h-12">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-fg"
                      : "text-muted hover:text-text hover:bg-surface-2",
                  )}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
