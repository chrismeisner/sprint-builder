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
    title: "Week 1 · Uphill — Explore & Decide",
    summary:
      "Reduce uncertainty, explore multiple paths, and commit to one clear direction.",
    highlight: "Outcome: Direction is locked",
    days: [
      {
        day: "Day 1 · Monday",
        title: "Kickoff workshop",
        detail:
          "3-hour brand/product workshop to align on goals, constraints, audience, and success metrics. Frame: Aligned.",
        engagement: { label: "Client input required", variant: "required" },
      },
      {
        day: "Day 2 · Tuesday",
        title: "Research + divergence",
        detail:
          "Studio audits existing materials, gathers references, and explores broadly. Async only so we stay heads down. Frame: Curious.",
        engagement: { label: "Studio heads down", variant: "studio" },
      },
      {
        day: "Day 3 · Wednesday",
        title: "Work-in-progress share",
        detail:
          "Explorations shared via Loom/Figma with 'ingredient'/'solution' buckets—categories with grouped variations. React inline to steer which buckets we'll carry into Ingredient Review. Optional live sync if helpful. Frame: Excited.",
        engagement: { label: "Optional sync share", variant: "optional" },
      },
      {
        day: "Day 4 · Thursday",
        title: "Ingredient review",
        detail:
          "Review grouped solutions and categorized ingredients together. Decide which to keep, refine, discard, or combine—shaping the raw materials into a clear direction. Frame: Decisive.",
        engagement: { label: "Client input required", variant: "required" },
      },
      {
        day: "Day 5 · Friday",
        title: "Direction locked",
        detail:
          "Studio compiles Day 4 feedback into one clear direction and shares an async outline. You see the solution shape and think: 'Yes, this solves it.' Frame: Clear.",
        engagement: { label: "Async outline shared", variant: "optional" },
      },
    ],
  },
  {
    id: "week-2",
    icon: "🏁",
    title: "Week 2 · Downhill — Build & Deliver",
    summary:
      "Execute quickly with focus, polish, and confidence.",
    highlight: "Outcome: Finished, polished handoff",
    days: [
      {
        day: "Day 6 · Monday",
        title: "Direction check + build kickoff",
        detail:
          "Quick sync to review the locked direction, answer last questions, and confirm we're all aligned before going downhill. No directional changes after today—just confident execution. Frame: Focused.",
        engagement: { label: "Optional sync", variant: "optional" },
      },
      {
        day: "Day 7 · Tuesday",
        title: "Deep build day",
        detail:
          "Heads-down execution across design/copy/systems/product. Mostly async updates; optional sync share. Frame: Inspired.",
        engagement: { label: "Optional sync share", variant: "optional" },
      },
      {
        day: "Day 8 · Wednesday",
        title: "Work-in-progress review",
        detail:
          "Live or Loom review to see it all coming together—early testing, validate progress, and request tweaks before polish. Not complete yet, but the shape is clear. Frame: Confident.",
        engagement: { label: "Client input required", variant: "required" },
      },
      {
        day: "Day 9 · Thursday",
        title: "Polish + stress test",
        detail:
          "QA, refinement, exports, and internal demo rehearsals. No meetings so we can polish. Frame: Meticulous.",
        engagement: { label: "Studio heads down", variant: "studio" },
      },
      {
        day: "Day 10 · Friday",
        title: "Delivery + handoff",
        detail:
          "Final deliverables, Loom walkthrough, optional live demo, and next-sprint recommendations. Frame: Satisfied.",
        engagement: { label: "Optional sync share", variant: "optional" },
      },
    ],
  },
];

export const ATTITUDE_THEMES = [
  "Understood",
  "Explorative",
  "Excited",
  "Decisive",
  "Aligned",
  "Focused",
  "Inspired",
  "Confident",
  "Meticulous",
  "Proud",
] as const;

export type AttitudeTheme = (typeof ATTITUDE_THEMES)[number];

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




