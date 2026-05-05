"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

/**
 * Page transition wrapper.
 *
 * iOS mapping:
 *   • Detail routes (e.g. /vehicle, /vehicles/*) → NavigationStack push:
 *     slide in from the trailing edge (translateX 100% → 0) with iOS-style
 *     easing.
 *   • All other routes → cross-fade.
 *
 * Pop direction (back/forward) is detected via the popstate event, so
 * tapping the back chevron / browser back doesn't replay the push slide-in
 * (which read as a forward push). Pop falls back to a fade — Next.js
 * doesn't keep the leaving page mounted, so a true iOS pop with parallax
 * would require manual route-stack management.
 */

const PUSH_ROUTES = [
  "/sandboxes/miles-proto-4/vehicle",
  "/sandboxes/miles-proto-4/vehicles",
];

/* Module-scoped flag flipped by popstate. The next render of
   PageTransition consumes it (and resets it) so back/forward navigation
   skips the slide-in animation. */
let pendingPop = false;
if (typeof window !== "undefined" && !(window as unknown as { __mp4PopBound?: boolean }).__mp4PopBound) {
  window.addEventListener("popstate", () => {
    pendingPop = true;
  });
  (window as unknown as { __mp4PopBound?: boolean }).__mp4PopBound = true;
}

function FadeIn({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col motion-safe:transition-opacity motion-safe:duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

function SlideInFromRight({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col motion-safe:transition-transform motion-safe:duration-[380ms] motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)] ${
        visible ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ willChange: "transform" }}
    >
      {children}
    </div>
  );
}

function isPushRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUSH_ROUTES.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`) || pathname.startsWith(`${base}?`)
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isBackNav = pendingPop;
  if (pendingPop) pendingPop = false;

  const Wrapper = isPushRoute(pathname) && !isBackNav ? SlideInFromRight : FadeIn;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-clip">
      <Wrapper key={pathname}>
        {children}
      </Wrapper>
    </div>
  );
}
