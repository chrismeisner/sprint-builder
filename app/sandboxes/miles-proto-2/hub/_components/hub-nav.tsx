"use client";

import { createContext, useContext, useState, useCallback } from "react";

// ─── Section registry ─────────────────────────────────────────────────────────

export interface SectionDef {
  id: string;
  label: string;
}

export const HUB_SECTIONS: SectionDef[] = [
  { id: "purpose",             label: "Purpose" },
  { id: "changelog",           label: "Changelog" },
  { id: "getting-started",     label: "Getting started" },
  { id: "pipeline",            label: "Pipeline" },
  { id: "capture-prompts",     label: "Capture prompts" },
  { id: "figma-plugin",        label: "Figma plugin" },
  { id: "color-primitives",    label: "Color · Primitives" },
  { id: "color-semantic",      label: "Color · Semantic" },
  { id: "spacing",             label: "Spacing" },
  { id: "radius-shadow",       label: "Radius · Shadow" },
  { id: "typography",          label: "Typography" },
  { id: "dashboard-parity",    label: "Dashboard parity" },
  { id: "token-compliance",    label: "Token compliance" },
  { id: "component-inventory", label: "Component inventory" },
  { id: "screen-inventory",    label: "Screen inventory" },
];

const ALL_IDS = new Set(HUB_SECTIONS.map((s) => s.id));

// ─── View presets ─────────────────────────────────────────────────────────────

export type PresetId = "all" | "ios-dev" | "designer" | "none" | "custom";

interface Preset {
  id: PresetId;
  label: string;
  sections: Set<string>;
}

export const PRESETS: Preset[] = [
  {
    id: "all",
    label: "All",
    sections: new Set(ALL_IDS),
  },
  {
    id: "none",
    label: "None",
    sections: new Set(),
  },
  {
    id: "ios-dev",
    label: "iOS dev",
    sections: new Set([
      "purpose",
      "changelog",
      "getting-started",
      "pipeline",
      "screen-inventory",
      "color-primitives",
      "color-semantic",
      "spacing",
      "radius-shadow",
      "typography",
      "dashboard-parity",
      "component-inventory",
    ]),
  },
  {
    id: "designer",
    label: "Designer",
    sections: new Set([
      "purpose",
      "changelog",
      "pipeline",
      "capture-prompts",
      "figma-plugin",
      "screen-inventory",
      "color-primitives",
      "color-semantic",
      "spacing",
      "radius-shadow",
      "typography",
      "token-compliance",
      "component-inventory",
    ]),
  },
];

function detectPreset(visible: Set<string>): PresetId {
  for (const preset of PRESETS) {
    if (
      preset.sections.size === visible.size &&
      Array.from(preset.sections).every((id) => visible.has(id))
    ) {
      return preset.id;
    }
  }
  return "custom";
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface SectionContextValue {
  visible: Set<string>;
  toggle: (id: string) => void;
  applyPreset: (id: PresetId) => void;
}

const SectionContext = createContext<SectionContextValue>({
  visible: ALL_IDS,
  toggle: () => {},
  applyPreset: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function HubSectionProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState<Set<string>>(new Set(ALL_IDS));

  const toggle = useCallback((id: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const applyPreset = useCallback((id: PresetId) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (preset) setVisible(new Set(preset.sections));
  }, []);

  return (
    <SectionContext.Provider value={{ visible, toggle, applyPreset }}>
      {children}
    </SectionContext.Provider>
  );
}

// ─── Sticky nav ───────────────────────────────────────────────────────────────

export function HubNav() {
  const { visible, toggle, applyPreset } = useContext(SectionContext);
  const activePreset = detectPreset(visible);

  return (
    <div className="sticky top-0 z-20 border-b border-stroke-muted bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-[1200px] px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">

          {/* View preset dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-text-muted">View</span>
            <select
              value={activePreset}
              onChange={(e) => applyPreset(e.target.value as PresetId)}
              className="cursor-pointer rounded border border-stroke-muted bg-surface-subtle px-2 py-1 text-xs text-text-primary outline-none focus:border-stroke-strong"
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
              {activePreset === "custom" && (
                <option value="custom" disabled>Custom</option>
              )}
            </select>
          </div>

          <div className="h-3 w-px bg-stroke-muted shrink-0" />

          {/* Section checkboxes */}
          {HUB_SECTIONS.map((section) => {
            const checked = visible.has(section.id);
            return (
              <label
                key={section.id}
                className="flex cursor-pointer items-center gap-1.5"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(section.id)}
                  className="h-3.5 w-3.5 cursor-pointer accent-foreground"
                />
                <span className={`text-xs transition-colors ${checked ? "text-text-primary" : "text-text-muted line-through"}`}>
                  {section.label}
                </span>
              </label>
            );
          })}

        </div>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

export function HubSection({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { visible } = useContext(SectionContext);
  if (!visible.has(id)) return null;
  return <>{children}</>;
}
