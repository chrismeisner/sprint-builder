"use client";

import { useMilesSheet } from "@/app/sandboxes/miles-proto-4/_components/miles-sheet";
import { SymbolIcon } from "@/app/sandboxes/miles-proto-4/_components/symbol-icon";

/**
 * AskMilesBadge — entry point that hands a page or section's context off to
 * the Miles agent. Tapping it opens the global Miles half-sheet (medium
 * detent), where the matching entry in CONTEXTS (see _lib/agent-data.ts)
 * drives the greeting and suggested prompts.
 *
 * The bottom-nav Miles tab is unchanged — that still navigates to the full
 * /miles page. Both surfaces render the same <MilesChat /> component.
 *
 * Iterate from here:
 *   - add `label` to render an inline pill
 *   - add `size` if we need a larger affordance for hero placements
 *   - add `tone` if we want non-green variants
 *   - accept a `detent` prop if some entry points should open expanded
 */
export function AskMilesBadge({
  context,
  ariaLabel = "Ask Miles about this",
  label = "Ask Miles",
  className = "",
}: {
  context: string;
  ariaLabel?: string;
  /** Override the badge copy. Defaults to "Ask Miles". */
  label?: string;
  className?: string;
}) {
  const { openMilesSheet } = useMilesSheet();

  return (
    <button
      type="button"
      onClick={() => openMilesSheet(context)}
      aria-label={ariaLabel}
      data-ask-miles-context={context}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 motion-safe:transition-colors hover:bg-green-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60 ${className}`}
    >
      <SymbolIcon name="auto_awesome" size="sm" filled className="text-green-700 dark:text-green-300" />
      {label}
    </button>
  );
}
