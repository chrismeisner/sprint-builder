"use client";

import { useEffect, useMemo, useState } from "react";
import {
  THEME_OVERRIDE_COOKIE,
  type ThemeMode,
  type ThemeOverrideSelection,
  applyThemeModeClass,
  normalizeThemeSelection,
} from "@/lib/theme-mode";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type ToggleOption = {
  value: ThemeOverrideSelection;
  label: string;
  icon: string;
  helper: string;
};

const OPTIONS: ToggleOption[] = [
  { value: "default", label: "System", icon: "🖥️", helper: "Follow OS" },
  { value: "light", label: "Light", icon: "☀️", helper: "Light UI" },
  { value: "dark", label: "Dark", icon: "🌙", helper: "Dark UI" },
];

function readCookieSelection(): ThemeOverrideSelection {
  if (typeof document === "undefined") return "default";
  const raw = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${THEME_OVERRIDE_COOKIE}=`));

  if (!raw) return "default";
  const value = decodeURIComponent(raw.split("=")[1] ?? "");
  if (value === "light" || value === "dark") return value;
  return "default";
}

function persistSelection(selection: ThemeOverrideSelection) {
  if (typeof document === "undefined") return;
  if (selection === "default") {
    document.cookie = `${THEME_OVERRIDE_COOKIE}=; path=/; max-age=0; samesite=lax`;
    return;
  }
  document.cookie = `${THEME_OVERRIDE_COOKIE}=${selection}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

function resolveEffectiveMode(selection: ThemeOverrideSelection): ThemeMode {
  if (selection === "light" || selection === "dark") return selection;
  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
}

export default function ThemeToggle() {
  const [selection, setSelection] = useState<ThemeOverrideSelection>("default");

  // Ensure we compute a friendly label for the current effective mode
  const effectiveMode: ThemeMode = useMemo(() => resolveEffectiveMode(selection), [selection]);

  useEffect(() => {
    const initial = readCookieSelection();
    setSelection(initial);
    applyThemeModeClass(resolveEffectiveMode(initial));

    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mediaQuery) return;
    const handleChange = (event: MediaQueryListEvent) => {
      if (selection === "default") {
        applyThemeModeClass(event.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleSelect = (next: ThemeOverrideSelection) => {
    if (next === selection) return;
    setSelection(next);
    persistSelection(next);
    const effective = resolveEffectiveMode(next);
    applyThemeModeClass(effective);
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-stroke-muted bg-surface-subtle px-2 py-1">
      {OPTIONS.map((option) => {
        const isActive = selection === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={[
              "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition",
              isActive
                ? "bg-brand-primary text-brand-inverse border border-brand-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-strong border border-transparent",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-pressed={isActive}
            aria-label={`${option.label} mode`}
            title={`${option.label} — ${option.helper}`}
          >
            <span aria-hidden>{option.icon}</span>
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
      <span className="sr-only">Current theme: {normalizeThemeSelection(selection)}</span>
      <span className="sr-only">Effective mode: {effectiveMode}</span>
    </div>
  );
}
