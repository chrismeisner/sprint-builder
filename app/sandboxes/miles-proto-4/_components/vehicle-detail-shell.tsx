"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface VehicleDetailShellProps {
  /** Centered title in the nav bar. Omit to render a title-less nav (back chevron only). */
  title?: string;
  /** Optional eyebrow shown above the title (e.g. "Vehicle · 2015 RAM 2500"). */
  eyebrow?: string;
  /** Optional trailing action rendered top-right (e.g. an Edit button). */
  trailing?: ReactNode;
  children: ReactNode;
}

/**
 * iOS-style push detail screen.
 *
 *  - Sticky top nav bar with safe-area inset, back chevron, and centered title.
 *  - Back chevron triggers router.back().
 *  - The slide-in-from-right animation is handled at the route level by
 *    PageTransition, so the shell itself does not animate.
 */
export function VehicleDetailShell({ title, eyebrow, trailing, children }: VehicleDetailShellProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <header
        className="sticky top-0 z-20 flex flex-col bg-white/90 backdrop-blur-md"
        style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
      >
        <div className="grid h-11 grid-cols-[1fr_auto_1fr] items-center px-2">
          <div className="justify-self-start">
            <button
              type="button"
              onClick={() => router.back()}
              className="-ml-1 flex h-11 items-center gap-0.5 rounded-lg px-2 text-semantic-info active:opacity-60"
              aria-label="Back"
            >
              <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-base">Back</span>
            </button>
          </div>
          <div className="flex flex-col items-center text-center leading-tight">
            {eyebrow && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                {eyebrow}
              </span>
            )}
            {title && (
              <span className="truncate text-base font-semibold text-neutral-900">{title}</span>
            )}
          </div>
          <div className="justify-self-end pr-2">{trailing}</div>
        </div>
        <div className="h-px bg-neutral-200/80" />
      </header>

      <main className="flex flex-1 flex-col px-5 py-5">{children}</main>
    </div>
  );
}
