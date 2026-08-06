import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/common/theme-toggle";
import { appConfig } from "@/lib/env";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dasbor" },
  { to: "/materi", label: "Materi" },
  { to: "/ujian", label: "Ujian" },
  { to: "/leaderboard", label: "Peringkat" },
  { to: "/profile", label: "Profil" },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="text-base font-semibold tracking-tight">
            {appConfig.shortName}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-8">{children}</main>

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:static md:border-t-0"
      >
        <ul className="mx-auto flex w-full max-w-5xl items-stretch justify-between px-2 md:justify-center md:gap-4 md:py-3">
          {navItems.map((item) => (
            <li key={item.to} className="flex-1 md:flex-none">
              <Link
                to={item.to}
                className={cn(
                  "flex min-h-12 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors md:text-sm",
                  pathname === item.to
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
