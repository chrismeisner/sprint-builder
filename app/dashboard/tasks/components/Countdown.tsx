"use client";

import { useState, useEffect } from "react";

type CountdownProps = {
  targetDate: string | Date;
  onComplete?: () => void;
  showSeconds?: boolean;
  className?: string;
  completedText?: string;
  prefix?: string;
  suffix?: string;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
};

function calculateTimeLeft(targetDate: string | Date): TimeLeft | null {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

export default function Countdown({
  targetDate,
  onComplete,
  showSeconds = true,
  className = "",
  completedText = "Time's up!",
  prefix = "",
  suffix = "",
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calculateTimeLeft(targetDate)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);

      if (!newTimeLeft && onComplete) {
        onComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  if (!timeLeft) {
    return <span className={className}>{completedText}</span>;
  }

  const { days, hours, minutes, seconds } = timeLeft;

  // Build the display string
  let display = "";
  if (days > 0) display += `${days}d `;
  if (days > 0 || hours > 0) display += `${hours}h `;
  display += `${minutes}m`;
  if (showSeconds) display += ` ${seconds}s`;

  return (
    <span className={`font-mono ${className}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

// Compact version for inline use
export function CountdownCompact({
  targetDate,
  className = "",
}: {
  targetDate: string | Date;
  className?: string;
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calculateTimeLeft(targetDate)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) {
    return <span className={`text-red-500 ${className}`}>overdue</span>;
  }

  const { days, hours, minutes } = timeLeft;

  // Compact format based on time remaining
  let display = "";
  if (days > 0) {
    display = `${days}d ${hours}h`;
  } else if (hours > 0) {
    display = `${hours}h ${minutes}m`;
  } else {
    display = `${minutes}m`;
  }

  // Color based on urgency
  let colorClass = "text-blue-600 dark:text-blue-400";
  if (days === 0 && hours < 24) {
    colorClass = "text-amber-600 dark:text-amber-400";
  }
  if (days === 0 && hours < 4) {
    colorClass = "text-red-600 dark:text-red-400";
  }

  return (
    <span className={`font-mono text-xs ${colorClass} ${className}`}>
      {display}
    </span>
  );
}

// Daily countdown - counts down to a specific time today (or tomorrow if passed)
export function DailyCountdown({
  targetTime,
  className = "",
  onComplete,
}: {
  targetTime: string; // Format: "HH:MM" (24h)
  className?: string;
  onComplete?: () => void;
}) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    function getTargetDate() {
      const now = new Date();
      const [hours, minutes] = targetTime.split(":").map(Number);
      const target = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0,
        0
      );

      // If target time has passed today, set for tomorrow
      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }

      return target;
    }

    function updateCountdown() {
      const target = getTargetDate();
      const diff = target.getTime() - Date.now();

      if (diff <= 0) {
        setDisplay("Time's up!");
        if (onComplete) onComplete();
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      let result = "";
      if (days > 0) result += `${days}d `;
      if (days > 0 || hours > 0) result += `${hours}h `;
      result += `${mins}m ${secs}s`;

      setDisplay(result);
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [targetTime, onComplete]);

  return (
    <span className={`font-mono ${className}`}>
      {display}
      <span className="opacity-70 ml-1">until {targetTime}</span>
    </span>
  );
}
