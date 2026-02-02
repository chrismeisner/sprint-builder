"use client";

import { useEffect, useState } from "react";
import {
  THEME_OVERRIDE_COOKIE,
  type ThemeMode,
  applyThemeModeClass,
} from "@/lib/theme-mode";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type ToggleOption = {
  value: ThemeMode;
  icon: string;
  label: string;
};

const OPTIONS: ToggleOption[] = [
  { value: "light", icon: "☀️", label: "Light mode" },
  { value: "dark", icon: "🌙", label: "Dark mode" },
];

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

  const handleSelect = (newMode: ThemeMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    persistSelection(newMode);
    applyThemeModeClass(newMode);
  };

  // Render a placeholder with consistent styling during SSR/initial render to avoid hydration mismatch
  // Once mounted, mode will be set and buttons will render correctly
  return (
    <div className="flex items-center gap-1 rounded-full border border-stroke-muted bg-surface-subtle p-1">
      {OPTIONS.map((option) => {
        // Before hydration completes, render all buttons in inactive state
        const isActive = mode !== null && mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={[
              "flex items-center justify-center rounded-full w-8 h-8 text-lg transition",
              isActive
                ? "bg-brand-primary border border-brand-primary"
                : "hover:bg-surface-strong border border-transparent",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-pressed={isActive}
            aria-label={option.label}
            title={option.label}
          >
            <span>{option.icon}</span>
          </button>
        );
      })}
      <span className="sr-only">Current theme: {mode ?? "loading"}</span>
    </div>
  );
}
