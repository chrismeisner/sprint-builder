"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AgentContext =
  | "cold"
  | "fuel"
  | "oil"
  | "registration"
  | "trip-detail"
  | "vehicle-health"
  | "driver-score"
  | "coaching-braking";

interface ActionOption {
  id: string;
  label: string;
  detail?: string;
  style: "primary" | "secondary" | "dismiss";
  response: { text: string; subtext?: string };
}

interface ActionCardData {
  intro: string;
  title: string;
  subtitle?: string;
  status?: { label: string; level: "good" | "warn" | "info" };
  rows: { label: string; value: string; highlight?: boolean }[];
  whyItMatters?: string;
  actions: ActionOption[];
}

interface InfoCardData {
  title: string;
  subtitle?: string;
  rows: { label: string; value: string }[];
}

interface ContextConfig {
  greeting: string;
  actionCard?: ActionCardData;
  infoCard?: InfoCardData;
  prompts: string[];
}

/* ------------------------------------------------------------------ */
/*  Demo data — pending items (cold context)                           */
/* ------------------------------------------------------------------ */

const PENDING_ITEMS: { id: string; actionCard: ActionCardData }[] = [
  {
    id: "fuel",
    actionCard: {
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
      actions: [
        {
          id: "tomorrow",
          label: "Remind me tomorrow morning",
          detail: "7 AM",
          style: "primary",
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
          response: {
            text: "Reminder set for Saturday morning.",
            subtext: "Added to your Miles to-do list.",
          },
        },
        {
          id: "handled",
          label: "Already filled up",
          style: "dismiss",
          response: {
            text: "Great — I've cleared this one.",
            subtext: "Check fuel data anytime in Vehicle Health.",
          },
        },
      ],
    },
  },
  {
    id: "oil",
    actionCard: {
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
      actions: [
        {
          id: "week",
          label: "Remind me in a week",
          style: "primary",
          response: {
            text: "I'll check back in a week.",
            subtext: "Added to your Miles to-do list.",
          },
        },
        {
          id: "500mi",
          label: "At 500 miles remaining",
          style: "secondary",
          response: {
            text: "I'll remind you at 500 miles remaining.",
            subtext: "Tracking your mileage automatically.",
          },
        },
        {
          id: "scheduled",
          label: "Already scheduled",
          style: "dismiss",
          response: {
            text: "Nice — I'll mark this as handled.",
            subtext: "Check maintenance anytime in Vehicle Health.",
          },
        },
      ],
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Demo data — context configs                                        */
/* ------------------------------------------------------------------ */

const CONTEXT_CONFIGS: Record<AgentContext, ContextConfig> = {
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
    actionCard: {
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
      actions: [
        {
          id: "tomorrow",
          label: "Remind me tomorrow morning",
          detail: "7 AM",
          style: "primary",
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
          response: {
            text: "Reminder set for Saturday morning.",
            subtext: "Added to your Miles to-do list.",
          },
        },
        {
          id: "handled",
          label: "Already filled up",
          style: "dismiss",
          response: {
            text: "Great — I've cleared this one.",
            subtext: "Check fuel data anytime in Vehicle Health.",
          },
        },
      ],
    },
    prompts: [
      "Where did I usually fill up?",
      "How much am I spending on gas?",
      "How does fuel relate to my trips?",
    ],
  },
  oil: {
    greeting: "Here's what I know about your upcoming oil change.",
    actionCard: {
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
      actions: [
        {
          id: "week",
          label: "Remind me in a week",
          style: "primary",
          response: {
            text: "I'll check back in a week.",
            subtext: "Added to your Miles to-do list.",
          },
        },
        {
          id: "500mi",
          label: "At 500 miles remaining",
          style: "secondary",
          response: {
            text: "I'll remind you at 500 miles remaining.",
            subtext: "Tracking your mileage automatically.",
          },
        },
        {
          id: "scheduled",
          label: "Already scheduled",
          style: "dismiss",
          response: {
            text: "Nice — I'll mark this as handled.",
            subtext: "Check maintenance anytime in Vehicle Health.",
          },
        },
      ],
    },
    prompts: [
      "What happens if I go over?",
      "What type of oil does my car use?",
      "How much does an oil change usually cost?",
    ],
  },
  registration: {
    greeting: "Your registration is coming up for renewal.",
    infoCard: {
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
    infoCard: {
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
    infoCard: {
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
    infoCard: {
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
    actionCard: {
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
          response: {
            text: "Try leaving 3–4 seconds of following distance at speed. Look further ahead to anticipate stops — smooth deceleration keeps your score high.",
            subtext: "Your braking score is currently 78.",
          },
        },
        {
          id: "dismiss",
          label: "Got it, thanks",
          style: "dismiss",
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
/*  Chat message types                                                 */
/* ------------------------------------------------------------------ */

type ChatMessage =
  | { role: "user"; text: string }
  | { role: "agent"; text: string; subtext?: string }
  | { role: "agent-info-card"; card: InfoCardData };

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatusBadge({
  label,
  level,
}: {
  label: string;
  level: "good" | "warn" | "info";
}) {
  const styles = {
    good: "text-green-700 bg-green-100",
    warn: "text-amber-700 bg-amber-100",
    info: "text-blue-700 bg-blue-100",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[level]}`}
    >
      {label}
    </span>
  );
}

function WhyItMatters({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-neutral-100">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600"
      >
        <span className="flex items-center gap-1.5">
          <svg
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          Why this matters
        </span>
        <svg
          className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: open ? "200px" : "0px" }}
      >
        <p className="px-4 pb-3 text-xs leading-relaxed text-neutral-500">
          {text}
        </p>
      </div>
    </div>
  );
}

function ActionButton({
  action,
  onClick,
}: {
  action: ActionOption;
  onClick: () => void;
}) {
  if (action.style === "primary") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-left text-sm font-medium text-blue-700 transition-all hover:bg-blue-100 active:scale-[0.99]"
      >
        <svg
          className="size-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        {action.label}
        {action.detail && (
          <span className="ml-auto text-[11px] text-blue-400">
            {action.detail}
          </span>
        )}
      </button>
    );
  }

  if (action.style === "secondary") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-2.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-left text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 active:scale-[0.99]"
      >
        <svg
          className="size-4 shrink-0 text-neutral-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {action.label}
        {action.detail && (
          <span className="ml-auto text-[11px] text-neutral-400">
            {action.detail}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-neutral-400 transition-all hover:bg-neutral-50 active:scale-[0.99]"
    >
      <svg
        className="size-4 shrink-0 text-neutral-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {action.label}
    </button>
  );
}

function AgentActionCard({
  card,
  onAction,
}: {
  card: ActionCardData;
  onAction: (action: ActionOption) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl bg-neutral-100 px-4 py-3 text-sm leading-relaxed text-neutral-700">
          {card.intro}
        </div>
      </div>

      <div className="max-w-[90%] overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {/* Context block */}
        <div className="p-4 pb-3">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-neutral-900">
                {card.title}
              </div>
              {card.subtitle && (
                <div className="mt-0.5 text-xs text-neutral-500">
                  {card.subtitle}
                </div>
              )}
            </div>
            {card.status && <StatusBadge {...card.status} />}
          </div>
          <div className="flex flex-col gap-2">
            {card.rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between"
              >
                <span className="text-xs text-neutral-500">{row.label}</span>
                <span
                  className={`text-xs font-semibold ${
                    row.highlight ? "text-amber-600" : "text-neutral-800"
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {card.whyItMatters && <WhyItMatters text={card.whyItMatters} />}

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-neutral-100 p-3">
          <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-300">
            What would you like to do?
          </span>
          {card.actions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              onClick={() => onAction(action)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ card }: { card: InfoCardData }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-xl border border-neutral-200 bg-white p-3.5">
        <div className="mb-2 flex items-start justify-between">
          <span className="text-xs font-semibold text-neutral-900">
            {card.title}
          </span>
          {card.subtitle && (
            <span className="text-[11px] text-neutral-400">
              {card.subtitle}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          {card.rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">{row.label}</span>
              <span className="text-xs font-semibold text-neutral-800">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentBubble({
  text,
  subtext,
}: {
  text: string;
  subtext?: string;
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-neutral-100 px-4 py-3">
        <p className="text-sm leading-relaxed text-neutral-800">{text}</p>
        {subtext && (
          <p className="mt-1 text-xs text-neutral-500">{subtext}</p>
        )}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-blue-600 px-4 py-3 text-sm leading-relaxed text-white">
        {text}
      </div>
    </div>
  );
}

function SuggestedPrompts({
  prompts,
  onSelect,
}: {
  prompts: string[];
  onSelect: (p: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-300">
        Suggested
      </span>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onSelect(p)}
            className="rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function ContextBadge({ context }: { context: AgentContext }) {
  if (context === "cold") return null;

  const labels: Partial<Record<AgentContext, string>> = {
    fuel: "Fuel alert",
    oil: "Maintenance",
    registration: "Registration",
    "trip-detail": "Trip Detail",
    "vehicle-health": "Vehicle Health",
    "driver-score": "Driver Score",
    "coaching-braking": "Hard braking event",
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-medium text-green-700">
      <span className="size-1.5 rounded-full bg-green-500" />
      {labels[context]}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Simulated agent responses                                          */
/* ------------------------------------------------------------------ */

function getAgentResponse(
  text: string,
  context: AgentContext
): ChatMessage[] {
  const q = text.toLowerCase();

  if (q.includes("score") && q.includes("calculat")) {
    return [
      {
        role: "agent",
        text: "Your score is based on four categories — braking, speed, acceleration, and cornering. Each trip is scored, and your daily score is a weighted average. Smoother driving in all four areas pushes your score up.",
      },
      {
        role: "agent-info-card",
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
    ];
  }

  if (q.includes("hard brak") || q.includes("braking event")) {
    return [
      {
        role: "agent",
        text: "Hard braking is when you decelerate faster than -0.4g. On your last trip, there was one event on Preston Rd — you went from 38 to 12 mph in about 2 seconds. Leaving a bit more following distance can help avoid these.",
      },
    ];
  }

  if (q.includes("oil") && (q.includes("cost") || q.includes("much"))) {
    return [
      {
        role: "agent",
        text: "For a 2019 Honda Civic Sport, a standard oil change typically runs $40–$75 at a shop, or $25–$40 if you do it yourself. Full synthetic (which Honda recommends) is at the higher end.",
      },
    ];
  }

  if (q.includes("cornering") || q.includes("improve my corner")) {
    return [
      {
        role: "agent",
        text: "Cornering score measures lateral g-force through turns. The biggest improvement comes from slowing down before the turn rather than braking through it. Even 3–5 mph less going in can improve your score significantly — it's about smoothness, not speed.",
      },
    ];
  }

  if (q.includes("tire pressure") || q.includes("tires")) {
    return [
      {
        role: "agent",
        text: "I can't read tire pressure directly from your Civic's OBD-II port — it's one of those metrics that varies by vehicle. If your car has a TPMS warning light, I'll catch that as an engine code. For now, I'd recommend checking manually once a month.",
      },
    ];
  }

  if (q.includes("last week") && q.includes("trip")) {
    return [
      {
        role: "agent",
        text: "Here's your week at a glance:",
      },
      {
        role: "agent-info-card",
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
    ];
  }

  if (context === "trip-detail" && q.includes("affect")) {
    return [
      {
        role: "agent",
        text: "This trip scored 88, which is above your 7-day average of 83. The one hard braking event knocked about 3 points off — without it, you would have been at 91. Overall this trip helped your daily score slightly.",
      },
    ];
  }

  return [
    {
      role: "agent",
      text: "I don't have a specific answer for that yet, but in the real app I'd pull your vehicle data to help. Try one of the suggested prompts, or ask me about your score, trips, or maintenance.",
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Main agent page                                                    */
/* ------------------------------------------------------------------ */

function AgentContent() {
  const searchParams = useSearchParams();
  const contextParam = (searchParams.get("context") || "cold") as AgentContext;
  const config = CONTEXT_CONFIGS[contextParam] || CONTEXT_CONFIGS.cold;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingIndex, setPendingIndex] = useState(0);
  const [promptsUsed, setPromptsUsed] = useState(false);
  const [cardResolved, setCardResolved] = useState(false);

  const pending =
    contextParam === "cold" && pendingIndex < PENDING_ITEMS.length
      ? PENDING_ITEMS[pendingIndex]
      : null;

  const showContextActionCard =
    contextParam !== "cold" && config.actionCard && !cardResolved;

  const showInfoCard = config.infoCard && messages.length === 0;

  const noPendingCards =
    contextParam === "cold" && pendingIndex >= PENDING_ITEMS.length;
  const showPrompts =
    !promptsUsed &&
    messages.length === 0 &&
    !pending &&
    !showContextActionCard &&
    (noPendingCards || contextParam !== "cold");

  useEffect(() => {
    setMessages([]);
    setPendingIndex(0);
    setPromptsUsed(false);
    setCardResolved(false);
  }, [contextParam]);

  function handleActionSelect(action: ActionOption) {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: action.label },
      {
        role: "agent",
        text: action.response.text,
        subtext: action.response.subtext,
      },
    ]);
    if (contextParam === "cold") {
      setPendingIndex((i) => i + 1);
    } else {
      setCardResolved(true);
    }
  }

  function handleSend(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: "user", text };
    const responses = getAgentResponse(text, contextParam);
    setMessages((prev) => [...prev, userMsg, ...responses]);
    setInput("");
    setPromptsUsed(true);
  }

  return (
    <main className="flex h-[100dvh] flex-col bg-white pb-14">
      {/* Header */}
      <div className="shrink-0 border-b border-neutral-100 px-5 pb-4 pt-14">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
            <svg
              className="size-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
              />
            </svg>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <h1 className="text-lg font-semibold text-neutral-900">Miles</h1>
            <ContextBadge context={contextParam} />
          </div>
        </div>
      </div>

      {/* Content area — scrolls between header and input bar */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        {/* Greeting */}
        <AgentBubble text={config.greeting} />

        {/* Info card (non-action contexts, shown before any interaction) */}
        {showInfoCard && <InfoCard card={config.infoCard!} />}

        {/* Chat history */}
        {messages.map((msg, i) => {
          if (msg.role === "user") return <UserBubble key={i} text={msg.text} />;
          if (msg.role === "agent")
            return (
              <AgentBubble key={i} text={msg.text} subtext={msg.subtext} />
            );
          if (msg.role === "agent-info-card")
            return <InfoCard key={i} card={msg.card} />;
          return null;
        })}

        {/* Action card for non-cold contexts */}
        {showContextActionCard && (
          <AgentActionCard
            card={config.actionCard!}
            onAction={handleActionSelect}
          />
        )}

        {/* Pending action card for cold context */}
        {pending && (
          <AgentActionCard
            card={pending.actionCard}
            onAction={handleActionSelect}
          />
        )}

        {/* Suggested prompts */}
        {showPrompts && (
          <SuggestedPrompts prompts={config.prompts} onSelect={handleSend} />
        )}

        {/* Post-interaction suggested prompts */}
        {messages.length > 0 && (
          <SuggestedPrompts prompts={config.prompts} onSelect={handleSend} />
        )}
      </div>

      {/* Input bar — pinned above bottom nav */}
      <div className="shrink-0 border-t border-neutral-100 bg-white px-5 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            placeholder="Ask Miles anything..."
            className="h-10 flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-shadow focus:border-neutral-300 focus:ring-2 focus:ring-green-500/20"
          />
          <button
            type="button"
            onClick={() => handleSend(input)}
            disabled={!input.trim()}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white transition-colors hover:bg-green-700 disabled:opacity-40"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function MilesAgentPage() {
  return (
    <Suspense>
      <AgentContent />
    </Suspense>
  );
}
