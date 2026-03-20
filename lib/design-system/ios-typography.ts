/**
 * iOS-specific typography scale for the Miles prototype.
 *
 * This is the single source of truth for:
 *   - hub/page.tsx  (renders the reference table)
 *   - hub/typography/route.ts  (serves styles to the Figma plugin)
 *
 * Each token maps one-to-one to an iOS HIG Dynamic Type style (or a named
 * custom style) and carries explicit px values so the Figma plugin can write
 * correct text styles without parsing Tailwind class strings.
 *
 * Web font (Inter) ↔ iOS font (SF Pro / SF Mono)
 */

export type IosTypographyGroup =
  | "Titles"
  | "Body"
  | "Stats"
  | "Captions"
  | "Small labels"
  | "Micro"
  | "AI voice";

export type IosTypographyToken = {
  /** Figma text style name — written as Miles/{name} */
  name: string;
  /** iOS HIG / custom size reference shown in the hub */
  iosName: string;
  /** SwiftUI equivalent shown in the hub */
  swiftUI: string;
  /** Tailwind utility classes used in the web prototype */
  className: string;
  /** Where this style appears in the dashboard */
  usage: string;
  /** Hub display group */
  group: IosTypographyGroup;
  /** Font size in px (used by Figma plugin) */
  sizePx: number;
  /** Line height in px (used by Figma plugin) */
  lineHeightPx: number;
  /** Numeric font weight — 400 / 500 / 600 / 700 (used by Figma plugin) */
  fontWeightNumeric: number;
  /**
   * Letter spacing in em — most styles are 0.
   * tracking-wide (Tailwind) = 0.025em
   */
  letterSpacingEm: number;
  /** Use monospaced font family in Figma (AI voice styles) */
  mono: boolean;
};

export const iosTypographyScale: IosTypographyToken[] = [
  // ─── Titles ────────────────────────────────────────────────────────────────
  {
    name: "Large Title",
    className: "text-3xl font-bold leading-tight",
    usage: "Dashboard page header 'Miles'",
    iosName: "largeTitle — 34pt Bold",
    swiftUI: ".largeTitle",
    group: "Titles",
    sizePx: 30,
    lineHeightPx: 38,
    fontWeightNumeric: 700,
    letterSpacingEm: 0,
    mono: false,
  },
  {
    name: "Display",
    className: "text-2xl font-semibold uppercase leading-tight",
    usage: "Vehicle name — CIVIC / RAV4",
    iosName: "title2 — 22pt (custom: uppercase + tight)",
    swiftUI: ".title2 + .textCase(.uppercase)",
    group: "Titles",
    sizePx: 24,
    lineHeightPx: 30,
    fontWeightNumeric: 600,
    letterSpacingEm: 0,
    mono: false,
  },
  {
    name: "Title",
    className: "text-lg font-semibold leading-snug",
    usage: "Section heading — trip complete vehicle name",
    iosName: "title3 — 20pt",
    swiftUI: ".title3",
    group: "Titles",
    sizePx: 18,
    lineHeightPx: 25,
    fontWeightNumeric: 600,
    letterSpacingEm: 0,
    mono: false,
  },
  {
    name: "Headline",
    className: "text-base font-semibold",
    usage: "Primary card text — route name, card titles",
    iosName: "headline — 17pt Semibold",
    swiftUI: ".headline",
    group: "Titles",
    sizePx: 16,
    lineHeightPx: 24,
    fontWeightNumeric: 600,
    letterSpacingEm: 0,
    mono: false,
  },
  // ─── Body ──────────────────────────────────────────────────────────────────
  {
    name: "Subheadline Bold",
    className: "text-sm font-semibold leading-none",
    usage: "Key data — stat values, driver name, speed max",
    iosName: "subheadline — 15pt Semibold",
    swiftUI: ".subheadline.bold()",
    group: "Body",
    sizePx: 14,
    lineHeightPx: 14,
    fontWeightNumeric: 600,
    letterSpacingEm: 0,
    mono: false,
  },
  {
    name: "Subheadline",
    className: "text-sm font-medium",
    usage: "Secondary interactive text — nav labels, tappable links, list items",
    iosName: "subheadline — 15pt",
    swiftUI: ".subheadline",
    group: "Body",
    sizePx: 14,
    lineHeightPx: 21,
    fontWeightNumeric: 500,
    letterSpacingEm: 0,
    mono: false,
  },
  {
    name: "Body",
    className: "text-sm leading-relaxed",
    usage: "Reading text — coaching descriptions, route labels",
    iosName: "body — 17pt Regular",
    swiftUI: ".body",
    group: "Body",
    sizePx: 14,
    lineHeightPx: 23,
    fontWeightNumeric: 400,
    letterSpacingEm: 0,
    mono: false,
  },
  // ─── Stats (numeric display) ───────────────────────────────────────────────
  {
    name: "Stat — Large",
    className: "text-4xl font-bold leading-none tabular-nums",
    usage: "Live speed readout — primary mph number",
    iosName: "custom: 36pt Bold tabular",
    swiftUI: "Font.system(size: 36, weight: .bold, design: .rounded).monospacedDigit()",
    group: "Stats",
    sizePx: 36,
    lineHeightPx: 36,
    fontWeightNumeric: 700,
    letterSpacingEm: 0,
    mono: false,
  },
  {
    name: "Stat — Medium",
    className: "text-lg font-bold tabular-nums",
    usage: "Driver strip speed — secondary mph number",
    iosName: "custom: 18pt Bold tabular",
    swiftUI: "Font.system(size: 18, weight: .bold).monospacedDigit()",
    group: "Stats",
    sizePx: 18,
    lineHeightPx: 27,
    fontWeightNumeric: 700,
    letterSpacingEm: 0,
    mono: false,
  },
  // ─── Captions ─────────────────────────────────────────────────────────────
  {
    name: "Caption Emphasized",
    className: "text-xs font-semibold",
    usage: "Status chips — Driving in-progress header",
    iosName: "caption1 — 12pt Semibold",
    swiftUI: ".caption.bold()",
    group: "Captions",
    sizePx: 12,
    lineHeightPx: 18,
    fontWeightNumeric: 600,
    letterSpacingEm: 0,
    mono: false,
  },
  {
    name: "Caption",
    className: "text-xs font-medium",
    usage: "Interactive labels — See all / Not Emma? / overlay stats",
    iosName: "caption1 — 12pt",
    swiftUI: ".caption",
    group: "Captions",
    sizePx: 12,
    lineHeightPx: 18,
    fontWeightNumeric: 500,
    letterSpacingEm: 0,
    mono: false,
  },
  {
    name: "Caption Muted",
    className: "text-xs",
    usage: "Secondary metadata — timestamps, relation · score line",
    iosName: "caption1 — 12pt Regular",
    swiftUI: ".caption.foregroundStyle(.secondary)",
    group: "Captions",
    sizePx: 12,
    lineHeightPx: 18,
    fontWeightNumeric: 400,
    letterSpacingEm: 0,
    mono: false,
  },
  // ─── Small labels ──────────────────────────────────────────────────────────
  {
    name: "Section Header",
    className: "text-[11px] font-semibold uppercase tracking-wide",
    usage: "Grouped-list headers — VEHICLES · RECENT TRIPS · TO-DO",
    iosName: "caption2 — 11pt Semibold Uppercase (UITableView section)",
    swiftUI: ".caption2.bold().textCase(.uppercase).kerning(0.5)",
    group: "Small labels",
    sizePx: 11,
    lineHeightPx: 16,
    fontWeightNumeric: 600,
    letterSpacingEm: 0.025,
    mono: false,
  },
  {
    name: "Caption 2",
    className: "text-[11px] font-medium",
    usage: "Smallest labels — bento stat keys, mph unit, trip stat keys, avatar initials",
    iosName: "caption2 — 11pt",
    swiftUI: ".caption2",
    group: "Small labels",
    sizePx: 11,
    lineHeightPx: 16,
    fontWeightNumeric: 500,
    letterSpacingEm: 0,
    mono: false,
  },
  // ─── Micro (badges / overlays) ────────────────────────────────────────────
  {
    name: "Badge",
    className: "text-[10px] font-semibold uppercase tracking-wide",
    usage: "Status pills — DRIVING (green) · PARKED (blue)",
    iosName: "custom: 10pt Semibold Uppercase (pill label)",
    swiftUI: "Font.system(size: 10, weight: .semibold).textCase(.uppercase)",
    group: "Micro",
    sizePx: 10,
    lineHeightPx: 15,
    fontWeightNumeric: 600,
    letterSpacingEm: 0.025,
    mono: false,
  },
  {
    name: "Micro Label",
    className: "text-[10px] font-medium uppercase tracking-wide",
    usage: "Overlay metadata — TRIP MAX SPEED map label",
    iosName: "custom: 10pt Medium Uppercase",
    swiftUI: "Font.system(size: 10, weight: .medium).textCase(.uppercase)",
    group: "Micro",
    sizePx: 10,
    lineHeightPx: 15,
    fontWeightNumeric: 500,
    letterSpacingEm: 0.025,
    mono: false,
  },
  // ─── AI / agent voice ─────────────────────────────────────────────────────
  {
    name: "AI Body",
    className: "font-mono text-sm leading-relaxed",
    usage: "Miles coaching card message — From Miles body text",
    iosName: "body — SFMono / Menlo 15pt (monospaced)",
    swiftUI: "Font.system(.body, design: .monospaced)",
    group: "AI voice",
    sizePx: 14,
    lineHeightPx: 23,
    fontWeightNumeric: 400,
    letterSpacingEm: 0,
    mono: true,
  },
  {
    name: "AI Label",
    className: "font-mono text-[11px] font-medium uppercase tracking-wide",
    usage: "FROM MILES section header",
    iosName: "caption2 — SFMono 11pt Uppercase",
    swiftUI: "Font.system(.caption2, design: .monospaced).textCase(.uppercase)",
    group: "AI voice",
    sizePx: 11,
    lineHeightPx: 16,
    fontWeightNumeric: 500,
    letterSpacingEm: 0.025,
    mono: true,
  },
];
