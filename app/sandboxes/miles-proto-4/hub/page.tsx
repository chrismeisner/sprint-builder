import Link from "@/app/sandboxes/miles-proto-4/_components/link";
import { CapturePrompt } from "@/app/sandboxes/miles-proto-4/hub/_components/capture-prompt";
import { ApplyUpdatesPrompt } from "@/app/sandboxes/miles-proto-4/hub/_components/apply-updates-prompt";
import { HubSectionProvider, HubNav, HubSection } from "@/app/sandboxes/miles-proto-4/hub/_components/hub-nav";
import primitives from "@/lib/design-system/tokens/primitives.json";
import sizing from "@/lib/design-system/tokens/sizing.json";
import semanticLight from "@/lib/design-system/tokens/semantic-light.json";
import { iosTypographyScale } from "@/lib/design-system/ios-typography";
import hubVersions from "@/app/sandboxes/miles-proto-4/hub/versions.json";
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
  // border-background / border-foreground are valid semantic token uses
  // (e.g. avatar stacking pip where border color = page background)
  /^border-(background|foreground|stroke-|brand-|semantic-)/,
  /^divide-(stroke-|brand-|semantic-)/,
  /^ring-(stroke-|brand-|semantic-)/,
  /^fill-(brand-|semantic-)/,
  /^stroke-(brand-|semantic-)/,
];

const ALLOWED_COLOR_EXCEPTIONS: RegExp[] = [
  /^from-black\/\d+$/,
  /^to-transparent$/,
  /^bg-black\/\d+$/,
  // text-white is used on elements with a dynamic inline backgroundColor (vehicle
  // color badges) where text-background would break in dark mode (#0a0a0a on dark red)
  /^text-white$/,
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
    "miles-proto-4",
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
    "miles-proto-4",
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
            href="/sandboxes/miles-proto-4/hub/download"
            download
            className="rounded-panel border border-stroke-muted bg-surface-card px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background"
          >
            ↓ iOS package (.zip)
          </a>
        </div>

        {/* Reference pages — add new entries here as new reference docs are created */}
        <div className="mt-6 flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Reference pages</span>
          <div className="flex flex-wrap gap-2">
            {[
              {
                label: "Design System Reference",
                description: "Color tokens, typography scale, radius & spacing — full iOS handoff table",
                href: "/sandboxes/miles-proto-4/hub/ds-reference",
                badge: "v0.1.1",
              },
            ].map((ref) => (
              <a
                key={ref.href}
                href={ref.href}
                className="flex flex-col gap-1 rounded-panel border border-stroke-muted bg-surface-card px-3 py-2.5 transition-colors hover:bg-background sm:max-w-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">{ref.label}</span>
                  {ref.badge && (
                    <span className="rounded-full bg-surface-strong px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                      {ref.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-text-muted leading-snug">{ref.description}</span>
              </a>
            ))}
          </div>
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
            Dark / light mode toggle on the dashboard proto controls section. All tokens resolve to different values per mode — test both before shipping. Figma variables mirror this token set exactly — synced via the <strong>Figma MCP</strong> <code className="rounded bg-surface-strong px-1 font-mono text-[10px]">use_figma</code> tool (see Figma MCP section below).
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
                    href: "/sandboxes/miles-proto-4/hub/download",
                    linkLabel: "↓ Download iOS package →",
                  },
                  {
                    label: "Figma MCP (use_figma)",
                    detail: "Figma MCP is now write-capable via the use_figma tool. An AI agent can sync tokens directly from the JSON files to Figma Variables, capture screens as layers, and bind variables — all without a plugin. It can also inspect token-linked layers by name, returning exact token names and resolved values as a reference during iOS development.",
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
                &ldquo;Here is a running web prototype at localhost:3000/sandboxes/miles-proto-4/dashboard and its source. Recreate the FleetView screen in SwiftUI. Use the typography and color mappings documented in the hub page to translate each Tailwind class to its iOS equivalent — .largeTitle for text-3xl font-bold, .cornerRadius(16) for rounded-card, Color(.semanticSuccess) for text-semantic-success, etc.&rdquo;
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
            Token names are stable from the start. iOS development and Figma refinement run in parallel — no sync gate, no fidelity milestone to wait for. Token values improve continuously; the hub always reflects current state.
          </p>

          {/* Process diagram */}
          <figure className="mt-4 overflow-hidden rounded-panel border border-stroke-muted bg-surface-subtle">
            <img
              src="/dropbox/process.png"
              alt="Design → iOS process diagram"
              className="w-full"
            />
            <figcaption className="px-3 py-2 text-[11px] text-text-muted">
              UX Flow → Token Source of Truth → iOS Build + Figma (parallel) → Testing → feedback loops back → version bump.
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
                body: "Dashboard prototype built with semantic tokens throughout. All screen states wired up and interactive. Hub compliance checker confirms every color and radius is token-bound.",
              },
              {
                n: "2",
                title: "Hub confirms styles",
                body: "Typography (18 roles → iOS HIG), color tokens (with UIColor equivalents), radius, spacing, and compliance audit all reflect live code — not a static spec. Layout and component structure are defined. The hub and the prototype stay synced — changes to either flow back to the other.",
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
            <span className="rounded-full bg-semantic-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-semantic-success">iOS development entry point</span>
            <p className="mt-2 text-sm font-medium text-text-primary">Build now. The values will catch up.</p>
            <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
              Component hierarchy, navigation flow, and token names are all stable at v0. Wire up <code className="rounded bg-surface-strong px-1 font-mono">Color(.semanticSuccess)</code>, <code className="rounded bg-surface-strong px-1 font-mono">.cornerRadius(16)</code>, <code className="rounded bg-surface-strong px-1 font-mono">.font(.headline)</code> now — these won&apos;t change. Exact hex values, typeface choices, and fine spacing will be refined through Figma and absorbed automatically when you re-download the iOS package.
            </p>
          </div>

          {/* Phase 2 — parallel tracks */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Phase 2 — Parallel tracks</span>
            <div className="h-px flex-1 bg-stroke-muted" />
            <span className="rounded-full bg-semantic-info/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-semantic-info">in progress</span>
          </div>
          <p className="mt-2 text-[11px] text-text-muted leading-relaxed">
            iOS development and Figma run simultaneously. Neither waits for the other. As Figma values are refined they flow back into the hub; as new screens are built they enter the same loop.
          </p>

          {/* Two-column parallel track layout */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* iOS track */}
            <div className="flex flex-col gap-2 rounded-panel border border-stroke-muted bg-background p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">iOS track</span>
              <ol className="flex flex-col gap-2.5">
                {[
                  { n: "3", title: "Build component structure", body: "SwiftUI views, navigation, screen states — mirroring the web prototype component names (FleetView, VehicleCardContent, ActivityFeed, etc.). Use this hub as the reference." },
                  { n: "4", title: "Wire token-mapped styles", body: "Apply Color, Font, and cornerRadius using the hub mappings. Once Figma screens are token-linked, use Figma MCP to inspect any layer directly — it returns exact token names and resolved values as a live reference alongside the hub." },
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
                  { n: "5", title: "Run 5-prompt capture workflow", body: "Build → Audit → Tokens → Bind → Components. Agent-driven end-to-end via generate_figma_design and use_figma. Full prompts in the Capture Prompts section." },
                  { n: "6", title: "Refine → sync back → version bump", body: "Designer refines color values, radius, or spacing in Figma. A Figma MCP agent reads the updated values and writes them back to lib/design-system/tokens/. Hub updates, iOS package reflects them, version increments." },
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
                {/* Frame it — named output, not a sequential step */}
                <li className="flex items-start gap-2.5 mt-1 pt-2.5 border-t border-stroke-muted">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-strong text-[10px] font-semibold text-text-muted">
                    ↗
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-text-primary">Frame it</span>
                    <span className="text-[11px] text-text-muted leading-relaxed">Export token-linked screens as flat PNGs for stakeholder decks, mockups, and marketing assets. A free by-product of the variable-linked Figma file — no extra work once screens are tokenized.</span>
                  </div>
                </li>
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
            Every new feature or page enters at the same point: <strong className="text-text-secondary">UX Flow</strong>. A new screen gets prototyped there first, which keeps the hub (Token Source of Truth) and the prototype synced. From there the same pipeline applies — tokenize, capture, refine, version bump. The token system, Swift package, and Figma tooling are all reusable — only scope grows.
          </p>
          <p className="mt-2 text-[11px] text-text-muted leading-relaxed">
            TestFlight feedback splits two ways: UX/flow issues return to the prototype; visual issues return to Figma. Either path feeds back into the next version batch through the same pipeline.
          </p>
          <div className="mt-3 rounded-panel border border-stroke-muted bg-background p-3">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">Adopting a new screen — 3 steps</p>
            <ol className="flex flex-col gap-2">
              {[
                { n: "A", title: "Tokenize the web screen", body: "Replace raw Tailwind color and radius classes with semantic token equivalents. Run the compliance checker to confirm zero non-token utilities remain." },
                { n: "B", title: "Run the 5-prompt capture workflow", body: "Set <dashboard-url> to the new screen's URL in the Capture Prompts section and run prompts 1–5. The same workflow applies to every screen — no setup changes needed." },
                { n: "C", title: "Update screen inventory", body: "Mark the screen as tokenized and Figma-captured below. The hub, iOS package, and Figma are immediately up to date — the loop continues." },
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

        {/* Apply updates — Figma → tokens → version bump */}
        <HubSection id="apply-updates">
        <ApplyUpdatesPrompt />
        </HubSection>

        {/* Figma MCP */}
        <HubSection id="figma-mcp">
        <section className="mt-6 rounded-panel border border-stroke-muted bg-surface-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Figma MCP
            </h2>
            <span className="rounded-full bg-semantic-info/10 px-2 py-0.5 text-[11px] font-medium text-semantic-info">
              use_figma · write-capable · no plugin needed
            </span>
          </div>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            As of March 24, 2026, Figma&apos;s MCP server gained write capability via the <code className="rounded bg-surface-strong px-1 font-mono text-[11px]">use_figma</code> tool. AI agents (Claude Code, Cursor, Codex, etc.) can now create and modify Figma files directly — variables, components, auto-layout, text styles — without any plugin install. This replaces the custom hub plugin entirely.
          </p>

          {/* What use_figma handles */}
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">What use_figma replaces and enables</span>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {[
                { name: "Token sync", detail: "Agent reads lib/design-system/tokens/*.json and writes all Figma Variables (primitives · semantic light/dark · sizing). Semantic tokens are aliased to primitives for automatic Light↔Dark switching. Idempotent — safe to re-run after any token change." },
                { name: "Miles/* text styles", detail: "18 iOS-specific text styles written from /hub/typography. Applied to text layers via the style panel, not as variables. Re-run any time the type scale changes." },
                { name: "Screen capture", detail: "Capture prompts still create layers with hardcoded values and semantic names. use_figma then applies variable bindings from the checklist — the same two-step workflow, now agent-applied end-to-end." },
                { name: "Design inspection", detail: "Read capability is unchanged — agents can still inspect token-linked layers by name, returning exact token names and resolved values as an iOS development reference at any point." },
              ].map((item) => (
                <div key={item.name} className="flex flex-col gap-1 rounded-panel border border-stroke-muted bg-background px-2.5 py-2">
                  <span className="font-mono text-[11px] font-semibold text-text-primary">{item.name}</span>
                  <span className="text-[11px] text-text-muted leading-relaxed">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Token sync prompt */}
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Token sync — what to tell the agent</span>
            <div className="rounded-panel border border-stroke-muted bg-surface-subtle px-4 py-3">
              <p className="font-mono text-xs text-text-secondary leading-relaxed">
                &ldquo;Read lib/design-system/tokens/primitives.json, semantic-light.json, semantic-dark.json, and sizing.json. Using use_figma, write all tokens to the Figma file as Variables — primitives collection (Base mode), semantic collection (Light + Dark modes with aliases to primitives), and sizing collection (Base mode). Also write all 18 type styles from /hub/typography as Miles/* text styles. The Figma file is [FIGMA_URL].&rdquo;
              </p>
            </div>
            <p className="text-[11px] text-text-muted">Run this any time tokens change. It&apos;s idempotent — existing variables update in place, missing ones are created.</p>
          </div>

          {/* What gets written */}
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">What gets written to Figma</span>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {[
                { name: "primitives ✦", detail: "Base — full color palette: neutral scale, green/blue/yellow/red status stops, brand greens, black, white" },
                { name: "semantic ✦", detail: "Light · Dark — all surface, text, stroke, and status colors; each aliased to its matching primitive for automatic mode-switching" },
                { name: "sizing ✦", detail: "Base — spacing scale, borderRadius/control·panel·card·pill, boxShadow/card (STRING — apply manually: Y 24, blur 70, black 8%)" },
                { name: "Miles/* text styles ✦", detail: "18 iOS-specific styles — apply to text layers via the style panel, not as variables" },
              ].map((item) => (
                <div key={item.name} className="flex items-start gap-2 rounded-panel border border-stroke-muted bg-background px-2.5 py-2">
                  <code className="shrink-0 font-mono text-[11px] font-medium text-text-primary">{item.name}</code>
                  <span className="text-[11px] text-text-muted">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="mt-4 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Skills</span>
            <p className="text-xs text-text-muted leading-relaxed">
              Skills are markdown instruction files that guide how agents use use_figma — which steps to take, what conventions to follow, what good output looks like. The <code className="rounded bg-surface-strong px-1 font-mono text-[10px]">figma-use</code> skill is the foundation all others build on. Miles-specific conventions (token naming, component hierarchy, iOS handoff intent) can be encoded as a skill to make agent output consistently brand-aligned without re-explaining context each time.
            </p>
          </div>

          {/* Hub endpoints */}
          <div className="mt-4 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Hub endpoints (available to agents)</span>
            <ul className="space-y-1 font-mono text-xs text-text-secondary">
              <li><code className="rounded bg-surface-strong px-1">GET /tokens</code> — combined token JSON (all sets)</li>
              <li><code className="rounded bg-surface-strong px-1">GET /typography</code> — text style bootstrap data</li>
              <li><code className="rounded bg-surface-strong px-1">GET /manifest</code> — hub index</li>
              <li><code className="rounded bg-surface-strong px-1">GET /component-specs</code> — component → token contract</li>
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
              <div className="mt-3 rounded-panel border border-stroke-muted bg-background p-3">
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
              <div className="mt-3 rounded-panel border border-stroke-muted bg-background p-3">
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
                <div className="mt-3 rounded-panel border border-stroke-muted bg-background p-3">
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
                    const prototypeUrl = `/sandboxes/miles-proto-4${screen.path}`;
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
