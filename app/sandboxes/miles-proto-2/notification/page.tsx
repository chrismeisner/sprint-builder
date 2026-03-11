"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BASE } from "@/app/sandboxes/miles-proto-2/_lib/nav";

/* ------------------------------------------------------------------ */
/*  Notification definitions — one per context key                    */
/* ------------------------------------------------------------------ */

interface NotifDef {
  title: string;
  body: string;
  /** Where this notification taps through to */
  href: string;
}

const NOTIFS: Record<string, NotifDef> = {
  "kid-speeding": {
    title: "Speed Alert — Jack",
    body: "Jack's going 72 in a 55. Tap to tell Miles how you'd like to handle it.",
    href: "/miles?context=kid-speeding",
  },
  "tire-pressure": {
    title: "Low Tire Pressure",
    body: "Your front left tire is reading 24 psi — below safe range. Ask Miles what to do next.",
    href: "/miles?context=tire-pressure",
  },
  "kid-trip": {
    title: "Jack Started a Trip",
    body: "Jack's driving the Subaru Outback. Tap to talk to Miles about this trip.",
    href: "/miles?context=kid-trip",
  },
  fuel: {
    title: "Fuel Getting Low",
    body: "Your Civic is at 38% (~95 mi range). Ask Miles to set a reminder or plan around it.",
    href: "/miles?context=fuel",
  },
  oil: {
    title: "Maintenance Reminder",
    body: "Your oil change is due in ~800 miles. Talk to Miles and decide how to handle it.",
    href: "/miles?context=oil",
  },
  registration: {
    title: "Registration Expiring",
    body: "Your Civic registration expires Apr 15. Ask Miles to help you get ahead of it.",
    href: "/miles?context=registration",
  },
  "coaching-braking": {
    title: "Hard Braking Detected",
    body: "A hard braking event on Preston Rd cost you 3 points. Ask Miles for tips.",
    href: "/miles?context=coaching-braking",
  },
  "check-engine": {
    title: "Check Engine Light",
    body: "Diagnostic code P0420 detected on your Civic. Ask Miles what it means and what to do.",
    href: "/miles?context=check-engine",
  },
  "trip-detail": {
    title: "Trip Complete",
    body: "Home → Target, 4.2 mi · Score 88. Tap to ask Miles about this trip.",
    href: "/miles?context=trip-detail",
  },
  "vehicle-health": {
    title: "Vehicle Health Update",
    body: "New data came in for your Civic. Ask Miles what it means.",
    href: "/miles?context=vehicle-health",
  },
  "driver-score": {
    title: "Score Updated",
    body: "Your score is now 82 — up 3 points. Ask Miles what made the difference.",
    href: "/miles?context=driver-score",
  },
};

const DEFAULT_NOTIF: NotifDef = {
  title: "Miles Has a Suggestion",
  body: "I noticed a few things from your recent trips. Tap to chat when you have a moment.",
  href: "/miles",
};

/* ------------------------------------------------------------------ */
/*  Icon                                                               */
/* ------------------------------------------------------------------ */

function AppIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/miles-proto-2/miles-icon.svg"
      alt="Miles"
      className="size-11 shrink-0 rounded-[14px] shadow-md"
    />
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
    <div className="relative flex h-dvh flex-col text-white overflow-hidden select-none">
      {/* Wallpaper */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/miles-proto-2/images/bg.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        aria-hidden="true"
      />
      {/* Scrim so text stays legible */}
      <div className="pointer-events-none absolute inset-0 bg-black/30" />

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
            <AppIcon />
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
