"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "@/app/sandboxes/miles-proto-2/_components/link";

/* ------------------------------------------------------------------ */
/*  Context definitions                                                */
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

interface ContextConfig {
  greeting: string;
  card?: ChatCard;
  prompts: string[];
}

interface ChatCard {
  type: "trip" | "vehicle" | "score" | "reminder";
  title: string;
  rows: { label: string; value: string }[];
  actions?: { label: string; style: "primary" | "secondary" }[];
}

interface ReminderOption {
  label: string;
  icon: string;
  response: string;
}

interface PendingItem {
  id: string;
  message: string;
  reminderOptions: ReminderOption[];
}

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */

const PENDING_ITEMS: PendingItem[] = [
  {
    id: "fuel",
    message: "Your fuel was at 38% after your last trip. Want a reminder to fill up?",
    reminderOptions: [
      { label: "Tomorrow morning", icon: "☀️", response: "I'll remind you tomorrow morning before you leave." },
      { label: "This weekend", icon: "📅", response: "Reminder set for Saturday morning." },
      { label: "Already filled up", icon: "✅", response: "Great — I've cleared this one." },
      { label: "Don't remind me", icon: "🚫", response: "Got it — I won't bring up fuel reminders." },
    ],
  },
  {
    id: "oil",
    message: "Your oil change is coming up in about 800 miles. How would you like to handle it?",
    reminderOptions: [
      { label: "Remind me in a week", icon: "📅", response: "I'll check back in a week." },
      { label: "At 500 miles remaining", icon: "🛣️", response: "I'll remind you when you're at 500 miles remaining." },
      { label: "Add to my to-do list", icon: "📝", response: "Added to your to-do list. You can find it there anytime." },
      { label: "Already scheduled", icon: "✅", response: "Nice — I'll mark this as handled." },
      { label: "Don't remind me", icon: "🚫", response: "Understood. I won't bring this up again." },
    ],
  },
];

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
    card: {
      type: "vehicle",
      title: "2019 Honda Civic Sport",
      rows: [
        { label: "Fuel level", value: "38%" },
        { label: "Estimated range", value: "~95 mi" },
        { label: "Last fill-up", value: "6 days ago" },
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
    card: {
      type: "reminder",
      title: "Oil Change Due",
      rows: [
        { label: "Remaining", value: "~800 mi" },
        { label: "Last changed", value: "Nov 12, 2025" },
        { label: "Interval", value: "Every 5,000 mi" },
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
    card: {
      type: "reminder",
      title: "Registration Renewal",
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
    greeting: "I see you're looking at your last trip. What would you like to know?",
    card: {
      type: "trip",
      title: "Home → Target",
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
    card: {
      type: "vehicle",
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
    card: {
      type: "score",
      title: "Driver Score",
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
    greeting: "You had a hard braking event on your last trip. Here's what I saw.",
    card: {
      type: "trip",
      title: "Hard Braking — Preston Rd",
      rows: [
        { label: "Deceleration", value: "-0.45g" },
        { label: "Speed before", value: "38 mph" },
        { label: "Speed after", value: "12 mph" },
        { label: "Score impact", value: "-3 pts" },
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
  | { role: "agent"; text: string }
  | { role: "agent-card"; card: ChatCard }
  | { role: "agent-reminder"; item: PendingItem };

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function InlineCard({ card }: { card: ChatCard }) {
  const borderColor = {
    trip: "border-blue-200 bg-blue-50/50",
    vehicle: "border-neutral-200 bg-neutral-50",
    score: "border-green-200 bg-green-50/50",
    reminder: "border-amber-200 bg-amber-50/50",
  }[card.type];

  return (
    <div className={`rounded-xl border p-3.5 ${borderColor}`}>
      <span className="text-xs font-semibold text-neutral-500">{card.title}</span>
      <div className="mt-2 flex flex-col gap-1.5">
        {card.rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">{row.label}</span>
            <span className="text-xs font-semibold text-neutral-800">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReminderCard({
  item,
  onSelect,
}: {
  item: PendingItem;
  onSelect: (option: ReminderOption) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-green-200 bg-green-50/50 p-4">
      <p className="text-sm leading-relaxed text-green-800">{item.message}</p>
      <div className="flex flex-col gap-1.5 pt-1">
        {item.reminderOptions.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onSelect(opt)}
            className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-white px-3.5 py-2.5 text-left text-sm font-medium text-green-800 transition-colors hover:bg-green-50"
          >
            <span className="text-base leading-none">{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AgentBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-neutral-100 px-4 py-3 text-sm leading-relaxed text-neutral-800">
        {text}
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

function getAgentResponse(text: string, context: AgentContext): ChatMessage[] {
  const q = text.toLowerCase();

  if (q.includes("score") && q.includes("calculat")) {
    return [
      {
        role: "agent",
        text: "Your score is based on four categories — braking, speed, acceleration, and cornering. Each trip is scored, and your daily score is a weighted average. Smoother driving in all four areas pushes your score up.",
      },
      {
        role: "agent-card",
        card: {
          type: "score",
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
        role: "agent-card",
        card: {
          type: "trip",
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

  const pending =
    contextParam === "cold" && pendingIndex < PENDING_ITEMS.length
      ? PENDING_ITEMS[pendingIndex]
      : null;

  const showPrompts = !promptsUsed && messages.length === 0 && !pending;

  useEffect(() => {
    setMessages([]);
    setPendingIndex(0);
    setPromptsUsed(false);
  }, [contextParam]);

  function handleReminderSelect(option: ReminderOption) {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: option.label },
      { role: "agent", text: option.response },
    ]);
    setPendingIndex((i) => i + 1);
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
    <main className="flex min-h-dvh flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-100 px-5 pb-4 pt-14">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
            <svg className="size-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <h1 className="text-lg font-semibold text-neutral-900">Miles</h1>
            <ContextBadge context={contextParam} />
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 pb-36">
        {/* Greeting */}
        <AgentBubble text={config.greeting} />

        {/* Context card (shown once on entry) */}
        {config.card && messages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              <InlineCard card={config.card} />
            </div>
          </div>
        )}

        {/* Pending reminder item (cold context only, one at a time) */}
        {pending && (
          <ReminderCard item={pending} onSelect={handleReminderSelect} />
        )}

        {/* Suggested prompts */}
        {showPrompts && (
          <SuggestedPrompts prompts={config.prompts} onSelect={handleSend} />
        )}

        {/* Chat history */}
        {messages.map((msg, i) => {
          if (msg.role === "user") return <UserBubble key={i} text={msg.text} />;
          if (msg.role === "agent") return <AgentBubble key={i} text={msg.text} />;
          if (msg.role === "agent-card") {
            return (
              <div key={i} className="flex justify-start">
                <div className="max-w-[85%]">
                  <InlineCard card={msg.card} />
                </div>
              </div>
            );
          }
          if (msg.role === "agent-reminder") {
            return (
              <ReminderCard
                key={i}
                item={msg.item}
                onSelect={handleReminderSelect}
              />
            );
          }
          return null;
        })}

        {/* Post-message suggested prompts */}
        {messages.length > 0 && (
          <SuggestedPrompts prompts={config.prompts} onSelect={handleSend} />
        )}
      </div>

      {/* Input bar */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+56px)] left-0 right-0 border-t border-neutral-100 bg-white px-5 py-3">
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
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
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
