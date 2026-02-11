"use client";

import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type SprintData = {
  title: string;
  projectName: string | null;
  startDate: string | null;
  dueDate: string | null;
  weeks: number;
  totalPoints: number;
  totalHours: number;
  totalPrice: number;
  approach: string | null;
  week1Overview: string | null;
  week2Overview: string | null;
};

type DeliverableItem = {
  name: string;
  description: string | null;
  category: string | null;
  scope: string | null;
  basePoints: number;
  adjustedPoints: number;
  multiplier: number;
  hours: number;
  note: string | null;
  quantity: number;
};

type Props = {
  sprint: SprintData;
  deliverables: DeliverableItem[];
};

function formatFriendly(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const dt = new Date(`${dateStr}T00:00:00`);
  if (isNaN(dt.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(dt);
}

function formatNum(value: number): string {
  return Number(value)
    .toFixed(1)
    .replace(/\.0$/, "");
}

export default function SharedSprintView({ sprint, deliverables }: Props) {
  const h1Class = `${getTypographyClassName("h1")} text-text-primary`;
  const h2Class = `${getTypographyClassName("h2")} text-text-primary`;
  const h3Class = `${getTypographyClassName("h3")} text-text-primary`;
  const subtitleClass = `${getTypographyClassName("subtitle-sm")} text-text-secondary`;
  const bodyClass = `${getTypographyClassName("body-md")} text-text-primary`;
  const bodySmClass = `${getTypographyClassName("body-sm")} text-text-primary`;
  const labelClass = `${getTypographyClassName("body-sm")} text-text-secondary`;
  const metricLabelClass = `${getTypographyClassName("subtitle-sm")} text-text-secondary`;
  const metricValueClass = `${getTypographyClassName("h3")} text-text-primary`;

  // Group deliverables by category
  const byCategory: Record<string, DeliverableItem[]> = {};
  deliverables.forEach((d) => {
    const cat = d.category || "Deliverables";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(d);
  });

  const totalDays = sprint.weeks * 5;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-black/10 dark:border-white/10">
        <div className="container max-w-3xl py-10">
          <div className="space-y-2">
            <p className={`${subtitleClass} uppercase tracking-wider`}>Sprint Proposal</p>
            <h1 className={h1Class}>{sprint.title}</h1>
            {sprint.projectName && (
              <p className={`${bodyClass} text-text-secondary`}>{sprint.projectName}</p>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-3xl py-8 space-y-8">
        {/* Overview cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black p-5">
            <div className={`${metricLabelClass} mb-1`}>Total Investment</div>
            <div className={h2Class}>${sprint.totalPrice.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black p-5">
            <div className={`${metricLabelClass} mb-1`}>Duration</div>
            <div className={metricValueClass}>
              {sprint.weeks} {sprint.weeks === 1 ? "week" : "weeks"}
            </div>
            <div className={labelClass}>{totalDays} working days</div>
          </div>
          <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black p-5">
            <div className={`${metricLabelClass} mb-1`}>Estimated Hours</div>
            <div className={metricValueClass}>{formatNum(sprint.totalHours)}</div>
            <div className={labelClass}>~{formatNum(sprint.totalHours / Math.max(totalDays, 1))} hrs/day</div>
          </div>
        </div>

        {/* Timeline */}
        {(sprint.startDate || sprint.dueDate) && (
          <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black p-5">
            <h2 className={`${h3Class} mb-3`}>Timeline</h2>
            <div className="flex flex-wrap gap-6">
              {sprint.startDate && (
                <div>
                  <div className={metricLabelClass}>Start</div>
                  <div className={bodyClass}>{formatFriendly(sprint.startDate)}</div>
                </div>
              )}
              {sprint.dueDate && (
                <div>
                  <div className={metricLabelClass}>End</div>
                  <div className={bodyClass}>{formatFriendly(sprint.dueDate)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approach */}
        {sprint.approach && (
          <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black p-5">
            <h2 className={`${h3Class} mb-3`}>Approach</h2>
            <p className={`${bodyClass} whitespace-pre-line`}>{sprint.approach}</p>
          </div>
        )}

        {/* Week overviews */}
        {(sprint.week1Overview || sprint.week2Overview) && (
          <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black p-5 space-y-4">
            <h2 className={`${h3Class}`}>Week-by-Week Plan</h2>
            {sprint.week1Overview && (
              <div>
                <div className={`${metricLabelClass} mb-1`}>Week 1</div>
                <p className={`${bodyClass} whitespace-pre-line`}>{sprint.week1Overview}</p>
              </div>
            )}
            {sprint.week2Overview && (
              <div>
                <div className={`${metricLabelClass} mb-1`}>Week 2</div>
                <p className={`${bodyClass} whitespace-pre-line`}>{sprint.week2Overview}</p>
              </div>
            )}
          </div>
        )}

        {/* Deliverables */}
        <div className="space-y-4">
          <h2 className={h2Class}>
            Deliverables ({deliverables.length})
          </h2>

          {Object.entries(byCategory).map(([category, items]) => (
            <div
              key={category}
              className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-black/5 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
                <h3 className={`${subtitleClass} uppercase tracking-wider`}>{category}</h3>
              </div>
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {items.map((d, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className={`${bodyClass} font-semibold`}>{d.name}</div>
                        {d.description && (
                          <p className={`${labelClass} mt-1`}>{d.description}</p>
                        )}
                        {d.scope && (
                          <p className={`${labelClass} mt-1 italic`}>Scope: {d.scope}</p>
                        )}
                        {d.note && (
                          <p className={`${bodySmClass} mt-1.5 text-text-secondary italic`}>
                            Note: {d.note}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`${bodySmClass} font-semibold`}>
                          {formatNum(d.hours)} hrs
                        </div>
                        {d.multiplier !== 1 && (
                          <div className={`${labelClass}`}>{d.multiplier}x complexity</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer summary */}
        <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className={metricLabelClass}>Total Investment</div>
              <div className={h2Class}>${sprint.totalPrice.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className={metricLabelClass}>
                {deliverables.length} deliverable{deliverables.length !== 1 ? "s" : ""} &middot;{" "}
                {formatNum(sprint.totalHours)} hours &middot;{" "}
                {sprint.weeks} week{sprint.weeks !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Draft notice */}
        <div className="text-center py-6">
          <p className={`${labelClass}`}>
            This is a draft proposal. Details may change based on further discussion.
          </p>
        </div>
      </div>
    </div>
  );
}
