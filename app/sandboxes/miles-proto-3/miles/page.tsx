"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { MilesChat } from "@/app/sandboxes/miles-proto-3/_components/miles-chat";

/**
 * Full-tab Miles chat. Reuses <MilesChat /> verbatim (the same component
 * the half-sheet renders), wrapped in the same slide-up entrance the
 * sheet uses so both surfaces feel like one pattern.
 *
 * Tunables — keep in sync with miles-sheet.tsx's `sheetEase`:
 *   duration  = 380ms
 *   easing    = cubic-bezier(0.32, 0.72, 0, 1)   // Apple sheet curve
 */
function AgentContent() {
  const searchParams = useSearchParams();
  const context = searchParams.get("context") || "home";

  return (
    <>
      <style>{`
        @keyframes miles-tab-slideup {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
      <div className="flex min-h-0 flex-1 flex-col motion-safe:[animation:miles-tab-slideup_380ms_cubic-bezier(0.32,0.72,0,1)_both]">
        <MilesChat context={context} />
      </div>
    </>
  );
}

export default function MilesAgentPage() {
  return (
    <Suspense>
      <AgentContent />
    </Suspense>
  );
}
