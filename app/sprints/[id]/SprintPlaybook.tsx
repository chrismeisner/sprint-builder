"use client";

import { useState } from "react";
import { SPRINT_WEEKS, ENGAGEMENT_BADGES } from "@/lib/sprintProcess";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "@/app/components/typography";

type Props = {
  className?: string;
};

export default function SprintPlaybook({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const t = {
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    heading: `${typography.headingCard}`,
    label: `${getTypographyClassName("body-sm")} text-text-muted`,
    cellText: `${getTypographyClassName("body-sm")} text-text-primary`,
  };

  const attitudeThemes = [
    "Understood",
    "Explorative",
    "Excited",
    "Decisive",
    "Aligned",
    "Focused",
    "Inspired",
    "Confident",
    "Meticulous",
    "Proud",
  ];

  const rows = (() => {
    const acc: Array<{
      day: string;
      title: string;
      detail: string;
      engagement: Record<string, unknown> | null;
      attitude: string;
    }> = [];
    let idx = 0;
    for (const week of SPRINT_WEEKS) {
      for (const day of week.days) {
        const attitude = attitudeThemes[idx] ?? attitudeThemes[attitudeThemes.length - 1];
        acc.push({
          day: day.day,
          title: day.title,
          detail: day.detail,
          engagement: day.engagement ? { ...day.engagement, badge: ENGAGEMENT_BADGES[day.engagement.variant] } : null,
          attitude,
        });
        idx += 1;
      }
    }
    return acc;
  })();

  return (
    <section
      className={`rounded-lg border border-black/10 dark:border-white/15 p-5 space-y-6 bg-black/5 dark:bg-white/5 ${t.bodySm} ${className || ""}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <div className={`inline-flex items-center rounded-full bg-black/10 dark:bg-white/10 px-3 py-1 ${t.chip} text-black/70 dark:text-white/60`}>
            Process
          </div>
          <div className="space-y-1">
            <h2 className={t.heading}>Process</h2>
            <p className={t.bodySm}>
              Every sprint we run follows this exact cadence so you always know when we need you live, when feedback is optional, and when the studio is heads down making progress.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className={`inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition ${getTypographyClassName("button-sm")}`}
        >
          <span>{isOpen ? "Collapse" : "Expand"}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-black/10 dark:border-white/15 rounded-lg overflow-hidden">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr className={getTypographyClassName("body-sm")}>
                <th className="text-left px-3 py-2 text-text-muted">Day</th>
                <th className="text-left px-3 py-2 text-text-muted">Focus</th>
                <th className="text-left px-3 py-2 text-text-muted">Attitude</th>
                <th className="text-left px-3 py-2 text-text-muted">Detail</th>
              </tr>
            </thead>
            <tbody className={t.bodySm}>
              {rows.map((row, idx) => (
                <tr key={`${row.day}-${idx}`} className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-gray-950/40">
                  <td className="px-3 py-3 align-top">
                    <div className={t.cellText}>{String(row.day).split("·")[0].trim()}</div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className={t.cellText}>{row.title}</div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className={`${t.cellText} rounded-md px-2 py-1 bg-black/5 dark:bg-white/5 w-fit`}>
                      {row.attitude}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

