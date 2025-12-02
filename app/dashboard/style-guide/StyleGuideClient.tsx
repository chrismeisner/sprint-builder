"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  fontTokens,
  typographyScale,
  brandColors,
  semanticColors,
  opacityScale,
  spacingScale,
  borderRadiusTokens,
  gapTokens,
} from "@/lib/design-system/tokens";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import type { FontToken } from "@/lib/design-system/tokens";
import WidthRuler from "@/components/WidthRuler";
import Button from "@/components/ui/Button";
import Typography from "@/components/ui/Typography";
import Badge from "@/components/ui/Badge";
import GridPreviewCard from "./GridPreviewCard";
import useSampleTextEditor from "@/hooks/useSampleTextEditor";

type TabType = "typography" | "buttons" | "colors" | "forms" | "grids" | "spacing";
type TypographyViewport = "desktop" | "mobile";
type GridExampleBlock = {
  label: string;
  className: string;
  helper?: string;
};

type GridExample = {
  id: string;
  title: string;
  description: string;
  classes: string;
  previewBlocks: GridExampleBlock[];
  rules: string[];
};

type GridBreakpointRule = {
  id: string;
  minWidth: string;
  behavior: string;
  utilities: string;
};

type GridBuilderMode = "auto" | "manual";

type GridBuilderConfig = {
  mode: GridBuilderMode;
  cardCount: number;
  gapId: string;
  paddingId: string;
  widthId: string;
  autoTemplateId: string;
  manualSpanId: string;
};

type GridGapOption = {
  id: string;
  label: string;
  className: string;
};

type GridPaddingOption = {
  id: string;
  label: string;
  className: string;
};

type GridWidthOption = {
  id: string;
  label: string;
  className: string;
  helper?: string;
};

type GridAutoTemplateOption = {
  id: string;
  label: string;
  className: string;
};

type GridManualSpanOption = {
  id: string;
  label: string;
  className: string;
};

type TypographyScaleId = (typeof typographyScale)[number]["id"];

const TRACKING_MIN = -0.1;
const TRACKING_MAX = 0.1;
const TRACKING_STEP = 0.005;
const LINE_HEIGHT_MIN = 0.8;
const LINE_HEIGHT_MAX = 2;
const LINE_HEIGHT_STEP = 0.05;

const GRID_PREVIEW_BLOCK_BASE_CLASS =
  "rounded-md border border-dashed border-black/15 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-3 flex flex-col gap-1 justify-center";

const GRID_CARD_COUNT_MIN = 1;
const GRID_CARD_COUNT_MAX = 12;

const GRID_GAP_OPTIONS: GridGapOption[] = [
  { id: "gap-2", label: "gap-2 · 8px", className: "gap-2" },
  { id: "gap-3", label: "gap-3 · 12px", className: "gap-3" },
  { id: "gap-4", label: "gap-4 · 16px", className: "gap-4" },
  { id: "gap-5", label: "gap-5 · 20px", className: "gap-5" },
  { id: "gap-6", label: "gap-6 · 24px (default)", className: "gap-6" },
  { id: "gap-8", label: "gap-8 · 32px", className: "gap-8" },
  { id: "gap-10", label: "gap-10 · 40px", className: "gap-10" },
  { id: "gap-12", label: "gap-12 · 48px", className: "gap-12" },
];

const GRID_PADDING_OPTIONS: GridPaddingOption[] = [
  { id: "flush", label: "Flush · px-0", className: "px-0" },
  { id: "micro", label: "Micro · px-2 sm:px-3", className: "px-2 sm:px-3" },
  { id: "tight", label: "Tight · px-3 sm:px-4", className: "px-3 sm:px-4" },
  { id: "compact", label: "Compact · px-4 sm:px-6", className: "px-4 sm:px-6" },
  { id: "default", label: "Default · px-6 lg:px-8", className: "px-6 lg:px-8" },
  { id: "spacious", label: "Spacious · px-7 lg:px-10", className: "px-7 lg:px-10" },
  { id: "roomy", label: "Roomy · px-8 lg:px-12", className: "px-8 lg:px-12" },
];

const GRID_WIDTH_OPTIONS: GridWidthOption[] = [
  { id: "auto", label: "Auto (inherit parent)", className: "w-full" },
  { id: "max-w-2xl", label: "2xl (42rem / 672px)", className: "w-full max-w-2xl mx-auto" },
  { id: "max-w-3xl", label: "3xl (48rem / 768px)", className: "w-full max-w-3xl mx-auto" },
  { id: "max-w-4xl", label: "4xl (64rem / 1024px)", className: "w-full max-w-4xl mx-auto", helper: "Great for focused forms" },
  { id: "max-w-5xl", label: "5xl (80rem / 1280px)", className: "w-full max-w-5xl mx-auto" },
  { id: "max-w-6xl", label: "6xl (96rem / 1536px)", className: "w-full max-w-6xl mx-auto" },
  { id: "max-w-7xl", label: "7xl (112rem / 1792px)", className: "w-full max-w-7xl mx-auto" },
  { id: "container", label: "Tailwind container (fluid)", className: "container mx-auto" },
];

const GRID_AUTO_TEMPLATE_OPTIONS: GridAutoTemplateOption[] = [
  { id: "auto-8", label: "8rem (128px)", className: "grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]" },
  { id: "auto-10", label: "10rem (160px)", className: "grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]" },
  { id: "auto-12", label: "12rem (192px)", className: "grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]" },
  { id: "auto-14", label: "14rem (224px)", className: "grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]" },
  { id: "auto-16", label: "16rem (256px)", className: "grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]" },
  { id: "auto-18", label: "18rem (288px)", className: "grid-cols-[repeat(auto-fit,minmax(18rem,1fr))]" },
  { id: "auto-20", label: "20rem (320px)", className: "grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]" },
];

const GRID_MANUAL_SPAN_OPTIONS: GridManualSpanOption[] = [
  { id: "12", label: "Full width (12/12)", className: "col-span-12" },
  { id: "8", label: "Content rail (8/12)", className: "col-span-12 md:col-span-8" },
  { id: "6", label: "Balanced split (6/12)", className: "col-span-12 md:col-span-6" },
  { id: "4", label: "Cards (4/12)", className: "col-span-12 md:col-span-4" },
  { id: "3", label: "Tiles (3/12)", className: "col-span-12 md:col-span-3" },
];

const gridGuidelines = [
  "Wrap all dashboard surfaces with `container max-w-7xl` so the page width lines up with the global chrome.",
  "The primary layout is a 12-column grid from `md` upward; at smaller widths everything snaps to `col-span-12` for readability.",
  "`gap-6` (24px) is the default gutter for app views. Use `gap-4` on dense tables and `xl:gap-8` on expressive marketing-style sections.",
  "Keep core reading experiences within `col-span-8` (≈ 768px) to maintain comfortable line lengths.",
  "For flowing card rails, prefer auto-fit grids (`grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]`) so tiles wrap cleanly without custom media queries.",
];

const gridBreakpointRules: GridBreakpointRule[] = [
  {
    id: "Base",
    minWidth: "0 – 639px",
    behavior: "Single column stack, full-width cards and forms.",
    utilities: "grid-cols-1 gap-4 px-4",
  },
  {
    id: "sm",
    minWidth: "≥ 640px",
    behavior: "Introduce 2-up cards or metrics, maintain generous gutters.",
    utilities: "sm:grid-cols-2 sm:gap-5",
  },
  {
    id: "md",
    minWidth: "≥ 768px",
    behavior: "Switch to the structural 12-column grid for layout control.",
    utilities: "md:grid-cols-12 md:gap-6",
  },
  {
    id: "lg",
    minWidth: "≥ 1024px",
    behavior: "Enable sidebar rails, sticky helpers, and 8/4 splits.",
    utilities: "lg:col-span-8 / lg:col-span-4",
  },
  {
    id: "xl+",
    minWidth: "≥ 1280px",
    behavior: "Clamp width with `max-w-7xl` and open gutters for 3-up grids.",
    utilities: "xl:gap-8 2xl:max-w-7xl",
  },
];

const gridExamples: GridExample[] = [
  {
    id: "page-grid",
    title: "Page Layout Grid (12 columns)",
    description: "Default dashboard layout that pairs full-width hero bands with content rails inside a centered container.",
    classes: "grid grid-cols-12 gap-4 sm:gap-6",
    previewBlocks: [
      { label: "Hero band", className: "col-span-12 min-h-[4rem]", helper: "col-span-12" },
      { label: "Primary content", className: "col-span-12 lg:col-span-8 min-h-[5rem]", helper: "lg:col-span-8" },
      { label: "Sidebar rail", className: "col-span-12 lg:col-span-4 min-h-[5rem]", helper: "lg:col-span-4" },
      { label: "Full width meta", className: "col-span-12 min-h-[3.5rem]", helper: "col-span-12" },
    ],
    rules: [
      "Use `container max-w-7xl px-6 lg:px-8` to align with the global shell.",
      "Primary content stays within `lg:col-span-8` to keep line length under ~90 characters.",
      "Bump to `xl:gap-8` when the page has large hero photography or storytelling moments.",
    ],
  },
  {
    id: "balanced-split",
    title: "Balanced Content Split (7 / 5)",
    description: "Common for forms and editors where supporting guidance lives beside the main task.",
    classes: "grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start",
    previewBlocks: [
      { label: "Form stack", className: "col-span-12 md:col-span-7 min-h-[5rem]", helper: "md:col-span-7" },
      { label: "Support panel", className: "col-span-12 md:col-span-5 min-h-[5rem]", helper: "md:col-span-5" },
      { label: "Inline helpers", className: "col-span-12 md:col-span-5 min-h-[4rem]", helper: "md:col-span-5" },
    ],
    rules: [
      "Switch to a 12-column grid at `md` so stacked content still respects the 7/5 split on tablets.",
      "Keep interactive forms at `md:col-span-7` (≈ 700px) for comfortable scanning and to leave room for contextual content.",
      "Align action rows using shared gutters so buttons on both columns sit on the same baseline.",
    ],
  },
  {
    id: "card-grid",
    title: "Responsive Card Grid",
    description: "Used on deliverables, packages, and resources to display tiles that scale with available width.",
    classes: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6",
    previewBlocks: Array.from({ length: 6 }, (_, index) => ({
      label: `Card ${index + 1}`,
      className: "min-h-[4.5rem]",
      helper: "auto column",
    })),
    rules: [
      "Base view stacks cards, `sm` unlocks 2-up, and `xl` enables three columns for dense surfaces.",
      "Use `gap-6` for parity with container padding and drop to `gap-4` on very dense dashboards.",
      "Cards grow vertically with their content; keep metrics consistent by bounding titles to two lines.",
    ],
  },
];

const defaultFontSize = "2.75rem";
const defaultSampleText = "The quick brown fox jumps over the lazy dog";

const clampTrackingValue = (value: number) => Math.min(TRACKING_MAX, Math.max(TRACKING_MIN, value));
const formatTrackingValue = (value: number) => `${value.toFixed(3)}em`;
const clampLineHeightValue = (value: number) => Math.min(LINE_HEIGHT_MAX, Math.max(LINE_HEIGHT_MIN, value));
const formatLineHeightValue = (value: number) => value.toFixed(2);

const FontFamilyCard = ({ token }: { token: FontToken }) => {
  const [selectedVariantId, setSelectedVariantId] = useState(token.variants[0]?.id ?? "");
  const [trackingValue, setTrackingValue] = useState(0);
  const [lineHeightValue, setLineHeightValue] = useState(1.1);
  const [lineFontSize, setLineFontSize] = useState(defaultFontSize);
  const [sampleInput, setSampleInput] = useState(defaultSampleText);
  const [sampleLine, setSampleLine] = useState(defaultSampleText);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [selectedTypographyId, setSelectedTypographyId] = useState<TypographyScaleId>("display-lg");
  const sampleTextEditor = useSampleTextEditor();

  const activeVariant = token.variants.find((variant) => variant.id === selectedVariantId) ?? token.variants[0];
  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeoutId = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  const handleTrackingInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = Number(event.target.value);
    if (Number.isNaN(numericValue)) {
      return;
    }
    setTrackingValue(clampTrackingValue(parseFloat(numericValue.toFixed(3))));
  };

  const handleLineHeightInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = Number(event.target.value);
    if (Number.isNaN(numericValue)) {
      return;
    }
    setLineHeightValue(clampLineHeightValue(parseFloat(numericValue.toFixed(2))));
  };

  const handleSampleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSampleLine(sampleInput.trim() || defaultSampleText);
  };

  const resetSample = () => {
    setSampleInput(defaultSampleText);
    setSampleLine(defaultSampleText);
  };

  const openSampleEditor = () => {
    sampleTextEditor.openEditor({
      label: token.label,
      initialValue: sampleLine,
      onSubmit: (value) => {
        setSampleInput(value);
        setSampleLine(value);
      },
    });
  };

  const applyTypographyPreset = (newId: TypographyScaleId) => {
    setSelectedTypographyId(newId);
    const preset = typographyScale.find((scale) => scale.id === newId);
    if (!preset) {
      return;
    }
    if (preset.desktop.rem) {
      setLineFontSize(preset.desktop.rem);
    }
    const numericLineHeight = parseFloat(preset.desktop.lineHeight.replace(/[^\d.]/g, ""));
    if (!Number.isNaN(numericLineHeight)) {
      setLineHeightValue(clampLineHeightValue(numericLineHeight));
    }
  };

  useEffect(() => {
    applyTypographyPreset("display-lg");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyStyleToClipboard = async () => {
    const styleSummary = [
      `Font family: ${token.label}`,
      `Variant: ${activeVariant?.label ?? "Default"}`,
      `Tailwind base: ${token.tailwindClass}`,
      `Variant classes: ${activeVariant?.className ?? "n/a"}`,
      `Font size: ${lineFontSize || defaultFontSize}`,
      `Line height: ${formatLineHeightValue(lineHeightValue)}`,
      `Letter spacing: ${formatTrackingValue(trackingValue)}`,
      `Sample text: ${sampleLine}`,
    ].join("\n");

    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(styleSummary);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = styleSummary;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopyStatus("copied");
    } catch (error) {
      console.error("Failed to copy style summary", error);
      setCopyStatus("error");
    }
  };

  const sampleParams = new URLSearchParams({
    text: sampleLine,
    fontClass: activeVariant?.className ?? token.baseClass,
    fontSize: lineFontSize || defaultFontSize,
    lineHeight: lineHeightValue.toFixed(2),
    letterSpacing: trackingValue.toFixed(3),
    label: token.label,
  });

  const sampleLink = `/dashboard/style-guide/sample?${sampleParams.toString()}`;

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between 2xl:gap-8">
        <div>
          <p className="text-sm font-semibold tracking-wide opacity-60">{token.label}</p>
        </div>
        <div className="w-full space-y-4">
          <form onSubmit={handleSampleSubmit} className="w-full sm:w-auto">
            <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide opacity-80">
              Sample text
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={sampleInput}
                  onChange={(event) => setSampleInput(event.target.value)}
                  className="flex-1 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm font-normal"
                  placeholder={defaultSampleText}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-3 py-2 text-xs font-semibold hover:opacity-90 transition whitespace-nowrap"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={resetSample}
                    className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition whitespace-nowrap"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </label>
          </form>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide opacity-80 w-full lg:flex-1">
              Apply typography scale
              <select
                value={selectedTypographyId}
                onChange={(event) => applyTypographyPreset(event.target.value as TypographyScaleId)}
                className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm font-normal normal-case opacity-100"
              >
                {typographyScale.map((scaleToken) => (
                  <option key={scaleToken.id} value={scaleToken.id}>
                    {scaleToken.label}
                  </option>
                ))}
              </select>
            </label>
            {token.variants.length > 1 ? (
              <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide opacity-80 w-full lg:flex-1">
                Variant
                <select
                  value={activeVariant?.id}
                  onChange={(event) => setSelectedVariantId(event.target.value)}
                  className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm font-normal normal-case opacity-100"
                >
                  {token.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="text-xs font-semibold tracking-wide opacity-70 w-full lg:flex-1">{activeVariant?.label}</div>
            )}

            <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide opacity-80 w-full lg:max-w-[10rem]">
              Tracking (em)
              <input
                type="number"
                step={TRACKING_STEP}
                min={TRACKING_MIN}
                max={TRACKING_MAX}
                value={trackingValue.toFixed(3)}
                onChange={handleTrackingInput}
                className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm font-medium"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide opacity-80 w-full lg:max-w-[10rem]">
              Line height
              <input
                type="number"
                step={LINE_HEIGHT_STEP}
                min={LINE_HEIGHT_MIN}
                max={LINE_HEIGHT_MAX}
                value={lineHeightValue.toFixed(2)}
                onChange={handleLineHeightInput}
                className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm font-medium"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide opacity-80 w-full lg:max-w-[10rem]">
              Size (rem)
              <input
                type="number"
                step={0.05}
                min={0}
                value={parseFloat(lineFontSize) || parseFloat(defaultFontSize)}
                onChange={(event) => {
                  const numericValue = Number(event.target.value);
                  setLineFontSize(Number.isNaN(numericValue) ? defaultFontSize : `${numericValue}rem`);
                }}
                className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm font-medium"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:justify-end">
              <a
                href={sampleLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-black/5 dark:hover:bg-white/10 transition whitespace-nowrap"
              >
                Create sample
              </a>
              <button
                type="button"
                onClick={copyStyleToClipboard}
                className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-black/5 dark:hover:bg-white/10 transition whitespace-nowrap"
              >
                Copy style
              </button>
              <span
                aria-live="polite"
                className={`text-xs font-semibold ${
                  copyStatus === "copied"
                    ? "text-green-600 dark:text-green-400"
                    : copyStatus === "error"
                      ? "text-red-600 dark:text-red-400"
                      : "sr-only"
                }`}
              >
                {copyStatus === "copied" ? "Copied!" : copyStatus === "error" ? "Copy failed" : "Status idle"}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={openSampleEditor}
          className="w-full rounded-md border border-transparent text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-2 dark:focus-visible:ring-white/60"
          title="Click to edit sample text"
        >
          <div className="px-5 py-4">
            <p
              className={`${activeVariant?.className ?? token.baseClass} opacity-90`}
              style={{
                letterSpacing: formatTrackingValue(trackingValue),
                fontSize: lineFontSize || defaultFontSize,
                lineHeight: lineHeightValue,
              }}
            >
              {sampleLine}
            </p>
          </div>
        </button>
      </div>
      {sampleTextEditor.editorModal}
    </div>
  );
};

export default function StyleGuideClient() {
  const [selectedTab, setSelectedTab] = useState<TabType>("typography");
  const [typographyViewport, setTypographyViewport] = useState<TypographyViewport>("desktop");
  const [visibleFamilies, setVisibleFamilies] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(fontTokens.map((token) => [token.id, false])),
  );
  const [visibleTypography, setVisibleTypography] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(typographyScale.map((token) => [token.id, true])),
  );
  const [showTypographyDetails, setShowTypographyDetails] = useState(true);
  const [typographySampleText, setTypographySampleText] = useState(defaultSampleText);
  const [typographySampleOverrides, setTypographySampleOverrides] = useState<Record<string, string>>({});
  const [gridBuilderConfig, setGridBuilderConfig] = useState<GridBuilderConfig>({
    mode: "auto",
    cardCount: 6,
    gapId: GRID_GAP_OPTIONS[2]?.id ?? "gap-6",
    paddingId: GRID_PADDING_OPTIONS.find((option) => option.id === "default")?.id ?? GRID_PADDING_OPTIONS[0].id,
    widthId: GRID_WIDTH_OPTIONS.find((option) => option.id === "max-w-4xl")?.id ?? GRID_WIDTH_OPTIONS[0]?.id ?? "auto",
    autoTemplateId: GRID_AUTO_TEMPLATE_OPTIONS[1]?.id ?? GRID_AUTO_TEMPLATE_OPTIONS[0].id,
    manualSpanId: GRID_MANUAL_SPAN_OPTIONS[1]?.id ?? GRID_MANUAL_SPAN_OPTIONS[0].id,
  });
  const [gridBuilderCopyStatus, setGridBuilderCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const gridBuilderPreviewRef = useRef<HTMLDivElement>(null);
  const filteredTypographyScale = typographyScale.filter((token) => visibleTypography[token.id] ?? true);
  const hasVisibleTypographyTokens = filteredTypographyScale.length > 0;
  const typographySampleEditor = useSampleTextEditor();

  const openTypographyScaleSample = () => {
    if (!hasVisibleTypographyTokens) {
      return;
    }
    const params = new URLSearchParams();
    params.set("viewport", typographyViewport);
    params.set("text", typographySampleText.trim() || defaultSampleText);
    filteredTypographyScale.forEach((token) => {
      params.append("id", token.id);
    });
    const previewUrl = `/dashboard/style-guide/sample/typography?${params.toString()}`;
    if (typeof window !== "undefined") {
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    }
  };

  const resolveTypographySampleCopy = (tokenId?: string) => {
    const baseCopy = typographySampleText.trim() || defaultSampleText;
    if (!tokenId) {
      return baseCopy;
    }
    const overrideValue = typographySampleOverrides[tokenId];
    if (typeof overrideValue === "string" && overrideValue.trim().length > 0) {
      return overrideValue;
    }
    return baseCopy;
  };

  const openTypographySampleEditor = (tokenId: string) => {
    const token = typographyScale.find((scaleToken) => scaleToken.id === tokenId);
    if (!token) {
      return;
    }
    typographySampleEditor.openEditor({
      label: `${token.label} (${token.id})`,
      helperText: "Overrides only this style. Reset to use the shared sample.",
      textareaLabel: "Sample text",
      resetLabel: "Use shared sample",
      initialValue: resolveTypographySampleCopy(tokenId),
      onSubmit: (value) => {
        setTypographySampleOverrides((prev) => ({
          ...prev,
          [tokenId]: value,
        }));
      },
      onReset: () => {
        setTypographySampleOverrides((prev) => {
          const next = { ...prev };
          delete next[tokenId];
          return next;
        });
      },
    });
  };

  const toggleFamily = (id: string) => {
    setVisibleFamilies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedGapOption = GRID_GAP_OPTIONS.find((option) => option.id === gridBuilderConfig.gapId) ?? GRID_GAP_OPTIONS[0];
  const selectedPaddingOption =
    GRID_PADDING_OPTIONS.find((option) => option.id === gridBuilderConfig.paddingId) ?? GRID_PADDING_OPTIONS[0];
  const selectedWidthOption = GRID_WIDTH_OPTIONS.find((option) => option.id === gridBuilderConfig.widthId) ?? GRID_WIDTH_OPTIONS[0];
  const selectedAutoTemplate =
    GRID_AUTO_TEMPLATE_OPTIONS.find((option) => option.id === gridBuilderConfig.autoTemplateId) ?? GRID_AUTO_TEMPLATE_OPTIONS[0];
  const selectedManualSpan =
    GRID_MANUAL_SPAN_OPTIONS.find((option) => option.id === gridBuilderConfig.manualSpanId) ?? GRID_MANUAL_SPAN_OPTIONS[0];

  const gridBuilderContainerClasses =
    gridBuilderConfig.mode === "auto"
      ? `grid grid-cols-1 ${selectedGapOption.className} ${selectedAutoTemplate.className}`
      : `grid grid-cols-1 md:grid-cols-12 ${selectedGapOption.className}`;

  const gridBuilderCardClasses =
    gridBuilderConfig.mode === "auto" ? GRID_PREVIEW_BLOCK_BASE_CLASS : `${GRID_PREVIEW_BLOCK_BASE_CLASS} ${selectedManualSpan.className}`;

  const gridBuilderCardMetaLabel = gridBuilderConfig.mode === "auto" ? selectedAutoTemplate.label : selectedManualSpan.label;

  const gridBuilderCards = Array.from({ length: Math.min(Math.max(gridBuilderConfig.cardCount, GRID_CARD_COUNT_MIN), GRID_CARD_COUNT_MAX) }, (_, index) => index);

  const updateGridBuilderConfig = <K extends keyof GridBuilderConfig>(key: K, value: GridBuilderConfig[K]) => {
    setGridBuilderConfig((prev) => ({ ...prev, [key]: value }));
  };

  const gridBuilderSummaryLines = [
    `Container: ${gridBuilderContainerClasses}`,
    gridBuilderConfig.mode === "auto" ? `Auto template: ${selectedAutoTemplate.className}` : `Card span: ${selectedManualSpan.className}`,
    `Gap: ${selectedGapOption.className}`,
    `Padding: ${selectedPaddingOption.className}`,
    `Width: ${selectedWidthOption.className}`,
  ];

  const gridSampleParams = new URLSearchParams({
    mode: gridBuilderConfig.mode,
    cardCount: String(Math.min(Math.max(gridBuilderConfig.cardCount, GRID_CARD_COUNT_MIN), GRID_CARD_COUNT_MAX)),
    gapClass: selectedGapOption.className,
    paddingClass: selectedPaddingOption.className,
    widthClass: selectedWidthOption.className,
    autoTemplateClass: selectedAutoTemplate.className,
    autoLabel: selectedAutoTemplate.label,
    manualSpanClass: selectedManualSpan.className,
    manualLabel: selectedManualSpan.label,
  });
  const gridSampleLink = `/dashboard/style-guide/sample/grid?${gridSampleParams.toString()}`;

  useEffect(() => {
    if (gridBuilderCopyStatus === "idle") return;
    const timeoutId = window.setTimeout(() => setGridBuilderCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [gridBuilderCopyStatus]);

  const copyGridBuilderStyles = async () => {
    const summaryText = gridBuilderSummaryLines.join("\n");
    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(summaryText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = summaryText;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setGridBuilderCopyStatus("copied");
    } catch (error) {
      console.error("Failed to copy grid builder styles", error);
      setGridBuilderCopyStatus("error");
    }
  };

  const handleDownloadTypographyStyles = (viewport: TypographyViewport) => {
    try {
      const content = buildTypographyScaleExport(viewport);
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `typography-scale-${viewport}.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export typography styles", error);
    }
  };

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Design System Style Guide</h1>
        <p className="text-base opacity-70">
          A comprehensive reference for typography, colors, components, and design tokens used throughout the application.
        </p>
      </div>


      {/* Navigation Tabs */}
      <div className="border-b border-black/10 dark:border-white/15 mb-8">
        <nav className="flex gap-6">
          {[
            { id: "typography" as const, label: "Typography" },
            { id: "buttons" as const, label: "Buttons" },
            { id: "colors" as const, label: "Colors" },
            { id: "forms" as const, label: "Forms" },
            { id: "grids" as const, label: "Grids" },
            { id: "spacing" as const, label: "Spacing" },
            { id: "badges" as const, label: "Badges" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? "border-black dark:border-white text-black dark:text-white"
                  : "border-transparent text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Sections */}
      <div className="space-y-12">
        {/* Typography Section */}
        {selectedTab === "typography" && (
          <section>
            <div className="space-y-12">
              {/* Font Families */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Font Families
                </h2>
                <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] p-4 mb-6">
                  <p className="text-xs font-semibold tracking-wide opacity-70 mb-3">Show / hide families</p>
                  <div className="flex flex-wrap gap-4">
                    {fontTokens.map((token) => (
                      <label key={`toggle-${token.id}`} className="inline-flex items-center gap-2 text-sm font-medium opacity-80">
                        <input
                          type="checkbox"
                          checked={visibleFamilies[token.id] ?? true}
                          onChange={() => toggleFamily(token.id)}
                          className="h-4 w-4 rounded border border-black/20 dark:border-white/30 accent-black dark:accent-white"
                        />
                        {token.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {fontTokens.filter((token) => visibleFamilies[token.id] ?? true).map((token) => (
                    <FontFamilyCard key={token.id} token={token} />
                  ))}
                </div>
              </div>

              {/* Typography Scale */}
              <div>
                <div className="mb-4 pb-2 border-b border-black/10 dark:border-white/15 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-2xl font-semibold">Typography Scale</h2>
                  <div className="flex flex-col gap-2 text-xs font-semibold tracking-wide uppercase opacity-80 md:flex-row md:items-center md:gap-4">
                    <select
                      value={typographyViewport}
                      onChange={(event) => setTypographyViewport(event.target.value as TypographyViewport)}
                      className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-xs font-semibold text-black dark:text-white"
                    >
                      <option value="desktop">Desktop</option>
                      <option value="mobile">Mobile</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleDownloadTypographyStyles(typographyViewport)}
                      className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-xs font-semibold uppercase tracking-wide text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      Download styles
                    </button>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase opacity-80">
                      <input
                        type="checkbox"
                        checked={showTypographyDetails}
                        onChange={(event) => setShowTypographyDetails(event.target.checked)}
                        className="h-4 w-4 rounded border border-black/20 dark:border-white/30 accent-black dark:accent-white"
                      />
                      <span className="normal-case tracking-normal">Show details</span>
                    </label>
                  </div>
                </div>
                <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] p-4 mb-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-4 items-center">
                      <p className="text-xs font-semibold tracking-wide uppercase opacity-70">Show / hide scales</p>
                      <div className="flex gap-3 flex-wrap">
                        {typographyScale.map((token) => (
                          <label key={`typo-toggle-${token.id}`} className="inline-flex items-center gap-2 text-xs font-medium opacity-80">
                            <input
                              type="checkbox"
                              checked={visibleTypography[token.id] ?? true}
                              onChange={() =>
                                setVisibleTypography((prev) => ({
                                  ...prev,
                                  [token.id]: !(prev[token.id] ?? true),
                                }))
                              }
                              className="h-4 w-4 rounded border border-black/20 dark:border-white/30 accent-black dark:accent-white"
                            />
                            {token.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openTypographyScaleSample}
                      disabled={!hasVisibleTypographyTokens}
                      className="inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-xs font-semibold uppercase tracking-wide text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      See sample
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 p-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <label className="flex-1 text-xs font-semibold tracking-wide uppercase opacity-80 flex flex-col gap-2">
                    Sample text
                    <input
                      type="text"
                      value={typographySampleText}
                      onChange={(event) => setTypographySampleText(event.target.value)}
                      className="rounded-md border border-black/10 dark:border-white/20 bg-white dark:bg-black px-3 py-2 text-sm font-medium text-black dark:text-white"
                      placeholder={defaultSampleText}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTypographySampleText(defaultSampleText);
                      setTypographySampleOverrides({});
                    }}
                    className="mt-2 sm:mt-0 inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 text-xs font-semibold uppercase tracking-wide text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-6">
                  {filteredTypographyScale.map((token) => {
                    const viewportConfig = token[typographyViewport];
                    const lineHeightClass = viewportConfig.lineHeight ? `leading-[${viewportConfig.lineHeight}]` : "";
                    const previewCopy = resolveTypographySampleCopy(token.id);
                    const previewStyle = viewportConfig.lineHeight
                      ? ({
                          lineHeight: viewportConfig.lineHeight,
                        } as React.CSSProperties)
                      : undefined;
                    const styleSummaryParts = [`${token.fontFamily} [${token.fontWeight}]`];
                    if (viewportConfig.rem) {
                      styleSummaryParts.push(`Size [${viewportConfig.rem}]`);
                    } else if (viewportConfig.sizeClass) {
                      styleSummaryParts.push(`Size ${viewportConfig.sizeClass}`);
                    }
                    const trackingMatch = token.baseClass.match(/tracking-[^\s]+/);
                    if (trackingMatch) {
                      styleSummaryParts.push(`Tracking ${trackingMatch[0].replace("tracking-", "")}`);
                    }
                    if (viewportConfig.lineHeight) {
                      styleSummaryParts.push(`Line Height [${viewportConfig.lineHeight}]`);
                    }
                    const styleSummary = styleSummaryParts.join(" • ");
                    const cardWrapperClassName = showTypographyDetails
                      ? "p-6 rounded-lg border border-black/10 dark:border-white/15"
                      : "rounded-lg";
                    const sampleTextClasses = [token.baseClass, viewportConfig.sizeClass, lineHeightClass, showTypographyDetails ? "" : "py-1"]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <div key={token.id} className={cardWrapperClassName}>
                        {showTypographyDetails && (
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between mb-2">
                            <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded uppercase">{token.id}</code>
                            <span className="text-xs opacity-60">
                              {typographyViewport === "desktop" ? "Desktop" : "Mobile"} · {viewportConfig.pixels} / {viewportConfig.rem} · LH{" "}
                              {viewportConfig.lineHeight}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => openTypographySampleEditor(token.id)}
                          className="w-full rounded-md border border-transparent text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 dark:focus-visible:ring-white/50"
                          title="Click to edit sample text"
                        >
                          <span className={sampleTextClasses} style={previewStyle}>
                            {previewCopy}
                          </span>
                        </button>
                        {showTypographyDetails && <p className="mt-3 text-xs opacity-70">{styleSummary}</p>}
                      </div>
                    );
                  })}
                </div>
                {typographySampleEditor.editorModal}
              </div>

            </div>
          </section>
        )}

        {/* Buttons Section */}
        {selectedTab === "buttons" && (
          <section>
            <div className="space-y-12">
              {/* Primary Buttons */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Primary Buttons
                </h2>
                <p className="text-sm opacity-70 mb-4">Used for primary actions and call-to-actions</p>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <Button size="lg">Large Button</Button>
                      <Button>Medium Button</Button>
                      <Button size="sm">Small Button</Button>
                    </div>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block">
                      bg-black dark:bg-white text-white dark:text-black hover:opacity-90
                    </code>
                  </div>
                </div>
              </div>

              {/* Secondary Buttons */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Secondary Buttons
                </h2>
                <p className="text-sm opacity-70 mb-4">Used for secondary actions</p>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <Button variant="secondary" size="lg">
                        Large Button
                      </Button>
                      <Button variant="secondary">Medium Button</Button>
                      <Button variant="secondary" size="sm">
                        Small Button
                      </Button>
                    </div>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block">
                      border border-black/10 dark:border-white/15 bg-transparent hover:bg-black/5 dark:hover:bg-white/10
                    </code>
                  </div>
                </div>
              </div>

              {/* Ghost Buttons */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Ghost Buttons
                </h2>
                <p className="text-sm opacity-70 mb-4">Used for tertiary actions with minimal visual weight</p>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <Button variant="ghost" size="lg">
                        Large Button
                      </Button>
                      <Button variant="ghost">Medium Button</Button>
                      <Button variant="ghost" size="sm">
                        Small Button
                      </Button>
                    </div>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block">
                      bg-transparent hover:bg-black/5 dark:hover:bg-white/10
                    </code>
                  </div>
                </div>
              </div>

              {/* Destructive Buttons */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Destructive Buttons
                </h2>
                <p className="text-sm opacity-70 mb-4">Used for destructive actions like delete</p>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <Button variant="destructive" size="lg">
                        Delete Item
                      </Button>
                      <Button variant="destructive">Delete Item</Button>
                      <Button variant="destructiveOutline">Delete Outline</Button>
                    </div>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block">
                      bg-red-600 text-white hover:bg-red-700
                    </code>
                  </div>
                </div>
              </div>

              {/* Link Buttons */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Link Buttons
                </h2>
                <p className="text-sm opacity-70 mb-4">Text-only buttons for inline actions</p>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <Button variant="link" size="lg">
                        Link Button
                      </Button>
                      <Button variant="link">Link Button</Button>
                      <Button variant="link" size="sm">
                        Link Button
                      </Button>
                    </div>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block">
                      underline hover:opacity-80
                    </code>
                  </div>
                </div>
              </div>

              {/* Button States */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Button States
                </h2>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <Button>Normal</Button>
                      <Button disabled>Disabled</Button>
                      <Button disabled>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </Button>
                    </div>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block">
                      Disabled: opacity-50 cursor-not-allowed
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Badges Section */}
        {selectedTab === "badges" && (
          <section>
            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Badge Variants
                </h2>
                <p className="text-sm opacity-70 mb-4">Use badges to label sections, metrics, and interactive controls.</p>
                <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] p-6 space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Badge>Solid</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="subtle">Subtle</Badge>
                    <Badge variant="metric">1024px · 64rem</Badge>
                  </div>
                  <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block whitespace-pre overflow-auto">
                    {`import Badge from "@/components/ui/Badge";

<Badge variant="metric">1024px · 64rem</Badge>`}
                  </code>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Colors Section */}
        {selectedTab === "colors" && (
          <section>
            <div className="space-y-12">
              {/* Brand Colors */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Brand Colors
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {brandColors.map((token) => (
                    <div key={token.id} className="p-6 rounded-lg border border-stroke-muted bg-surface-subtle">
                      <div className={`w-full h-24 rounded mb-3 ${token.swatchClass}`}></div>
                      <p className="font-medium mb-1">{token.label}</p>
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">{token.code}</code>
                      <p className="text-sm opacity-70 mt-2">{token.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semantic Colors */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Semantic Colors
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {semanticColors.map((token) => (
                    <div key={token.id} className="p-6 rounded-lg border border-stroke-muted bg-surface-subtle">
                      <div className={`w-full h-24 rounded mb-3 ${token.swatchClass}`}></div>
                      <p className="font-medium mb-1">{token.label}</p>
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">{token.code}</code>
                      <p className="text-sm opacity-70 mt-2">{token.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opacity Scale */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Opacity Scale
                </h2>
                <p className="text-sm opacity-70 mb-4">Used for creating visual hierarchy and subtle backgrounds</p>
                <div className="space-y-3">
                  {opacityScale.map((item) => (
                    <div key={item.className} className="flex items-center gap-4">
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded w-24">{item.className}</code>
                      <span className="text-xs opacity-60 w-12">{item.value}</span>
                      <div className={`flex-1 h-12 bg-brand-primary rounded border border-stroke-muted ${item.className}`}></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Background Colors */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Background Colors
                </h2>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg bg-surface-subtle border border-stroke-muted">
                    <p className="font-medium mb-2">Subtle Background</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">bg-surface-subtle</code>
                    <p className="text-sm opacity-70 mt-2">Used for card backgrounds and subtle sections</p>
                  </div>
                  <div className="p-6 rounded-lg bg-surface-strong border border-stroke-muted">
                    <p className="font-medium mb-2">Raised Surface</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">bg-surface-strong</code>
                    <p className="text-sm opacity-70 mt-2">Used for hover states and secondary backgrounds</p>
                  </div>
                  <div className="p-6 rounded-lg bg-surface-card border border-stroke-muted">
                    <p className="font-medium mb-2">Card Surface</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">bg-surface-card</code>
                    <p className="text-sm opacity-70 mt-2">High-emphasis cards and sticky headers</p>
                  </div>
                </div>
              </div>

              {/* Border Colors */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Border Colors
                </h2>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border-2 border-stroke-muted">
                    <p className="font-medium mb-2">Default Border</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">border-stroke-muted</code>
                    <p className="text-sm opacity-70 mt-2">Used for most borders throughout the app</p>
                  </div>
                  <div className="p-6 rounded-lg border-2 border-stroke-strong">
                    <p className="font-medium mb-2">Emphasis Border</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">border-stroke-strong</code>
                    <p className="text-sm opacity-70 mt-2">Used for borders that need more emphasis</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Forms Section */}
        {selectedTab === "forms" && (
          <section>
            <div className="space-y-12">
              {/* Text Inputs */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Text Inputs
                </h2>
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Input</label>
                    <input
                      type="text"
                      placeholder="Enter text..."
                      className="w-full px-4 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    />
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded mt-2 inline-block">
                      border border-black/10 focus:ring-2 focus:ring-black
                    </code>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Large Input</label>
                    <input
                      type="text"
                      placeholder="Enter text..."
                      className="w-full px-4 py-3 text-lg rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Small Input</label>
                    <input
                      type="text"
                      placeholder="Enter text..."
                      className="w-full px-3 py-1.5 text-sm rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Disabled Input</label>
                    <input
                      type="text"
                      placeholder="Disabled..."
                      disabled
                      className="w-full px-4 py-2 rounded-md border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 opacity-50 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Error State</label>
                    <input
                      type="text"
                      placeholder="Error..."
                      className="w-full px-4 py-2 rounded-md border-2 border-red-500 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-sm text-red-600 mt-1">This field is required</p>
                  </div>
                </div>
              </div>

              {/* Textarea */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Textarea
                </h2>
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Textarea</label>
                    <textarea
                      placeholder="Enter multiple lines..."
                      rows={4}
                      className="w-full px-4 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-vertical"
                    />
                  </div>
                </div>
              </div>

              {/* Select Dropdown */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Select Dropdown
                </h2>
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Select</label>
                    <select className="w-full px-4 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent">
                      <option>Option 1</option>
                      <option>Option 2</option>
                      <option>Option 3</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Checkboxes and Radio Buttons */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Checkboxes & Radio Buttons
                </h2>
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <p className="text-sm font-medium mb-3">Checkboxes</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-black/10 dark:border-white/15" />
                        <span>Checkbox option 1</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-black/10 dark:border-white/15" defaultChecked />
                        <span>Checkbox option 2 (checked)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                        <input type="checkbox" className="w-4 h-4 rounded border-black/10 dark:border-white/15" disabled />
                        <span>Checkbox option 3 (disabled)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-3">Radio Buttons</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="radio-example" className="w-4 h-4" />
                        <span>Radio option 1</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="radio-example" className="w-4 h-4" defaultChecked />
                        <span>Radio option 2 (checked)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                        <input type="radio" name="radio-example" className="w-4 h-4" disabled />
                        <span>Radio option 3 (disabled)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Layouts */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Form Layouts
                </h2>
                <div className="space-y-6 max-w-2xl">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <h3 className="text-lg font-semibold mb-4">Example Form</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Email <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          className="w-full px-4 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Message</label>
                        <textarea
                          placeholder="Your message..."
                          rows={3}
                          className="w-full px-4 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-vertical"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4 rounded border-black/10 dark:border-white/15" />
                        <label className="text-sm">I agree to the terms and conditions</label>
                      </div>
                      <button className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90">
                        Submit Form
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Grids Section */}
        {selectedTab === "grids" && (
          <section>
            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">Grid Builder Sandbox</h2>
                <p className="text-sm opacity-70 mb-4">
                  Quickly prototype how cards wrap by toggling between auto-fit rails and manual column spans. Every configuration uses Tailwind utility classes so
                  you can copy the output directly into a layout.
                </p>
                <div className="space-y-5">
                  <div className="space-y-4 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Layout mode</p>
                        <div className="grid grid-cols-2 gap-2 sm:max-w-xs">
                          {[
                            { id: "auto" as GridBuilderMode, label: "Auto-fit" },
                            { id: "manual" as GridBuilderMode, label: "Manual spans" },
                          ].map((option) => (
                            <Button
                              key={option.id}
                              type="button"
                              size="sm"
                              variant={gridBuilderConfig.mode === option.id ? "primary" : "secondary"}
                              className="normal-case tracking-normal"
                              onClick={() => updateGridBuilderConfig("mode", option.id)}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          as="a"
                          href={gridSampleLink}
                          target="_blank"
                          rel="noreferrer"
                          variant="secondary"
                          size="sm"
                          className="normal-case tracking-normal"
                        >
                          Create sample
                        </Button>
                        <Button
                          type="button"
                          onClick={copyGridBuilderStyles}
                          variant="ghost"
                          size="sm"
                          className="normal-case tracking-normal"
                        >
                          Copy style
                        </Button>
                        <span
                          aria-live="polite"
                          className={`text-[11px] font-semibold ${
                            gridBuilderCopyStatus === "copied"
                              ? "text-green-600 dark:text-green-400"
                              : gridBuilderCopyStatus === "error"
                                ? "text-red-600 dark:text-red-400"
                                : "sr-only"
                          }`}
                        >
                          {gridBuilderCopyStatus === "copied"
                            ? "Copied!"
                            : gridBuilderCopyStatus === "error"
                              ? "Copy failed"
                              : "Idle"}
                        </span>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))]">
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
                        Cards
                        <input
                          type="number"
                          min={GRID_CARD_COUNT_MIN}
                          max={GRID_CARD_COUNT_MAX}
                          value={gridBuilderConfig.cardCount}
                          onChange={(event) => {
                            const numericValue = Number(event.target.value);
                            if (Number.isNaN(numericValue)) {
                              return;
                            }
                            const clampedValue = Math.min(Math.max(numericValue, GRID_CARD_COUNT_MIN), GRID_CARD_COUNT_MAX);
                            updateGridBuilderConfig("cardCount", clampedValue);
                          }}
                          className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm font-medium"
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
                        Gap
                        <select
                          value={gridBuilderConfig.gapId}
                          onChange={(event) => updateGridBuilderConfig("gapId", event.target.value)}
                          className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm font-medium"
                        >
                          {GRID_GAP_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
                        Side padding
                        <select
                          value={gridBuilderConfig.paddingId}
                          onChange={(event) => updateGridBuilderConfig("paddingId", event.target.value)}
                          className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm font-medium"
                        >
                          {GRID_PADDING_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      {gridBuilderConfig.mode === "auto" && (
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
                          Min width
                          <select
                            value={gridBuilderConfig.autoTemplateId}
                            onChange={(event) => updateGridBuilderConfig("autoTemplateId", event.target.value)}
                            className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm font-medium"
                          >
                            {GRID_AUTO_TEMPLATE_OPTIONS.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      {gridBuilderConfig.mode === "manual" && (
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
                          Card span (md and up)
                          <select
                            value={gridBuilderConfig.manualSpanId}
                            onChange={(event) => updateGridBuilderConfig("manualSpanId", event.target.value)}
                            className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm font-medium"
                          >
                            {GRID_MANUAL_SPAN_OPTIONS.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <span className="text-[11px] font-normal normal-case opacity-70">
                            Cards stay full-width on mobile, then snap to the selected span on `md:grid-cols-12`.
                          </span>
                        </label>
                      )}

                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
                        Max width
                        <select
                          value={gridBuilderConfig.widthId}
                          onChange={(event) => updateGridBuilderConfig("widthId", event.target.value)}
                          className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm font-medium"
                        >
                          {GRID_WIDTH_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {selectedWidthOption.helper && (
                          <span className="text-[11px] font-normal normal-case opacity-70">{selectedWidthOption.helper}</span>
                        )}
                      </label>
                    </div>
                  </div>
                  <WidthRuler targetRef={gridBuilderPreviewRef} label="Current width" className="text-black/60 dark:text-white/60" />
                  <div
                    ref={gridBuilderPreviewRef}
                    className="rounded-lg border border-black/10 dark:border-white/15 bg-white/70 dark:bg-black/40 p-0 overflow-hidden"
                  >
                    <div className={`${selectedWidthOption.className}`}>
                      <div className={`${selectedPaddingOption.className} py-4`}>
                        <div className={gridBuilderContainerClasses}>
                          {gridBuilderCards.map((cardIndex) => (
                            <GridPreviewCard
                              key={`builder-card-${cardIndex}`}
                              index={cardIndex}
                              className={gridBuilderCardClasses}
                              metaLabel={gridBuilderCardMetaLabel}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">Grid Foundations</h2>
                <p className="text-sm opacity-70 mb-4">
                  The design system relies on Tailwind&apos;s container plus a responsive 12-column grid. Use these guardrails to make sure layouts stay
                  consistent with the rest of the dashboard surface.
                </p>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <h3 className="text-lg font-semibold mb-2">Container & Gutters</h3>
                    <p className="text-sm opacity-80">
                      `container max-w-7xl` is centered with padding defined in `tailwind.config.ts`: 1.5rem (24px) by default and sm, 2rem (32px) on lg,
                      and 2.5rem (40px) on xl+. Pair it with the spacing tokens below to keep gutters and page chrome aligned.
                    </p>
                    <div className="mt-4 space-y-2 text-sm opacity-80">
                      <p>
                        <span className="font-semibold">Default padding:</span> `px-6` (24px)
                      </p>
                      <p>
                        <span className="font-semibold">Wide screens:</span> `lg:px-8` (32px) / `xl:px-10` (40px)
                      </p>
                      <p>
                        <span className="font-semibold">Standard gutter:</span> `gap-6` (24px)
                      </p>
                    </div>
                  </div>
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <h3 className="text-lg font-semibold mb-2">Usage Rules</h3>
                    <ul className="space-y-2 text-sm opacity-80">
                      {gridGuidelines.map((guideline) => (
                        <li key={guideline} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/50 dark:bg-white/60"></span>
                          <span>{guideline}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">Breakpoints & Column Behavior</h2>
                <p className="text-sm opacity-70 mb-4">How columns and gutters evolve across Tailwind&apos;s default media queries.</p>
                <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/15">
                  <div className="hidden md:grid grid-cols-4 bg-black/5 dark:bg-white/10 text-xs font-semibold uppercase tracking-wide">
                    <div className="px-4 py-3">Breakpoint</div>
                    <div className="px-4 py-3">Width</div>
                    <div className="px-4 py-3">Behavior</div>
                    <div className="px-4 py-3">Utilities</div>
                  </div>
                  <div className="divide-y divide-black/10 dark:divide-white/15">
                    {gridBreakpointRules.map((rule) => (
                      <div key={rule.id} className="grid grid-cols-1 md:grid-cols-4">
                        <div className="px-4 py-3">
                          <p className="text-[11px] uppercase opacity-60 md:hidden">Breakpoint</p>
                          <p className="text-sm font-semibold">{rule.id}</p>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-[11px] uppercase opacity-60 md:hidden">Width</p>
                          <p className="text-sm opacity-80">{rule.minWidth}</p>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-[11px] uppercase opacity-60 md:hidden">Behavior</p>
                          <p className="text-sm opacity-80">{rule.behavior}</p>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-[11px] uppercase opacity-60 md:hidden">Utilities</p>
                          <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded inline-block">{rule.utilities}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">Example Grids</h2>
                <p className="text-sm opacity-70 mb-4">
                  Copyable Tailwind compositions that we use repeatedly across the dashboard. Each example collapses to a single column on smaller screens.
                </p>
                <div className="space-y-6">
                  {gridExamples.map((example) => (
                    <article key={example.id} className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] space-y-5">
                      <div>
                        <h3 className="text-xl font-semibold">{example.title}</h3>
                        <p className="text-sm opacity-70 mt-1">{example.description}</p>
                      </div>
                      <div className={`grid ${example.classes}`}>
                        {example.previewBlocks.map((block) => (
                          <div key={`${example.id}-${block.label}`} className={`${GRID_PREVIEW_BLOCK_BASE_CLASS} ${block.className}`}>
                            <span className="text-sm font-semibold">{block.label}</span>
                            {block.helper && <span className="text-xs opacity-70">{block.helper}</span>}
                          </div>
                        ))}
                      </div>
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded inline-flex items-center gap-1">
                        {example.classes}
                      </code>
                      <ul className="list-disc pl-5 text-sm opacity-80 space-y-1">
                        {example.rules.map((rule) => (
                          <li key={`${example.id}-${rule}`}>{rule}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Spacing Section */}
        {selectedTab === "spacing" && (
          <section>
            <div className="space-y-12">
              {/* Spacing Scale */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Spacing Scale
                </h2>
                <p className="text-sm opacity-70 mb-4">
                  Tailwind spacing scale based on 0.25rem (4px) increments
                </p>
                <div className="space-y-3">
                  {spacingScale.map((item) => (
                    <div key={item.token} className="flex items-center gap-4">
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded w-20">{item.token}</code>
                      <span className="text-xs opacity-60 w-32">{item.value}</span>
                      <div className="h-8 bg-black dark:bg-white rounded" style={{ width: `${item.pixels || 1}px` }}></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Padding Examples */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Padding Examples
                </h2>
                <div className="space-y-4">
                  {[
                    { class: "p-2", label: "p-2 (8px all sides)" },
                    { class: "p-4", label: "p-4 (16px all sides)" },
                    { class: "p-6", label: "p-6 (24px all sides)" },
                    { class: "px-4 py-2", label: "px-4 py-2 (16px horizontal, 8px vertical)" },
                    { class: "px-6 py-3", label: "px-6 py-3 (24px horizontal, 12px vertical)" },
                  ].map((item) => (
                    <div key={item.class} className="border border-black/10 dark:border-white/15 rounded-lg">
                      <div className={`${item.class} bg-black/5 dark:bg-white/10`}>
                        <div className="bg-white dark:bg-black border border-black/10 dark:border-white/15 rounded p-2 text-sm">
                          Content Area
                        </div>
                      </div>
                      <div className="px-4 py-2 border-t border-black/10 dark:border-white/15">
                        <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">
                          {item.class}
                        </code>
                        <span className="text-xs opacity-60 ml-2">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gap Examples */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Gap Examples (Flexbox/Grid)
                </h2>
                <div className="space-y-4">
                  {gapTokens.map((item) => (
                    <div key={item.className} className="p-4 border border-black/10 dark:border-white/15 rounded-lg">
                      <div className={`flex ${item.className}`}>
                        {Array.from({ length: item.count }).map((_, i) => (
                          <div key={`${item.className}-${i}`} className="flex-1 h-16 bg-black/10 dark:bg-white/10 rounded"></div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">{item.className}</code>
                        <span className="text-xs opacity-60 ml-2">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Border Radius
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {borderRadiusTokens.map((token) => (
                    <div key={token.className} className="p-4 border border-black/10 dark:border-white/15 rounded-lg">
                      <div className={`w-full h-20 bg-black dark:bg-white ${token.className} mb-3`}></div>
                      <p className="text-sm font-medium">{token.label}</p>
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">{token.className}</code>
                      <p className="text-xs opacity-60 mt-1">{token.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}


const REM_IN_PX = 16;

function formatPxNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "";
  }
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
  return `${formatted}px`;
}

function normalizePxString(value: string) {
  const numeric = parseFloat(value);
  return Number.isFinite(numeric) ? formatPxNumber(numeric) : value;
}

function convertLineHeightToPx(lineHeight: string, sizePixels: string) {
  const trimmed = lineHeight.trim();
  if (trimmed.endsWith("px")) {
    return trimmed;
  }
  if (trimmed.endsWith("rem")) {
    const remValue = parseFloat(trimmed.replace(/rem$/, ""));
    return Number.isFinite(remValue) ? formatPxNumber(remValue * REM_IN_PX) : trimmed;
  }
  const numeric = parseFloat(trimmed);
  const sizeNumeric = parseFloat(sizePixels);
  if (Number.isFinite(numeric) && Number.isFinite(sizeNumeric)) {
    return formatPxNumber(sizeNumeric * numeric);
  }
  return trimmed;
}

function buildTypographyScaleExport(viewport: TypographyViewport) {
  return typographyScale
    .map((token) => {
      const bp = token[viewport];
      const lineHeightPx = convertLineHeightToPx(bp.lineHeight, bp.pixels);
      const classStack = getTypographyClassName(token.id);
      return [
        `${token.label} (${token.id})`,
        `Font: ${token.fontFamily}`,
        `Weight: ${token.fontWeight}`,
        `Usage: ${token.usage}`,
        `${viewport === "desktop" ? "Desktop" : "Mobile"} · Size ${normalizePxString(bp.pixels)} · Line height ${lineHeightPx}`,
        `Base classes: ${token.baseClass}`,
        `Tailwind stack: ${classStack}`,
      ].join("\n");
    })
    .join("\n\n");
}

