"use client";

import { useEffect, useState } from "react";

const presets = [
  { key: "mobile", label: "Mobile", width: 390 },
  { key: "tablet", label: "Tablet", width: 768 },
  { key: "desktop", label: "Desktop", width: 0 },
] as const;

type PresetKey = (typeof presets)[number]["key"] | "custom";

export function DeviceSwitcher({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<PresetKey>("mobile");
  const [customInput, setCustomInput] = useState("480");
  const [appliedCustomWidth, setAppliedCustomWidth] = useState("480");
  const [isVisible, setIsVisible] = useState(false);
  // null = not yet measured (pre-hydration); true = real mobile screen
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ignore shortcuts while typing in inputs/textareas/contenteditable.
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingTarget =
        tagName === "input" ||
        tagName === "textarea" ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (isTypingTarget) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        setIsVisible((v) => !v);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function selectPreset(key: (typeof presets)[number]["key"]) {
    setActive(key);
  }

  function applyCustomWidth() {
    setActive("custom");
    setAppliedCustomWidth(customInput);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      applyCustomWidth();
    }
  }

  // On a real mobile screen the toolbar and fake frame add no value — render
  // children at natural full width. Also use this path while the viewport
  // hasn't been measured yet (null) to avoid a flash of the constrained frame.
  if (isMobile !== false) {
    return <>{children}</>;
  }

  const resolvedWidth =
    active === "custom"
      ? `${parseInt(appliedCustomWidth, 10) || 390}px`
      : active === "desktop"
        ? "100%"
        : `${presets.find((p) => p.key === active)!.width}px`;

  const displayLabel =
    active === "desktop" ? "100%" : resolvedWidth;

  if (!isVisible) {
    return (
      <div
        className="cq-container mx-auto min-h-dvh bg-white shadow-sm dark:bg-neutral-900 dark:shadow-none dark:border-x dark:border-neutral-700"
        style={{ maxWidth: resolvedWidth }}
      >
        {children}
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="sticky top-0 z-50 flex items-center justify-center gap-3 border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-700 dark:bg-neutral-900">
        <span className="text-xs font-medium leading-none text-neutral-500 dark:text-neutral-500">
          Viewport
        </span>

        {/* Preset buttons */}
        <div className="flex items-center gap-1">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => selectPreset(p.key)}
              className={`h-8 rounded px-3 text-sm font-medium leading-none motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                active === p.key
                  ? "bg-blue-600 text-white dark:bg-blue-500"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

        {/* Custom width input group */}
        <div className="flex items-center gap-1">
          <label htmlFor="custom-width" className="sr-only">
            Custom width
          </label>
          <input
            id="custom-width"
            type="number"
            min="200"
            max="1920"
            step="1"
            value={customInput}
            placeholder="Custom"
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 w-20 rounded border border-neutral-300 bg-white px-2 text-sm font-normal leading-normal tabular-nums text-neutral-900 outline-none motion-safe:transition-shadow motion-safe:duration-150 motion-safe:ease-out focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:ring-blue-400"
          />
          <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
            px
          </span>
          <button
            type="button"
            onClick={applyCustomWidth}
            className="h-8 rounded px-3 text-sm font-medium leading-none text-neutral-600 motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            Apply
          </button>
        </div>

        {/* Current width label */}
        <span className="text-xs font-normal leading-normal tabular-nums text-neutral-500 dark:text-neutral-500">
          {displayLabel}
        </span>

        {/* Divider */}
        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

        {/* Hide button */}
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="h-8 rounded px-3 text-sm font-medium leading-none text-neutral-600 motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          Hide
        </button>
      </div>

      {/* Device frame */}
      <div
        className="cq-container mx-auto min-h-dvh bg-white shadow-sm dark:bg-neutral-900 dark:shadow-none dark:border-x dark:border-neutral-700 motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out"
        style={{ maxWidth: resolvedWidth }}
      >
        {children}
      </div>
    </>
  );
}
