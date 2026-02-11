"use client";

import { useEffect, useState } from "react";
import {
  THEME_OVERRIDE_COOKIE,
  type ThemeMode,
  applyThemeModeClass,
} from "@/lib/theme-mode";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function getSystemPreference(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
}

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
  document.cookie = `${THEME_OVERRIDE_COOKIE}=${mode}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

export default function ThemeToggle() {
  // Use null initially to indicate "not yet determined" - prevents hydration mismatch
  const [mode, setMode] = useState<ThemeMode | null>(null);

  useEffect(() => {
    // Check for saved preference, otherwise use system preference
    const savedMode = readCookieSelection();
    const initialMode = savedMode ?? getSystemPreference();
    setMode(initialMode);
    applyThemeModeClass(initialMode);
  }, []);

  const handleToggle = () => {
    if (mode === null) return;
    const newMode: ThemeMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    persistSelection(newMode);
    applyThemeModeClass(newMode);
  };

  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="relative inline-flex h-9 w-16 items-center rounded-full border border-stroke-muted transition-colors duration-300 ease-in-out hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Sliding background */}
      <span
        className={`absolute inset-0 rounded-full transition-colors duration-300 ease-in-out ${
          isDark ? "bg-gray-700" : "bg-gray-200"
        }`}
      />
      
      {/* Sliding thumb with icon */}
      <span
        className={`relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-in-out transform ${
          isDark ? "translate-x-8" : "translate-x-1"
        }`}
      >
        <span className="text-base leading-none">
          {isDark ? "🌙" : "☀️"}
        </span>
      </span>

      <span className="sr-only">Current theme: {mode ?? "loading"}</span>
    </button>
  );
}
