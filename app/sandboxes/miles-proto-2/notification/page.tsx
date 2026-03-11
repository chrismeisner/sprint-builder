"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BASE } from "@/app/sandboxes/miles-proto-2/_lib/nav";

/* ------------------------------------------------------------------ */
/*  Notification definitions — one per context key                    */
/* ------------------------------------------------------------------ */

type IconVariant = "miles" | "miles-alert" | "miles-trip";

interface NotifDef {
  title: string;
  body: string;
  icon: IconVariant;
  /** Where this notification taps through to */
  href: string;
}

const NOTIFS: Record<string, NotifDef> = {
  "kid-speeding": {
    title: "Speed Alert — Jack",
    body: "Jack is going 72 in a 55. Tap to respond.",
    icon: "miles-alert",
    href: "/miles?context=kid-speeding",
  },
  "tire-pressure": {
    title: "Low Tire Pressure",
    body: "Your front left tire is reading 24 psi — below the safe range of 32 psi.",
    icon: "miles-alert",
    href: "/miles?context=tire-pressure",
  },
  "kid-trip": {
    title: "Jack Started a Trip",
    body: "Jack is driving the 2019 Subaru Outback. Tap to see the live view.",
    icon: "miles-trip",
    href: "/miles?context=kid-trip",
  },
  fuel: {
    title: "Fuel Getting Low",
    body: "Your Civic is at 38% (~95 mi range). Want a reminder to fill up?",
    icon: "miles",
    href: "/miles?context=fuel",
  },
  oil: {
    title: "Maintenance Reminder",
    body: "Your oil change is coming up in ~800 miles. Tap to set a reminder or schedule service.",
    icon: "miles",
    href: "/miles?context=oil",
  },
  registration: {
    title: "Registration Expiring",
    body: "Your 2019 Honda Civic registration expires Apr 15. Want help planning ahead?",
    icon: "miles",
    href: "/miles?context=registration",
  },
  "coaching-braking": {
    title: "Hard Braking Detected",
    body: "A hard braking event on Preston Rd cost you 3 points. Tap to review and get tips.",
    icon: "miles-alert",
    href: "/miles?context=coaching-braking",
  },
  "check-engine": {
    title: "Check Engine Light",
    body: "Diagnostic code P0420 detected on your 2019 Civic. Tap to see what it means.",
    icon: "miles-alert",
    href: "/miles?context=check-engine",
  },
  "trip-detail": {
    title: "Trip Complete",
    body: "Home → Target, 4.2 mi · Score: 88. Tap to review your trip and ask Miles anything.",
    icon: "miles-trip",
    href: "/miles?context=trip-detail",
  },
  "vehicle-health": {
    title: "Vehicle Health Update",
    body: "New data is available for your 2019 Civic Sport. Tap to view.",
    icon: "miles",
    href: "/miles?context=vehicle-health",
  },
  "driver-score": {
    title: "Score Updated",
    body: "Your driving score is now 82 — up 3 points from last week. See what changed.",
    icon: "miles",
    href: "/miles?context=driver-score",
  },
};

const DEFAULT_NOTIF: NotifDef = {
  title: "Miles Has a Suggestion",
  body: "I noticed a few things from your recent trips. Tap to chat when you have a moment.",
  icon: "miles",
  href: "/miles",
};

/* ------------------------------------------------------------------ */
/*  Icon                                                               */
/* ------------------------------------------------------------------ */

function AppIcon({ variant }: { variant: IconVariant }) {
  const bg =
    variant === "miles-alert"
      ? "bg-amber-500"
      : variant === "miles-trip"
        ? "bg-blue-500"
        : "bg-green-600";

  return (
    <div className={`flex size-11 shrink-0 items-center justify-center rounded-[14px] ${bg} shadow-md`}>
      {variant === "miles-alert" ? (
        <svg className="size-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      ) : variant === "miles-trip" ? (
        <svg className="size-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      ) : (
        <svg className="size-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
        </svg>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page content                                                       */
/* ------------------------------------------------------------------ */

function NotificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contextKey = searchParams.get("context") ?? "";
  const notif = NOTIFS[contextKey] ?? DEFAULT_NOTIF;
  const destination = BASE + notif.href;

  const [visible, setVisible] = useState(false);
  const [tapped, setTapped] = useState(false);

  // Staggered entrance — notification drops in after a short delay
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function handleTap() {
    setTapped(true);
    setTimeout(() => router.push(destination), 180);
  }

  return (
    <div className="relative flex h-dvh flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden select-none">
      {/* Wallpaper gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 30% 20%, rgba(56,189,248,0.25), transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(168,85,247,0.2), transparent 60%)",
        }}
      />

      {/* Status bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-3 pb-1 shrink-0">
        <span className="text-xs font-medium">{timeStr}</span>
        <div className="flex items-center gap-1">
          <svg className="size-4 text-white/80" fill="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="16" width="3" height="6" rx="0.5" opacity="0.4" />
            <rect x="7" y="12" width="3" height="10" rx="0.5" opacity="0.6" />
            <rect x="12" y="8" width="3" height="14" rx="0.5" opacity="0.8" />
            <rect x="17" y="4" width="3" height="18" rx="0.5" />
          </svg>
          <svg className="size-4 text-white/80" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
          </svg>
          <div className="flex items-center gap-0.5">
            <div className="flex h-3 w-6 items-center rounded-sm border border-white/50 p-0.5">
              <div className="h-full w-[72%] rounded-[1px] bg-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Clock + date */}
      <div className="relative z-10 flex flex-col items-center gap-1 pt-8 pb-4 shrink-0">
        <svg className="size-5 text-white/50 mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        <time className="text-[72px] font-thin leading-none tracking-tight tabular-nums">
          {timeStr}
        </time>
        <span className="text-base font-light text-white/70">{dateStr}</span>
      </div>

      {/* Notification card */}
      <div className="relative z-10 flex-1 flex flex-col justify-start px-4 pt-4">
        {/* Section label */}
        <div
          className={`flex items-center justify-between px-1 mb-2 transition-all duration-500 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Recent
          </span>
          <span className="text-[11px] font-medium text-white/40">Just now</span>
        </div>

        {/* The notification — tappable */}
        <button
          type="button"
          onClick={handleTap}
          className={`w-full text-left transition-all duration-500 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
          } ${tapped ? "scale-[0.97] opacity-70" : "active:scale-[0.98]"}`}
        >
          <div className="flex gap-3 rounded-2xl bg-white/15 backdrop-blur-xl p-3 pr-4 border border-white/10 shadow-xl">
            <AppIcon variant={notif.icon} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold leading-tight text-white/50 uppercase tracking-wide">
                  Miles
                </span>
              </div>
              <p className="text-[15px] font-semibold leading-snug text-white">
                {notif.title}
              </p>
              <p className="mt-0.5 text-[13px] leading-[1.4] text-white/70">
                {notif.body}
              </p>
            </div>
          </div>
        </button>

        {/* Tap hint */}
        <p
          className={`mt-5 text-center text-[11px] text-white/30 transition-all duration-700 delay-500 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          Tap notification to open Miles
        </p>
      </div>

      {/* Home indicator */}
      <div className="relative z-10 shrink-0 flex justify-center pb-3 pt-4">
        <div className="h-1 w-32 rounded-full bg-white/30" />
      </div>
    </div>
  );
}

export default function NotificationPage() {
  return (
    <Suspense>
      <NotificationContent />
    </Suspense>
  );
}
