"use client";

import { type ReactNode } from "react";
import { useMilesSheet } from "@/app/sandboxes/miles-proto-4/_components/miles-sheet";
import { SymbolIcon } from "@/app/sandboxes/miles-proto-4/_components/symbol-icon";
import { useLocalStorageState } from "@/app/sandboxes/miles-proto-4/_lib/use-local-storage-state";

/**
 * Reusable "From Miles" insight card. Tinted in the Miles green palette
 * (matches AskMilesBadge), with a ✨ glyph + eyebrow, body content, an
 * optional "Tell me more" CTA that hands a context string off to the
 * Miles sheet, and a trailing dismiss button. Dismissed state persists
 * per `id` via localStorage so the user only sees it once until reset.
 *
 * iOS analogue: a `GroupBox` / custom card with `.transition` + a
 * `@AppStorage("miles-card-<id>-dismissed")` flag.
 */
interface MilesCardProps {
  /** Stable id used to persist the dismissed state for this specific card. */
  id: string;
  body: ReactNode;
  /** When set, renders the CTA and opens the Miles sheet with this context on tap. */
  ctaContext?: string;
  /** Override the CTA copy; defaults to "Tell me more". */
  ctaLabel?: string;
}

export function MilesCard({ id, body, ctaContext, ctaLabel = "Tell me more" }: MilesCardProps) {
  const [dismissed, setDismissed] = useLocalStorageState<boolean>(
    `miles-proto-4-miles-card-dismissed-${id}`,
    false
  );
  const { openMilesSheet } = useMilesSheet();

  if (dismissed) return null;

  return (
    <div className="relative rounded-2xl border border-green-100 bg-green-50 p-4">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full text-green-700 transition-colors active:bg-green-100"
      >
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
        </svg>
      </button>
      <div className="flex flex-col gap-1.5 pr-7">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-green-700">
          <SymbolIcon name="auto_awesome" size="sm" filled className="text-green-700" />
          From Miles
        </span>
        <div className="font-mono text-sm leading-relaxed text-neutral-800">{body}</div>
        {ctaContext && (
          <button
            type="button"
            onClick={() => openMilesSheet(ctaContext)}
            className="mt-1 inline-flex items-center gap-1 self-start text-sm font-medium text-green-700 transition-opacity active:opacity-60"
          >
            {ctaLabel}
            <svg
              className="size-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden
            >
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
