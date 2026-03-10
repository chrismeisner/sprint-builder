"use client";

import { useState, useMemo } from "react";
import { BASE } from "@/app/sandboxes/miles-proto-2/_lib/nav";

interface PageEntry {
  href: string;
  label: string;
  note?: string;
}

interface Section {
  title: string;
  pages: PageEntry[];
}

type Tab = "screens" | "scenarios";

type TierLevel = 1 | 2 | 3;

interface Scenario {
  id: number;
  name: string;
  tierLevel: TierLevel;
  tier: string;
  trigger: string;
  category: string;
  constraint?: string;
  isNotAgent?: boolean;
  href?: string;
}

const scenarios: Scenario[] = [
  {
    id: 1,
    name: "Fuel Low After a Trip",
    tierLevel: 2,
    tier: "Active (Alert → Chat)",
    trigger: "Trip ends, fuel level below user's threshold or default",
    category: "Coaching",
    constraint: "Never show map, gas stations, or route suggestions — explicitly banned anti-pattern",
    href: "/miles?context=fuel",
  },
  {
    id: 2,
    name: "Kid Starts Driving / Trip in Progress",
    tierLevel: 2,
    tier: "Active (Alert → Chat)",
    trigger: "Vehicle starts a trip; both parents alerted simultaneously (Ring doorbell model)",
    category: "Family",
  },
  {
    id: 3,
    name: "Kid Speeding",
    tierLevel: 2,
    tier: "Active (Alert → Chat)",
    trigger: "Speed exceeds set threshold during active trip",
    category: "Family",
  },
  {
    id: 4,
    name: "Low Tire Pressure",
    tierLevel: 2,
    tier: "Active (Alert → Chat)",
    trigger: "Device reports tire pressure below safe range (only when vehicle provides data)",
    category: "Maintenance",
  },
  {
    id: 5,
    name: "Oil Change Due",
    tierLevel: 2,
    tier: "Active / Passive",
    trigger: "Mileage or time-based oil change threshold approaching; no badgering once snoozed",
    category: "Maintenance",
    href: "/miles?context=oil",
  },
  {
    id: 6,
    name: "Major Maintenance Early Warning",
    tierLevel: 1,
    tier: "Passive (Badge)",
    trigger: "Approaching major milestone from vehicle maintenance schedule (e.g., coolant flush at 50k)",
    category: "Maintenance",
  },
  {
    id: 7,
    name: "Model-Specific Known Issue",
    tierLevel: 1,
    tier: "Passive (Badge)",
    trigger: "Make/model/year associated with known common issue at certain mileage",
    category: "Maintenance",
  },
  {
    id: 8,
    name: "Maintenance Intake / Source of Truth",
    tierLevel: 2,
    tier: "Active (Onboarding → Passive)",
    trigger: "Initial setup after device install; populates to-do list from make/model/mileage",
    category: "Onboarding",
  },
  {
    id: 9,
    name: "Pre-Service Appointment Briefing",
    tierLevel: 2,
    tier: "Active (Alert → Chat)",
    trigger: "Service appointment approaching or user says they're going to the shop",
    category: "Maintenance",
  },
  {
    id: 10,
    name: "Insurance Policy — Photo Intake + Insight",
    tierLevel: 1,
    tier: "Passive (Badge)",
    trigger: "Setup to-do for intake; then renewal approaching months later for insight",
    category: "Documents",
  },
  {
    id: 11,
    name: "Registration Expiring",
    tierLevel: 1,
    tier: "Passive (Badge)",
    trigger: "Registration expiration approaching (30 days, then 14 days)",
    category: "Documents",
    href: "/miles?context=registration",
  },
  {
    id: 12,
    name: "Trip Summary — Contextual Q&A",
    tierLevel: 1,
    tier: "Passive (In-context)",
    trigger: "User opens agent while viewing a completed trip; agent is context-aware",
    category: "Trips",
    href: "/miles?context=trip-detail",
  },
  {
    id: 13,
    name: "Trip Detail — Save Destination",
    tierLevel: 1,
    tier: "Passive (In-context)",
    trigger: "Agent detects new or frequently visited destination from trip detail",
    category: "Trips",
  },
  {
    id: 14,
    name: "Check Engine Light",
    tierLevel: 2,
    tier: "Active (Alert → Chat)",
    trigger: "Device reads check engine code from OBD data; drops into dashboard as alert",
    category: "Vehicle Health",
  },
  {
    id: 15,
    name: "Severe Crash — Emergency",
    tierLevel: 3,
    tier: "Emergency (Full-screen)",
    trigger: "High g-force + collision data; auto-dispatches first responder via Affiliated",
    category: "Emergency",
    isNotAgent: true,
  },
  {
    id: 16,
    name: "Less Severe Crash / Breakdown",
    tierLevel: 3,
    tier: "Emergency (Simplified)",
    trigger: "Moderate g-force or vehicle undrivable; below auto-dispatch threshold",
    category: "Emergency",
    isNotAgent: true,
  },
  {
    id: 17,
    name: "Post-Incident Follow-Up",
    tierLevel: 1,
    tier: "Passive (Badge)",
    trigger: "2–3 days after crash or emergency event (Ring follow-up model)",
    category: "Emergency",
  },
  {
    id: 18,
    name: "Service Receipt Photo → Update Log",
    tierLevel: 2,
    tier: "Active / Passive",
    trigger: "User marks maintenance done or tells agent they got service",
    category: "Maintenance",
  },
];

const sections: Section[] = [
  /* ── Faux Home Screen ── */
  {
    title: "Home Screen & Notifications",
    pages: [
      { href: "/home-screen", label: "Lock screen", note: "all notifications" },
    ],
  },
  {
    title: "Notification Scenarios",
    pages: [
      { href: "/dashboard?mode=complete", label: "Trip Complete", note: "Emma finished a trip" },
      { href: "/miles?context=coaching-braking", label: "Hard Braking Detected", note: "alert → agent" },
      { href: "/miles?context=fuel", label: "Fuel Getting Low", note: "reminder flow" },
      { href: "/driver-score", label: "Score Updated", note: "+3 from last week" },
      { href: "/miles?context=oil", label: "Maintenance Reminder", note: "oil change · mileage options" },
      { href: "/miles?context=registration", label: "Registration Expiring", note: "Apr 15 deadline" },
      { href: "/weekly-recap", label: "Weekly Recap Ready", note: "7 trips · 38.6 mi" },
      { href: "/device-health", label: "Device Disconnected", note: "RAV4 IO6 offline" },
      { href: "/miles", label: "Miles Has a Suggestion", note: "cold start · badge tap" },
    ],
  },

  /* ── Onboarding ── */
  {
    title: "Auth & Onboarding",
    pages: [
      { href: "/", label: "Welcome", note: "landing / sign-up" },
      { href: "/signup", label: "Sign up" },
      { href: "/signup-name", label: "Sign up — name" },
    ],
  },
  {
    title: "Setup & Installation",
    pages: [
      { href: "/install?state=empty", label: "Install checklist", note: "empty" },
      { href: "/install?state=partial", label: "Install checklist", note: "partial" },
      { href: "/install?state=filled", label: "Install checklist", note: "filled" },
      { href: "/scan-device", label: "Scan device" },
      { href: "/billing", label: "Billing / start trial" },
      { href: "/permissions", label: "Permissions" },
      { href: "/find-port", label: "Find OBD-II port" },
      { href: "/help-port", label: "Help — find port" },
      { href: "/help-port/vin", label: "Help — enter VIN" },
      { href: "/help-port/vin/result", label: "Help — VIN result" },
      { href: "/help-port/vehicle", label: "Help — select vehicle" },
      { href: "/help-port/vehicle/result", label: "Help — vehicle result" },
      { href: "/plug-in-device", label: "Plug in device" },
      { href: "/pair-device", label: "Pair device" },
      { href: "/linking-device", label: "Linking device" },
      { href: "/getting-online", label: "Getting online" },
      { href: "/device-detected", label: "Device detected" },
      { href: "/whos-driving", label: "Who's driving" },
      { href: "/setup-progress", label: "Setup progress" },
    ],
  },

  /* ── Tab 1: Dashboard ── */
  {
    title: "Tab 1 — Dashboard",
    pages: [
      { href: "/dashboard", label: "Dashboard", note: "Civic · parked" },
      { href: "/dashboard?vehicle=rav4", label: "Dashboard", note: "RAV4 · parked" },
      { href: "/dashboard?vehicle=fleet", label: "Dashboard", note: "Fleet View" },
      { href: "/dashboard?mode=trip", label: "Dashboard", note: "trip in progress" },
      { href: "/dashboard?mode=complete", label: "Dashboard", note: "trip complete" },
      { href: "/ready-to-drive", label: "Ready to drive" },
    ],
  },

  /* ── Tab 2: Trips ── */
  {
    title: "Tab 2 — Trips",
    pages: [
      { href: "/trips", label: "Trips list", note: "driver filter" },
      { href: "/trip-receipt", label: "Trip receipt" },
      { href: "/trip-detail", label: "Trip detail", note: "from proto-1" },
      { href: "/trip-complete", label: "Trip complete", note: "from proto-1" },
      { href: "/trip-indicator", label: "Trip indicator", note: "from proto-1" },
      { href: "/trip-finalizing", label: "Trip finalizing", note: "from proto-1" },
      { href: "/first-trip-ready", label: "First trip — ready", note: "from proto-1" },
      { href: "/first-trip-summary", label: "First trip — summary", note: "from proto-1" },
      { href: "/post-drive-prompts", label: "Post-drive prompts", note: "from proto-1" },
      { href: "/live-trip", label: "Live trip", note: "standalone · from proto-1" },
      { href: "/live-trip-event", label: "Live trip — event", note: "from proto-1" },
      { href: "/live-trip-degraded", label: "Live trip — degraded", note: "from proto-1" },
    ],
  },

  /* ── Tab 3: Miles Agent ── */
  {
    title: "Tab 3 — Miles Agent",
    pages: [
      { href: "/miles", label: "Miles agent", note: "cold start · reminders" },
      { href: "/miles?context=fuel", label: "Miles agent", note: "fuel alert context" },
      { href: "/miles?context=oil", label: "Miles agent", note: "oil change context" },
      { href: "/miles?context=registration", label: "Miles agent", note: "registration renewal" },
      { href: "/miles?context=trip-detail", label: "Miles agent", note: "from trip detail" },
      { href: "/miles?context=vehicle-health", label: "Miles agent", note: "from vehicle health" },
      { href: "/miles?context=driver-score", label: "Miles agent", note: "from driver score" },
      { href: "/miles?context=coaching-braking", label: "Miles agent", note: "hard braking event" },
    ],
  },

  /* ── Tab 4: Account ── */
  {
    title: "Tab 4 — Account",
    pages: [
      { href: "/account", label: "Account hub" },
      { href: "/profile", label: "Profile" },
      { href: "/household", label: "Household members" },
      { href: "/add-drivers", label: "Add drivers" },
      { href: "/notifications", label: "Notification preferences" },
      { href: "/privacy", label: "Privacy & controls" },
      { href: "/settings", label: "Settings", note: "from proto-1" },
    ],
  },

  /* ── Detail Screens ── */
  {
    title: "Detail Screens",
    pages: [
      { href: "/driver-score", label: "Driver Score", note: "trend · categories · comparison" },
      { href: "/todos", label: "To-Do List", note: "full list · completable" },
      { href: "/device-health", label: "Device Health" },
      { href: "/insights", label: "Insights", note: "from proto-1" },
      { href: "/weekly-recap", label: "Weekly recap", note: "from proto-1" },
      { href: "/next-trip-headsup", label: "Next trip heads-up", note: "from proto-1" },
      { href: "/locations", label: "Locations & Geofences" },
    ],
  },

  /* ── Drivers (legacy / from proto-1) ── */
  {
    title: "Drivers (from proto-1)",
    pages: [
      { href: "/primary-driver", label: "Primary driver" },
      { href: "/secondary-drivers", label: "Secondary drivers" },
      { href: "/driver-reassignment", label: "Driver reassignment" },
      { href: "/teen-independence", label: "Teen independence" },
      { href: "/confirm-address", label: "Confirm address" },
    ],
  },
];

const totalPages = sections.reduce((sum, s) => sum + s.pages.length, 0);

function CopyIcon() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

function tierLevelColor(level: TierLevel) {
  const map: Record<TierLevel, string> = {
    1: "bg-neutral-100 text-neutral-600 border-neutral-200",
    2: "bg-blue-50 text-blue-700 border-blue-200",
    3: "bg-red-50 text-red-700 border-red-200",
  };
  return map[level];
}

function tierLevelLabel(level: TierLevel) {
  const map: Record<TierLevel, string> = {
    1: "Passive",
    2: "Active",
    3: "Emergency",
  };
  return map[level];
}

function categoryColor(category: string) {
  const map: Record<string, string> = {
    Coaching: "bg-green-50 text-green-700",
    Family: "bg-purple-50 text-purple-700",
    Maintenance: "bg-orange-50 text-orange-700",
    Onboarding: "bg-cyan-50 text-cyan-700",
    Documents: "bg-indigo-50 text-indigo-700",
    Trips: "bg-teal-50 text-teal-700",
    "Vehicle Health": "bg-amber-50 text-amber-700",
    Emergency: "bg-red-50 text-red-700",
  };
  return map[category] ?? "bg-neutral-100 text-neutral-600";
}

type SortKey = "id" | "name" | "tierLevel" | "category";
type SortDir = "asc" | "desc";

const allTiers: TierLevel[] = [1, 2, 3];
const allCategories = Array.from(new Set(scenarios.map((s) => s.category))).sort();

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg className={`ml-0.5 inline size-3 ${active ? "text-neutral-700" : "text-neutral-300"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      {dir === "asc" || !active ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      )}
    </svg>
  );
}

export default function IndexPage() {
  const [query, setQuery] = useState("");
  const [copiedHref, setCopiedHref] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("screens");

  const [tierFilter, setTierFilter] = useState<Set<TierLevel>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleTier(t: TierLevel) {
    setTierFilter((prev) => {
      const next = new Set(prev);
      if (next.has(t)) {
        next.delete(t);
      } else {
        next.add(t);
      }
      return next;
    });
  }

  function toggleCategory(c: string) {
    setCategoryFilter((prev) => {
      const next = new Set(prev);
      if (next.has(c)) {
        next.delete(c);
      } else {
        next.add(c);
      }
      return next;
    });
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const hasActiveFilters = tierFilter.size > 0 || categoryFilter.size > 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        pages: s.pages.filter(
          (p) =>
            p.label.toLowerCase().includes(q) ||
            p.href.toLowerCase().includes(q) ||
            (p.note?.toLowerCase().includes(q) ?? false) ||
            s.title.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.pages.length > 0);
  }, [query]);

  const filteredScenarios = useMemo(() => {
    let result = scenarios;

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.tier.toLowerCase().includes(q) ||
          s.trigger.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    if (tierFilter.size > 0) {
      result = result.filter((s) => tierFilter.has(s.tierLevel));
    }
    if (categoryFilter.size > 0) {
      result = result.filter((s) => categoryFilter.has(s.category));
    }

    const sorted = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "id":
          cmp = a.id - b.id;
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "tierLevel":
          cmp = a.tierLevel - b.tierLevel;
          break;
        case "category":
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return sorted;
  }, [query, tierFilter, categoryFilter, sortKey, sortDir]);

  const filteredTotal = filtered.reduce((sum, s) => sum + s.pages.length, 0);

  function copyLink(href: string) {
    const url = window.location.origin + BASE + href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedHref(href);
      setTimeout(() => setCopiedHref(null), 1500);
    });
  }

  let rowIndex = 0;

  return (
    <div className="min-h-dvh bg-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
          <a
            href="/dashboard/sandboxes"
            className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Sandboxes
          </a>

          <div className="h-4 w-px shrink-0 bg-neutral-200" />

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <h1 className="truncate text-sm font-semibold text-neutral-900">
                Miles Proto 2
              </h1>
              <span className="shrink-0 text-xs text-neutral-400">
                {tab === "screens"
                  ? query
                    ? `${filteredTotal} of ${totalPages} screens`
                    : `${totalPages} screens · ${sections.length} sections`
                  : query || hasActiveFilters
                    ? `${filteredScenarios.length} of ${scenarios.length} scenarios`
                    : `${scenarios.length} scenarios`}
              </span>
            </div>
          </div>

          <div className="relative w-56 shrink-0">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400"
              fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="search"
              placeholder={tab === "screens" ? "Filter screens…" : "Filter scenarios…"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 w-full rounded-md border border-neutral-200 bg-neutral-50 pl-8 pr-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-shadow focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <a
            href={BASE}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Open prototype
            <ExternalLinkIcon />
          </a>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex gap-0">
            <button
              type="button"
              onClick={() => { setTab("screens"); setQuery(""); setTierFilter(new Set()); setCategoryFilter(new Set()); setSortKey("id"); setSortDir("asc"); }}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                tab === "screens"
                  ? "text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              Screens
              <span className="ml-1.5 text-xs text-neutral-400">{totalPages}</span>
              {tab === "screens" && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-neutral-900" />
              )}
            </button>
            <button
              type="button"
              onClick={() => { setTab("scenarios"); setQuery(""); }}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                tab === "scenarios"
                  ? "text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              Scenarios
              <span className="ml-1.5 text-xs text-neutral-400">{scenarios.length}</span>
              {tab === "scenarios" && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-neutral-900" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-6">
        {tab === "screens" ? (
          /* ── Screens table ── */
          filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <p className="text-sm font-medium text-neutral-500">No screens match &ldquo;{query}&rdquo;</p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="w-10 pb-2 pr-4 text-left text-xs font-medium text-neutral-400">#</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Screen</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Path</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium text-neutral-400">State</th>
                  <th className="w-16 pb-2 text-right text-xs font-medium text-neutral-400">Open</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((section) => (
                  <>
                    <tr key={`section-${section.title}`} className="border-b border-neutral-100">
                      <td colSpan={5} className="bg-neutral-50 px-0 py-2 pt-5 first:pt-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                          {section.title}
                        </span>
                      </td>
                    </tr>

                    {section.pages.map((page) => {
                      rowIndex += 1;
                      const idx = rowIndex;
                      const fullUrl = BASE + page.href;
                      const isCopied = copiedHref === page.href;
                      const [pathPart, queryPart] = page.href.split("?");

                      return (
                        <tr
                          key={`${page.href}-${idx}`}
                          className="group border-b border-neutral-100 transition-colors hover:bg-neutral-50"
                        >
                          <td className="py-2.5 pr-4 text-right text-xs tabular-nums text-neutral-300 group-hover:text-neutral-400">
                            {idx}
                          </td>
                          <td className="py-2.5 pr-4">
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-neutral-800 transition-colors hover:text-blue-600"
                            >
                              {page.label}
                            </a>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-neutral-400">
                              {pathPart}
                              {queryPart && (
                                <span className="text-neutral-300">?{queryPart}</span>
                              )}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {page.note && (
                              <span className="inline-flex items-center rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium leading-none text-neutral-500">
                                {page.note}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => copyLink(page.href)}
                                title="Copy link"
                                className={`flex size-7 items-center justify-center rounded transition-colors ${
                                  isCopied
                                    ? "bg-green-50 text-green-600"
                                    : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                                }`}
                              >
                                {isCopied ? (
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                ) : (
                                  <CopyIcon />
                                )}
                              </button>
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open screen"
                                className="flex size-7 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                              >
                                <ExternalLinkIcon />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                ))}
              </tbody>
            </table>
          )
        ) : (
          /* ── Scenarios table ── */
          <>
            {/* Filter bar */}
            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">Tier</span>
                {allTiers.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTier(t)}
                    className={`rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      tierFilter.size === 0 || tierFilter.has(t)
                        ? tierLevelColor(t)
                        : "border-neutral-200 bg-white text-neutral-300"
                    }`}
                  >
                    T{t} {tierLevelLabel(t)}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-neutral-200" />

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">Category</span>
                {allCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCategory(c)}
                    className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      categoryFilter.size === 0 || categoryFilter.has(c)
                        ? categoryColor(c)
                        : "bg-neutral-50 text-neutral-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {hasActiveFilters && (
                <>
                  <div className="h-4 w-px bg-neutral-200" />
                  <button
                    type="button"
                    onClick={() => { setTierFilter(new Set()); setCategoryFilter(new Set()); }}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>

            {filteredScenarios.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <p className="text-sm font-medium text-neutral-500">No scenarios match your filters</p>
              <button
                type="button"
                onClick={() => { setQuery(""); setTierFilter(new Set()); setCategoryFilter(new Set()); }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="w-10 pb-2 pr-4 text-left">
                    <button type="button" onClick={() => handleSort("id")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                      #
                      <SortIcon active={sortKey === "id"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="pb-2 pr-4 text-left">
                    <button type="button" onClick={() => handleSort("name")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                      Scenario
                      <SortIcon active={sortKey === "name"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="w-20 pb-2 pr-4 text-left">
                    <button type="button" onClick={() => handleSort("tierLevel")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                      Tier
                      <SortIcon active={sortKey === "tierLevel"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Trigger</th>
                  <th className="w-28 pb-2 pr-4 text-left">
                    <button type="button" onClick={() => handleSort("category")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                      Category
                      <SortIcon active={sortKey === "category"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="w-28 pb-2 text-left text-xs font-medium text-neutral-400">Prototype</th>
                </tr>
              </thead>
              <tbody>
                {filteredScenarios.map((scenario) => (
                  <tr
                    key={scenario.id}
                    className="group border-b border-neutral-100 transition-colors hover:bg-neutral-50"
                  >
                    <td className="py-3 pr-4 text-right text-xs tabular-nums text-neutral-300 group-hover:text-neutral-400">
                      {scenario.id}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-800">
                              {scenario.name}
                            </span>
                            {scenario.isNotAgent && (
                              <span className="inline-flex shrink-0 items-center rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-red-600">
                                NOT AGENT
                              </span>
                            )}
                          </div>
                          {scenario.constraint && (
                            <p className="mt-0.5 text-[11px] leading-tight text-amber-600">
                              {scenario.constraint}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none ${tierLevelColor(scenario.tierLevel)}`}>
                        <span className="font-semibold">T{scenario.tierLevel}</span>
                        <span className="text-inherit/70">{tierLevelLabel(scenario.tierLevel)}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <span className="text-xs text-neutral-500">{scenario.trigger}</span>
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${categoryColor(scenario.category)}`}>
                        {scenario.category}
                      </span>
                    </td>
                    <td className="py-3 align-top">
                      {scenario.href ? (
                        <a
                          href={BASE + scenario.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          View
                          <ExternalLinkIcon />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 border border-dashed border-neutral-200">
                          Not yet linked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </>
        )}
      </div>
    </div>
  );
}
