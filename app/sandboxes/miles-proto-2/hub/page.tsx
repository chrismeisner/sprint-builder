import Link from "@/app/sandboxes/miles-proto-2/_components/link";
import primitives from "@/lib/design-system/tokens/primitives.json";
import sizing from "@/lib/design-system/tokens/sizing.json";
import semanticLight from "@/lib/design-system/tokens/semantic-light.json";
import fs from "fs";
import path from "path";

type TokenValue = { $value?: string; $type?: string };
type TokenNode = Record<string, TokenValue | TokenNode>;

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
  "rounded-card",
  "rounded-panel",
  "rounded-control",
  "rounded-full",
]);

function getNonTokenRadiusUtilities(source: string): string[] {
  const matches = source.match(RADIUS_UTILITY_REGEX) ?? [];
  const unique = Array.from(new Set(matches)).sort();
  return unique.filter((utilityClass) => !ALLOWED_RADIUS_UTILITIES.has(utilityClass));
}

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

  const typographyScale = [
    { name: "text-4xl / font-bold", className: "text-4xl font-bold leading-none tabular-nums", usage: "LiveSpeed mph" },
    { name: "text-2xl / font-bold", className: "text-2xl font-bold leading-none", usage: "Page title (Miles)" },
    { name: "text-lg / font-bold", className: "text-lg font-bold tabular-nums", usage: "Live trip mph" },
    { name: "text-lg / font-semibold", className: "text-lg font-semibold leading-snug", usage: "Trip complete vehicle name" },
    { name: "text-base / font-semibold", className: "text-base font-semibold", usage: "Route name (trip complete)" },
    { name: "text-sm / font-semibold", className: "text-sm font-semibold leading-none", usage: "Vehicle name, score, driver, stats" },
    { name: "text-sm / font-medium", className: "text-sm font-medium", usage: "Nav (Chris M.), links" },
    { name: "text-sm / leading-relaxed", className: "text-sm leading-relaxed", usage: "Coaching card message" },
    { name: "text-sm", className: "text-sm", usage: "Driver label (trip complete)" },
    { name: "text-xs / font-semibold", className: "text-xs font-semibold", usage: "Live badge, section labels, Roadside, dots" },
    { name: "text-xs / font-medium", className: "text-xs font-medium", usage: "See all, map overlay, Not Emma?" },
    { name: "text-xs", className: "text-xs", usage: "Year/make/model, relation · Miles Score" },
    { name: "text-[11px] / font-semibold", className: "text-[11px] font-semibold", usage: "Driver initial, Trip active badge" },
    { name: "text-[11px]", className: "text-[11px]", usage: "Started ago, mph label, time" },
    { name: "text-[10px] / font-medium", className: "text-[10px] font-medium uppercase tracking-wide", usage: "Miles Score, Engine, Fuel, Distance, Duration" },
    { name: "text-[10px] / font-semibold", className: "text-[10px] font-semibold", usage: "Live badge" },
  ];

  const componentInventory = [
    { name: "FleetView", description: "Dashboard header, map, vehicle list" },
    { name: "VehicleCardContent", description: "Single vehicle card (header, bento, live strip)" },
    { name: "RecentTrips", description: "Recent Trips section + See all + TripListItem list" },
    { name: "AgentCoachingCard", description: "From Miles message + CTA" },
    { name: "AgentCoachingCarousel", description: "Horizontal coaching cards + dot indicators" },
    { name: "TodoPreview", description: "Demo todos list" },
    { name: "QuickActions", description: "Roadside Assist button (when profile header)" },
    { name: "LiveSpeed", description: "Trip speed + max (trip mode)" },
    { name: "TripVehicleStatus", description: "Vehicle health bento (trip mode)" },
    { name: "TripDriverCard", description: "Driver avatar + name + score" },
    { name: "TripInProgress", description: "Trip active header, map, LiveSpeed, vehicle, driver" },
    { name: "TripComplete", description: "Trip summary card + coaching + back" },
    { name: "MapView", description: "Map with markers/route" },
    { name: "Link", description: "Internal navigation" },
    { name: "BottomNav", description: "Tab bar (layout)" },
  ];

  return (
    <main className="flex min-h-dvh flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-[1200px]">
      <div className="px-5 pb-6 pt-14">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold leading-none text-text-primary">
            Design system hub
          </h1>
          <p className="text-sm text-text-muted">
            Miles prototype · wireframe v0 · styles in use
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg border border-stroke-muted bg-surface-card px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Figma capture + variable-linking prompt */}
        <section className="mt-6 rounded-xl border border-stroke-muted bg-surface-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Figma capture prompt
            </h2>
            <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-muted">
              copy → paste into Claude Code
            </span>
          </div>
          <p className="mt-2 text-sm text-text-secondary">
            Use this prompt to recreate any screen in Figma and auto-generate a variable-linking checklist for the designer. Swap in the page URL, Figma file URL, and node ID before sending.
          </p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg border border-stroke-muted bg-background px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">{`Look at http://localhost:3000/sandboxes/miles-proto-2/[PAGE] and recreate it in Figma here: https://www.figma.com/design/[FILE_KEY]/[FILE_NAME]?node-id=[NODE_ID]

Read the source code directly — do not take screenshots.

When the capture is done, also write a file at:
  lib/design-system/variable-linking-instructions-[page].md

The file should be a section-by-section checklist that maps every
Figma layer (background, card fills, text colors, strokes, borders,
icon colors, radius, spacing) to the correct Figma variable name from
our token system — so a designer can open the Figma file, work through
the checklist top-to-bottom, and manually swap every hardcoded value
to its variable in one focused pass.

Format each section as a markdown table with columns:
  Layer | Property | Variable

Include a spacing & radius audit section at the end, and tips for
batch-selecting by fill color to speed up the linking pass.`}</pre>
          <div className="mt-3 flex flex-col gap-1">
            <p className="text-[11px] text-text-muted">
              <strong>Variables available in Figma:</strong> open the file → Resources → Local variables. Token names follow <code className="rounded bg-surface-strong px-1 font-mono">semantic/[name]</code> and <code className="rounded bg-surface-strong px-1 font-mono">primitive/color/[name]</code> — matching the sets in <code className="rounded bg-surface-strong px-1 font-mono">lib/design-system/tokens/</code>.
            </p>
            <p className="text-[11px] text-text-muted">
              <strong>After linking:</strong> toggle Light ↔ Dark mode in the variable panel to verify every token responds. Anything that doesn&apos;t change is still hardcoded.
            </p>
          </div>
        </section>

        {/* Figma / Token Studio — machine-readable token URL */}
        <section className="mt-6 rounded-xl border border-stroke-muted bg-surface-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Figma / Token Studio
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Use the token URL below in <strong>Tokens Studio for Figma</strong> (or any plugin that syncs DTCG tokens to Figma Variables). The response is the same combined JSON as <code className="rounded bg-surface-strong px-1 font-mono text-[11px]">tokens.figma.json</code> — primitives, typography, state, semantic-light, semantic-dark, sizing, with <code className="rounded bg-surface-strong px-1 font-mono text-[11px]">tokenSetOrder</code>.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Token URL (copy for plugin)
            </label>
            <code className="block break-all rounded-lg border border-stroke-muted bg-background px-3 py-2 font-mono text-xs text-text-secondary">
              /sandboxes/miles-proto-2/hub/tokens
            </code>
            <p className="text-[11px] text-text-muted">
              Local: <code className="font-mono">http://localhost:3000/sandboxes/miles-proto-2/hub/tokens</code> · In Token Studio: Settings → Sync → Connect to URL / Import from URL, then paste this URL.
            </p>
          </div>
          <ul className="mt-3 space-y-1 text-xs text-text-secondary">
            <li>• Assign <strong>semantic-light</strong> to Figma mode &quot;Light&quot;, <strong>semantic-dark</strong> to &quot;Dark&quot;.</li>
            <li>• Typography primitives are in token JSON (`typography` set); also create Figma Text Styles and align with the scale below.</li>
            <li>• See <code className="rounded bg-surface-strong px-1 font-mono">lib/design-system/figma-token-studio-mapping.md</code> for full mapping and sync workflow.</li>
            <li>• Also available: <code className="rounded bg-surface-strong px-1 font-mono">/hub/manifest</code> (hub index), <code className="rounded bg-surface-strong px-1 font-mono">/hub/component-specs</code> (component → token contract), <code className="rounded bg-surface-strong px-1 font-mono">/hub/typography</code> (text styles bootstrap data).</li>
            <li>• <strong>Roll your own plugin</strong> (Figma → hub): use <code className="rounded bg-surface-strong px-1 font-mono">POST /api/design-tokens/sync</code> with the same JSON shape as <code className="rounded bg-surface-strong px-1 font-mono">GET /hub/tokens</code> to update these token files from Figma. See <code className="rounded bg-surface-strong px-1 font-mono">lib/design-system/roll-your-own-figma-plugin.md</code>.</li>
          </ul>
        </section>
      </div>

      <div className="flex flex-col gap-8 px-5">
        {/* Primitives — colors */}
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

        {/* Semantic tokens */}
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

        {/* Spacing */}
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

        {/* Border radius & shadow */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Border radius · Shadow
          </h2>
          <div className="flex flex-wrap gap-6">
            {radiusTokens.map((t) => (
              <div key={t.name} className="flex flex-col items-center gap-1">
                <div
                  className="rounded bg-stroke-strong"
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
                <span className="font-mono text-xs text-text-secondary">
                  {t.value}
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
              </div>
            ))}
          </div>
        </section>

        {/* Typography scale */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Typography scale (prototype)
          </h2>
          <p className="text-xs text-text-muted">
            Inter via —font-miles-sans · Tailwind text/font classes used in dashboard
          </p>
          <div className="flex flex-col gap-4 rounded-xl border border-stroke-muted bg-surface-card p-4">
            {typographyScale.map((row) => (
              <div
                key={row.name}
                className="flex flex-col gap-0.5 border-b border-stroke-muted pb-3 last:border-0 last:pb-0"
              >
                <span className="font-mono text-[11px] text-text-muted">
                  {row.name}
                </span>
                <span className={`text-text-primary ${row.className}`}>
                  The quick brown fox
                </span>
                <span className="text-[11px] text-text-muted">
                  {row.usage}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Dashboard parity — Tailwind → token mapping */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Dashboard parity (tokenized dashboard)
          </h2>
          <p className="text-xs text-text-muted">
            Current classes used on the dashboard. Keep these aligned with Figma variables and token JSON.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-stroke-muted bg-surface-card p-4">
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
            <div className="rounded-xl border border-stroke-muted bg-surface-card p-4">
              <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Radius (dashboard)
              </h3>
              <ul className="space-y-1 font-mono text-xs text-text-secondary">
                <li>rounded-card → 16px (map + primary cards)</li>
                <li>rounded-panel → 12px (panels, bento, strips)</li>
                <li>rounded-control → 8px (buttons, controls, thumbnails)</li>
                <li>rounded-full → pill (badges, avatars)</li>
              </ul>
            </div>
            <div className="sm:col-span-2 rounded-xl border border-stroke-muted bg-surface-card p-4">
              <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Colors (dashboard)
              </h3>
              <ul className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-text-secondary">
                <li>bg-background / bg-surface-card / bg-surface-subtle (base surfaces)</li>
                <li>text-text-primary / text-text-secondary / text-text-muted (typography)</li>
                <li>border-stroke-muted / divide-stroke-muted / bg-stroke-strong (strokes)</li>
                <li>text-semantic-success / warning / danger / info (status + intent)</li>
                <li>bg-semantic-success / warning / info (dots + status markers)</li>
                <li>bg-brand-accent + text-brand-inverse (profile avatar accent)</li>
                <li>bg-foreground + text-background (inverse dark cards/overlays)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Token compliance checklist */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Token compliance checklist
          </h2>
          <div className="rounded-xl border border-stroke-muted bg-surface-card p-4">
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
          </div>
        </section>

        {/* Component inventory */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Component inventory
          </h2>
          <p className="text-xs text-text-muted">
            Components used on the dashboard (1:1 with dashboard/page.tsx)
          </p>
          <div className="rounded-xl border border-stroke-muted bg-surface-card">
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
  );
}
