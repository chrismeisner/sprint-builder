/* ------------------------------------------------------------------ */
/*  Miles Agent — data layer                                           */
/*                                                                     */
/*  All context configs, pending items, and response rules live here.  */
/*  To add a new context or scenario, edit this file only.             */
/* ------------------------------------------------------------------ */

import type {
  ActionOption,
  AgentCard,
  ChatMessage,
  ContextConfig,
  PendingItem,
  ResponseRule,
} from "./agent-types";

/* ------------------------------------------------------------------ */
/*  Shared action sets (reused across contexts + pending items)        */
/* ------------------------------------------------------------------ */

const FUEL_ACTIONS: ActionOption[] = [
  {
    id: "tomorrow",
    label: "Remind me tomorrow morning",
    detail: "7 AM",
    style: "primary",
    icon: "clock",
    response: {
      text: "Got it — reminder set for tomorrow at 7 AM.",
      subtext: "Added to your Miles to-do list.",
    },
  },
  {
    id: "weekend",
    label: "Remind me this weekend",
    detail: "Sat",
    style: "secondary",
    icon: "calendar",
    response: {
      text: "Reminder set for Saturday morning.",
      subtext: "Added to your Miles to-do list.",
    },
  },
  {
    id: "handled",
    label: "Already filled up",
    style: "dismiss",
    icon: "check",
    response: {
      text: "Great — I've cleared this one.",
      subtext: "Check fuel data anytime in Vehicle Health.",
    },
  },
];

const OIL_ACTIONS: ActionOption[] = [
  {
    id: "week",
    label: "Remind me in a week",
    style: "primary",
    icon: "clock",
    response: {
      text: "I'll check back in a week.",
      subtext: "Added to your Miles to-do list.",
    },
  },
  {
    id: "500mi",
    label: "At 500 miles remaining",
    style: "secondary",
    icon: "calendar",
    response: {
      text: "I'll remind you at 500 miles remaining.",
      subtext: "Tracking your mileage automatically.",
    },
  },
  {
    id: "scheduled",
    label: "Already scheduled",
    style: "dismiss",
    icon: "check",
    response: {
      text: "Nice — I'll mark this as handled.",
      subtext: "Check maintenance anytime in Vehicle Health.",
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Context configurations                                             */
/*                                                                     */
/*  Keys are the ?context= param values. "cold" is the default.       */
/*  To add a new context: add an entry here + a response rule below.   */
/* ------------------------------------------------------------------ */

export const CONTEXTS: Record<string, ContextConfig> = {
  cold: {
    greeting: "Hey Chris — anything I can help with?",
    prompts: [
      "How is my driving score calculated?",
      "When is my next oil change due?",
      "Show me last week's trips",
      "What does a check engine light mean?",
      "How can I improve my braking score?",
    ],
  },

  fuel: {
    greeting: "Let's talk about your fuel situation.",
    badgeLabel: "Fuel alert",
    card: {
      intro:
        "Your fuel was at 38% after your last trip. Here's where things stand:",
      title: "Fuel Level",
      subtitle: "2019 Honda Civic Sport",
      status: { label: "Low", level: "warn" },
      rows: [
        { label: "Current level", value: "38%", highlight: true },
        { label: "Estimated range", value: "~95 mi" },
        { label: "Last fill-up", value: "6 days ago" },
        { label: "Avg consumption", value: "28 mpg" },
      ],
      whyItMatters:
        "Running below 25% increases risk of fuel pump wear and can leave you stranded. Filling up regularly also helps you track fuel economy trends.",
      actions: FUEL_ACTIONS,
    },
    prompts: [
      "Where did I usually fill up?",
      "How much am I spending on gas?",
      "How does fuel relate to my trips?",
    ],
  },

  oil: {
    greeting: "Here's what I know about your upcoming oil change.",
    badgeLabel: "Maintenance",
    card: {
      intro: "Your oil change is coming up. Here's the details:",
      title: "Oil Change",
      subtitle: "Next service interval",
      status: { label: "Due Soon", level: "warn" },
      rows: [
        { label: "Remaining", value: "~800 mi", highlight: true },
        { label: "Last changed", value: "Nov 12, 2025" },
        { label: "Interval", value: "Every 5,000 mi" },
        { label: "Oil type", value: "0W-20 Synthetic" },
      ],
      whyItMatters:
        "Delaying oil changes can lead to increased engine wear, reduced fuel efficiency, and potentially costly repairs. Staying on schedule keeps your engine running smoothly.",
      actions: OIL_ACTIONS,
    },
    prompts: [
      "What happens if I go over?",
      "What type of oil does my car use?",
      "How much does an oil change usually cost?",
    ],
  },

  registration: {
    greeting: "Your registration is coming up for renewal.",
    badgeLabel: "Registration",
    card: {
      title: "Registration Renewal",
      subtitle: "Apr 15, 2026",
      rows: [
        { label: "Expires", value: "Apr 15, 2026" },
        { label: "Vehicle", value: "2019 Honda Civic" },
        { label: "State", value: "Texas" },
      ],
    },
    prompts: [
      "How do I renew online in Texas?",
      "What documents do I need?",
      "Remind me two weeks before",
    ],
  },

  "trip-detail": {
    greeting:
      "I see you're looking at your last trip. What would you like to know?",
    badgeLabel: "Trip Detail",
    card: {
      title: "Home → Target",
      subtitle: "Today, 3:42 PM",
      rows: [
        { label: "Score", value: "88" },
        { label: "Distance", value: "4.2 mi" },
        { label: "Duration", value: "12 min" },
        { label: "Events", value: "1 hard brake" },
      ],
    },
    prompts: [
      "How did this trip affect my score?",
      "What was the hard braking event?",
      "Was I speeding at any point?",
      "Compare this to my average trip",
    ],
  },

  "vehicle-health": {
    greeting: "Here's a summary of your Civic's health.",
    badgeLabel: "Vehicle Health",
    card: {
      title: "2019 Honda Civic Sport",
      rows: [
        { label: "Engine", value: "Good" },
        { label: "Battery", value: "Good" },
        { label: "Fuel", value: "38%" },
        { label: "Odometer", value: "62,340 mi" },
      ],
    },
    prompts: [
      "What does the battery health mean?",
      "When should I worry about engine codes?",
      "How can I see tire pressure?",
      "What data can Miles read from my car?",
    ],
  },

  "driver-score": {
    greeting: "Let's dig into your driving score.",
    badgeLabel: "Driver Score",
    card: {
      title: "Driver Score",
      subtitle: "Updated today",
      rows: [
        { label: "Current", value: "82" },
        { label: "Lowest category", value: "Cornering (76)" },
        { label: "Best category", value: "Acceleration (88)" },
        { label: "vs. average", value: "+8 pts" },
      ],
    },
    prompts: [
      "How is the score calculated?",
      "How can I improve my cornering?",
      "Why did my score drop on Wednesday?",
      "What's a good score?",
    ],
  },

  "coaching-braking": {
    greeting: "I noticed something on your last trip.",
    badgeLabel: "Hard braking event",
    card: {
      intro:
        "You had a hard braking event on Preston Rd. Here's what happened:",
      title: "Hard Braking Event",
      subtitle: "Preston Rd · Today, 3:48 PM",
      status: { label: "-3 pts", level: "info" },
      rows: [
        { label: "Deceleration", value: "-0.45g", highlight: true },
        { label: "Speed before", value: "38 mph" },
        { label: "Speed after", value: "12 mph" },
        { label: "Score impact", value: "-3 pts" },
      ],
      whyItMatters:
        "Hard braking events affect your driver score and can indicate risky following distance. Smoother braking is safer for you and easier on your brake pads.",
      actions: [
        {
          id: "tips",
          label: "Show me braking tips",
          style: "primary",
          icon: "clock",
          response: {
            text: "Try leaving 3–4 seconds of following distance at speed. Look further ahead to anticipate stops — smooth deceleration keeps your score high.",
            subtext: "Your braking score is currently 78.",
          },
        },
        {
          id: "dismiss",
          label: "Got it, thanks",
          style: "dismiss",
          icon: "check",
          response: {
            text: "No problem — keep it smooth out there!",
            subtext: "Check your driving breakdown anytime in Driver Score.",
          },
        },
      ],
    },
    prompts: [
      "What counts as hard braking?",
      "How much did this affect my score?",
      "Tips for smoother braking",
      "Show me where this happened on the map",
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Pending items — shown proactively in cold context                  */
/*                                                                     */
/*  These use the same action sets as their parent contexts but can    */
/*  have fewer rows for a more concise notification card.              */
/* ------------------------------------------------------------------ */

export const PENDING_ITEMS: PendingItem[] = [
  {
    id: "fuel",
    card: {
      intro:
        "Your fuel was at 38% after your last trip. Here's where things stand:",
      title: "Fuel Level",
      subtitle: "2019 Honda Civic Sport",
      status: { label: "Low", level: "warn" },
      rows: [
        { label: "Current level", value: "38%", highlight: true },
        { label: "Estimated range", value: "~95 mi" },
        { label: "Last fill-up", value: "6 days ago" },
      ],
      whyItMatters:
        "Running below 25% increases risk of fuel pump wear and can leave you stranded. Filling up regularly also helps you track fuel economy trends.",
      actions: FUEL_ACTIONS,
    },
  },
  {
    id: "oil",
    card: {
      intro: "Your oil change is coming up. Here's what I know:",
      title: "Oil Change",
      subtitle: "Next service interval",
      status: { label: "Due Soon", level: "warn" },
      rows: [
        { label: "Remaining", value: "~800 mi", highlight: true },
        { label: "Last changed", value: "Nov 12, 2025" },
        { label: "Interval", value: "Every 5,000 mi" },
      ],
      whyItMatters:
        "Delaying oil changes can lead to increased engine wear, reduced fuel efficiency, and potentially costly repairs. Staying on schedule keeps your engine running smoothly.",
      actions: OIL_ACTIONS,
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Response rules — checked in order, first match wins                */
/*                                                                     */
/*  To add a new response: push a rule to this array.                  */
/* ------------------------------------------------------------------ */

const RESPONSE_RULES: ResponseRule[] = [
  {
    match: (q) => q.includes("score") && q.includes("calculat"),
    messages: [
      {
        role: "agent",
        text: "Your score is based on four categories — braking, speed, acceleration, and cornering. Each trip is scored, and your daily score is a weighted average. Smoother driving in all four areas pushes your score up.",
      },
      {
        role: "agent-card",
        card: {
          title: "Your Breakdown",
          rows: [
            { label: "Braking", value: "78" },
            { label: "Speed", value: "85" },
            { label: "Acceleration", value: "88" },
            { label: "Cornering", value: "76" },
          ],
        },
      },
    ],
  },
  {
    match: (q) => q.includes("hard brak") || q.includes("braking event"),
    messages: [
      {
        role: "agent",
        text: "Hard braking is when you decelerate faster than -0.4g. On your last trip, there was one event on Preston Rd — you went from 38 to 12 mph in about 2 seconds. Leaving a bit more following distance can help avoid these.",
      },
    ],
  },
  {
    match: (q) => q.includes("oil") && (q.includes("cost") || q.includes("much")),
    messages: [
      {
        role: "agent",
        text: "For a 2019 Honda Civic Sport, a standard oil change typically runs $40–$75 at a shop, or $25–$40 if you do it yourself. Full synthetic (which Honda recommends) is at the higher end.",
      },
    ],
  },
  {
    match: (q) => q.includes("cornering") || q.includes("improve my corner"),
    messages: [
      {
        role: "agent",
        text: "Cornering score measures lateral g-force through turns. The biggest improvement comes from slowing down before the turn rather than braking through it. Even 3–5 mph less going in can improve your score significantly — it's about smoothness, not speed.",
      },
    ],
  },
  {
    match: (q) => q.includes("tire pressure") || q.includes("tires"),
    messages: [
      {
        role: "agent",
        text: "I can't read tire pressure directly from your Civic's OBD-II port — it's one of those metrics that varies by vehicle. If your car has a TPMS warning light, I'll catch that as an engine code. For now, I'd recommend checking manually once a month.",
      },
    ],
  },
  {
    match: (q) => q.includes("last week") && q.includes("trip"),
    messages: [
      { role: "agent", text: "Here's your week at a glance:" },
      {
        role: "agent-card",
        card: {
          title: "Last 7 Days",
          rows: [
            { label: "Total trips", value: "7" },
            { label: "Total distance", value: "38.6 mi" },
            { label: "Avg score", value: "83" },
            { label: "Busiest day", value: "Tuesday" },
          ],
        },
      },
    ],
  },
  {
    match: (q, ctx) => ctx === "trip-detail" && q.includes("affect"),
    messages: [
      {
        role: "agent",
        text: "This trip scored 88, which is above your 7-day average of 83. The one hard braking event knocked about 3 points off — without it, you would have been at 91. Overall this trip helped your daily score slightly.",
      },
    ],
  },
];

const FALLBACK_RESPONSE: ChatMessage[] = [
  {
    role: "agent",
    text: "I don't have a specific answer for that yet, but in the real app I'd pull your vehicle data to help. Try one of the suggested prompts, or ask me about your score, trips, or maintenance.",
  },
];

export function getAgentResponse(
  text: string,
  context: string
): ChatMessage[] {
  const q = text.toLowerCase();
  const rule = RESPONSE_RULES.find((r) => r.match(q, context));
  return rule ? rule.messages : FALLBACK_RESPONSE;
}
