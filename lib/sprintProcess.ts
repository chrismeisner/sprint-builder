export type SprintDayEngagement =
  | { label: string; variant: "required" }
  | { label: string; variant: "optional" }
  | { label: string; variant: "studio" };

export type SprintDay = {
  day: string;
  title: string;
  detail: string;
  engagement?: SprintDayEngagement;
};

export type SprintWeek = {
  id: string;
  icon: string;
  title: string;
  summary: string;
  highlight: string;
  days: SprintDay[];
};

export const SPRINT_WEEKS: SprintWeek[] = [
  {
    id: "week-1",
    icon: "⛰️",
    title: "Week 1 · Uphill (explore + decide)",
    summary:
      "We run the Google-inspired workshop on Monday, diverge Tuesday through Thursday morning, then lock the winning direction by Decision Day so everyone knows what we're building.",
    highlight: "",
    days: [
      {
        day: "Day 1 · Monday",
        title: "Kickoff workshop",
        detail:
          "A 3-hour Brand/Product workshop to capture goals, guardrails, audiences, and success metrics so the sprint starts with shared context. You'll feel: Aligned.",
        engagement: { label: "Client input required", variant: "required" },
      },
      {
        day: "Day 2 · Tuesday",
        title: "Research + divergence",
        detail:
          "Studio audits what exists, pulls references, and shares notes in your portal. No live touchpoints so we can stay heads down—just drop async comments if something needs a tweak. You'll feel: Curious.",
        engagement: { label: "Studio heads down", variant: "studio" },
      },
      {
        day: "Day 3 · Wednesday",
        title: "Work-in-progress share",
        detail:
          "We send Looms/Figma links showing explorations. You react in-line so we can keep exploring the strongest angles, with an optional live sync if you want to talk it through. You'll feel: Excited.",
        engagement: { label: "Optional sync share", variant: "optional" },
      },
      {
        day: "Day 4 · Thursday",
        title: "Decision Day",
        detail:
          "Live review of 2–3 viable paths. We debate tradeoffs together and commit to one confident direction + success criteria. You'll feel: Decisive.",
        engagement: { label: "Client input required", variant: "required" },
      },
      {
        day: "Day 5 · Friday",
        title: "Execution plan",
        detail:
          "Studio documents the downhill build plan, lists deliverables, files, and dependencies, and (if you want) we hop on a quick sync to walk through the final direction we landed on. You'll feel: Clear.",
        engagement: { label: "Optional sync share", variant: "optional" },
      },
    ],
  },
  {
    id: "week-2",
    icon: "🏁",
    title: "Week 2 · Downhill (build + deliver)",
    summary:
      "With the direction locked, we spend the second week converging, building, and stress-testing so the sprint ships on Day 10.",
    highlight: "",
    days: [
      {
        day: "Day 6 · Monday",
        title: "Translate plan → build tasks",
        detail:
          "We align deliverables with the chosen direction, confirm any new inputs, then stay heads down translating the plan into execution tasks. You'll feel: Focused.",
        engagement: { label: "Studio heads down", variant: "studio" },
      },
      {
        day: "Day 7 · Tuesday",
        title: "Deep build day",
        detail:
          "Heads-down execution across design, copy, systems, or product. Expect async updates inside the sprint portal, plus an optional sync share if you want another peek. You'll feel: Inspired.",
        engagement: { label: "Optional sync share", variant: "optional" },
      },
      {
        day: "Day 8 · Wednesday",
        title: "Work-in-progress review",
        detail:
          "Live or Loom review so you can annotate, request tweaks, and make sure we're on track before polish days. You'll feel: Confident.",
        engagement: { label: "Client input required", variant: "required" },
      },
      {
        day: "Day 9 · Thursday",
        title: "Polish + stress test",
        detail:
          "We apply feedback, QA flows, prep exports/source files, and rehearse demos internally—no meetings so the studio can focus on polish. You'll feel: Meticulous.",
        engagement: { label: "Studio heads down", variant: "studio" },
      },
      {
        day: "Day 10 · Friday",
        title: "Delivery + handoff",
        detail:
          "Final deliverables, Loom walkthrough, optional live demo, and next-sprint recommendations all drop at once. You'll feel: Satisfied.",
        engagement: { label: "Optional sync share", variant: "optional" },
      },
    ],
  },
];

export const ENGAGEMENT_BADGES: Record<
  SprintDayEngagement["variant"],
  { icon: string; classes: string }
> = {
  required: {
    icon: "🤝",
    classes:
      "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800",
  },
  optional: {
    icon: "💬",
    classes:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/50 dark:text-gray-200 dark:border-gray-700",
  },
  studio: {
    icon: "🔕",
    classes:
      "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-700",
  },
};




