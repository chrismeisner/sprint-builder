"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { MilesChat } from "@/app/sandboxes/miles-proto-3/_components/miles-chat";
import type { ChatMessage } from "@/app/sandboxes/miles-proto-3/_lib/agent-types";

/**
 * Miles agent half-sheet — global overlay for scoped agent conversations.
 *
 *  • Two detents: "medium" (~66vh) and "large" (full).
 *  • Tap drag-handle bar to toggle detents (v1 — no real drag yet).
 *  • Expand-to-tab chevron navigates to /miles?context=… and closes the sheet.
 *  • Backdrop / X button / Escape key dismiss. Body scroll is locked while open.
 *  • Each open(...) starts a fresh conversation (MilesChat keys on `context`).
 *
 * Iterate from here:
 *   - real drag-to-resize (pointer events + snap on release)
 *   - per-context dismissal memory (return to prior thread on reopen)
 *   - small / medium / large 3-detent staircase
 */

type Detent = "medium" | "large";

/**
 * A snapshot of an in-progress conversation. Saved when the user
 * navigates away from the sheet via the bottom nav, so the Miles tab
 * can show a "convo in progress" badge dot and resume the thread on
 * tap. Cleared on explicit dismiss (X / backdrop / Escape).
 */
interface SavedThread {
  context: string;
  messages: ChatMessage[];
}

interface MilesSheetState {
  open: boolean;
  context: string;
  detent: Detent;
  savedThread: SavedThread | null;
  openMilesSheet: (context: string, detent?: Detent) => void;
  /**
   * Close the sheet. Pass `{ save: true }` (used by tab nav) to snapshot
   * the current conversation into `savedThread` so it can be resumed
   * from the Miles tab. Default behavior (X / backdrop / Escape) clears
   * any saved thread — explicit dismissal means the user is done.
   */
  closeMilesSheet: (opts?: { save?: boolean }) => void;
  setDetent: (detent: Detent) => void;
  toggleDetent: () => void;
}

const MilesSheetContext = createContext<MilesSheetState | null>(null);

export function useMilesSheet(): MilesSheetState {
  const ctx = useContext(MilesSheetContext);
  if (!ctx) {
    throw new Error("useMilesSheet must be used inside <MilesSheetProvider>");
  }
  return ctx;
}

export function MilesSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<string>("home");
  const [detent, setDetent] = useState<Detent>("medium");
  const [savedThread, setSavedThread] = useState<SavedThread | null>(null);

  // Latest snapshot of the live chat — published from MilesChat via
  // its onMessagesChange prop. We keep this in a ref (not state) so the
  // close handler can read it synchronously without depending on a
  // re-render cycle. The accompanying state mirror is what MilesChat
  // initially seeds with on resume.
  const currentMessagesRef = useRef<ChatMessage[]>([]);
  const handleMessagesChange = useCallback((messages: ChatMessage[]) => {
    currentMessagesRef.current = messages;
  }, []);

  const openMilesSheet = useCallback((nextContext: string, nextDetent: Detent = "medium") => {
    setContext(nextContext);
    setDetent(nextDetent);
    setOpen(true);
  }, []);

  const closeMilesSheet = useCallback(
    (opts?: { save?: boolean }) => {
      if (opts?.save) {
        // Only save if there's been actual user interaction (otherwise
        // the "saved thread" would just be the auto-played greeting,
        // which is misleading as a "convo in progress" signal).
        const messages = currentMessagesRef.current;
        const hasInteraction = messages.some((m) => m.role === "user");
        if (hasInteraction) {
          setSavedThread({ context, messages });
        }
      } else {
        // Explicit dismiss → clear any stored thread.
        setSavedThread(null);
      }
      setOpen(false);
    },
    [context]
  );

  const toggleDetent = useCallback(() => {
    setDetent((d) => (d === "medium" ? "large" : "medium"));
  }, []);

  const value = useMemo(
    () => ({
      open,
      context,
      detent,
      savedThread,
      openMilesSheet,
      closeMilesSheet,
      setDetent,
      toggleDetent,
    }),
    [open, context, detent, savedThread, openMilesSheet, closeMilesSheet, toggleDetent]
  );

  return (
    <MilesSheetContext.Provider value={value}>
      {/* Reserve the scrollbar gutter at all times so the page behind the
          sheet doesn't shift sideways when we toggle body overflow:hidden
          on open. Always-on rather than open-only — toggling it would
          recreate the jitter we're trying to eliminate. */}
      <style>{`html { scrollbar-gutter: stable; }`}</style>
      {children}
      <MilesAgentSheet onMessagesChange={handleMessagesChange} />
    </MilesSheetContext.Provider>
  );
}

function MilesAgentSheet({
  onMessagesChange,
}: {
  onMessagesChange: (messages: ChatMessage[]) => void;
}) {
  const { open, context, detent, savedThread, closeMilesSheet, toggleDetent, setDetent } =
    useMilesSheet();

  // Auto-expand: the first time the user interacts with a half-sheet
  // chat, bump it to large. Anyone interacting with the conversation
  // wants the full height to read and type — the medium detent is for
  // glanceable peeks, not commitments.
  function handleUserInteraction() {
    if (detent === "medium") setDetent("large");
  }
  // Resume a saved thread only if its context matches the one being opened.
  // Otherwise the user has switched scope (different badge), and we want
  // a fresh greeting for the new context.
  const initialMessages =
    savedThread && savedThread.context === context ? savedThread.messages : undefined;

  // Lock body scroll while the sheet is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMilesSheet();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeMilesSheet]);

  // Detent → height. Large fills the available area (capped at the bottom
  // by the nav inset on the container), so the sheet reaches the very top
  // of the viewport when fully expanded.
  const heightClass = detent === "large" ? "h-full" : "h-[66vh]";

  // Apple's UISheetPresentationController curve — snappy on lift, settles soft.
  // Single tunable so the sheet, backdrop, and any inner motion stay in sync.
  const sheetEase = "motion-safe:duration-[380ms] motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]";

  // Backdrop deepens when the sheet expands so "going large" feels more focused.
  const backdropOpacity = !open ? "opacity-0" : detent === "large" ? "opacity-50" : "opacity-30";

  // Pointer-events gate — kept conditional on `open` so the sheet's
  // close transition can play out without the (now invisible) sheet
  // catching stray clicks. The container itself stays in the DOM at
  // all times so the slide-down + fade-out have something to animate.
  const pointerCls = open ? "pointer-events-auto" : "pointer-events-none";

  return (
    <div
      className="pointer-events-none fixed inset-y-0 left-1/2 z-30 flex -translate-x-1/2 flex-col justify-end"
      style={{ width: "var(--frame-width, 100%)", maxWidth: "100%" }}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close Miles"
        onClick={() => closeMilesSheet()}
        tabIndex={open ? 0 : -1}
        className={`absolute inset-0 bg-black motion-safe:transition-opacity ${sheetEase} ${backdropOpacity} ${pointerCls}`}
      />

      {/* Sheet — max-h-full keeps it above the bottom nav even at large detent.
          At large detent we add safe-area-inset-top padding so the drag
          handle and header sit clear of the iOS notch / status bar. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Miles"
        style={{
          paddingTop: detent === "large" ? "env(safe-area-inset-top)" : "0px",
        }}
        className={`relative flex w-full max-h-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl motion-safe:transition-[transform,height,border-radius,padding] motion-safe:[will-change:transform,height] ${sheetEase} ${heightClass} ${pointerCls} ${
          open ? "translate-y-0" : "translate-y-full"
        } ${detent === "large" ? "rounded-t-xl" : "rounded-t-2xl"}`}
      >
        {/* Drag handle — tap to toggle detent */}
        <button
          type="button"
          aria-label={detent === "medium" ? "Expand sheet" : "Collapse sheet"}
          onClick={toggleDetent}
          className="group flex shrink-0 items-center justify-center pb-1 pt-2 focus-visible:outline-none"
        >
          <span
            className={`block h-1.5 rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-[380ms] motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-neutral-400 ${
              detent === "large" ? "w-8 bg-neutral-200" : "w-10 bg-neutral-300"
            }`}
          />
        </button>

        {/* Header — sparkle avatar + title + actions */}
        <div className="flex shrink-0 items-center gap-3 border-b border-neutral-100 px-5 pb-3 pt-1">
          <div className="flex size-7 items-center justify-center rounded-full bg-green-600">
            <svg
              className="size-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
              />
            </svg>
          </div>
          <span className="flex-1 text-sm font-semibold text-neutral-900">Ask Miles</span>

          <button
            type="button"
            onClick={() => closeMilesSheet()}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-full text-neutral-400 motion-safe:transition-colors hover:bg-neutral-100 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat — keyed on context so reopen with a new scope resets state.
            The bottom padding pushes the composer up above the bottom nav
            so the sheet's white background tucks under the nav while the
            composer remains visible above it. */}
        <div
          className="flex min-h-0 flex-1 flex-col"
          style={{ paddingBottom: "var(--miles-bottom-inset, 0px)" }}
        >
          {open ? (
            <MilesChat
              key={context}
              context={context}
              initialMessages={initialMessages}
              onMessagesChange={onMessagesChange}
              onUserInteraction={handleUserInteraction}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
