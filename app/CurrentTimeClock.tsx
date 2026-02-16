"use client";

import { useState, useEffect } from "react";

export default function CurrentTimeClock() {
  const [now, setNow] = useState<Date | null>(null);
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    setNow(new Date());
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const hours = now.getHours();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  const pad = (n: number) => n.toString().padStart(2, "0");

  const time = `${pad(displayHour)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-2xl font-semibold leading-snug text-balance tabular-nums text-neutral-900 dark:text-neutral-100">
        {time} <span className="text-neutral-500 dark:text-neutral-500">{period}</span>
      </p>
      <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
        {date}
      </p>
      <p className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
        {timezone.replace(/_/g, " ")}
      </p>
    </div>
  );
}
