"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { THEME_OVERRIDE_COOKIE, type ThemeMode, applyThemeModeClass } from "@/lib/theme-mode";

function readCookieSelection(): ThemeMode | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${THEME_OVERRIDE_COOKIE}=`));
  if (!raw) return null;
  const value = decodeURIComponent(raw.split("=")[1] ?? "");
  if (value === "light" || value === "dark") return value;
  return null;
}

function persistSelection(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.cookie = `${THEME_OVERRIDE_COOKIE}=${mode}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export default function LandingHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [mode, setMode] = useState<ThemeMode | null>(null);

  useEffect(() => {
    const saved = readCookieSelection();
    const system: ThemeMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = saved ?? system;
    setMode(initial);
    applyThemeModeClass(initial);
  }, []);

  function toggleDark() {
    if (mode === null) return;
    const next: ThemeMode = mode === "dark" ? "light" : "dark";
    setMode(next);
    persistSelection(next);
    applyThemeModeClass(next);
  }

  const isDark = mode === "dark";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stroke-muted bg-surface-card backdrop-blur supports-[backdrop-filter]:bg-surface-card">
      <div className="container max-w-6xl flex h-12 items-center justify-between">
        <Link
          href="/"
          className="text-base font-semibold leading-none text-text-primary tracking-tight"
        >
          Chris Meisner
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleDark}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            className="flex items-center justify-center size-8 rounded-md text-text-muted hover:text-text-secondary transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            <svg className="size-4 hidden dark:block" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
            <svg className="size-4 block dark:hidden" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          </button>

          {isLoggedIn ? (
            <Link
              href="/projects"
              className="inline-flex items-center justify-center h-8 px-3 rounded-md border border-stroke-muted text-text-secondary text-sm font-medium hover:border-stroke-strong hover:text-text-primary transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
            >
              My projects
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-8 px-3 rounded-md border border-stroke-muted text-text-secondary text-sm font-medium hover:border-stroke-strong hover:text-text-primary transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
            >
              Client login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
