"use client";

import Link from "@/app/sandboxes/miles-proto-4/_components/link";
import type { DemoTodoItem } from "@/app/sandboxes/miles-proto-4/_lib/demo-todos";

const VEHICLE_COLOR: Record<string, string> = {
  civic: "#9b1c1c",
  rav4: "#6b8cae",
};

interface TodoPreviewProps {
  items: DemoTodoItem[];
  title?: string;
  href?: string;
  className?: string;
}

export function TodoPreview({
  items,
  title = "To-Do",
  href = "/todos",
  className = "",
}: TodoPreviewProps) {
  if (items.length === 0) return null;

  return (
    <div className={`flex flex-col gap-3 ${className}`.trim()}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          {title}
        </span>
        {href ? (
          <Link
            href={href}
            className="text-xs font-medium text-semantic-info hover:text-semantic-info/80"
          >
            See all
          </Link>
        ) : null}
      </div>
      <div className="flex flex-col divide-y divide-stroke-muted rounded-panel border border-stroke-muted bg-surface-card">
        {items.map((item) => {
          const vehicleColor = VEHICLE_COLOR[item.vehicleId] ?? "#6b7280";
          const vehicleInitial = item.vehicleLabel[0].toUpperCase();
          return (
          <div
            key={item.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-background text-xs font-bold leading-none text-white shadow-sm"
              style={{ backgroundColor: vehicleColor }}
              title={item.vehicleLabel}
              aria-hidden
            >
              {vehicleInitial}
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-text-primary">
                {item.title}
              </span>
              <span className="text-xs leading-none text-text-muted">{item.subtitle}</span>
            </div>
            <svg className="size-4 shrink-0 text-stroke-strong" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          );
        })}
      </div>
    </div>
  );
}
