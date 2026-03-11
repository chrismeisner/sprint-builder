"use client";

import { useState, useMemo, useEffect } from "react";
import { BASE } from "@/app/sandboxes/miles-proto-2/_lib/nav";

type PageStatus = "draft" | "in review" | "ready";
type Priority = "p0" | "p1" | "p2" | "p3";

interface PageEntry {
  href: string;
  label: string;
  note?: string;
  status?: PageStatus;
  priority?: Priority;
}

interface Section {
  title: string;
  pages: PageEntry[];
}

type Tab = "screens" | "scenarios";

type TierLevel = 1 | 2 | 3;

type ScenarioStatus = "draft" | "in review" | "ready";

interface Scenario {
  id: number;
  name: string;
  tierLevel: TierLevel;
  tier: string;
  overview: string;
  category: string;
  status: ScenarioStatus;
  priority: Priority;
  constraint?: string;
  isNotAgent?: boolean;
  href?: string;
}

interface ScreenOverride { status?: PageStatus; priority?: Priority; }
interface ScenarioOverride { status?: ScenarioStatus; priority?: Priority; }

const SCREEN_STORAGE_KEY = "miles-proto-2-screen-overrides";
const SCENARIO_STORAGE_KEY = "miles-proto-2-scenario-overrides";

const scenarios: Scenario[] = [
  { id: 1,  name: "Kid Starts Driving / Trip in Progress",    tierLevel: 2, tier: "Active (Alert → Chat)",         overview: "Prove that both parents receive, view, and trust a live trip as it happens and after it ends.",                                                                                                                                           category: "Family",         status: "ready",     priority: "p1", href: "/notification?context=kid-trip" },
  { id: 2,  name: "Kid Speeding",                             tierLevel: 2, tier: "Active (Alert → Chat)",         overview: "Show the agent interrupting an active trip thread with a driving behavior alert and parent response options.",                                                                                                                         category: "Family",         status: "ready",     priority: "p1", href: "/notification?context=kid-speeding" },
  { id: 3,  name: "Hard Braking (Real-Time Alert)",           tierLevel: 2, tier: "Active (Alert → Chat)",         overview: "Same as speeding but for a deceleration event, proving the mid-trip alert pattern repeats cleanly.",                                                                                                                                 category: "Coaching",       status: "ready",     priority: "p2", href: "/notification?context=coaching-braking" },
  { id: 4,  name: "Fuel Low After a Trip",                    tierLevel: 2, tier: "Active (Alert → Chat)",         overview: "Establish the baseline reminder pattern: agent surfaces a low-stakes issue, user picks how to handle it, done.",                                                                                                                     category: "Coaching",       status: "in review", priority: "p2", href: "/notification?context=fuel" },
  { id: 5,  name: "Low Tire Pressure",                        tierLevel: 2, tier: "Active (Alert → Chat)",         overview: "Prove the full card anatomy works end-to-end: data visualization, coaching layer, action set, and resolution.",                                                                                                                     category: "Maintenance",    status: "ready",     priority: "p1", href: "/notification?context=tire-pressure" },
  { id: 6,  name: "Oil Change Due",                           tierLevel: 2, tier: "Active / Passive",              overview: "Show the reminder pattern with more action variety (time-based, mileage-based, already done) and the \"don't badger\" behavior.",                                                                                                   category: "Maintenance",    status: "in review", priority: "p2", href: "/notification?context=oil" },
  { id: 7,  name: "Severe Crash — Emergency",                 tierLevel: 3, tier: "Emergency (Full-screen)",       overview: "Define the boundary where the agent pattern stops and a full-screen, red-button emergency UI takes over. Send push alert to trusted contact with details of incident; tell primary driver we've dispatched first responder; monitoring center calls them.",                                                                                                                           category: "Emergency",      status: "draft",     priority: "p0", isNotAgent: true },
  { id: 8,  name: "Less Severe Crash / Vehicle Breakdown",    tierLevel: 3, tier: "Emergency (Simplified)",        overview: "Show the second tier of crash response where the user is conscious and choosing between tow or ambulance. Push notification to trusted contact; ask primary user if they need help. Two buttons: roadside, emergency services.",                                                                                                                          category: "Emergency",      status: "draft",     priority: "p0", isNotAgent: true },
  { id: 9,  name: "Maintenance Intake / Source of Truth Setup", tierLevel: 2, tier: "Active (Onboarding → Passive)", overview: "Walk through the onboarding moment where the agent builds the vehicle's maintenance baseline item by item.",                                                                                                                      category: "Onboarding",     status: "draft",     priority: "p2" },
  { id: 10, name: "Check Engine Light",                       tierLevel: 2, tier: "Active (Alert → Chat)",         overview: "Test the alert → chat flow with a higher-anxiety vehicle issue that needs calm explanation. Surface context on the issue, severity, and cost range. CTAs: get reminder in 2–3 days; send email/documentation to mechanic.",                                                                                                                                       category: "Vehicle Health", status: "ready",     priority: "p1", href: "/notification?context=check-engine" },
  { id: 11, name: "Trip Summary — Contextual Q&A",            tierLevel: 1, tier: "Passive (In-context)",          overview: "Prove the agent can be user-initiated from a screen, not just alert-driven, with suggested prompts scoped to a completed trip.",                                                                                                    category: "Trips",          status: "in review", priority: "p2", href: "/miles?context=trip-detail" },
  { id: 12, name: "Hard Braking (Post-Trip Review)",          tierLevel: 2, tier: "Active (Alert → Chat)",         overview: "Show braking events as markers on a completed trip route inside the trip summary view.",                                                                                                                                            category: "Coaching",       status: "ready",     priority: "p2", href: "/miles?context=coaching-braking" },
  { id: 13, name: "Insurance Photo Intake",                   tierLevel: 1, tier: "Passive (Badge)",               overview: "Demonstrate the agent asking the user to contribute a document and following up months later with insight from it. Future: share insights on their rates vs others or market trends; prompt to get a quote from our partner when rates look high or near renewal.",                                                                                                                 category: "Documents",      status: "draft",     priority: "p3" },
  { id: 14, name: "Registration Expiring",                    tierLevel: 1, tier: "Passive (Badge)",               overview: "Show the passive badge entry point for a time-based reminder that's handled in seconds and backgrounded.",                                                                                                                          category: "Documents",      status: "ready",     priority: "p2", href: "/notification?context=registration" },
  { id: 15, name: "Post-Incident Follow-Up",                  tierLevel: 1, tier: "Passive (Badge)",               overview: "Prove the agent can re-open a closed loop days after an emergency with a human-touch check-in.",                                                                                                                                    category: "Emergency",      status: "draft",     priority: "p3" },
  { id: 16, name: "Service Receipt Photo",                    tierLevel: 2, tier: "Active / Passive",              overview: "Show the agent prompting for a photo after a maintenance item is marked done to keep the log accurate. Store image in \"digital glovebox\" for reference; parse info to show in records; set behind-the-scenes reminders for future service milestones. (Glovebox concept could extend to insurance, service records, todo list, etc.)",                                                                                                                            category: "Maintenance",    status: "draft",     priority: "p3" },
  { id: 17, name: "Major Maintenance Early Warning",          tierLevel: 1, tier: "Passive (Badge)",               overview: "Surface a future maintenance milestone from the vehicle's schedule before it becomes urgent. In future, we'll pull in info about the recommended service: anticipated cost range, how long service takes, etc. Also can ask to book an appointment.", category: "Maintenance", status: "draft", priority: "p3" },
  { id: 18, name: "Model-Specific Known Issue",               tierLevel: 1, tier: "Passive (Badge)",               overview: "Proactively flag a common problem for this make/model/mileage that the user may not know about.",                                                                                                                                   category: "Maintenance",    status: "draft",     priority: "p3" },
  { id: 19, name: "Pre-Service Appointment Briefing",         tierLevel: 2, tier: "Active (Alert → Chat)",         overview: "Arm the user with what their car actually needs before they walk into the shop. Prepare people before they go in based on recommended services for their mileage, what's coming up in future, and cost ranges.",                                                                                  category: "Maintenance",    status: "in review", priority: "p2" },
  { id: 20, name: "Trip Detail — Save Destination",           tierLevel: 1, tier: "Passive (In-context)",          overview: "Show the agent offering to name a location based on where the user is in the app, replacing a settings screen.",                                                                                                                    category: "Trips",          status: "draft",     priority: "p3" },
  { id: 21, name: "Inspection Due",                           tierLevel: 1, tier: "Passive (Badge)",               overview: "Same pattern as registration expiring: passive badge for a time-based reminder (state/safety inspection due), handled in seconds and backgrounded.",                                                                                 category: "Documents",      status: "draft",     priority: "p3" },
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
    title: "Notification Entry Points",
    pages: [
      { href: "/notification?context=kid-speeding", label: "Speed Alert — Jack", note: "notification → agent", status: "ready" },
      { href: "/notification?context=tire-pressure", label: "Low Tire Pressure", note: "notification → agent", status: "ready" },
      { href: "/notification?context=kid-trip", label: "Kid Started a Trip", note: "notification → agent", status: "in review" },
      { href: "/notification?context=coaching-braking", label: "Hard Braking Detected", note: "notification → agent", status: "ready" },
      { href: "/notification?context=fuel", label: "Fuel Getting Low", note: "notification → agent", status: "in review" },
      { href: "/notification?context=check-engine", label: "Check Engine Light", note: "notification → agent", status: "ready" },
      { href: "/notification?context=oil", label: "Maintenance Reminder", note: "notification → agent", status: "draft" },
      { href: "/notification?context=registration", label: "Registration Expiring", note: "notification → agent", status: "ready" },
      { href: "/notification?context=trip-detail", label: "Trip Complete", note: "notification → agent", status: "draft" },
    ],
  },
  {
    title: "Notification Scenarios",
    pages: [
      { href: "/dashboard?mode=complete", label: "Trip Complete", note: "Emma finished a trip" },
      { href: "/miles?context=coaching-braking", label: "Hard Braking Detected", note: "alert → agent" },
      { href: "/miles?context=fuel", label: "Fuel Getting Low", note: "reminder flow" },
      { href: "/miles?context=check-engine", label: "Check Engine Light", note: "OBD alert → agent" },
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
      { href: "/miles?context=kid-speeding", label: "Miles agent", note: "kid speeding — speed alert" },
      { href: "/miles?context=tire-pressure", label: "Miles agent", note: "tire pressure — 4-corner viz" },
      { href: "/miles?context=kid-trip", label: "Miles agent", note: "kid trip — live + completion" },
      { href: "/miles?context=vehicle-health", label: "Miles agent", note: "from vehicle health" },
      { href: "/miles?context=driver-score", label: "Miles agent", note: "from driver score" },
      { href: "/miles?context=check-engine", label: "Miles agent", note: "check engine alert" },
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
      { href: "/driver-score", label: "Miles Score", note: "trend · categories · comparison" },
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

function statusBadgeClass(status: PageStatus | ScenarioStatus) {
  const map: Record<string, string> = {
    draft: "bg-neutral-100 text-neutral-600 border-neutral-200",
    "in review": "bg-amber-50 text-amber-700 border-amber-200",
    ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return map[status] ?? "bg-neutral-100 text-neutral-600";
}

function priorityBadgeClass(p: Priority) {
  const map: Record<Priority, string> = {
    p0: "bg-red-50 text-red-700 border-red-200",
    p1: "bg-orange-50 text-orange-700 border-orange-200",
    p2: "bg-blue-50 text-blue-700 border-blue-200",
    p3: "bg-neutral-100 text-neutral-500 border-neutral-200",
  };
  return map[p];
}

function _priorityLabel(p: Priority) {
  const map: Record<Priority, string> = {
    p0: "P0 Critical",
    p1: "P1 High",
    p2: "P2 Medium",
    p3: "P3 Low",
  };
  return map[p];
}

function InlineSelect<T extends string>({
  value,
  options,
  onChange,
  badgeClass,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  badgeClass: string;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`cursor-pointer appearance-none rounded border py-0.5 pl-1.5 pr-5 text-[10px] font-medium leading-none transition-opacity hover:opacity-80 ${badgeClass}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-1 size-2.5 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}

const STATUS_OPTIONS: { value: PageStatus; label: string }[] = [
  { value: "draft", label: "draft" },
  { value: "in review", label: "in review" },
  { value: "ready", label: "ready" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "p0", label: "P0 Critical" },
  { value: "p1", label: "P1 High" },
  { value: "p2", label: "P2 Medium" },
  { value: "p3", label: "P3 Low" },
];

type SortKey = "id" | "name" | "tierLevel" | "category" | "status" | "priority";
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
  const [tab, setTab] = useState<Tab>("scenarios");

  const [tierFilter, setTierFilter] = useState<Set<TierLevel>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [screenOverrides, setScreenOverrides] = useState<Record<string, ScreenOverride>>({});
  const [scenarioOverrides, setScenarioOverrides] = useState<Record<string, ScenarioOverride>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SCREEN_STORAGE_KEY);
      if (raw) setScreenOverrides(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem(SCENARIO_STORAGE_KEY);
      if (raw) setScenarioOverrides(JSON.parse(raw));
    } catch {}
  }, []);

  function updateScreenOverride(href: string, patch: Partial<ScreenOverride>) {
    setScreenOverrides((prev) => {
      const next = { ...prev, [href]: { ...prev[href], ...patch } };
      try { localStorage.setItem(SCREEN_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function updateScenarioOverride(id: number, patch: Partial<ScenarioOverride>) {
    setScenarioOverrides((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      try { localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

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
          s.overview.toLowerCase().includes(q) ||
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
        case "status": {
          const order = { draft: 0, "in review": 1, ready: 2 };
          cmp = order[a.status] - order[b.status];
          break;
        }
        case "priority": {
          const order: Record<Priority, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
          const ap = scenarioOverrides[a.id]?.priority ?? a.priority;
          const bp = scenarioOverrides[b.id]?.priority ?? b.priority;
          cmp = order[ap] - order[bp];
          break;
        }
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
        <div className="mx-auto flex max-w-none items-center gap-4 px-6 py-3">
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
        <div className="mx-auto max-w-none px-6">
          <div className="flex gap-0">
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-none px-6 py-6">
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
                  <th className="w-24 pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Status</th>
                  <th className="w-16 pb-2 text-right text-xs font-medium text-neutral-400">Open</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((section) => (
                  <>
                    <tr key={`section-${section.title}`} className="border-b border-neutral-100">
                      <td colSpan={6} className="bg-neutral-50 px-0 py-2 pt-5 first:pt-2">
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
                          <td className="py-2.5 pr-4">
                            {(() => {
                              const st = screenOverrides[page.href]?.status ?? page.status ?? "draft";
                              return (
                                <InlineSelect
                                  value={st}
                                  options={STATUS_OPTIONS}
                                  onChange={(v) => updateScreenOverride(page.href, { status: v })}
                                  badgeClass={statusBadgeClass(st)}
                                />
                              );
                            })()}
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
                  <th className="pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Overview</th>
                  <th className="w-28 pb-2 pr-4 text-left">
                    <button type="button" onClick={() => handleSort("category")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                      Category
                      <SortIcon active={sortKey === "category"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="w-28 pb-2 pr-4 text-left">
                    <button type="button" onClick={() => handleSort("priority")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                      Priority
                      <SortIcon active={sortKey === "priority"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="w-24 pb-2 pr-4 text-left">
                    <button type="button" onClick={() => handleSort("status")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                      Status
                      <SortIcon active={sortKey === "status"} dir={sortDir} />
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
                      <span className="text-xs text-neutral-500">{scenario.overview}</span>
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${categoryColor(scenario.category)}`}>
                        {scenario.category}
                      </span>
                    </td>
                    <td className="py-3 pr-4 align-top">
                      {(() => {
                        const prio = scenarioOverrides[scenario.id]?.priority ?? scenario.priority;
                        return (
                          <InlineSelect
                            value={prio}
                            options={PRIORITY_OPTIONS}
                            onChange={(v) => updateScenarioOverride(scenario.id, { priority: v })}
                            badgeClass={priorityBadgeClass(prio)}
                          />
                        );
                      })()}
                    </td>
                    <td className="py-3 pr-4 align-top">
                      {(() => {
                        const st = scenarioOverrides[scenario.id]?.status ?? scenario.status;
                        return (
                          <InlineSelect
                            value={st}
                            options={STATUS_OPTIONS}
                            onChange={(v) => updateScenarioOverride(scenario.id, { status: v })}
                            badgeClass={statusBadgeClass(st)}
                          />
                        );
                      })()}
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
