import Link from "@/app/sandboxes/miles-proto-2/_components/link";
import primitives from "@/lib/design-system/tokens/primitives.json";
import sizing from "@/lib/design-system/tokens/sizing.json";
import semanticLight from "@/lib/design-system/tokens/semantic-light.json";

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
          className="h-10 w-full rounded-lg border border-neutral-200"
          style={{ backgroundColor: value }}
        />
      )}
      <span className="truncate font-mono text-[11px] text-neutral-500" title={name}>
        {name}
      </span>
      <span className="font-mono text-xs text-neutral-700">{value}</span>
    </div>
  );
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
    <main className="flex min-h-dvh flex-col bg-neutral-50 pb-24">
      <div className="mx-auto w-full max-w-[1200px]">
      <div className="px-5 pb-6 pt-14">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold leading-none text-neutral-900">
            Design system hub
          </h1>
          <p className="text-sm text-neutral-500">
            Miles prototype · wireframe v0 · styles in use
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-8 px-5">
        {/* Primitives — colors */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
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
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Color · Semantic (light)
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {semanticTokens.map((t) => (
              <ColorSwatch key={t.name} name={t.name} value={t.value} />
            ))}
          </div>
        </section>

        {/* Spacing */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Spacing
          </h2>
          <div className="flex flex-wrap gap-4">
            {spacingTokens.map((t) => (
              <div key={t.name} className="flex flex-col items-center gap-1">
                <div
                  className="rounded bg-neutral-200"
                  style={{
                    width: t.value === "0" ? 4 : Math.min(48, parseInt(t.value, 10) || 16),
                    height: 24,
                  }}
                />
                <span className="font-mono text-[11px] text-neutral-500">
                  {t.name}
                </span>
                <span className="font-mono text-xs text-neutral-700">
                  {t.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Border radius & shadow */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Border radius · Shadow
          </h2>
          <div className="flex flex-wrap gap-6">
            {radiusTokens.map((t) => (
              <div key={t.name} className="flex flex-col items-center gap-1">
                <div
                  className="rounded bg-neutral-300"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius:
                      t.value === "9999px"
                        ? 9999
                        : parseInt(t.value, 10) || 0,
                  }}
                />
                <span className="font-mono text-[11px] text-neutral-500">
                  {t.name}
                </span>
                <span className="font-mono text-xs text-neutral-700">
                  {t.value}
                </span>
              </div>
            ))}
            {shadowTokens.map((t) => (
              <div key={t.name} className="flex flex-col items-center gap-1">
                <div
                  className="rounded-lg bg-white border border-neutral-200"
                  style={{ boxShadow: t.value, width: 64, height: 48 }}
                />
                <span className="font-mono text-[11px] text-neutral-500">
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Typography scale */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Typography scale (prototype)
          </h2>
          <p className="text-xs text-neutral-500">
            Inter via —font-miles-sans · Tailwind text/font classes used in dashboard
          </p>
          <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4">
            {typographyScale.map((row) => (
              <div
                key={row.name}
                className="flex flex-col gap-0.5 border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
              >
                <span className="font-mono text-[11px] text-neutral-400">
                  {row.name}
                </span>
                <span className={`text-neutral-900 ${row.className}`}>
                  The quick brown fox
                </span>
                <span className="text-[11px] text-neutral-400">
                  {row.usage}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Dashboard parity — Tailwind → token mapping */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Dashboard parity (Tailwind → tokens)
          </h2>
          <p className="text-xs text-neutral-500">
            Classes used on the dashboard and their token equivalent. 1:1 reference for Figma sync.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                Spacing (dashboard)
              </h3>
              <ul className="space-y-1 font-mono text-xs text-neutral-700">
                <li>px-5, py-4, gap-4 → 20px</li>
                <li>px-4, gap-3, p-4 → 16px</li>
                <li>px-3, py-3, gap-2, p-3 → 12px</li>
                <li>px-2.5, py-2.5, gap-1.5 → 10px</li>
                <li>gap-1, py-1.5, pt-2 → 4–6px</li>
                <li>gap-0.5, py-0.5 → 2px</li>
              </ul>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                Radius (dashboard)
              </h3>
              <ul className="space-y-1 font-mono text-xs text-neutral-700">
                <li>rounded-2xl → 16px (cards, map)</li>
                <li>rounded-xl → 12px (bento, strips, panels)</li>
                <li>rounded-lg → 8px (buttons, thumbnails)</li>
                <li>rounded-full → pill (badges, avatars)</li>
              </ul>
            </div>
            <div className="sm:col-span-2 rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                Colors (dashboard)
              </h3>
              <ul className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-neutral-700">
                <li>neutral-50, 100, 200, 300, 400, 700, 900 (bg, text, border)</li>
                <li>green-50, 100, 200, 400, 500, 600, 700, 800, 900 (success, live)</li>
                <li>amber-500, 700 (engine/fuel attention)</li>
                <li>red-50, 200, 600, 700 (Roadside Assist)</li>
                <li>blue-500, 600, 700 (links, driver avatar)</li>
                <li>purple-500 (driver avatar)</li>
                <li>white/black + opacity (overlays)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Component inventory */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Component inventory
          </h2>
          <p className="text-xs text-neutral-500">
            Components used on the dashboard (1:1 with dashboard/page.tsx)
          </p>
          <div className="rounded-xl border border-neutral-200 bg-white">
            <ul className="divide-y divide-neutral-100">
              {componentInventory.map((c) => (
                <li
                  key={c.name}
                  className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-mono text-sm font-medium text-neutral-900">
                    {c.name}
                  </span>
                  <span className="text-xs text-neutral-500">{c.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="pb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
      </div>
    </main>
  );
}
