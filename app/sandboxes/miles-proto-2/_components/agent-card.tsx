"use client";

import { useState } from "react";
import type {
  ActionIcon,
  ActionOption,
  AgentCard,
  StatusLevel,
} from "@/app/sandboxes/miles-proto-2/_lib/agent-types";

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
  const icon = action.icon ?? DEFAULT_ICON_FOR_STYLE[action.style] ?? "none";
  const detailColor =
    action.style === "primary" ? "text-blue-400" : "text-neutral-400";

  return (
    <button
      type="button"
      onClick={onClick}
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

          {card.rows && card.rows.length > 0 && (
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
          )}
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
