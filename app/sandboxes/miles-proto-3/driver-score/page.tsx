"use client";

import Link from "@/app/sandboxes/miles-proto-3/_components/link";

const SCORE = 82;
const PREVIOUS_SCORE = 79;

const TREND = [
  { label: "Mon", value: 78 },
  { label: "Tue", value: 81 },
  { label: "Wed", value: 76 },
  { label: "Thu", value: 83 },
  { label: "Fri", value: 80 },
  { label: "Sat", value: 85 },
  { label: "Sun", value: 82 },
];

const CATEGORIES: {
  label: string;
  score: number;
  max: number;
  description: string;
}[] = [
  { label: "Braking", score: 78, max: 100, description: "Hard braking events per trip" },
  { label: "Speed", score: 85, max: 100, description: "Time within posted limits" },
  { label: "Acceleration", score: 88, max: 100, description: "Smooth starts and merges" },
  { label: "Cornering", score: 76, max: 100, description: "Turning g-force consistency" },
];

const AVERAGE_SCORE = 74;

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f5f5f5"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444"}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-neutral-900">{score}</span>
        <span className="text-[11px] text-neutral-400">out of 100</span>
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: typeof TREND }) {
  const max = 100;
  const min = 50;
  const range = max - min;

  return (
    <div className="flex items-end gap-2">
      {data.map((d, i) => {
        const height = ((d.value - min) / range) * 80 + 16;
        const isToday = i === data.length - 1;
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] font-medium tabular-nums text-neutral-500">
              {d.value}
            </span>
            <div
              className={`w-full rounded-t-md transition-all ${
                isToday ? "bg-blue-500" : "bg-neutral-200"
              }`}
              style={{ height: `${height}px` }}
            />
            <span className={`text-[10px] font-medium ${isToday ? "text-blue-600" : "text-neutral-400"}`}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CategoryBar({ label, score, max, description }: typeof CATEGORIES[number]) {
  const pct = (score / max) * 100;
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-neutral-900">{label}</span>
          <span className="text-xs text-neutral-400">{description}</span>
        </div>
        <span className="text-sm font-semibold tabular-nums text-neutral-700">{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DriverScorePage() {
  const delta = SCORE - PREVIOUS_SCORE;
  const deltaColor = delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-neutral-500";

  return (
    <main className="flex min-h-dvh flex-col bg-neutral-50 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-2">
        <Link
          href="/dashboard"
          className="flex size-9 items-center justify-center rounded-full bg-neutral-100 transition-colors hover:bg-neutral-200"
        >
          <svg className="size-4 text-neutral-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900">Miles Score</h1>
      </div>

      <div className="flex flex-col gap-6 px-5 pt-4">
        {/* Score ring + delta */}
        <div className="flex flex-col items-center gap-3">
          <ScoreRing score={SCORE} />
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${deltaColor}`}>
              {delta > 0 ? "+" : ""}{delta} pts
            </span>
            <span className="text-xs text-neutral-400">vs last week</span>
          </div>
          <span className="text-xs text-neutral-400">Updated today</span>
        </div>

        {/* Comparison to average */}
        <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-neutral-900">Your score</span>
            <span className="text-xs text-neutral-400">vs Miles drivers average</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold tabular-nums text-neutral-900">{SCORE}</span>
              <span className="text-[10px] text-neutral-400">You</span>
            </div>
            <div className="h-8 w-px bg-neutral-200" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold tabular-nums text-neutral-400">{AVERAGE_SCORE}</span>
              <span className="text-[10px] text-neutral-400">Avg</span>
            </div>
          </div>
        </div>

        {/* 7-day trend */}
        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            Last 7 days
          </span>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <TrendChart data={TREND} />
          </div>
        </div>

        {/* Category breakdown */}
        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            Category breakdown
          </span>
          <div className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-4">
            {CATEGORIES.map((cat) => (
              <CategoryBar key={cat.label} {...cat} />
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <svg className="size-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-blue-800">Improve your cornering</span>
              <p className="text-xs leading-relaxed text-blue-700">
                Your cornering score is your lowest category. Reducing speed before turns rather than braking through them can improve this by 5–10 points.
              </p>
            </div>
          </div>
        </div>

        {/* Ask Miles */}
        <Link
          href="/miles?context=driver-score"
          className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 transition-colors hover:bg-green-100"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-100">
            <svg className="size-4.5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold text-green-800">Ask Miles about your score</span>
            <span className="text-xs text-green-600">Get tips on improving or see how trips affect it</span>
          </div>
          <svg className="size-4 shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </main>
  );
}
