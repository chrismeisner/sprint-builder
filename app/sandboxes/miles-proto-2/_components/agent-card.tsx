"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ActionIcon,
  ActionOption,
  AgentCard,
  StatusLevel,
  TireMap,
} from "@/app/sandboxes/miles-proto-2/_lib/agent-types";
import { p } from "@/app/sandboxes/miles-proto-2/_lib/nav";

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<StatusLevel, string> = {
  good: "text-green-700 bg-green-100",
  warn: "text-amber-700 bg-amber-100",
  info: "text-blue-700 bg-blue-100",
};

export function StatusBadge({
  label,
  level,
}: {
  label: string;
  level: StatusLevel;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[level]}`}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

const ICON_PATHS: Record<ActionIcon, React.ReactNode> = {
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  none: null,
};

function ActionSvg({ icon }: { icon: ActionIcon }) {
  const path = ICON_PATHS[icon];
  if (!path) return null;
  return (
    <svg
      className="size-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      {path}
    </svg>
  );
}

const DEFAULT_ICON_FOR_STYLE: Record<string, ActionIcon> = {
  primary: "clock",
  secondary: "calendar",
  dismiss: "check",
};

/* ------------------------------------------------------------------ */
/*  Why It Matters                                                     */
/* ------------------------------------------------------------------ */

export function WhyItMatters({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-neutral-100">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600"
      >
        <span className="flex items-center gap-1.5">
          <svg
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          Why this matters
        </span>
        <svg
          className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: open ? "200px" : "0px" }}
      >
        <p className="px-4 pb-3 text-xs leading-relaxed text-neutral-500">
          {text}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tire Pressure Visualization                                        */
/* ------------------------------------------------------------------ */

const TIRE_POSITIONS = [
  { key: "frontLeft" as const,  label: "FL", x: 8,   y: 14,  cx: 30.5, cy: 29  },
  { key: "frontRight" as const, label: "FR", x: 207, y: 14,  cx: 229.5, cy: 29 },
  { key: "rearLeft" as const,   label: "RL", x: 8,   y: 106, cx: 30.5, cy: 121 },
  { key: "rearRight" as const,  label: "RR", x: 207, y: 106, cx: 229.5, cy: 121 },
];

export function TirePressureView({ tireMap }: { tireMap: TireMap }) {
  return (
    <div className="-mx-4 -mb-1 border-t border-neutral-100 bg-neutral-50 px-2 pb-2 pt-2">
      <svg
        viewBox="0 0 260 148"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        aria-label="Tire pressure overview"
      >
        {/* Car body */}
        <rect x="65" y="15" width="130" height="120" rx="14" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5" />
        {/* Windshield */}
        <rect x="78" y="22" width="104" height="34" rx="5" fill="#bfdbfe" opacity="0.55" />
        {/* Rear window */}
        <rect x="78" y="94" width="104" height="30" rx="5" fill="#bfdbfe" opacity="0.38" />
        {/* Center console divider */}
        <line x1="130" y1="58" x2="130" y2="92" stroke="#e5e7eb" strokeWidth="1" />

        {TIRE_POSITIONS.map(({ key, x, y, cx, cy }) => {
          const psi = tireMap[key];
          const isLow = psi < tireMap.recommended;
          return (
            <g key={key}>
              {isLow && (
                <circle cx={cx} cy={cy} r="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.35">
                  <animate attributeName="r" values="17;25;17" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <rect
                x={x} y={y} width="45" height="30" rx="6"
                fill={isLow ? "#fffbeb" : "#f0fdf4"}
                stroke={isLow ? "#fcd34d" : "#86efac"}
                strokeWidth="1.5"
              />
              <text x={cx} y={y + 13} textAnchor="middle" fill={isLow ? "#d97706" : "#16a34a"} fontSize="11.5" fontWeight="bold">
                {psi} psi
              </text>
              <text x={cx} y={y + 25} textAnchor="middle" fill={isLow ? "#d97706" : "#16a34a"} fontSize="8.5">
                {isLow ? "LOW ⚠" : "OK ✓"}
              </text>
            </g>
          );
        })}

        {/* Recommended reference */}
        <text x="130" y="145" textAnchor="middle" fill="#9ca3af" fontSize="9">
          Recommended: {tireMap.recommended} psi
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Speed Alert Display                                               */
/* ------------------------------------------------------------------ */

export function SpeedAlertView({
  speedAlert,
}: {
  speedAlert: NonNullable<AgentCard["speedAlert"]>;
}) {
  return (
    <div className="-mx-4 -mb-1 border-t border-neutral-100 bg-neutral-50 px-4 pb-3 pt-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[46px] font-black leading-none tabular-nums text-amber-500">
              {speedAlert.current}
            </span>
            <span className="mb-1 self-end text-sm font-medium text-neutral-400">
              mph
            </span>
          </div>
          <div className="mt-0.5 text-sm text-neutral-500">
            in a{" "}
            <span className="font-semibold text-neutral-700">
              {speedAlert.limit}
            </span>{" "}
            zone
          </div>
        </div>
        {speedAlert.timestamp && (
          <span className="mt-0.5 text-[11px] text-neutral-400">
            {speedAlert.timestamp}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Action Button                                                      */
/* ------------------------------------------------------------------ */

const ACTION_STYLES = {
  primary:
    "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  secondary:
    "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
  dismiss:
    "text-neutral-400 hover:bg-neutral-50",
} as const;

const ICON_COLOR: Record<string, string> = {
  primary: "",
  secondary: "text-neutral-400",
  dismiss: "text-neutral-300",
};

export function ActionButton({
  action,
  onClick,
}: {
  action: ActionOption;
  onClick: () => void;
}) {
  const router = useRouter();
  const icon = action.icon ?? DEFAULT_ICON_FOR_STYLE[action.style] ?? "none";
  const detailColor =
    action.style === "primary" ? "text-blue-400" : "text-neutral-400";

  function handleClick() {
    onClick();
    if (action.href) {
      router.push(p(action.href));
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-all active:scale-[0.99] ${ACTION_STYLES[action.style]}`}
    >
      <span className={ICON_COLOR[action.style]}>
        <ActionSvg icon={icon} />
      </span>
      {action.label}
      {action.detail && (
        <span className={`ml-auto text-[11px] ${detailColor}`}>
          {action.detail}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Agent Card — the unified card component                            */
/*                                                                     */
/*  Renders adaptively based on which fields are present:              */
/*   card.intro       → agent bubble above the card                    */
/*   card.rows        → data rows in the context block                 */
/*   card.status      → badge in top-right of header                   */
/*   card.whyItMatters → expandable section                            */
/*   card.actions     → action button set with resolution              */
/* ------------------------------------------------------------------ */

export function AgentCardView({
  card,
  onAction,
}: {
  card: AgentCard;
  onAction?: (action: ActionOption) => void;
}) {
  const hasActions = card.actions && card.actions.length > 0;

  return (
    <div className="flex flex-col gap-2.5">
      {card.intro && (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl bg-neutral-100 px-4 py-3 text-sm leading-relaxed text-neutral-700">
            {card.intro}
          </div>
        </div>
      )}

      <div
        className={`overflow-hidden rounded-xl border border-neutral-200 bg-white ${
          hasActions ? "max-w-[90%]" : "max-w-[85%]"
        }`}
      >
        {/* Faux map preview */}
        {card.mapPreview && (
          <div className="relative h-28 w-full overflow-hidden bg-[#e8eaed]">
            <svg
              viewBox="0 0 300 112"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {/* Road grid */}
              <line x1="0" y1="56" x2="300" y2="56" stroke="white" strokeWidth="10" />
              <line x1="0" y1="28" x2="300" y2="28" stroke="white" strokeWidth="6" />
              <line x1="0" y1="84" x2="300" y2="84" stroke="white" strokeWidth="6" />
              <line x1="80" y1="0" x2="80" y2="112" stroke="white" strokeWidth="6" />
              <line x1="200" y1="0" x2="200" y2="112" stroke="white" strokeWidth="6" />
              {/* Route trail */}
              <path
                d="M 18 56 C 40 56 55 28 80 28 C 105 28 110 56 140 56 C 165 56 175 44 200 42 C 220 40 230 42 248 42"
                stroke="#2563eb"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Start marker */}
              <circle cx="18" cy="56" r="5" fill="white" stroke="#2563eb" strokeWidth="2" />
              {/* Pulse ring (live only) */}
              {card.mapPreview === "live" && (
                <circle cx="248" cy="42" r="11" fill="#2563eb" opacity="0.18">
                  <animate attributeName="r" values="8;15;8" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.22;0;0.22" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Current / end position dot */}
              <circle cx="248" cy="42" r="5.5" fill="#2563eb" stroke="white" strokeWidth="2" />
            </svg>
            {/* Speed overlay (live only, suppressed when speedAlert widget carries the speed) */}
            {card.mapPreview === "live" && !card.speedAlert && (
              <div className="absolute bottom-2 left-3 flex items-baseline gap-1 rounded-lg bg-white/90 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
                <span className="text-[22px] font-bold leading-none tabular-nums text-neutral-900">37</span>
                <span className="text-[11px] font-medium text-neutral-400">mph</span>
              </div>
            )}
          </div>
        )}

        {/* Context block */}
        <div className="p-4 pb-3">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-neutral-900">
                {card.title}
              </div>
              {card.subtitle && (
                <div className="mt-0.5 text-xs text-neutral-500">
                  {card.subtitle}
                </div>
              )}
            </div>
            {card.status && <StatusBadge {...card.status} />}
          </div>

          {card.tireMap ? (
            <TirePressureView tireMap={card.tireMap} />
          ) : card.speedAlert ? (
            <SpeedAlertView speedAlert={card.speedAlert} />
          ) : card.rows && card.rows.length > 0 ? (
            <div className="flex flex-col gap-2">
              {card.rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-neutral-500">{row.label}</span>
                  <span
                    className={`text-xs font-semibold ${
                      row.highlight ? "text-amber-600" : "text-neutral-800"
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {card.whyItMatters && <WhyItMatters text={card.whyItMatters} />}

        {hasActions && onAction && (
          <div className="flex flex-col gap-2 border-t border-neutral-100 p-3">
            <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-300">
              What would you like to do?
            </span>
            {card.actions!.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                onClick={() => onAction(action)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat bubbles                                                       */
/* ------------------------------------------------------------------ */

export function AgentBubble({
  text,
  subtext,
}: {
  text: string;
  subtext?: string;
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-neutral-100 px-4 py-3">
        <p className="text-sm leading-relaxed text-neutral-800">{text}</p>
        {subtext && (
          <p className="mt-1 text-xs text-neutral-500">{subtext}</p>
        )}
      </div>
    </div>
  );
}

export function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-blue-600 px-4 py-3 text-sm leading-relaxed text-white">
        {text}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Suggested prompts                                                  */
/* ------------------------------------------------------------------ */

export function SuggestedPrompts({
  prompts,
  onSelect,
}: {
  prompts: string[];
  onSelect: (p: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-300">
        Suggested
      </span>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onSelect(p)}
            className="rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Context badge                                                      */
/* ------------------------------------------------------------------ */

export function ContextBadge({ label }: { label?: string }) {
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-medium text-green-700">
      <span className="size-1.5 rounded-full bg-green-500" />
      {label}
    </span>
  );
}
