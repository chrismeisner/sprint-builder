import Link from "@/app/sandboxes/miles-proto-2/_components/link";
import { CapturePrompt } from "@/app/sandboxes/miles-proto-2/hub/_components/capture-prompt";
import { HubSectionProvider, HubNav, HubSection } from "@/app/sandboxes/miles-proto-2/hub/_components/hub-nav";
import primitives from "@/lib/design-system/tokens/primitives.json";
import sizing from "@/lib/design-system/tokens/sizing.json";
import semanticLight from "@/lib/design-system/tokens/semantic-light.json";
import { iosTypographyScale } from "@/lib/design-system/ios-typography";
import hubVersions from "@/app/sandboxes/miles-proto-2/hub/versions.json";
import fs from "fs";
import path from "path";

type BreakingChange = { type: string; from: string; to: string; note: string };

type TokenValue = { $value?: string; $type?: string };
interface TokenNode {
  [key: string]: TokenValue | TokenNode;
}

function flattenTokens(
  node: TokenNode,
  prefix = ""
): Array<{ name: string; value: string; type?: string }> {
  const out: Array<{ name: string; value: string; type?: string }> = [];
  for (const [key, v] of Object.entries(node)) {
    const path = prefix ? `${prefix}/${key}` : key;
    if (v && typeof v === "object" && "$value" in v) {
      const t = v as TokenValue;
      out.push({
        name: path,
        value: String(t.$value ?? ""),
        type: t.$type,
      });
    } else if (v && typeof v === "object" && !("$value" in v)) {
      out.push(...flattenTokens(v as TokenNode, path));
    }
  }
  return out;
}

function ColorSwatch({ value, name }: { value: string; name: string }) {
  const isColor = value.startsWith("#") || value.startsWith("rgb");
  return (
    <div className="flex flex-col gap-1">
      {isColor && (
        <div
          className="h-10 w-full rounded-lg border border-stroke-muted"
          style={{ backgroundColor: value }}
        />
      )}
      <span className="truncate font-mono text-[11px] text-text-muted" title={name}>
        {name}
      </span>
      <span className="font-mono text-xs text-text-secondary">{value}</span>
    </div>
  );
}

const COLOR_UTILITY_REGEX =
  /\b(?:bg|text|border|divide|ring|from|to|via|fill|stroke)-[A-Za-z0-9_[\]().:%/-]+\b/g;
const RADIUS_UTILITY_REGEX = /\brounded-[A-Za-z0-9_[\]-]+\b/g;

const ALLOWED_TOKEN_PATTERNS: RegExp[] = [
  /^bg-(background|foreground|surface-|stroke-|brand-|semantic-)/,
  /^text-(background|foreground|text-|brand-|semantic-)/,
  /^border-(stroke-|brand-|semantic-)/,
  /^divide-(stroke-|brand-|semantic-)/,
  /^ring-(stroke-|brand-|semantic-)/,
  /^fill-(brand-|semantic-)/,
  /^stroke-(brand-|semantic-)/,
];

const ALLOWED_COLOR_EXCEPTIONS: RegExp[] = [
  /^from-black\/\d+$/,
  /^to-transparent$/,
  /^bg-black\/\d+$/,
];

const NON_COLOR_UTILITY_EXCEPTIONS: RegExp[] = [
  /^text-(xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\])$/,
  /^text-\[[^\s]+$/,
  /^text-(left|center|right|justify|start|end)$/,
  /^border-(t|r|b|l|x|y)$/,
  /^divide-(x|y)$/,
  /^bg-gradient-to-/,
  /^ring-\d+$/,        // ring-width utilities (ring-1, ring-2…) — not color
  /^ring-offset-\d+$/, // ring-offset-size utilities — not color
];

function isAllowedColorUtility(utilityClass: string) {
  return (
    NON_COLOR_UTILITY_EXCEPTIONS.some((pattern) => pattern.test(utilityClass)) ||
    ALLOWED_TOKEN_PATTERNS.some((pattern) => pattern.test(utilityClass)) ||
    ALLOWED_COLOR_EXCEPTIONS.some((pattern) => pattern.test(utilityClass))
  );
}

function getNonTokenColorUtilities(source: string): string[] {
  const matches = source.match(COLOR_UTILITY_REGEX) ?? [];
  const unique = Array.from(new Set(matches)).sort();
  return unique.filter((utilityClass) => !isAllowedColorUtility(utilityClass));
}

const ALLOWED_RADIUS_UTILITIES = new Set([
  "rounded-card",    // 16px — primary cards, map
  "rounded-panel",   // 12px — list groups, bento cells
  "rounded-control", // 8px  — buttons, inputs, thumbnails
  "rounded-pill",    // 9999px — alternative capsule alias
  "rounded-full",    // 9999px — circles and capsules (used in practice)
]);

function getNonTokenRadiusUtilities(source: string): string[] {
  const matches = source.match(RADIUS_UTILITY_REGEX) ?? [];
  const unique = Array.from(new Set(matches)).sort();
  return unique.filter((utilityClass) => !ALLOWED_RADIUS_UTILITIES.has(utilityClass));
}

type ScreenStatus = "done" | "in-progress" | "pending";
interface ScreenEntry { name: string; path: string; tokenized: ScreenStatus; figma: ScreenStatus; notes?: string; figmaUrl?: string; }
interface ScreenGroup { group: string; screens: ScreenEntry[] }

export default function HubPage() {
  const primColors = flattenTokens(primitives as TokenNode);
  const sizingNode = sizing as TokenNode;
  const spacingTokens = flattenTokens(
    sizingNode.spacing as TokenNode,
    "spacing"
  );
  const radiusTokens = flattenTokens(
    sizingNode.borderRadius as TokenNode,
    "borderRadius"
  );
  const shadowTokens = flattenTokens(
    sizingNode.boxShadow as TokenNode,
    "boxShadow"
  );
  const semanticTokens = flattenTokens(semanticLight as TokenNode);
  const dashboardSourcePath = path.join(
    process.cwd(),
    "app",
    "sandboxes",
    "miles-proto-2",
    "dashboard",
    "page.tsx"
  );
  const dashboardSource = fs.readFileSync(dashboardSourcePath, "utf8");
  const nonTokenColorUtilities = getNonTokenColorUtilities(dashboardSource);
  const nonTokenRadiusUtilities = getNonTokenRadiusUtilities(dashboardSource);
  const tokenAuditPass = nonTokenColorUtilities.length === 0;
  const radiusAuditPass = nonTokenRadiusUtilities.length === 0;

  // Bottom-nav uses intentional system colors — audit them separately
  const bottomNavSourcePath = path.join(
    process.cwd(),
    "app",
    "sandboxes",
    "miles-proto-2",
    "_components",
    "bottom-nav.tsx"
  );
  const bottomNavSource = fs.readFileSync(bottomNavSourcePath, "utf8");
  // These are the expected system colors in the bottom nav — all intentional
  const BOTTOM_NAV_EXPECTED = new Set([
    "bg-white/95",
    "border-neutral-200/80",
    "text-blue-600",
    "text-neutral-400",
    "bg-blue-600",
    "ring-blue-500",
    "ring-white",
  ]);
  const bottomNavRaw = getNonTokenColorUtilities(bottomNavSource).filter(
    (u) => !BOTTOM_NAV_EXPECTED.has(u)
  );
  const bottomNavAuditPass = bottomNavRaw.length === 0;

  // 18-entry type scale — every entry maps 1:1 to an iOS HIG Dynamic Type style or named custom role.
  // Merge history: "text-sm" (body regular) merged into "text-sm leading-relaxed" (body);
  // "text-[11px] font-semibold" (avatar) + "text-[11px]" (unit label) merged into
  // "text-[11px] font-medium" (caption 2) — weight diff at 11px is imperceptible.
  const typographyScale = iosTypographyScale;

  const SCREEN_INVENTORY: ScreenGroup[] = [
    {
      group: "Core",
      screens: [
        { name: "Dashboard",  path: "/dashboard",  tokenized: "done",    figma: "in-progress", notes: "Lead reference screen" },
        { name: "Trips",      path: "/trips",      tokenized: "pending", figma: "pending" },
        { name: "Miles",      path: "/miles",      tokenized: "pending", figma: "pending" },
        { name: "Insights",   path: "/insights",   tokenized: "pending", figma: "pending" },
        { name: "Profile",    path: "/profile",    tokenized: "pending", figma: "pending" },
      ],
    },
    {
      group: "Trip flow",
      screens: [
        { name: "Live trip",          path: "/live-trip",          tokenized: "pending", figma: "pending" },
        { name: "Trip complete",      path: "/trip-complete",      tokenized: "pending", figma: "pending" },
        { name: "Trip detail",        path: "/trip-detail",        tokenized: "pending", figma: "pending" },
        { name: "Trip receipt",       path: "/trip-receipt",       tokenized: "pending", figma: "pending" },
        { name: "Weekly recap",       path: "/weekly-recap",       tokenized: "pending", figma: "pending" },
        { name: "Driver score",       path: "/driver-score",       tokenized: "pending", figma: "pending" },
        { name: "Post drive prompts", path: "/post-drive-prompts", tokenized: "pending", figma: "pending" },
        { name: "First trip summary", path: "/first-trip-summary", tokenized: "pending", figma: "pending" },
      ],
    },
    {
      group: "Onboarding",
      screens: [
        { name: "Signup",          path: "/signup",          tokenized: "pending", figma: "pending" },
        { name: "Permissions",     path: "/permissions",     tokenized: "pending", figma: "pending" },
        { name: "Install",         path: "/install",         tokenized: "pending", figma: "pending" },
        { name: "Plug in device",  path: "/plug-in-device",  tokenized: "pending", figma: "pending" },
        { name: "Scan device",     path: "/scan-device",     tokenized: "pending", figma: "pending" },
        { name: "Pair device",     path: "/pair-device",     tokenized: "pending", figma: "pending" },
        { name: "Device detected", path: "/device-detected", tokenized: "pending", figma: "pending" },
        { name: "Ready to drive",  path: "/ready-to-drive",  tokenized: "pending", figma: "pending" },
        { name: "First trip ready",path: "/first-trip-ready",tokenized: "pending", figma: "pending" },
        { name: "Confirm address", path: "/confirm-address", tokenized: "pending", figma: "pending" },
      ],
    },
    {
      group: "Drivers",
      screens: [
        { name: "Drivers",           path: "/drivers",           tokenized: "pending", figma: "pending" },
        { name: "Add drivers",       path: "/add-drivers",       tokenized: "pending", figma: "pending" },
        { name: "Household",         path: "/household",         tokenized: "pending", figma: "pending" },
        { name: "Teen independence", path: "/teen-independence",  tokenized: "pending", figma: "pending" },
        { name: "Who's driving",     path: "/whos-driving",      tokenized: "pending", figma: "pending" },
        { name: "Driver reassignment",path: "/driver-reassignment",tokenized: "pending",figma: "pending" },
      ],
    },
    {
      group: "Device & account",
      screens: [
        { name: "Device health",  path: "/device-health",  tokenized: "pending", figma: "pending" },
        { name: "Vehicle",        path: "/vehicle",        tokenized: "pending", figma: "pending" },
        { name: "Settings",       path: "/settings",       tokenized: "pending", figma: "pending" },
        { name: "Account",        path: "/account",        tokenized: "pending", figma: "pending" },
        { name: "Billing",        path: "/billing",        tokenized: "pending", figma: "pending" },
        { name: "Notifications",  path: "/notifications",  tokenized: "pending", figma: "pending" },
        { name: "Help",           path: "/help-port",      tokenized: "pending", figma: "pending" },
        { name: "Locations",      path: "/locations",      tokenized: "pending", figma: "pending" },
      ],
    },
  ];

  const totalScreens = SCREEN_INVENTORY.reduce((n, g) => n + g.screens.length, 0);
  const tokenizedCount = SCREEN_INVENTORY.reduce(
    (n, g) => n + g.screens.filter((s) => s.tokenized === "done").length, 0
  );

  const componentInventory = [
    { name: "FleetView", description: "Dashboard header, map, vehicle list" },
    { name: "VehicleCardContent", description: "Single vehicle card (header, bento, live strip)" },
    { name: "ActivityFeed", description: "Grouped timeline: live trip · trip cards · score update cards · conversation starters" },
    { name: "AgentCoachingCard", description: "From Miles message + CTA" },
    { name: "AgentCoachingCarousel", description: "Horizontal coaching cards + dot indicators" },
    { name: "TodoPreview", description: "Demo todos list" },
    { name: "QuickActions", description: "Roadside Assist button (when profile header)" },
    { name: "LiveSpeed", description: "Trip speed + max (trip mode)" },
    { name: "TripVehicleStatus", description: "Vehicle health bento (trip mode)" },
    { name: "TripDriverCard", description: "Driver avatar + name + score" },
    { name: "TripInProgress", description: "Driving header, map, LiveSpeed, vehicle, driver" },
    { name: "TripComplete", description: "Trip summary card + coaching + back" },
    { name: "MapView", description: "Map with markers/route — supports labelColor to override pill color independently from marker dot" },
    { name: "Link", description: "Internal navigation" },
    { name: "BottomNav", description: "Tab bar (layout)" },
  ];

  return (
    <HubSectionProvider>
    <main className="flex min-h-dvh flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-[1200px]">
      <div className="px-5 pb-6 pt-14">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold leading-none text-text-primary">
            Design system hub
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-text-muted">
              Miles · iOS handoff reference
            </p>
            <span className="rounded-full bg-surface-strong px-2 py-0.5 text-[10px] font-semibold text-text-muted">{hubVersions.current}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="rounded-panel border border-stroke-muted bg-surface-card px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background"
          >
            ← Dashboard
          </Link>
          <a
            href="/sandboxes/miles-proto-2/hub/download"
            download
            className="rounded-panel border border-stroke-muted bg-surface-card px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background"
          >
            ↓ iOS package (.zip)
          </a>
        </div>

      </div>

      <HubNav />

      <div className="px-5 pb-6">
        {/* iOS Handoff — purpose statement */}
        <HubSection id="purpose">
        <section className="mt-6 rounded-panel border border-stroke-muted bg-surface-subtle p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Purpose</span>
            <span className="rounded-full bg-semantic-info/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-semantic-info">iOS handoff reference</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            A versioned handoff reference for the iOS engineering team. Starting at wireframe fidelity is intentional — it proves the process has real value before branded UI exists. Design will evolve; that&apos;s not a risk, it&apos;s the assumption the system is built on. Token names are stable from v0, so every line of SwiftUI written today stays valid as values are refined. Each version adds screens or improves values; the hub, iOS package, and Figma variables update together.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { section: "Typography", maps: "UIFont.TextStyle / SwiftUI .font()" },
              { section: "Colors", maps: "Semantic UIColor / Color(.semanticInfo)" },
              { section: "Radius", maps: "control 8pt · panel 12pt · card 16pt" },
              { section: "Spacing", maps: "SwiftUI .padding() / .spacing()" },
            ].map((item) => (
              <div key={item.section} className="flex flex-col gap-0.5 rounded-panel border border-stroke-muted bg-surface-card p-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{item.section}</span>
                <span className="font-mono text-[10px] text-text-secondary leading-snug">{item.maps}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-text-muted">
            Dark / light mode toggle on the dashboard proto controls section. All tokens resolve to different values per mode — test both before shipping. Figma variables mirror this token set exactly (see <strong>Figma Plugin</strong> section below).
          </p>
        </section>

        </HubSection>

        {/* Changelog */}
        <HubSection id="changelog">
        <section className="mt-6 rounded-panel border border-stroke-muted bg-surface-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Changelog
            </h2>
            <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-muted">
              how updates are delivered
            </span>
          </div>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            The hub is versioned. Each version is a stable, usable state — {hubVersions.current} is not a draft, it&apos;s a working reference. Changes happen in batches: a round of Figma refinement, a new screen tokenized, a token value updated. When a batch is ready, the version increments, this page reflects it, and the iOS package updates automatically.
          </p>

          {/* Version entries — driven by versions.json */}
          <div className="mt-5 flex flex-col gap-5">
            {hubVersions.versions.map((v) => (
              <div key={v.version} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {v.status === "current" ? (
                    <span className="rounded-full bg-semantic-success/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-semantic-success">
                      current · {v.version}
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                      {v.version}
                    </span>
                  )}
                  <span className="text-[11px] text-text-muted">{v.date}</span>
                  <div className="h-px flex-1 bg-stroke-muted" />
                </div>
                {(v.breaking as BreakingChange[]).length > 0 && (
                  <div className="rounded-panel border border-semantic-warning/40 bg-semantic-warning/5 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-semantic-warning">
                      ⚠ Breaking changes — SwiftUI update required
                    </p>
                    <ul className="flex flex-col gap-2 text-xs text-text-secondary">
                      {(v.breaking as BreakingChange[]).map((b, i) => (
                        <li key={i} className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <code className="rounded bg-surface-strong px-1 font-mono text-[11px] line-through text-text-muted">{b.from}</code>
                            <span className="text-text-muted">→</span>
                            <code className="rounded bg-surface-strong px-1 font-mono text-[11px] text-text-primary">{b.to}</code>
                            <span className="rounded-full bg-surface-strong px-1.5 py-0.5 text-[10px] font-medium text-text-muted uppercase tracking-wide">{b.type}</span>
                          </div>
                          <span className="text-[11px] text-text-muted leading-relaxed">{b.note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="rounded-panel border border-stroke-muted bg-background p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    What&apos;s in {v.version}
                  </p>
                  <ul className="flex flex-col gap-1.5 text-xs text-text-secondary">
                    {v.changes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`mt-px shrink-0 ${item.done ? "text-semantic-success" : "text-semantic-info"}`}>
                          {item.done ? "✓" : "~"}
                        </span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* How future versions work */}
          <div className="mt-5 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">How future versions work</span>
            <p className="text-xs text-text-muted leading-relaxed">
              As Figma refines values or new screens are tokenized, changes are batched and the hub version increments. The iOS Swift package re-downloads with updated values. Figma-linked token values update automatically via the hub plugin. Existing SwiftUI code referencing stable token names requires no changes — only the underlying values improve.
            </p>
            <div className="mt-1 rounded-panel border border-stroke-muted bg-surface-subtle px-3 py-2.5">
              <ul className="flex flex-col gap-0.5">
                {hubVersions.upcoming.map((line, i) => (
                  <li key={i} className="font-mono text-[11px] text-text-muted">{line}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* iOS dev — when a new version ships */}
          <div className="mt-4 rounded-panel border border-stroke-muted bg-background p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">When a new version ships — iOS checklist</p>
            <ul className="flex flex-col gap-2 text-xs text-text-secondary">
              {[
                {
                  icon: "→",
                  color: "text-text-muted",
                  title: "Check the changelog",
                  body: "The version badge at the top of this page increments when a new version ships. Review the entry to understand scope before doing anything else.",
                },
                {
                  icon: "↓",
                  color: "text-semantic-info",
                  title: "Re-download the iOS package if token values changed",
                  body: "If the changelog notes refined color, radius, or spacing values — re-download MilesTokens.swift from the button at the top of this page and drop it into Xcode.",
                },
                {
                  icon: "⚠",
                  color: "text-semantic-warning",
                  title: "If breaking changes are listed — SwiftUI update required",
                  body: "Token names are stable by design and almost never change. But if a name is renamed or removed, it will appear as a breaking change with a warning block in the changelog entry — with the old name, new name, and exact update needed. This is rare and will always be explicit.",
                },
                {
                  icon: "✓",
                  color: "text-semantic-success",
                  title: "No breaking changes listed — no code changes needed",
                  body: "If there is no breaking changes block, your SwiftUI code is unaffected. Color(.semanticSuccess), .cornerRadius(16), .font(.headline) — all stable. Only the resolved values improve.",
                },
                {
                  icon: "○",
                  color: "text-text-muted",
                  title: "New screens in the inventory",
                  body: "No action needed until you're ready to build them. They enter the same loop when the time comes.",
                },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={`mt-px shrink-0 font-mono text-[11px] ${item.color}`}>{item.icon}</span>
                  <span className="leading-relaxed">
                    <strong className="font-semibold text-text-primary">{item.title} — </strong>
                    {item.body}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        </HubSection>

        {/* Getting Started — iOS developer onboarding */}
        <HubSection id="getting-started">
        <section className="mt-6 rounded-panel border border-stroke-muted bg-surface-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Getting started
            </h2>
          </div>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            Everything needed to start building is here now. As versions increment, the same references update in place — the prototype, token ZIP, and Figma are always accessible from this page.
          </p>

          {/* Always available */}
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Always available</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  {
                    label: "Live dashboard prototype",
                    detail: "All screen states: fleet view, one vehicle driving, trip in progress, trip complete. Toggle between them with the proto controls at the bottom of the dashboard.",
                    href: "/dashboard",
                    linkLabel: "Open dashboard →",
                  },
                  {
                    label: "Typography — 18 roles",
                    detail: "Every text style on the dashboard maps to a named iOS HIG role (e.g. .largeTitle, .headline, .caption2) with the exact SwiftUI modifier. See Typography scale below.",
                    href: null,
                    linkLabel: null,
                  },
                  {
                    label: "Color tokens",
                    detail: "Semantic tokens (surface, text, stroke, success/warning/danger/info) with light and dark values. Each has an explicit UIColor / SwiftUI Color mapping in the Dashboard parity section below.",
                    href: null,
                    linkLabel: null,
                  },
                  {
                    label: "Radius + spacing",
                    detail: "Three radius tokens: control 8pt, panel 12pt, card 16pt — each maps to .cornerRadius(). Spacing follows Tailwind multiples: 4px base, used as SwiftUI .padding() or .spacing().",
                    href: null,
                    linkLabel: null,
                  },
                  {
                    label: "iOS Swift package",
                    detail: "Generated on demand from live token files — MilesTokens.swift with adaptive Color, Radius, and Spacing enums ready to drop into Xcode. Re-download after any token update.",
                    href: "/sandboxes/miles-proto-2/hub/download",
                    linkLabel: "↓ Download iOS package →",
                  },
                  {
                    label: "Figma MCP",
                    detail: "Figma variables are synced via the hub plugin. As screens are captured and variable-linked, an AI assistant with Figma MCP access can inspect individual layer properties — exact token names, bindings, and resolved values — as an additional reference during development.",
                    href: null,
                    linkLabel: null,
                  },
                ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1 rounded-panel border border-stroke-muted bg-background p-3">
                  <span className="text-xs font-semibold text-text-primary">{item.label}</span>
                  <span className="text-[11px] text-text-muted leading-relaxed">{item.detail}</span>
                  {item.href && item.linkLabel && (
                    <a href={item.href} className="mt-1 text-[11px] font-medium text-semantic-info hover:text-semantic-info/80">
                      {item.linkLabel}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI-assisted approach */}
          <div className="mt-5 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Recommended AI-assisted approach</span>
            <p className="text-xs text-text-muted leading-relaxed">
              Open the dashboard in a browser alongside your Xcode project. Feed both this URL and the source file to your AI assistant and use a prompt like:
            </p>
            <div className="rounded-panel border border-stroke-muted bg-surface-subtle px-4 py-3">
              <p className="font-mono text-xs text-text-secondary leading-relaxed">
                &ldquo;Here is a running web prototype at localhost:3000/sandboxes/miles-proto-2/dashboard and its source. Recreate the FleetView screen in SwiftUI. Use the typography and color mappings documented in the hub page to translate each Tailwind class to its iOS equivalent — .largeTitle for text-3xl font-bold, .cornerRadius(16) for rounded-card, Color(.semanticSuccess) for text-semantic-success, etc.&rdquo;
              </p>
            </div>
            <p className="text-[11px] text-text-muted">
              Providing both the prototype URL and source to an AI assistant can accelerate SwiftUI development. As Figma fidelity grows, token values update in place — the same SwiftUI calls remain valid throughout.
            </p>
          </div>

          {/* What Figma provides */}
          <div className="mt-5 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">What Figma provides</span>
            <ul className="flex flex-col gap-1 text-xs text-text-muted">
              <li className="flex items-start gap-2">
                <span className="mt-px text-stroke-strong">·</span>
                <span>A canonical design artifact for sign-off and stakeholder review</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-px text-stroke-strong">·</span>
                <span>Variable-linked layers — toggling Light ↔ Dark in Figma verifies every token in one click</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-px text-stroke-strong">·</span>
                <span>AI-extractable variable bindings per layer — an AI assistant can query token-linked layers by name, returning exact token names and resolved values as a reference at any point in iOS development</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-px text-stroke-strong">·</span>
                <span>Designer refinements to color values, radius, or spacing — updates sync back to this hub and are picked up by the iOS build without any structural changes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-px text-stroke-strong">·</span>
                <span>Flat PNG exports for mockup decks, stakeholder presentations, and marketing assets — a free by-product of token-linked screens</span>
              </li>
            </ul>
          </div>
        </section>

        </HubSection>

        {/* Pipeline — full workflow */}
        <HubSection id="pipeline">
        <section className="mt-6 rounded-panel border border-stroke-muted bg-surface-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Design → iOS pipeline
            </h2>
            <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-muted">
              repeatable method
            </span>
          </div>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            Token names are stable from the start. iOS development and Figma refinement run in parallel without blocking each other — there is no sync gate or fidelity milestone to wait for. Token values improve continuously; the hub always reflects the current state.
          </p>

          {/* Process diagram */}
          <figure className="mt-4 overflow-hidden rounded-panel border border-stroke-muted bg-surface-subtle">
            <img
              src="/dropbox/process.png"
              alt="Design → iOS process diagram"
              className="w-full"
            />
            <figcaption className="px-3 py-2 text-[11px] text-text-muted">
              The full loop — UX Flow → Token Source of Truth → Build + Make it Pretty (parallel) → Testing → feedback splits back to UX or visual track → version bump.
            </figcaption>
          </figure>

          {/* Phase 1 */}
          <div className="mt-5 flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Phase 1 — Reference ready</span>
            <div className="h-px flex-1 bg-stroke-muted" />
            <span className="rounded-full bg-semantic-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-semantic-success">done</span>
          </div>
          <ol className="mt-3 flex flex-col gap-3">
            {[
              {
                n: "1",
                title: "Design in the browser",
                body: "Build and iterate on the dashboard prototype using semantic design tokens throughout. All screen states — fleet view, live trip, trip complete — are wired up and interactive. The hub's live compliance checker confirms every color and radius is token-bound.",
              },
              {
                n: "2",
                title: "Hub confirms styles",
                body: "Typography scale (18 roles mapped to iOS HIG), color tokens (with UIColor equivalents), radius tokens, spacing, and the token compliance audit all reflect live code — not a static spec. At this point layout and component structure are defined.",
              },
            ].map((step) => (
              <li key={step.n} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                  {step.n}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-text-primary">{step.title}</span>
                  <span className="text-xs text-text-muted leading-relaxed">{step.body}</span>
                </div>
              </li>
            ))}
          </ol>

          {/* iOS dev entry point callout */}
          <div className="mt-4 rounded-panel border border-semantic-success/30 bg-semantic-success/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-semantic-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-semantic-success">iOS development entry point</span>
            </div>
            <p className="text-sm font-medium text-text-primary leading-relaxed">
              Build now. The values will catch up.
            </p>
            <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
              The component hierarchy, navigation flow, and token names are defined at v0. Visual fidelity — exact color values, font choices, radius — will be refined through Figma. That&apos;s not a gap in the reference; it&apos;s the process working as intended.
            </p>
            <div className="mt-3 rounded-control border border-stroke-muted bg-background px-3 py-2.5">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">What this means for your SwiftUI code</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-semantic-success">Wire up now — these won&apos;t change</span>
                  <ul className="flex flex-col gap-0.5 text-text-muted">
                    <li className="flex items-start gap-1.5"><span className="mt-px shrink-0 text-semantic-success">✓</span><span>Component structure and hierarchy</span></li>
                    <li className="flex items-start gap-1.5"><span className="mt-px shrink-0 text-semantic-success">✓</span><span>Screen states and navigation flow</span></li>
                    <li className="flex items-start gap-1.5"><span className="mt-px shrink-0 text-semantic-success">✓</span><span>Token names (semanticSuccess, strokeMuted, etc.)</span></li>
                    <li className="flex items-start gap-1.5"><span className="mt-px shrink-0 text-semantic-success">✓</span><span>Layout and spacing proportions</span></li>
                    <li className="flex items-start gap-1.5"><span className="mt-px shrink-0 text-semantic-success">✓</span><span>Typography role assignments (.largeTitle, .headline…)</span></li>
                  </ul>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-text-secondary">Expected to evolve — absorbed automatically</span>
                  <ul className="flex flex-col gap-0.5 text-text-muted">
                    <li className="flex items-start gap-1.5"><span className="mt-px shrink-0 text-text-muted">→</span><span>Exact color values (hex/opacity per token)</span></li>
                    <li className="flex items-start gap-1.5"><span className="mt-px shrink-0 text-text-muted">→</span><span>Secondary typeface (SF Pro is already handled)</span></li>
                    <li className="flex items-start gap-1.5"><span className="mt-px shrink-0 text-text-muted">→</span><span>Corner radius values (currently 8 / 12 / 16pt)</span></li>
                    <li className="flex items-start gap-1.5"><span className="mt-px shrink-0 text-text-muted">→</span><span>Fine spacing adjustments per section</span></li>
                  </ul>
                </div>
              </div>
              <p className="mt-2.5 text-[11px] text-text-muted leading-relaxed">
                Everything on the right evolves as token <em>values</em> — not names. SwiftUI calls like <code className="rounded bg-surface-strong px-1 font-mono">Color(.semanticSuccess)</code>, <code className="rounded bg-surface-strong px-1 font-mono">.cornerRadius(16)</code>, and <code className="rounded bg-surface-strong px-1 font-mono">.font(.headline)</code> stay exactly as written. Re-download the iOS package when a new version ships and the updated values are picked up automatically.
              </p>
            </div>
          </div>

          {/* Phase 2 — parallel tracks */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Phase 2 — Parallel tracks</span>
            <div className="h-px flex-1 bg-stroke-muted" />
            <span className="rounded-full bg-semantic-info/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-semantic-info">in progress</span>
          </div>
          <p className="mt-2 text-[11px] text-text-muted leading-relaxed">
            iOS development and Figma refinement run at the same time. Neither waits for the other — and neither is ever &ldquo;done.&rdquo; As Figma values are refined, they update in this hub. As new screens are built, they enter the same loop.
          </p>

          {/* Two-column parallel track layout */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* iOS track */}
            <div className="flex flex-col gap-2 rounded-panel border border-stroke-muted bg-background p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">iOS track</span>
              <ol className="flex flex-col gap-2.5">
                {[
                  { n: "3", title: "Build component structure", body: "SwiftUI views, navigation, screen states. Use this hub as the reference. Component names mirror the web prototype (FleetView, VehicleCardContent, ActivityFeed, etc.)." },
                  { n: "4", title: "Wire token-mapped styles", body: "Apply Color, Font, and cornerRadius using the mappings in this hub. Once Figma screens are token-linked, Figma MCP can be used to inspect individual layer properties — exact token names and resolved values — as an additional reference during development." },
                ].map((step) => (
                  <li key={step.n} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                      {step.n}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-text-primary">{step.title}</span>
                      <span className="text-[11px] text-text-muted leading-relaxed">{step.body}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            {/* Figma track */}
            <div className="flex flex-col gap-2 rounded-panel border border-stroke-muted bg-background p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Figma track</span>
              <ol className="flex flex-col gap-2.5">
                {[
                  { n: "5", title: "Push tokens to Figma (plugin)", body: "Run the Miles Hub Plugin. It writes all tokens as Figma Variables (semantic · primitives · sizing) and Miles/* text styles. Re-run any time tokens change — it's idempotent." },
                  { n: "6", title: "Port screen + link variables", body: "AI capture recreates the screen as Figma layers. Then the variable-linking checklist maps every layer property to its token. Toggle Light ↔ Dark to verify all tokens respond." },
                  { n: "7", title: "Refine visual details in Figma", body: "Designer adjusts color values, radius, font, spacing directly in Figma. Token names stay the same — only values change. Sync refined values back to lib/design-system/tokens/ via Figma MCP. Token-linked screens can also be exported as flat PNGs for decks and stakeholder assets." },
                ].map((step) => (
                  <li key={step.n} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                      {step.n}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-text-primary">{step.title}</span>
                      <span className="text-[11px] text-text-muted leading-relaxed">{step.body}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Ongoing — expand scope */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Ongoing — expand scope</span>
            <div className="h-px flex-1 bg-stroke-muted" />
            <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">repeating</span>
          </div>
          <p className="mt-2 text-[11px] text-text-muted leading-relaxed">
            Each additional screen enters the same loop at step 1. The token system, plugin, Swift package, and Figma tooling are all reusable — only the scope grows. The hub is always the current state of the system, whatever that state is.
          </p>
          <p className="mt-2 text-[11px] text-text-muted leading-relaxed">
            Real-world testing — TestFlight builds, beta feedback, usage data — feeds back into the loop in two ways: UX or flow issues return to the prototype and become structural updates; visual or branding issues return to Figma and become token value refinements. Either way, the next version batch absorbs them through the same pipeline.
          </p>
          <div className="mt-3 rounded-panel border border-stroke-muted bg-background p-3">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">Adopting a new screen — 3 steps</p>
            <ol className="flex flex-col gap-2">
              {[
                { n: "A", title: "Tokenize", body: "Replace raw Tailwind color and radius classes with semantic token equivalents. Run the compliance checker (or extend it to the new file) to confirm zero non-token utilities remain." },
                { n: "B", title: "Capture into Figma", body: "Run the Figma capture prompt with the new screen's URL in [LOCAL_PAGE_URL]. The same hub plugin, prompt, and variable-linking workflow apply — no setup changes needed." },
                { n: "C", title: "Update screen inventory", body: "Mark the screen as tokenized and Figma-captured in the Screen inventory below. The hub, iOS package, and Figma are immediately up to date — the loop continues." },
              ].map((step) => (
                <li key={step.n} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-strong text-[10px] font-semibold text-text-secondary">
                    {step.n}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-text-primary">{step.title}</span>
                    <span className="text-[11px] text-text-muted leading-relaxed">{step.body}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        </HubSection>

        {/* Figma capture + variable-linking prompt */}
        <HubSection id="capture-prompts">
        <CapturePrompt />
        </HubSection>

        {/* Figma Plugin */}
        <HubSection id="figma-plugin">
        <section className="mt-6 rounded-panel border border-stroke-muted bg-surface-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Figma Plugin
            </h2>
            <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-muted">
              custom dev plugin · no Token Studio
            </span>
          </div>
          <p className="mt-2 text-sm text-text-secondary">
            We use our own Figma development plugin at <code className="rounded bg-surface-strong px-1 font-mono text-[11px]">figma-plugin/miles-hub-mvp/</code>. It fetches tokens directly from this running app and writes them as Figma Variables — no third-party plugin required.
          </p>

          {/* Setup steps */}
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Setup</span>
            <ol className="flex flex-col gap-1.5 text-xs text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-surface-strong text-[10px] font-semibold text-text-muted">1</span>
                <span>Start the app: <code className="rounded bg-surface-strong px-1 font-mono">npm run dev</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-surface-strong text-[10px] font-semibold text-text-muted">2</span>
                <span>In Figma desktop: <strong>Plugins → Development → Import plugin from manifest</strong> → select <code className="rounded bg-surface-strong px-1 font-mono">figma-plugin/miles-hub-mvp/manifest.json</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-surface-strong text-[10px] font-semibold text-text-muted">3</span>
                <span>Run the plugin, enter the full hub URL (e.g. <code className="rounded bg-surface-strong px-1 font-mono">http://localhost:3000/sandboxes/miles-proto-2/hub</code>), click <strong>Upsert from Hub</strong></span>
              </li>
            </ol>
          </div>

          {/* What it creates */}
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">What the plugin creates</span>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {[
                { name: "primitives ✦", detail: "Base — full color palette: neutral scale, green/blue/yellow/red status stops, brand greens, black, white" },
                { name: "semantic ✦", detail: "Light · Dark — all surface, text, stroke, and status colors; each aliased to its matching primitive for automatic mode-switching" },
                { name: "sizing ✦", detail: "Base — spacing scale, borderRadius/control·panel·card·pill, boxShadow/card (STRING reference — see note below)" },
                { name: "Miles/* text styles ✦", detail: "18 iOS-specific styles from /hub/typography — apply to text layers via the style panel, not as variables" },
                { name: "typography", detail: "web font primitives (fontSizes, fontWeights…). Not needed for iOS handoff but useful as a reference; uncheck to skip" },
                { name: "state", detail: "hover/active/focus/disabled tokens. iOS handles states natively; uncheck to skip for a leaner sync" },
              ].map((item) => (
                <div key={item.name} className="flex items-start gap-2 rounded-panel border border-stroke-muted bg-background px-2.5 py-2">
                  <code className="shrink-0 font-mono text-[11px] font-medium text-text-primary">{item.name}</code>
                  <span className="text-[11px] text-text-muted">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* boxShadow note */}
          <p className="mt-3 text-[11px] text-text-muted">
            <strong>Note on shadows:</strong> <code className="rounded bg-surface-strong px-1 font-mono">sizing → boxShadow/card</code> is stored as a <code className="rounded bg-surface-strong px-1 font-mono">STRING</code> variable — Figma cannot live-bind variables to drop shadows. Read the value from the variable and enter it manually: Y offset 24, blur 70, black @ 8% opacity.
          </p>

          {/* Key behavior */}
          <div className="mt-4 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Key behavior</span>
            <ul className="space-y-1 text-xs text-text-secondary">
              <li>• <strong>Idempotent</strong> — re-running updates existing variables and creates missing ones. Safe to run after any token change.</li>
              <li>• <strong>Alias linking</strong> — semantic color tokens are written as Figma variable aliases to the matching primitive (not raw hex), so toggling Light/Dark mode in Figma updates everything automatically. All status colors (success, info, warning, danger) have matching primitives for a complete alias chain.</li>
              <li>• <strong>Color Samples page</strong> — a secondary button generates a <code className="rounded bg-surface-strong px-1 font-mono">Miles Color Samples</code> page in Figma with live-bound swatches for every color variable — useful for quickly verifying Light/Dark mode values after a sync.</li>
            </ul>
          </div>

          {/* Endpoints */}
          <div className="mt-4 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Hub endpoints</span>
            <p className="text-[11px] text-text-muted">
              All paths are relative to the hub URL you enter in the plugin (e.g. <code className="rounded bg-surface-strong px-1 font-mono">.../hub</code>). The same plugin works with any project that exposes these routes.
            </p>
            <ul className="space-y-1 font-mono text-xs text-text-secondary">
              <li><code className="rounded bg-surface-strong px-1">GET /tokens</code> — combined token JSON (all sets) <span className="text-text-muted">· used by plugin</span></li>
              <li><code className="rounded bg-surface-strong px-1">GET /typography</code> — text style bootstrap data <span className="text-text-muted">· used by plugin</span></li>
              <li><code className="rounded bg-surface-strong px-1">GET /manifest</code> — hub index <span className="text-text-muted">· available for tooling</span></li>
              <li><code className="rounded bg-surface-strong px-1">GET /component-specs</code> — component → token contract <span className="text-text-muted">· available for tooling</span></li>
            </ul>
          </div>
        </section>
        </HubSection>
      </div>

      <div className="mt-8 flex flex-col gap-8 px-5">
        {/* Primitives — colors */}
        <HubSection id="color-primitives">
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Color · Primitives
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {primColors.map((t) => (
              <ColorSwatch key={t.name} name={t.name} value={t.value} />
            ))}
          </div>
        </section>
        </HubSection>

        {/* Semantic tokens */}
        <HubSection id="color-semantic">
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Color · Semantic (light mode)
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {semanticTokens.map((t) => (
              <ColorSwatch key={t.name} name={t.name} value={t.value} />
            ))}
          </div>
        </section>
        </HubSection>

        {/* Spacing */}
        <HubSection id="spacing">
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Spacing
          </h2>
          <div className="flex flex-wrap gap-4">
            {spacingTokens.map((t) => (
              <div key={t.name} className="flex flex-col items-center gap-1">
                <div
                  className="rounded bg-surface-strong"
                  style={{
                    width: t.value === "0" ? 4 : Math.min(48, parseInt(t.value, 10) || 16),
                    height: 24,
                  }}
                />
                <span className="font-mono text-[11px] text-text-muted">
                  {t.name}
                </span>
                <span className="font-mono text-xs text-text-secondary">
                  {t.value}
                </span>
              </div>
            ))}
          </div>
        </section>
        </HubSection>

        {/* Border radius & shadow */}
        <HubSection id="radius-shadow">
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Border radius · Shadow
          </h2>
          <div className="flex flex-wrap gap-6">
            {radiusTokens.map((t) => (
              <div key={t.name} className="flex flex-col items-center gap-1">
                <div
                  className="bg-stroke-strong"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius:
                      t.value === "9999px"
                        ? 9999
                        : parseInt(t.value, 10) || 0,
                  }}
                />
                <span className="font-mono text-[11px] text-text-muted">
                  {t.name}
                </span>
                <span className="font-mono text-[10px] text-text-muted">
                  {t.value === "9999px" ? "Capsule()" : `.cornerRadius(${parseInt(t.value, 10)})`}
                </span>
              </div>
            ))}
            {shadowTokens.map((t) => (
              <div key={t.name} className="flex flex-col items-center gap-1">
                <div
                  className="rounded-lg bg-surface-card border border-stroke-muted"
                  style={{ boxShadow: t.value, width: 64, height: 48 }}
                />
                <span className="font-mono text-[11px] text-text-muted">
                  {t.name}
                </span>
                <span className="text-center text-[10px] text-text-muted">
                  map · from miles
                </span>
              </div>
            ))}
          </div>
        </section>
        </HubSection>

        {/* Typography scale */}
        <HubSection id="typography">
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Typography scale — iOS handoff
          </h2>
          <p className="text-xs text-text-muted">
            18 roles · each maps to one iOS HIG Dynamic Type style or named custom role. Inter (web) ↔ SF Pro (iOS).
          </p>

          {/* Group key */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Titles", color: "bg-surface-strong text-text-secondary" },
              { label: "Body", color: "bg-surface-strong text-text-secondary" },
              { label: "Stats", color: "bg-surface-strong text-text-secondary" },
              { label: "Captions", color: "bg-surface-strong text-text-secondary" },
              { label: "Small labels", color: "bg-surface-strong text-text-secondary" },
              { label: "Micro", color: "bg-surface-strong text-text-secondary" },
              { label: "AI voice", color: "bg-surface-strong text-text-secondary" },
            ].map((g) => (
              <span key={g.label} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${g.color}`}>
                {g.label}
              </span>
            ))}
          </div>

          {(() => {
            const GROUPS: { label: string; names: string[] }[] = [
              { label: "Titles", names: ["Large Title", "Display", "Title", "Headline"] },
              { label: "Body", names: ["Subheadline Bold", "Subheadline", "Body"] },
              { label: "Stats", names: ["Stat — Large", "Stat — Medium"] },
              { label: "Captions", names: ["Caption Emphasized", "Caption", "Caption Muted"] },
              { label: "Small labels", names: ["Section Header", "Caption 2"] },
              { label: "Micro", names: ["Badge", "Micro Label"] },
              { label: "AI voice", names: ["AI Body", "AI Label"] },
            ];
            return (
              <div className="flex flex-col gap-6">
                {GROUPS.map((group) => {
                  const rows = typographyScale.filter((r) => group.names.includes(r.name));
                  return (
                    <div key={group.label} className="flex flex-col gap-0">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                          {group.label}
                        </span>
                        <div className="h-px flex-1 bg-stroke-muted" />
                      </div>
                      <div className="flex flex-col rounded-panel border border-stroke-muted bg-surface-card">
                        {rows.map((row, i) => (
                          <div
                            key={row.name}
                            className={`flex flex-col gap-2 p-3 ${i < rows.length - 1 ? "border-b border-stroke-muted" : ""}`}
                          >
                            {/* Top row: role name + iOS name + SwiftUI */}
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-semibold text-text-primary">
                                  {row.name}
                                </span>
                                <code className="font-mono text-[10px] text-text-muted">
                                  {row.className}
                                </code>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                                  {row.iosName}
                                </span>
                                <span className="rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-[10px] text-semantic-info">
                                  {row.swiftUI}
                                </span>
                              </div>
                            </div>
                            {/* Sample text */}
                            <span className={`text-text-primary ${row.className}`}>
                              The quick brown fox
                            </span>
                            {/* Usage */}
                            <span className="text-[10px] text-text-muted">
                              {row.usage}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </section>
        </HubSection>

        {/* Dashboard parity — Tailwind → token mapping */}
        <HubSection id="dashboard-parity">
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Dashboard parity (tokenized dashboard)
          </h2>
          <p className="text-xs text-text-muted">
            Current classes used on the dashboard. Keep these aligned with Figma variables and token JSON.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-panel border border-stroke-muted bg-surface-card p-4">
              <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Spacing (dashboard)
              </h3>
              <ul className="space-y-1 font-mono text-xs text-text-secondary">
                <li>px-5, py-4, gap-4 → 20px</li>
                <li>px-4, gap-3, p-4 → 16px</li>
                <li>px-3, py-3, gap-2, p-3 → 12px</li>
                <li>px-2.5, py-2.5, gap-1.5 → 10px</li>
                <li>gap-1, py-1.5, pt-2 → 4–6px</li>
                <li>gap-0.5, py-0.5 → 2px</li>
              </ul>
            </div>
            <div className="rounded-panel border border-stroke-muted bg-surface-card p-4">
              <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Radius (dashboard)
              </h3>
              <ul className="space-y-1 font-mono text-xs text-text-secondary">
                <li>rounded-card → 16px (map + primary cards)</li>
                <li>rounded-panel → 12px (panels, bento, strips)</li>
                <li>rounded-control → 8px (buttons, controls, thumbnails)</li>
                <li>rounded-full → 9999px (badges, avatars)</li>
              </ul>
            </div>
            <div className="sm:col-span-2 rounded-panel border border-stroke-muted bg-surface-card p-4">
              <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Colors (dashboard)
              </h3>
              <ul className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-text-secondary">
                <li>bg-background / bg-surface-card / bg-surface-subtle (base surfaces)</li>
                <li>text-text-primary / text-text-secondary / text-text-muted (typography)</li>
                <li>border-stroke-muted / divide-stroke-muted / bg-stroke-strong (strokes)</li>
                <li>text-semantic-success / warning / danger / info (status + intent)</li>
                <li>bg-semantic-success / warning / info (dots, status markers, filled status pills)</li>
                <li>bg-semantic-info + bg-semantic-success (filled PARKED / DRIVING pill backgrounds)</li>
                <li>bg-foreground + text-background (inverse dark cards, overlays, Emma driver avatar)</li>
              </ul>
              <p className="mt-3 text-[11px] text-text-muted">
                <strong>Note:</strong> <code className="font-mono rounded bg-surface-strong px-1">stroke-muted</code> and <code className="font-mono rounded bg-surface-strong px-1">surface-strong</code> resolve to the same value in both modes (<code className="font-mono">neutral-200</code> light / <code className="font-mono">neutral-800</code> dark). The names are kept separate for semantic clarity — strokes vs hover surfaces — but share values by design.
              </p>
            </div>
            <div className="sm:col-span-2 rounded-panel border border-stroke-muted bg-surface-card p-4">
              <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Tab bar / Bottom nav (system colors — intentional)
              </h3>
              <p className="mb-3 text-xs text-text-muted">
                <code className="rounded bg-surface-strong px-1 font-mono">_components/bottom-nav.tsx</code> uses raw Tailwind system colors, not semantic tokens. This is intentional — these map directly to iOS UITabBar system tints.
              </p>
              <ul className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-text-secondary">
                <li>bg-white/95 backdrop-blur-xl → UITabBar background (frosted glass)</li>
                <li>border-neutral-200/80 → UITabBar top separator</li>
                <li>text-blue-600 → active tab icon + label tint (iOS system blue)</li>
                <li>text-neutral-400 → inactive tab icon + label</li>
                <li>bg-blue-600 ring-2 ring-white → Miles tab notification badge dot</li>
                <li>focus-visible:ring-blue-500 → keyboard focus ring</li>
              </ul>
              <p className="mt-3 text-[11px] text-text-muted">
                iOS mapping: active tint → <code className="font-mono">UIColor.systemBlue</code> · inactive → <code className="font-mono">UIColor.systemGray2</code> · bar background → <code className="font-mono">.systemBackground</code> with <code className="font-mono">UIBlurEffect(.systemMaterial)</code>
              </p>
            </div>
          </div>
        </section>
        </HubSection>

        {/* Token compliance checklist */}
        <HubSection id="token-compliance">
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Token compliance checklist
          </h2>
          <div className="rounded-panel border border-stroke-muted bg-surface-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">
                Dashboard color utility audit
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  tokenAuditPass
                    ? "bg-surface-subtle text-semantic-success"
                    : "bg-surface-subtle text-semantic-warning"
                }`}
              >
                {tokenAuditPass ? "PASS" : "ATTN"}
              </span>
            </div>
            <ul className="space-y-1 text-xs text-text-secondary">
              <li>• Uses token classes for surface/text/stroke/semantic intent</li>
              <li>• Uses only sanctioned radius utilities: `rounded-card`, `rounded-panel`, `rounded-control`, `rounded-full`</li>
              <li>• Allows black gradient/overlay exceptions for map readability</li>
              <li>• Source audited: <code className="rounded bg-surface-strong px-1 font-mono">dashboard/page.tsx</code></li>
              <li>
                • Non-token color utility count:{" "}
                <strong>{nonTokenColorUtilities.length}</strong>
              </li>
              <li>
                • Non-token radius utility count:{" "}
                <strong>{nonTokenRadiusUtilities.length}</strong>
              </li>
            </ul>
            {!tokenAuditPass && (
              <div className="mt-3 rounded-lg border border-stroke-muted bg-background p-3">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
                  Needs conversion
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {nonTokenColorUtilities.map((utilityClass) => (
                    <code
                      key={utilityClass}
                      className="rounded bg-surface-strong px-1.5 py-0.5 font-mono text-[11px] text-text-secondary"
                    >
                      {utilityClass}
                    </code>
                  ))}
                </div>
              </div>
            )}
            {!radiusAuditPass && (
              <div className="mt-3 rounded-lg border border-stroke-muted bg-background p-3">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
                  Radius needs conversion
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {nonTokenRadiusUtilities.map((utilityClass) => (
                    <code
                      key={utilityClass}
                      className="rounded bg-surface-strong px-1.5 py-0.5 font-mono text-[11px] text-text-secondary"
                    >
                      {utilityClass}
                    </code>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 border-t border-stroke-muted pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">
                  Bottom-nav color audit (system colors expected)
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    bottomNavAuditPass
                      ? "bg-surface-subtle text-semantic-success"
                      : "bg-surface-subtle text-semantic-warning"
                  }`}
                >
                  {bottomNavAuditPass ? "PASS" : "ATTN"}
                </span>
              </div>
              <ul className="space-y-1 text-xs text-text-secondary">
                <li>• Source audited: <code className="rounded bg-surface-strong px-1 font-mono">_components/bottom-nav.tsx</code></li>
                <li>• Intentional system colors: <code className="font-mono">blue-600</code> (active tint), <code className="font-mono">neutral-400</code> (inactive), <code className="font-mono">white/95</code> (bar bg)</li>
                <li>• Unexpected non-token utilities: <strong>{bottomNavRaw.length}</strong></li>
              </ul>
              {!bottomNavAuditPass && (
                <div className="mt-3 rounded-lg border border-stroke-muted bg-background p-3">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
                    Unexpected — review
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {bottomNavRaw.map((u) => (
                      <code key={u} className="rounded bg-surface-strong px-1.5 py-0.5 font-mono text-[11px] text-text-secondary">
                        {u}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        </HubSection>

        {/* Component inventory */}
        <HubSection id="component-inventory">
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Component inventory
          </h2>
          <p className="text-xs text-text-muted">
            Components used on the dashboard (1:1 with dashboard/page.tsx)
          </p>
          <div className="rounded-panel border border-stroke-muted bg-surface-card">
            <ul className="divide-y divide-stroke-muted">
              {componentInventory.map((c) => (
                <li
                  key={c.name}
                  className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-mono text-sm font-medium text-text-primary">
                    {c.name}
                  </span>
                  <span className="text-xs text-text-muted">{c.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        </HubSection>

        {/* Screen inventory */}
        <HubSection id="screen-inventory">
        <section className="rounded-panel border border-stroke-muted bg-surface-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Screen inventory
            </h2>
            <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-muted">
              {tokenizedCount} of {totalScreens} tokenized
            </span>
          </div>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            All screens in the prototype. Each screen moves through the same adoption pipeline — tokenize → Figma capture → variable linking → refine. The token system, hub, and tooling are shared across all screens; only the scope grows over time.
          </p>

          {/* Status key */}
          <div className="mt-3 flex flex-wrap gap-3">
            {[
              { label: "Done", color: "bg-semantic-success/10 text-semantic-success" },
              { label: "In progress", color: "bg-semantic-info/10 text-semantic-info" },
              { label: "Pending", color: "bg-surface-subtle text-text-muted" },
            ].map((s) => (
              <span key={s.label} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.color}`}>
                {s.label}
              </span>
            ))}
          </div>

          {/* Groups */}
          <div className="mt-4 flex flex-col gap-5">
            {SCREEN_INVENTORY.map((group) => (
              <div key={group.group}>
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{group.group}</span>
                  <div className="h-px flex-1 bg-stroke-muted" />
                </div>
                <div className="rounded-panel border border-stroke-muted bg-background">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_100px_100px_96px] gap-3 border-b border-stroke-muted px-3 py-1.5">
                    {["Screen", "Tokenized", "Figma", "Links"].map((h) => (
                      <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{h}</span>
                    ))}
                  </div>
                  {group.screens.map((screen, i) => {
                    const badge = (status: ScreenStatus) => {
                      if (status === "done")        return <span className="rounded-full bg-semantic-success/10 px-2 py-0.5 text-[10px] font-semibold text-semantic-success">✓ Done</span>;
                      if (status === "in-progress") return <span className="rounded-full bg-semantic-info/10 px-2 py-0.5 text-[10px] font-semibold text-semantic-info">~ In progress</span>;
                      return <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-medium text-text-muted">○ Pending</span>;
                    };
                    const prototypeUrl = `/sandboxes/miles-proto-2${screen.path}`;
                    return (
                      <div
                        key={screen.name}
                        className={`grid grid-cols-[1fr_100px_100px_96px] items-center gap-3 px-3 py-2 ${i < group.screens.length - 1 ? "border-b border-stroke-muted" : ""}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-text-primary truncate">{screen.name}</span>
                          {screen.notes && (
                            <span className="shrink-0 text-[10px] text-text-muted">{screen.notes}</span>
                          )}
                        </div>
                        {badge(screen.tokenized)}
                        {badge(screen.figma)}
                        <div className="flex items-center gap-1.5">
                          <a
                            href={prototypeUrl}
                            className="rounded border border-stroke-muted bg-surface-subtle px-1.5 py-0.5 font-mono text-[10px] text-text-muted hover:border-stroke-strong hover:text-text-primary transition-colors"
                            title="Open prototype"
                          >
                            Proto
                          </a>
                          {screen.figmaUrl ? (
                            <a
                              href={screen.figmaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded border border-stroke-muted bg-surface-subtle px-1.5 py-0.5 font-mono text-[10px] text-text-muted hover:border-stroke-strong hover:text-text-primary transition-colors"
                              title="Open in Figma"
                            >
                              Figma
                            </a>
                          ) : (
                            <span className="rounded border border-stroke-muted px-1.5 py-0.5 font-mono text-[10px] text-text-muted/40">
                              Figma
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
        </HubSection>

        <div className="pb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-semantic-info hover:text-semantic-info/80"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
      </div>
    </main>
    </HubSectionProvider>
  );
}
