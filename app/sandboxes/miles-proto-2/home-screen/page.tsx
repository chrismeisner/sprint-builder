"use client";

import { useState } from "react";
import Link from "@/app/sandboxes/miles-proto-2/_components/link";

interface Notification {
  id: string;
  app: string;
  icon: "miles" | "miles-alert" | "miles-trip";
  title: string;
  body: string;
  time: string;
  href: string;
  group?: string;
}

const NOTIFICATIONS: Notification[] = [
  {
    id: "trip-complete",
    app: "Miles",
    icon: "miles-trip",
    title: "Trip Complete",
    body: "Emma just finished a trip — Home → Target, 4.2 mi. Trip score: 88.",
    time: "3m ago",
    href: "/dashboard?mode=complete",
    group: "recent",
  },
  {
    id: "hard-brake",
    app: "Miles",
    icon: "miles-alert",
    title: "Hard Braking Detected",
    body: "A hard braking event was logged on Preston Rd during Emma's trip. Tap to review.",
    time: "3m ago",
    href: "/miles?context=coaching-braking",
    group: "recent",
  },
  {
    id: "fuel-low",
    app: "Miles",
    icon: "miles",
    title: "Fuel Getting Low",
    body: "Your Civic is at 38% fuel (~95 mi range). Want a reminder to fill up?",
    time: "28m ago",
    href: "/miles?context=fuel",
    group: "recent",
  },
  {
    id: "score-update",
    app: "Miles",
    icon: "miles",
    title: "Score Updated",
    body: "Your driving score is now 82 (+3 from last week). Your cornering could use some work.",
    time: "1h ago",
    href: "/driver-score",
    group: "earlier",
  },
  {
    id: "oil-change",
    app: "Miles",
    icon: "miles",
    title: "Maintenance Reminder",
    body: "Your oil change is coming up in about 800 miles. Tap to set a reminder or mark it done.",
    time: "2h ago",
    href: "/miles?context=oil",
    group: "earlier",
  },
  {
    id: "registration",
    app: "Miles",
    icon: "miles",
    title: "Registration Expiring",
    body: "Your 2019 Honda Civic registration expires Apr 15. Want help planning ahead?",
    time: "5h ago",
    href: "/miles?context=registration",
    group: "earlier",
  },
  {
    id: "weekly-recap",
    app: "Miles",
    icon: "miles",
    title: "Weekly Recap Ready",
    body: "You drove 38.6 miles across 7 trips last week. Average score: 83. Tap to see details.",
    time: "Yesterday",
    href: "/weekly-recap",
    group: "yesterday",
  },
  {
    id: "device-offline",
    app: "Miles",
    icon: "miles-alert",
    title: "Device Disconnected",
    body: "The Miles IO6 in your RAV4 went offline. This may affect trip tracking.",
    time: "Yesterday",
    href: "/device-health",
    group: "yesterday",
  },
  {
    id: "coaching-nudge",
    app: "Miles",
    icon: "miles",
    title: "Miles Has a Suggestion",
    body: "I noticed a few things from your recent trips. Tap to chat when you have a moment.",
    time: "Yesterday",
    href: "/miles",
    group: "yesterday",
  },
];

const GROUP_LABELS: Record<string, string> = {
  recent: "Recent",
  earlier: "Earlier Today",
  yesterday: "Yesterday",
};

const GROUP_ORDER = ["recent", "earlier", "yesterday"];

function MilesAppIcon({ variant }: { variant: Notification["icon"] }) {
  const bg =
    variant === "miles-alert"
      ? "bg-amber-500"
      : variant === "miles-trip"
        ? "bg-blue-500"
        : "bg-green-600";

  return (
    <div className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${bg}`}>
      {variant === "miles-alert" ? (
        <svg className="size-4.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      ) : variant === "miles-trip" ? (
        <svg className="size-4.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      ) : (
        <svg className="size-4.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
        </svg>
      )}
    </div>
  );
}

function NotificationCard({ notification }: { notification: Notification }) {
  return (
    <Link
      href={notification.href}
      className="group flex gap-3 rounded-2xl bg-white/80 backdrop-blur-xl p-3 pr-4 transition-all hover:bg-white/95 hover:scale-[1.01] active:scale-[0.99]"
    >
      <MilesAppIcon variant={notification.icon} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold leading-tight text-neutral-900">
            {notification.title}
          </span>
          <span className="shrink-0 text-[11px] text-neutral-400">
            {notification.time}
          </span>
        </div>
        <p className="text-[12px] leading-[1.35] text-neutral-600 line-clamp-2">
          {notification.body}
        </p>
      </div>
    </Link>
  );
}

export default function HomeScreenPage() {
  const [cleared, setCleared] = useState<Set<string>>(new Set());

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).replace(" ", "");
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const visible = NOTIFICATIONS.filter((n) => !cleared.has(n.id));
  const grouped = GROUP_ORDER.map((g) => ({
    key: g,
    label: GROUP_LABELS[g],
    items: visible.filter((n) => n.group === g),
  })).filter((g) => g.items.length > 0);

  function clearAll() {
    setCleared(new Set(NOTIFICATIONS.map((n) => n.id)));
  }

  function resetAll() {
    setCleared(new Set());
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Wallpaper texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 30% 20%, rgba(56,189,248,0.25), transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(168,85,247,0.2), transparent 60%)",
        }}
      />

      {/* Status bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-3 pb-1">
        <span className="text-xs font-medium">{timeStr}</span>
        <div className="flex items-center gap-1">
          {/* Signal */}
          <svg className="size-4 text-white/80" fill="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="16" width="3" height="6" rx="0.5" opacity="0.4" />
            <rect x="7" y="12" width="3" height="10" rx="0.5" opacity="0.6" />
            <rect x="12" y="8" width="3" height="14" rx="0.5" opacity="0.8" />
            <rect x="17" y="4" width="3" height="18" rx="0.5" />
          </svg>
          {/* WiFi */}
          <svg className="size-4 text-white/80" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
          </svg>
          {/* Battery */}
          <div className="flex items-center gap-0.5">
            <div className="flex h-3 w-6 items-center rounded-sm border border-white/50 p-0.5">
              <div className="h-full w-[72%] rounded-[1px] bg-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Lock icon + time */}
      <div className="relative z-10 flex flex-col items-center gap-1 pb-2 pt-8">
        <svg className="size-5 text-white/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        <time className="text-[72px] font-thin leading-none tracking-tight tabular-nums">
          {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false })}
        </time>
        <span className="text-base font-light text-white/70">{dateStr}</span>
      </div>

      {/* Proto label */}
      <div className="relative z-10 mx-auto mt-3 mb-2 flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1.5">
        <span className="size-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[11px] font-medium text-white/70">
          Miles prototype — tap any notification
        </span>
      </div>

      {/* Notifications */}
      <div className="relative z-10 flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-20 pt-2">
        {grouped.length > 0 ? (
          grouped.map((group) => (
            <div key={group.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  {group.label}
                </span>
                {group.key === "recent" && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[11px] font-medium text-white/40 transition-colors hover:text-white/70"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {group.items.map((n) => (
                  <NotificationCard key={n.id} notification={n} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center gap-3 pt-12">
            <span className="text-sm text-white/40">No notifications</span>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/20 hover:text-white/80"
            >
              Reset notifications
            </button>
          </div>
        )}
      </div>

      {/* Home indicator */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center pb-2 pt-4 bg-gradient-to-t from-slate-900/80 to-transparent">
        <div className="h-1 w-32 rounded-full bg-white/30" />
      </div>
    </div>
  );
}
