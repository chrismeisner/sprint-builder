"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ThemeMode,
  ThemeOverrideSelection,
  applyThemeModeClass,
  normalizeThemeSelection,
} from "@/lib/theme-mode";

type Props = {
  initialSelection: ThemeOverrideSelection;
};

type Option = {
  value: ThemeOverrideSelection;
  title: string;
  description: string;
  badge?: string;
};

const OPTIONS: Option[] = [
  {
    value: "default",
    title: "Use default (Dark)",
    description: "Follow the global site setting. This keeps the experience identical to what customers see.",
  },
  {
    value: "dark",
    title: "Force dark mode",
    description: "Always apply dark mode, even if you previously switched to light. Useful for testing after overrides.",
  },
  {
    value: "light",
    title: "Force light mode",
    description: "Temporarily disable the dark theme so you can audit contrast, screenshots, or marketing layouts.",
    badge: "Admin only",
  },
];

export default function ThemeOverrideClient({ initialSelection }: Props) {
  const [selection, setSelection] = useState<ThemeOverrideSelection>(initialSelection);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const currentMode: ThemeMode = useMemo(
    () => normalizeThemeSelection(selection),
    [selection]
  );

  const handleSelect = (nextSelection: ThemeOverrideSelection) => {
    if (nextSelection === selection) return;
    const previousSelection = selection;
    setSelection(nextSelection);
    setStatus("idle");
    setMessage("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/theme-override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: nextSelection }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error ?? "Unable to update theme");
        }

        const payload = (await response.json()) as {
          mode: ThemeMode;
          selection: ThemeOverrideSelection;
        };

        setSelection(payload.selection);
        applyThemeModeClass(payload.mode);
        setStatus("success");
        setMessage(
          payload.mode === "light"
            ? "Light mode enabled for your current session."
            : "Dark mode enabled for your current session."
        );
      } catch (error) {
        console.error(error);
        setSelection(previousSelection);
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Unable to update theme preference."
        );
      }
    });
  };

  return (
    <div className="container max-w-3xl py-10 space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] opacity-70 mb-3">
          Appearance
        </p>
        <h1 className="text-3xl font-semibold mb-2">Theme controls</h1>
        <p className="text-sm opacity-80">
          This page is only visible to admins. Changes you make here affect{" "}
          <strong>only your logged-in account</strong> so you can preview the product in light or dark mode without logging out.
        </p>
      </div>

      <div className="rounded-2xl border border-stroke-muted bg-surface-card/70 p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Mode override</h2>
          <p className="text-sm opacity-70">
            Pick the mode you want to browse with. We&apos;ll store this preference in a cookie tied to your admin session.
          </p>
        </div>

        <div className="space-y-3">
          {OPTIONS.map((option) => {
            const checked = selection === option.value;
            return (
              <label
                key={option.value}
                className={`flex items-start gap-4 rounded-xl border px-4 py-3 cursor-pointer transition ${
                  checked ? "border-white/50 bg-white/5" : "border-stroke-muted hover:border-white/40"
                }`}
              >
                <input
                  type="radio"
                  name="theme-override"
                  value={option.value}
                  checked={checked}
                  disabled={isPending}
                  onChange={() => handleSelect(option.value)}
                  className="mt-1 h-4 w-4 accent-white"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold">{option.title}</span>
                    {option.badge ? (
                      <span className="text-[10px] uppercase tracking-wide rounded-full border border-stroke-muted px-2 py-0.5">
                        {option.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm opacity-75">{option.description}</p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="text-xs text-brand-muted">
          Current effective mode:{" "}
          <span className="font-semibold uppercase tracking-wide">
            {currentMode === "dark" ? "Dark" : "Light"}
          </span>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className={`text-sm ${
          status === "success"
            ? "text-semantic-success"
            : status === "error"
            ? "text-semantic-danger"
            : "text-brand-muted"
        }`}
      >
        {message ||
          "Tip: Force light mode to capture marketing screenshots, then revert to default when you're done."}
      </div>
    </div>
  );
}


