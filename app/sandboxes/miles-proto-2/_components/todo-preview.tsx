"use client";

import Link from "@/app/sandboxes/miles-proto-2/_components/link";
import type { DemoTodoItem } from "@/app/sandboxes/miles-proto-2/_lib/demo-todos";

interface TodoPreviewProps {
  items: DemoTodoItem[];
  title?: string;
  href?: string;
  className?: string;
  showVehicle?: boolean;
}

export function TodoPreview({
  items,
  title = "To-Do",
  href = "/todos",
  className = "",
  showVehicle = true,
}: TodoPreviewProps) {
  const typeStyles = {
    setup: { iconBg: "bg-blue-50", text: "text-neutral-900", sub: "text-neutral-500" },
    "near-term": { iconBg: "bg-amber-50", text: "text-neutral-900", sub: "text-neutral-500" },
    "long-horizon": { iconBg: "bg-neutral-100", text: "text-neutral-900", sub: "text-neutral-500" },
  } as const;

  if (items.length === 0) return null;

  return (
    <div className={`flex flex-col gap-3 ${className}`.trim()}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          {title}
        </span>
        {href ? (
          <Link
            href={href}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            See all
          </Link>
        ) : null}
      </div>
      <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
        {items.map((item) => {
          const s = typeStyles[item.type];
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className={`relative flex size-8 shrink-0 items-center justify-center rounded-full text-sm ${s.iconBg}`}>
                {item.emoji}
                {showVehicle ? (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border border-white bg-neutral-900 text-white"
                    aria-hidden="true"
                    title={item.vehicleLabel}
                  >
                    <svg className="size-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5h9m-11.21-1.35.73-2.9a2.25 2.25 0 0 1 2.18-1.7h7.6a2.25 2.25 0 0 1 2.18 1.7l.73 2.9M6 16.5v.75a.75.75 0 0 0 .75.75h.75a.75.75 0 0 0 .75-.75v-.75m7.5 0v.75a.75.75 0 0 0 .75.75h.75a.75.75 0 0 0 .75-.75v-.75M7.5 16.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
                    </svg>
                  </span>
                ) : null}
              </span>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className={`text-sm font-medium leading-none ${s.text}`}>
                  {item.title}
                </span>
                <span className={`text-xs leading-none ${s.sub}`}>{item.subtitle}</span>
              </div>
              <svg className="size-4 shrink-0 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}
