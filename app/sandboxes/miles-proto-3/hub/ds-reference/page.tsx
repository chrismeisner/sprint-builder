import type { Metadata } from "next";

export const metadata: Metadata = { title: "Design System Reference — Miles" };

/* ─────────────────────────────────────────────────────────
   Token data — sourced from /hub/tokens endpoint
   All values hardcoded as a point-in-time snapshot.
   ───────────────────────────────────────────────────────── */

const GENERATED_AT = "2026-03-28 — v0.1";
const HUB_URL = "http://localhost:3000/sandboxes/miles-proto-3/hub";

const COLOR_GROUPS: Array<{
  category: string;
  tokens: Array<{ name: string; light: string; dark: string; ios: string; primitive?: string }>;
}> = [
  {
    category: "Base",
    tokens: [
      { name: "background",  light: "#f7f6f2", dark: "#030712", primitive: "gray/50 → gray/950",  ios: "UIColor.systemBackground" },
      { name: "foreground",  light: "#030712", dark: "#f7f6f2", primitive: "gray/950 → gray/50",  ios: "UIColor.label" },
    ],
  },
  {
    category: "Text",
    tokens: [
      { name: "text/primary",   light: "#0a0a0a", dark: "#f5f5f5", primitive: "gray/950 → gray/50",  ios: "UIColor.label" },
      { name: "text/secondary", light: "#404040", dark: "#d4d4d4", primitive: "gray/700 → gray/300",  ios: "UIColor.secondaryLabel" },
      { name: "text/muted",     light: "#737373", dark: "#a3a3a3", primitive: "gray/500 → gray/400",  ios: "UIColor.tertiaryLabel" },
      { name: "text/inverse",   light: "#fafafa", dark: "#0a0a0a", primitive: "gray/50 → gray/950",   ios: "UIColor.label (inverse)" },
    ],
  },
  {
    category: "Surface",
    tokens: [
      { name: "surface/subtle",  light: "#f5f5f5", dark: "#171717", primitive: "gray/50 → gray/900",  ios: "UIColor.secondarySystemBackground" },
      { name: "surface/strong",  light: "#e5e5e5", dark: "#262626", primitive: "gray/200 → gray/800", ios: "UIColor.tertiarySystemBackground" },
      { name: "surface/card",    light: "#ffffff", dark: "#0a0a0a", primitive: "gray/0 → gray/900",   ios: "UIColor.secondarySystemGroupedBackground" },
      { name: "surface/overlay", light: "#242322", dark: "#363432", primitive: "gray/900 → gray/800", ios: "Custom overlay surface" },
    ],
  },
  {
    category: "Stroke",
    tokens: [
      { name: "stroke/muted",  light: "#e5e5e5", dark: "#262626", primitive: "gray/200 → gray/800", ios: "UIColor.separator" },
      { name: "stroke/strong", light: "#d4d4d4", dark: "#404040", primitive: "gray/300 → gray/700", ios: "UIColor.opaqueSeparator" },
    ],
  },
  {
    category: "Brand — Primary",
    tokens: [
      { name: "brand/wordmark",  light: "#2d6041", dark: "#8dd5b3", primitive: "green/800 → green/300", ios: "Custom wordmark color" },
      { name: "brand/primary",   light: "#0a0a0a", dark: "#ffffff", primitive: "gray/950 → gray/0",     ios: "Custom brand color" },
      { name: "brand/inverse",   light: "#ffffff", dark: "#000000", primitive: "gray/0 → gray/1000",    ios: "Custom brand inverse" },
    ],
  },
  {
    category: "Brand — Green",
    tokens: [
      { name: "brand/green",          light: "#309061", dark: "#5ebe91", primitive: "green/600 → green/400", ios: "Custom brand green" },
      { name: "brand/green-subtle",   light: "#f2f9f5", dark: "#181a17", primitive: "green/50 → green/950",  ios: "Custom green surface" },
      { name: "brand/green-muted",    light: "#e5f4eb", dark: "#1f2420", primitive: "green/100 → green/900", ios: "Custom green muted" },
      { name: "brand/green-emphasis", light: "#2f7852", dark: "#8dd5b3", primitive: "green/700 → green/300", ios: "Custom green emphasis" },
    ],
  },
  {
    category: "Brand — Blue",
    tokens: [
      { name: "brand/blue",          light: "#3e6fa0", dark: "#9dc3e4", primitive: "blue/600 → blue/300",  ios: "Custom brand blue" },
      { name: "brand/blue-subtle",   light: "#f4f8fa", dark: "#1f222e", primitive: "blue/50 → blue/900",   ios: "Custom blue surface" },
      { name: "brand/blue-muted",    light: "#e6f0f5", dark: "#30405c", primitive: "blue/100 → blue/800",  ios: "Custom blue muted" },
      { name: "brand/blue-emphasis", light: "#37577e", dark: "#9dc3e4", primitive: "blue/700 → blue/300",  ios: "Custom blue emphasis" },
    ],
  },
  {
    category: "Semantic",
    tokens: [
      { name: "semantic/success", light: "#16a34a", dark: "#4ade80", primitive: "green/600 → green/400", ios: "UIColor.systemGreen" },
      { name: "semantic/info",    light: "#2563eb", dark: "#93c5fd", primitive: "blue/600 → blue/300",   ios: "UIColor.systemBlue" },
      { name: "semantic/warning", light: "#ca8a04", dark: "#facc15", primitive: "—",                     ios: "UIColor.systemYellow" },
      { name: "semantic/danger",  light: "#dc2626", dark: "#f87171", primitive: "—",                     ios: "UIColor.systemRed" },
    ],
  },
];

const TYPE_STYLES: Array<{
  name: string; group: string; family: string; sizePx: number; weightLabel: string; weight: number;
  lineHeightPx: number; letterSpacingPct: number; ios: string; sample?: string;
}> = [
  { name: "Miles/Large Title",       group: "Titles",       family: "Inter",       sizePx: 30, weightLabel: "Bold",      weight: 700, lineHeightPx: 38, letterSpacingPct: 0,   ios: ".largeTitle" },
  { name: "Miles/Display",           group: "Titles",       family: "Inter",       sizePx: 24, weightLabel: "Semi Bold", weight: 600, lineHeightPx: 30, letterSpacingPct: 0,   ios: ".title2 uppercase" },
  { name: "Miles/Title",             group: "Titles",       family: "Inter",       sizePx: 18, weightLabel: "Semi Bold", weight: 600, lineHeightPx: 25, letterSpacingPct: 0,   ios: ".title3" },
  { name: "Miles/Headline",          group: "Titles",       family: "Inter",       sizePx: 16, weightLabel: "Semi Bold", weight: 600, lineHeightPx: 24, letterSpacingPct: 0,   ios: ".headline" },
  { name: "Miles/Subheadline Bold",  group: "Body",         family: "Inter",       sizePx: 14, weightLabel: "Semi Bold", weight: 600, lineHeightPx: 14, letterSpacingPct: 0,   ios: ".subheadline.bold()", sample: "Jack is driving" },
  { name: "Miles/Subheadline",       group: "Body",         family: "Inter",       sizePx: 14, weightLabel: "Medium",    weight: 500, lineHeightPx: 21, letterSpacingPct: 0,   ios: ".subheadline" },
  { name: "Miles/Body",              group: "Body",         family: "Inter",       sizePx: 14, weightLabel: "Regular",   weight: 400, lineHeightPx: 23, letterSpacingPct: 0,   ios: ".body" },
  { name: "Miles/Stat — Large",      group: "Stats",        family: "Inter",       sizePx: 36, weightLabel: "Bold",      weight: 700, lineHeightPx: 36, letterSpacingPct: 0,   ios: "Custom 36pt bold tabular", sample: "34 mph" },
  { name: "Miles/Stat — Medium",     group: "Stats",        family: "Inter",       sizePx: 18, weightLabel: "Bold",      weight: 700, lineHeightPx: 18, letterSpacingPct: 0,   ios: "Custom 18pt bold tabular", sample: "82 · Good · 62%" },
  { name: "Miles/Caption Emphasized",group: "Captions",     family: "Inter",       sizePx: 12, weightLabel: "Semi Bold", weight: 600, lineHeightPx: 18, letterSpacingPct: 0,   ios: ".caption.bold()" },
  { name: "Miles/Caption",           group: "Captions",     family: "Inter",       sizePx: 12, weightLabel: "Medium",    weight: 500, lineHeightPx: 18, letterSpacingPct: 0,   ios: ".caption" },
  { name: "Miles/Caption Muted",     group: "Captions",     family: "Inter",       sizePx: 12, weightLabel: "Regular",   weight: 400, lineHeightPx: 18, letterSpacingPct: 0,   ios: ".caption (secondary)" },
  { name: "Miles/Section Header",    group: "Small labels", family: "Inter",       sizePx: 11, weightLabel: "Semi Bold", weight: 600, lineHeightPx: 16, letterSpacingPct: 2.5, ios: ".caption2 semibold uppercase", sample: "SECTION HEADER" },
  { name: "Miles/Caption 2",         group: "Small labels", family: "Inter",       sizePx: 11, weightLabel: "Medium",    weight: 500, lineHeightPx: 16, letterSpacingPct: 0,   ios: ".caption2" },
  { name: "Miles/Badge",             group: "Micro",        family: "Inter",       sizePx: 10, weightLabel: "Semi Bold", weight: 600, lineHeightPx: 15, letterSpacingPct: 2.5, ios: "Custom 10pt semibold", sample: "DRIVING" },
  { name: "Miles/Micro Label",       group: "Micro",        family: "Inter",       sizePx: 10, weightLabel: "Medium",    weight: 500, lineHeightPx: 15, letterSpacingPct: 2.5, ios: "Custom 10pt medium" },
  { name: "Miles/AI Body",           group: "AI voice",     family: "Overpass Mono", sizePx: 14, weightLabel: "Regular",   weight: 400, lineHeightPx: 23, letterSpacingPct: 0,   ios: "SF Mono .body" },
  { name: "Miles/AI Label",          group: "AI voice",     family: "Overpass Mono", sizePx: 11, weightLabel: "Medium",    weight: 500, lineHeightPx: 16, letterSpacingPct: 2.5, ios: "SF Mono .caption2 uppercase", sample: "AI LABEL" },
];

const RADIUS_TOKENS = [
  { name: "borderRadius/control", px: 8,    label: "8px",    ios: ".cornerRadius(8)",    usage: "Buttons · inputs · thumbnails" },
  { name: "borderRadius/panel",   px: 12,   label: "12px",   ios: ".cornerRadius(12)",   usage: "Panels · bento cells · strips" },
  { name: "borderRadius/card",    px: 16,   label: "16px",   ios: ".cornerRadius(16)",   usage: "Primary cards · map container" },
  { name: "borderRadius/pill",    px: 9999, label: "9999px", ios: ".clipShape(Capsule())", usage: "Badges · avatars · tags" },
];

const SPACING_TOKENS = [
  { name: "spacing/0",       px: 0  },
  { name: "spacing/1",       px: 4  },
  { name: "spacing/2",       px: 8  },
  { name: "spacing/3",       px: 12 },
  { name: "spacing/4",       px: 16 },
  { name: "spacing/5",       px: 20 },
  { name: "spacing/6",       px: 24 },
  { name: "spacing/8",       px: 32 },
  { name: "spacing/10",      px: 40 },
  { name: "spacing/12",      px: 48 },
  { name: "spacing/16",      px: 64 },
  { name: "spacing/20",      px: 80 },
  { name: "spacing/24",      px: 96 },
  { name: "spacing/gutter",  px: 24 },
  { name: "spacing/page",    px: 40 },
  { name: "spacing/section", px: 48 },
];

const SEMANTIC_TABLE: Array<{
  name: string; category: string; light: string; dark: string; ios: string;
}> = COLOR_GROUPS.flatMap((g) =>
  g.tokens.map((t) => ({ name: t.name, category: g.category, light: t.light, dark: t.dark, ios: t.ios }))
);

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */

function SectionFrame({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 16,
        background: "#ffffff",
        padding: "32px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373" }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: 1, background: "#e5e5e5" }} />
      </div>
      {children}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────── */

export default function DesignSystemReferencePage() {
  return (
    <div style={{ background: "#f5f5f5", minHeight: "100dvh", paddingBottom: 96 }}>
      <style>{`.ds-ref-back-link:hover { color: #fafafa !important; }`}</style>
      {/* ── Page header label ── */}
      <div
        id="reference/header"
        style={{
          background: "#0a0a0a",
          color: "#fafafa",
          padding: "14px 40px",
          fontFamily: "ui-monospace, monospace",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.03em",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a
            href="/sandboxes/miles-proto-3/hub"
            className="ds-ref-back-link"
            style={{
              color: "#737373",
              textDecoration: "none",
              fontFamily: "ui-monospace, monospace",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.03em",
            }}
          >
            ← Hub
          </a>
          <span style={{ color: "#262626" }}>·</span>
          <span>Design System Reference — generated {GENERATED_AT} from {HUB_URL}</span>
        </div>
        <span style={{ color: "#737373" }}>token-version: v0</span>
      </div>

      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "40px 40px 0",
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >

        {/* ══════════════════════════════════════════
            SECTION 1 — Color Tokens
        ══════════════════════════════════════════ */}
        <SectionFrame id="reference/color-tokens" title="1 · Color Tokens">
          <p style={{ margin: 0, fontSize: 12, color: "#737373", lineHeight: 1.6 }}>
            Semantic tokens resolve to different hex values per mode. Light ↔ Dark columns show prototype wireframe values (not Figma production values).
            The Primitive column shows the Figma variable alias — the shared naming contract. All token names here are in parity with the Figma file. brand/green*, brand/blue*, surface/overlay are defined for Figma parity; remaining tokens are actively used in the dashboard prototype.
          </p>

          {COLOR_GROUPS.map((group) => (
            <div key={group.category} id={`reference/color-tokens/${group.category.toLowerCase()}`}>
              {/* Group label */}
              <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#a3a3a3" }}>
                  {group.category}
                </span>
                <div style={{ flex: 1, height: 1, background: "#f5f5f5" }} />
              </div>

              {/* Token rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 10, overflow: "hidden", border: "1px solid #e5e5e5" }}>
                {/* Column headers */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "220px 1fr 1fr 160px",
                  background: "#f5f5f5",
                  padding: "8px 16px",
                  gap: 16,
                }}>
                  {["Token name", "Light mode", "Dark mode", "Primitive"].map((h) => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#a3a3a3" }}>
                      {h}
                    </span>
                  ))}
                </div>

                {group.tokens.map((t, i) => (
                  <div
                    key={t.name}
                    id={`reference/color-tokens/${group.category.toLowerCase()}/${t.name.replace(/\//g, "-")}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "220px 1fr 1fr 160px",
                      padding: "12px 16px",
                      gap: 16,
                      background: i % 2 === 0 ? "#ffffff" : "#fafafa",
                      alignItems: "center",
                    }}
                  >
                    {/* Token name */}
                    <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#0a0a0a", fontWeight: 500 }}>
                      {t.name}
                    </span>

                    {/* Light swatch */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                        background: t.light,
                        border: (t.light === "#ffffff" || t.light === "#fafafa" || t.light === "#f7f6f2" || t.light === "#f2f9f5" || t.light === "#f4f8fa" || t.light === "#e5f4eb" || t.light === "#e6f0f5") ? "1px solid #e5e5e5" : "none",
                      }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#0a0a0a", fontWeight: 500 }}>
                          {t.light}
                        </span>
                        <span style={{ fontSize: 10, color: "#a3a3a3" }}>Light</span>
                      </div>
                    </div>

                    {/* Dark swatch */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                        background: t.dark,
                        border: (t.dark === "#ffffff" || t.dark === "#fafafa") ? "1px solid #e5e5e5" : "none",
                        outline: "1px solid rgba(0,0,0,0.06)",
                      }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#0a0a0a", fontWeight: 500 }}>
                          {t.dark}
                        </span>
                        <span style={{ fontSize: 10, color: "#a3a3a3" }}>Dark</span>
                      </div>
                    </div>

                    {/* Primitive reference */}
                    <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#309061" }}>
                      {t.primitive ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </SectionFrame>

        {/* ══════════════════════════════════════════
            SECTION 2 — Typography Scale
        ══════════════════════════════════════════ */}
        <SectionFrame id="reference/typography" title="2 · Typography Scale — Miles/* Text Styles">
          <p style={{ margin: 0, fontSize: 12, color: "#737373", lineHeight: 1.6 }}>
            18 roles. Each maps 1-to-1 to an iOS HIG Dynamic Type style or named custom role.
            Inter (web) ↔ SF Pro (iOS) · Overpass Mono (web) ↔ SF Mono (iOS).
          </p>

          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "220px 180px 80px 100px 90px 80px 1fr",
            gap: 12,
            padding: "8px 16px",
            background: "#f5f5f5",
            borderRadius: 8,
          }}>
            {["Style name", "Live sample", "Size", "Weight", "Line ht.", "LS %", "iOS equivalent"].map((h) => (
              <span key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#a3a3a3" }}>
                {h}
              </span>
            ))}
          </div>

          {/* Group rows */}
          {(() => {
            const groups = ["Titles", "Body", "Stats", "Captions", "Small labels", "Micro", "AI voice"];
            return groups.map((groupName) => {
              const rows = TYPE_STYLES.filter((s) => s.group === groupName);
              return (
                <div key={groupName} id={`reference/typography/${groupName.toLowerCase().replace(/ /g, "-")}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#a3a3a3" }}>
                      {groupName}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "#e5e5e5" }} />
                  </div>
                  <div style={{ borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
                    {rows.map((s, i) => (
                      <div
                        key={s.name}
                        id={`reference/typography/${s.name.replace(/\//g, "-").replace(/ /g, "-").toLowerCase()}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "220px 180px 80px 100px 90px 80px 1fr",
                          gap: 12,
                          padding: "14px 16px",
                          background: i % 2 === 0 ? "#ffffff" : "#fafafa",
                          borderBottom: i < rows.length - 1 ? "1px solid #f5f5f5" : "none",
                          alignItems: "center",
                        }}
                      >
                        {/* Style name */}
                        <span style={{ fontSize: 11, fontWeight: 500, color: "#0a0a0a", fontFamily: "ui-monospace, monospace" }}>
                          {s.name}
                        </span>

                        {/* Live sample */}
                        <span style={{
                          fontFamily: (s.family === "Roboto Mono" || s.family === "Overpass Mono") ? "var(--font-overpass-mono), ui-monospace, monospace" : "Inter, ui-sans-serif, sans-serif",
                          fontSize: Math.min(s.sizePx, 22),
                          fontWeight: s.weight,
                          lineHeight: `${s.lineHeightPx}px`,
                          letterSpacing: s.letterSpacingPct ? `${s.letterSpacingPct / 100}em` : undefined,
                          textTransform: s.name.includes("Section Header") || s.name.includes("Badge") || s.name.includes("Display") || s.name.includes("AI Label") ? "uppercase" : undefined,
                          color: "#0a0a0a",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {s.sample ?? "The quick brown fox"}
                        </span>

                        {/* Size */}
                        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#404040" }}>
                          {s.sizePx}px
                        </span>

                        {/* Weight */}
                        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#404040" }}>
                          {s.weightLabel} ({s.weight})
                        </span>

                        {/* Line height */}
                        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#404040" }}>
                          {s.lineHeightPx}px
                        </span>

                        {/* Letter spacing */}
                        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#404040" }}>
                          {s.letterSpacingPct > 0 ? `${s.letterSpacingPct}%` : "—"}
                        </span>

                        {/* iOS equivalent */}
                        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#2563eb" }}>
                          {s.ios}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </SectionFrame>

        {/* ══════════════════════════════════════════
            SECTION 3 — Radius Tokens
        ══════════════════════════════════════════ */}
        <SectionFrame id="reference/radius" title="3 · Radius Tokens">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 48, flexWrap: "wrap" }}>
            {RADIUS_TOKENS.map((t) => (
              <div
                key={t.name}
                id={`reference/radius/${t.name.replace(/\//g, "-")}`}
                style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}
              >
                {/* Visual */}
                <div style={{
                  width: 80,
                  height: 80,
                  background: "#0a0a0a",
                  borderRadius: t.px === 9999 ? 9999 : t.px,
                  flexShrink: 0,
                }} />

                {/* Labels */}
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, fontWeight: 600, color: "#0a0a0a" }}>
                    {t.name}
                  </span>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#737373" }}>
                    {t.label}
                  </span>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: "#2563eb" }}>
                    {t.ios}
                  </span>
                  <span style={{ fontSize: 10, color: "#a3a3a3", maxWidth: 120 }}>
                    {t.usage}
                  </span>
                </div>
              </div>
            ))}

            {/* Shadow token */}
            <div
              id="reference/radius/boxShadow-card"
              style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}
            >
              <div style={{
                width: 80, height: 80,
                background: "#ffffff",
                borderRadius: 16,
                border: "1px solid #e5e5e5",
                boxShadow: "0 24px 70px rgba(0,0,0,0.08)",
                flexShrink: 0,
              }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, fontWeight: 600, color: "#0a0a0a" }}>
                  boxShadow/card
                </span>
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: "#737373", maxWidth: 160, lineHeight: 1.5 }}>
                  0 24px 70px rgba(0,0,0,0.08)
                </span>
                <span style={{ fontSize: 10, color: "#a3a3a3" }}>
                  Map · coaching cards
                </span>
                <span style={{ fontSize: 10, color: "#dc2626", fontFamily: "ui-monospace, monospace" }}>
                  STRING var — apply manually
                </span>
              </div>
            </div>
          </div>
        </SectionFrame>

        {/* ══════════════════════════════════════════
            SECTION 4 — Spacing Tokens
        ══════════════════════════════════════════ */}
        <SectionFrame id="reference/spacing" title="4 · Spacing Tokens">
          <p style={{ margin: 0, fontSize: 12, color: "#737373", lineHeight: 1.6 }}>
            Bar widths are to scale (max 96px = spacing/24). SwiftUI maps as <code style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, background: "#f5f5f5", padding: "1px 4px", borderRadius: 3 }}>.padding()</code> or <code style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, background: "#f5f5f5", padding: "1px 4px", borderRadius: 3 }}>Spacer()</code>.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SPACING_TOKENS.map((t) => (
              <div
                key={t.name}
                id={`reference/spacing/${t.name.replace(/\//g, "-")}`}
                style={{ display: "flex", alignItems: "center", gap: 16 }}
              >
                {/* Bar */}
                <div style={{
                  width: t.px === 0 ? 4 : Math.round((t.px / 96) * 240),
                  height: 20,
                  background: "#0a0a0a",
                  borderRadius: 3,
                  flexShrink: 0,
                  minWidth: t.px === 0 ? 4 : undefined,
                }} />
                {/* Name */}
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, fontWeight: 500, color: "#0a0a0a", width: 160, flexShrink: 0 }}>
                  {t.name}
                </span>
                {/* Value */}
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#737373" }}>
                  {t.px}px
                </span>
              </div>
            ))}
          </div>
        </SectionFrame>

        {/* ══════════════════════════════════════════
            SECTION 5 — Semantic Token Reference Table
        ══════════════════════════════════════════ */}
        <SectionFrame id="reference/semantic-table" title="5 · Semantic Token Reference">
          <p style={{ margin: 0, fontSize: 12, color: "#737373", lineHeight: 1.6 }}>
            Full token contract. All semantic tokens are aliased to primitives — toggle Light/Dark in Figma to verify automatic mode-switching.
          </p>

          {/* Table */}
          <div style={{ borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
            {/* Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "200px 120px 160px 160px 1fr",
              gap: 16,
              padding: "10px 16px",
              background: "#f5f5f5",
            }}>
              {["Token name", "Category", "Light value", "Dark value", "iOS mapping"].map((h) => (
                <span key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#a3a3a3" }}>
                  {h}
                </span>
              ))}
            </div>

            {SEMANTIC_TABLE.map((t, i) => (
              <div
                key={t.name}
                id={`reference/semantic-table/${t.name.replace(/\//g, "-")}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "200px 120px 160px 160px 1fr",
                  gap: 16,
                  padding: "12px 16px",
                  background: i % 2 === 0 ? "#ffffff" : "#fafafa",
                  borderBottom: i < SEMANTIC_TABLE.length - 1 ? "1px solid #f5f5f5" : "none",
                  alignItems: "center",
                }}
              >
                {/* Token name */}
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, fontWeight: 500, color: "#0a0a0a" }}>
                  {t.name}
                </span>

                {/* Category */}
                <span style={{ fontSize: 11, color: "#737373" }}>
                  {t.category}
                </span>

                {/* Light value */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    background: t.light,
                    border: (t.light === "#ffffff" || t.light === "#fafafa") ? "1px solid #e5e5e5" : "none",
                    outline: "1px solid rgba(0,0,0,0.06)",
                  }} />
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#0a0a0a" }}>
                    {t.light}
                  </span>
                </div>

                {/* Dark value */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    background: t.dark,
                    border: (t.dark === "#ffffff" || t.dark === "#fafafa") ? "1px solid #e5e5e5" : "none",
                    outline: "1px solid rgba(0,0,0,0.06)",
                  }} />
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#0a0a0a" }}>
                    {t.dark}
                  </span>
                </div>

                {/* iOS mapping */}
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#2563eb" }}>
                  {t.ios}
                </span>
              </div>
            ))}
          </div>
        </SectionFrame>

      </div>
    </div>
  );
}
