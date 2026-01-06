"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import type { DeliverableComponentProps } from "./index";

// Color ramp stops (matching the design token reference)
const RAMP_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const RECOMMENDED_STOPS = [100, 500, 900];

type ColorRamp = {
  name: string; // e.g., "Primary", "Secondary"
  baseColor: string; // The 500 shade hex
  shades: Record<number, string>; // { 50: "#F5F9FF", 100: "#EBF2FE", ... }
};

type NeutralColor = {
  name: string;
  hex: string;
};

type UIStateColor = {
  name: string;
  hex: string;
  usage: string;
};

type ColorPaletteData = {
  brandColors?: ColorRamp[];
  neutrals?: NeutralColor[];
  uiStates?: UIStateColor[];
  // Legacy support
  colors?: Array<{ name: string; hex: string; usage?: string }>;
};

// =====================================================
// DEFAULT PALETTE - Based on Design Token Reference
// =====================================================
const DEFAULT_BRAND_COLORS: ColorRamp[] = [
  {
    name: "Primary",
    baseColor: "#3B82F6",
    shades: {
      50: "#F5F9FF",
      100: "#EBF2FE",
      200: "#D8E6FD",
      300: "#C4DAFC",
      400: "#B1CDFB",
      500: "#3B82F6",
      600: "#3575DD",
      700: "#2C62B8",
      800: "#234E94",
      900: "#1B3A6F",
      950: "#12274A",
    },
  },
  {
    name: "Secondary",
    baseColor: "#F59E0B",
    shades: {
      50: "#FEFAF3",
      100: "#FEF5E7",
      200: "#FDECCE",
      300: "#FCE2B6",
      400: "#FBD89D",
      500: "#F59E0B",
      600: "#DC8E0A",
      700: "#B87608",
      800: "#935F07",
      900: "#6E4705",
      950: "#4A2F03",
    },
  },
  {
    name: "Tertiary",
    baseColor: "#10B981",
    shades: {
      50: "#F3FCF9",
      100: "#E7F8F2",
      200: "#CFF1E6",
      300: "#B7EAD9",
      400: "#9FE3CD",
      500: "#10B981",
      600: "#0EA674",
      700: "#0C8B61",
      800: "#0A6F4D",
      900: "#07533A",
      950: "#053827",
    },
  },
];

const DEFAULT_NEUTRALS: NeutralColor[] = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Gray 50", hex: "#F9FAFB" },
  { name: "Gray 100", hex: "#F3F4F6" },
  { name: "Gray 300", hex: "#D1D5DB" },
  { name: "Gray 500", hex: "#6B7280" },
  { name: "Gray 700", hex: "#374151" },
  { name: "Gray 900", hex: "#111827" },
];

const DEFAULT_UI_STATES: UIStateColor[] = [
  { name: "Success Primary", hex: "#10B981", usage: "Positive feedback, confirmations" },
  { name: "Success Secondary", hex: "#07533A", usage: "Success text, dark mode emphasis" },
  { name: "Fail Primary", hex: "#EF4444", usage: "Errors, destructive actions" },
  { name: "Fail Secondary", hex: "#7F1D1D", usage: "Error text, dark mode emphasis" },
];

const DEFAULT_PALETTE: ColorPaletteData = {
  brandColors: DEFAULT_BRAND_COLORS,
  neutrals: DEFAULT_NEUTRALS,
  uiStates: DEFAULT_UI_STATES,
};

function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

function getContrastColor(hex: string): string {
  const color = hex.replace("#", "");
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

// Generate a color ramp from a base color (500 shade)
function generateRamp(baseHex: string): Record<number, string> {
  // This is a simplified ramp generator - in production you'd use a proper color library
  const base = baseHex.replace("#", "");
  const r = parseInt(base.substr(0, 2), 16);
  const g = parseInt(base.substr(2, 2), 16);
  const b = parseInt(base.substr(4, 2), 16);
  
  const shades: Record<number, string> = {};
  
  RAMP_STOPS.forEach(stop => {
    let factor: number;
    if (stop < 500) {
      // Lighter shades
      factor = 1 + (500 - stop) / 500 * 0.8;
    } else if (stop > 500) {
      // Darker shades
      factor = 1 - (stop - 500) / 500 * 0.7;
    } else {
      factor = 1;
    }
    
    const newR = Math.min(255, Math.max(0, Math.round(stop < 500 ? r + (255 - r) * (1 - factor) : r * factor)));
    const newG = Math.min(255, Math.max(0, Math.round(stop < 500 ? g + (255 - g) * (1 - factor) : g * factor)));
    const newB = Math.min(255, Math.max(0, Math.round(stop < 500 ? b + (255 - b) * (1 - factor) : b * factor)));
    
    shades[stop] = `#${newR.toString(16).padStart(2, '0').toUpperCase()}${newG.toString(16).padStart(2, '0').toUpperCase()}${newB.toString(16).padStart(2, '0').toUpperCase()}`;
  });
  
  shades[500] = baseHex.toUpperCase();
  return shades;
}

function ColorSwatch({ 
  hex, 
  label, 
  sublabel,
  onCopy 
}: { 
  hex: string; 
  label: string; 
  sublabel?: string;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(hex);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden bg-white dark:bg-black text-left transition hover:border-black/30 dark:hover:border-white/30 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
    >
      <div
        className="h-11 flex items-end justify-end p-1.5"
        style={{ backgroundColor: hex }}
      >
        {copied && (
          <span 
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/20"
            style={{ color: getContrastColor(hex) }}
          >
            Copied!
          </span>
        )}
      </div>
      <div className="px-2.5 py-2 space-y-0.5">
        <span className="block text-xs font-semibold text-text-primary truncate">
          {label}
        </span>
        <span className="block text-[11px] font-mono text-text-muted">
          {sublabel || hex}
        </span>
      </div>
    </button>
  );
}

/**
 * Color Palette Component
 * Design token-based color system with ramps, neutrals, and UI states.
 */
export default function ColorPaletteComponent({
  data,
  isEditable,
  onChange,
  mode,
}: DeliverableComponentProps) {
  const paletteData = (data as ColorPaletteData) || {};
  const brandColors = paletteData.brandColors || [];
  const neutrals = paletteData.neutrals || [];
  const uiStates = paletteData.uiStates || [];
  const legacyColors = paletteData.colors || [];
  
  const [showFullRamp, setShowFullRamp] = useState(false);
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandHex, setNewBrandHex] = useState("#");
  const [addError, setAddError] = useState<string | null>(null);

  const t = {
    heading: getTypographyClassName("h4"),
    subheading: `${getTypographyClassName("subtitle-sm")} text-text-primary`,
    body: `${getTypographyClassName("body-sm")} text-text-secondary`,
    mono: `${getTypographyClassName("mono-sm")}`,
    label: `${getTypographyClassName("mono-sm")} text-text-muted uppercase tracking-wide text-xs`,
  };

  const displayStops = showFullRamp ? RAMP_STOPS : RECOMMENDED_STOPS;

  const handleAddBrandColor = () => {
    if (!newBrandName.trim()) {
      setAddError("Name is required");
      return;
    }
    if (!isValidHex(newBrandHex)) {
      setAddError("Please enter a valid hex color (e.g., #3B82F6)");
      return;
    }

    const newRamp: ColorRamp = {
      name: newBrandName.trim(),
      baseColor: newBrandHex.toUpperCase(),
      shades: generateRamp(newBrandHex),
    };

    onChange?.({
      ...paletteData,
      brandColors: [...brandColors, newRamp],
    });
    setNewBrandName("");
    setNewBrandHex("#");
    setIsAddingBrand(false);
    setAddError(null);
  };

  const handleRemoveBrandColor = (index: number) => {
    const updated = brandColors.filter((_, i) => i !== index);
    onChange?.({ ...paletteData, brandColors: updated });
  };

  const handleAddNeutral = () => {
    onChange?.({ ...paletteData, neutrals: DEFAULT_NEUTRALS });
  };

  const handleAddUIStates = () => {
    onChange?.({ ...paletteData, uiStates: DEFAULT_UI_STATES });
  };

  const hasData = brandColors.length > 0 || neutrals.length > 0 || uiStates.length > 0 || legacyColors.length > 0;

  const handleInitializeDefaults = () => {
    onChange?.(DEFAULT_PALETTE);
  };

  if (!hasData && !isEditable) {
    return (
      <div className="rounded-xl border border-dashed border-black/20 dark:border-white/20 p-8 text-center space-y-3">
        <div className="text-4xl">🎨</div>
        <p className={t.body}>No color palette defined yet.</p>
      </div>
    );
  }

  // Empty state with option to initialize defaults (editable mode)
  if (!hasData && isEditable) {
    return (
      <div className="rounded-xl border border-dashed border-black/20 dark:border-white/20 p-8 text-center space-y-4">
        <div className="text-4xl">🎨</div>
        <div className="space-y-2">
          <p className={`${t.heading} text-text-primary`}>Start Your Color Palette</p>
          <p className={t.body}>
            Initialize with our default design tokens, or start from scratch.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <button
            onClick={handleInitializeDefaults}
            className="inline-flex items-center gap-2 rounded-md bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Initialize with Defaults
          </button>
          <button
            onClick={() => setIsAddingBrand(true)}
            className="inline-flex items-center gap-2 rounded-md border border-black/15 dark:border-white/15 px-5 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            Start from Scratch
          </button>
        </div>
        <p className={`${t.body} text-xs pt-4`}>
          Default palette includes: Primary, Secondary, Tertiary brand colors (11 shades each), 
          7 neutrals, and 4 UI state colors.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* View Toggle */}
      {brandColors.length > 0 && (
        <div className="flex items-center justify-between">
          <p className={t.label}>Palette View</p>
          <div className="flex rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
            <button
              onClick={() => setShowFullRamp(false)}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                !showFullRamp
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              Recommended
            </button>
            <button
              onClick={() => setShowFullRamp(true)}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                showFullRamp
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              Full Ramp
            </button>
          </div>
        </div>
      )}

      {/* Brand Colors */}
      {brandColors.map((ramp, rampIndex) => (
        <div key={`brand-${rampIndex}`} className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className={t.heading}>
              Brand · {ramp.name} <span className="text-text-muted font-normal">(50 → 950)</span>
            </h4>
            {isEditable && mode === "sprint" && (
              <button
                onClick={() => handleRemoveBrandColor(rampIndex)}
                className="text-xs text-text-muted hover:text-red-600 transition"
              >
                Remove
              </button>
            )}
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {displayStops.map((stop) => (
              <ColorSwatch
                key={`${ramp.name}-${stop}`}
                hex={ramp.shades[stop] || ramp.baseColor}
                label={`${ramp.name.toLowerCase()}-${stop}`}
                sublabel={ramp.shades[stop]}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Neutrals */}
      {neutrals.length > 0 && (
        <div className="space-y-3">
          <h4 className={t.heading}>
            Neutrals <span className="text-text-muted font-normal">(Light → Dark)</span>
          </h4>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {neutrals.map((neutral, i) => (
              <ColorSwatch
                key={`neutral-${i}`}
                hex={neutral.hex}
                label={neutral.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* UI States */}
      {uiStates.length > 0 && (
        <div className="space-y-3">
          <h4 className={t.heading}>UI States</h4>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {uiStates.map((state, i) => (
              <div
                key={`state-${i}`}
                className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden bg-white dark:bg-black"
              >
                <div
                  className="h-11"
                  style={{ backgroundColor: state.hex }}
                />
                <div className="px-2.5 py-2 space-y-1">
                  <span className="block text-xs font-semibold text-text-primary">
                    {state.name}
                  </span>
                  <span className="block text-[11px] font-mono text-text-muted">
                    {state.hex}
                  </span>
                  {state.usage && (
                    <span className="block text-[10px] text-text-muted">
                      {state.usage}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy colors (backward compatibility) */}
      {legacyColors.length > 0 && brandColors.length === 0 && (
        <div className="space-y-3">
          <h4 className={t.heading}>Colors</h4>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {legacyColors.map((color, i) => (
              <ColorSwatch
                key={`legacy-${i}`}
                hex={color.hex}
                label={color.name}
                sublabel={color.usage}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Controls (Sprint mode only) */}
      {isEditable && mode === "sprint" && (
        <div className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
          {/* Add Brand Color */}
          {isAddingBrand ? (
            <div className="space-y-3 p-4 rounded-lg bg-black/5 dark:bg-white/5">
              <p className={t.label}>Add Brand Color</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={t.label}>Name</label>
                  <input
                    type="text"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="Primary"
                    className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className={t.label}>Base Color (500)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBrandHex}
                      onChange={(e) => setNewBrandHex(e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1 rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm font-mono"
                    />
                    <input
                      type="color"
                      value={isValidHex(newBrandHex) ? newBrandHex : "#3B82F6"}
                      onChange={(e) => setNewBrandHex(e.target.value)}
                      className="w-10 h-10 rounded-md border border-black/15 dark:border-white/15 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              
              {addError && (
                <p className="text-sm text-red-600 dark:text-red-400">{addError}</p>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={handleAddBrandColor}
                  className="rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90"
                >
                  Add Brand Color
                </button>
                <button
                  onClick={() => {
                    setIsAddingBrand(false);
                    setNewBrandName("");
                    setNewBrandHex("#");
                    setAddError(null);
                  }}
                  className="rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsAddingBrand(true)}
                className="inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span>+</span>
                <span>Add Brand Color</span>
              </button>
              
              {neutrals.length === 0 && (
                <button
                  onClick={handleAddNeutral}
                  className="inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <span>+</span>
                  <span>Add Neutrals</span>
                </button>
              )}
              
              {uiStates.length === 0 && (
                <button
                  onClick={handleAddUIStates}
                  className="inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <span>+</span>
                  <span>Add UI States</span>
                </button>
              )}

              {/* Reset to defaults option */}
              <button
                onClick={handleInitializeDefaults}
                className="inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 text-text-muted"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reset to Defaults</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Usage Note */}
      {brandColors.length > 0 && (
        <p className={`${t.body} text-xs pt-2 border-t border-black/10 dark:border-white/10`}>
          <strong>Tip:</strong> Use 500 for defaults, lighter shades (100-300) for surfaces, darker shades (700-900) for hover, focus, and emphasis.
        </p>
      )}

      {/* Template mode message */}
      {mode === "template" && brandColors.length === 0 && neutrals.length === 0 && (
        <div className="rounded-lg bg-black/5 dark:bg-white/5 p-4 text-center space-y-3">
          <p className={t.body}>
            This is the template for Color Palette deliverables. Sprint-specific colors will be added when this deliverable is used in a sprint.
          </p>
          {isEditable && (
            <button
              onClick={handleInitializeDefaults}
              className="inline-flex items-center gap-2 rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Initialize with Default Palette
            </button>
          )}
        </div>
      )}
    </div>
  );
}
