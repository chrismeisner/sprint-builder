"use client";

import { useState, useEffect, useRef } from "react";

import type {
  ActionOption,
  AgentCard,
  ChatMessage,
} from "@/app/sandboxes/miles-proto-3/_lib/agent-types";
import {
  CONTEXTS,
  PENDING_ITEMS,
  getAgentResponse,
} from "@/app/sandboxes/miles-proto-3/_lib/agent-data";
import {
  AgentBubble,
  AgentCardView,
  SuggestedPrompts,
  UserBubble,
} from "@/app/sandboxes/miles-proto-3/_components/agent-card";

/* ── Stage timing tunables ─────────────────────────────────────────────
   Tune these to taste — they shape the perceived "feel" of the agent.   */
const THINKING_MS = 700; // typing dots before tokens start
const WORD_MS = 60; // ms per word during streaming reveal
const INTER_MESSAGE_MS = 250; // pause between sequential agent messages

/* ── Awaiting-input field labels ──────────────────────────────────────
   Maps awaitingFor keys (set by ActionOption.response.awaitingFor or
   ResponseRule.awaitingFor in agent-data.ts) to human-readable phrases
   used in the confirmation reply and composer placeholder.            */
const AWAITING_LABELS: Record<string, string> = {
  "first-name": "first name",
  "last-name": "last name",
  name: "name",
  email: "email",
  phone: "phone number",
  "date-of-birth": "date of birth",
};

function awaitingLabel(key: string): string {
  return AWAITING_LABELS[key] ?? key.replace(/-/g, " ");
}

/* ── Internal display model ────────────────────────────────────────────
   Richer than the public ChatMessage shape so we can track per-message
   stage state without polluting agent-data or the ChatMessage type.     */
type DisplayMessage =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "agent";
      text: string;
      subtext?: string;
      status: "pending" | "streaming" | "done";
      revealedWords: number;
    }
  | {
      id: string;
      role: "agent-card";
      card: AgentCard;
      status: "pending" | "done";
    };

let _id = 0;
const nextId = () => String(++_id);

function toDisplay(msg: ChatMessage): DisplayMessage {
  if (msg.role === "user") return { id: nextId(), role: "user", text: msg.text };
  if (msg.role === "agent")
    return {
      id: nextId(),
      role: "agent",
      text: msg.text,
      subtext: msg.subtext,
      status: "pending",
      revealedWords: 0,
    };
  return { id: nextId(), role: "agent-card", card: msg.card, status: "pending" };
}

// Seed a DisplayMessage in `done` status — used to restore a saved thread
// without re-running the typing animation.
function seedDoneDisplay(msg: ChatMessage): DisplayMessage {
  if (msg.role === "user") return { id: nextId(), role: "user", text: msg.text };
  if (msg.role === "agent") {
    const total = msg.text.split(/\s+/).filter(Boolean).length;
    return {
      id: nextId(),
      role: "agent",
      text: msg.text,
      subtext: msg.subtext,
      status: "done",
      revealedWords: total,
    };
  }
  return { id: nextId(), role: "agent-card", card: msg.card, status: "done" };
}

// Convert a DisplayMessage back to its public ChatMessage shape — used to
// publish chat state up to the provider for save/resume.
function toChatMessage(d: DisplayMessage): ChatMessage {
  if (d.role === "user") return { role: "user", text: d.text };
  if (d.role === "agent") return { role: "agent", text: d.text, subtext: d.subtext };
  return { role: "agent-card", card: d.card };
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error("aborted"));
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("aborted"));
    });
  });
}

/**
 * MilesChat — pure chat surface with simulated agent stages
 * (pending → streaming → done) so the prototype reads like a real LLM
 * chat: thinking dots, word-by-word reveal, blinking caret, follow-ups
 * staggered after the response settles.
 *
 * Used by both the full /miles tab and the half-sheet.
 */
export function MilesChat({
  context = "home",
  initialMessages,
  onMessagesChange,
  onUserInteraction,
}: {
  context?: string;
  /** Seed display from a previously saved thread instead of replaying the greeting. */
  initialMessages?: ChatMessage[];
  /** Notifies the parent on every display change so it can snapshot for save/resume. */
  onMessagesChange?: (messages: ChatMessage[]) => void;
  /**
   * Fires the first time the user does something — taps an action card,
   * sends a prompt, or types into the composer. The sheet wrapper uses
   * this to auto-expand from medium to large detent: as soon as the
   * user commits to interacting, give them the full height to work in.
   */
  onUserInteraction?: () => void;
}) {
  const config = CONTEXTS[context] ?? CONTEXTS.home;

  const [display, setDisplay] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingIndex, setPendingIndex] = useState(0);
  const [cardResolved, setCardResolved] = useState(false);
  // When non-null, the chat is "awaiting input" — the user's next
  // free-text message is treated as the answer to whatever the last
  // agent action / response rule asked for. See AWAITING_LABELS for
  // how each key maps to a confirmation phrase.
  const [awaitingFor, setAwaitingFor] = useState<string | null>(null);
  // When non-null, replaces the suggested-prompts chip set with this
  // narrower list — set by a ResponseRule.nextPrompts. Persists until
  // a future rule overrides it again or the context changes.
  const [promptsOverride, setPromptsOverride] = useState<string[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isHomeCtx = context === "home";
  const isColdCtx = context === "cold";
  const isDefaultCtx = isColdCtx || isHomeCtx;

  const isBusy = display.some(
    (d) =>
      (d.role === "agent" && d.status !== "done") ||
      (d.role === "agent-card" && d.status !== "done")
  );

  const pending =
    isColdCtx && pendingIndex < PENDING_ITEMS.length
      ? PENDING_ITEMS[pendingIndex]
      : null;

  const hasActions = config.card?.actions && config.card.actions.length > 0;

  // Show suggested prompts when the agent has settled, no proactive
  // card is awaiting a response, and any context card with actions has
  // been resolved. Prompts resurface after each agent turn so the
  // user always has a next step.
  const showPrompts =
    !isBusy &&
    !pending &&
    (isDefaultCtx || !hasActions || cardResolved);

  // Reset on mount / context change. If a saved thread was passed in
  // via `initialMessages`, seed display in `done` status (no replay).
  // Otherwise queue the greeting + optional context card to play through
  // the standard pending → streaming → done stages.
  useEffect(() => {
    abortRef.current?.abort();
    setPendingIndex(0);
    setCardResolved(false);
    setAwaitingFor(null);
    setPromptsOverride(null);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;

    if (initialMessages && initialMessages.length > 0) {
      setDisplay(initialMessages.map(seedDoneDisplay));
      return;
    }

    setDisplay([]);
    const initialSeq: ChatMessage[] = [
      { role: "agent", text: config.greeting },
    ];
    if (config.card && !isDefaultCtx) {
      initialSeq.push({ role: "agent-card", card: config.card });
    }
    void playSequence(initialSeq);
    // initialMessages is captured intentionally on mount — later changes
    // come via remount (key={context} from the sheet wrapper).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  // Publish display changes upward so the provider can snapshot for
  // save/resume. Maps internal DisplayMessage shape → public ChatMessage.
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(display.map(toChatMessage));
    }
  }, [display, onMessagesChange]);

  // Cancel any in-flight playback on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Auto-scroll: follow streaming as new content arrives. Skip the
  // very first message so a fresh conversation starts at the top
  // instead of auto-scrolling to the bottom of the greeting bubble.
  useEffect(() => {
    if (scrollRef.current && display.length > 1) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [display]);

  function snapInFlightToDone() {
    setDisplay((d) =>
      d.map((x) => {
        if (x.role === "agent" && x.status !== "done") {
          const total = x.text.split(/\s+/).filter(Boolean).length;
          return { ...x, status: "done", revealedWords: total };
        }
        if (x.role === "agent-card" && x.status !== "done") {
          return { ...x, status: "done" };
        }
        return x;
      })
    );
  }

  async function playAgent(id: string, text: string, signal: AbortSignal) {
    await wait(THINKING_MS, signal);
    setDisplay((d) =>
      d.map((x) => (x.id === id && x.role === "agent" ? { ...x, status: "streaming" } : x))
    );
    const total = text.split(/\s+/).filter(Boolean).length;
    for (let i = 1; i <= total; i++) {
      await wait(WORD_MS, signal);
      setDisplay((d) =>
        d.map((x) => (x.id === id && x.role === "agent" ? { ...x, revealedWords: i } : x))
      );
    }
    setDisplay((d) =>
      d.map((x) =>
        x.id === id && x.role === "agent"
          ? { ...x, status: "done", revealedWords: total }
          : x
      )
    );
  }

  async function playCard(id: string, signal: AbortSignal) {
    await wait(THINKING_MS, signal);
    setDisplay((d) =>
      d.map((x) => (x.id === id && x.role === "agent-card" ? { ...x, status: "done" } : x))
    );
  }

  async function playSequence(seq: ChatMessage[]) {
    abortRef.current?.abort();
    snapInFlightToDone();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      // Append all user messages immediately, then process agent messages serially
      const userPart = seq.filter((m) => m.role === "user").map(toDisplay);
      const agentPart = seq.filter((m) => m.role !== "user");
      if (userPart.length) setDisplay((d) => [...d, ...userPart]);
      for (const m of agentPart) {
        if (ac.signal.aborted) return;
        const dm = toDisplay(m);
        setDisplay((d) => [...d, dm]);
        if (dm.role === "agent") await playAgent(dm.id, dm.text, ac.signal);
        else if (dm.role === "agent-card") await playCard(dm.id, ac.signal);
        await wait(INTER_MESSAGE_MS, ac.signal);
      }
    } catch {
      /* aborted — fine */
    }
  }

  function handleActionSelect(action: ActionOption) {
    const seq: ChatMessage[] = [
      { role: "user", text: action.label },
      {
        role: "agent",
        text: action.response.text,
        subtext: action.response.subtext,
      },
      ...(action.response.card
        ? [{ role: "agent-card" as const, card: action.response.card }]
        : []),
    ];
    if (isDefaultCtx) {
      setPendingIndex((i) => i + 1);
    } else {
      setCardResolved(true);
    }
    // Picking a different action overrides any previous awaitingFor.
    setAwaitingFor(action.response.awaitingFor ?? null);
    onUserInteraction?.();
    void playSequence(seq);

    if (action.response.followUpMessages?.length) {
      const delay = action.response.followUpDelay ?? 1500;
      const msgs = action.response.followUpMessages;
      setTimeout(() => {
        void playSequence(msgs);
      }, delay);
    }
  }

  // Build the agent's confirmation when the user types a value while
  // the chat is awaiting input. Stays minimal and form-letter-y for v1
  // — the goal is "agent acknowledged the input," not natural language
  // generation.
  function buildAwaitingConfirmation(key: string, value: string): ChatMessage[] {
    const label = awaitingLabel(key);
    return [
      {
        role: "agent",
        text: `Updated — your ${label} is now "${value}". Anything else you'd like to change?`,
      },
    ];
  }

  function handleSend(text: string) {
    if (!text.trim() || isBusy) return;
    const trimmed = text.trim();
    setInput("");
    onUserInteraction?.();

    if (awaitingFor) {
      // Free-text reply to a previously asked question.
      const userMsg: ChatMessage = { role: "user", text: trimmed };
      const confirmation = buildAwaitingConfirmation(awaitingFor, trimmed);
      setAwaitingFor(null);
      // After a successful update, narrow the suggested prompts to the
      // two natural follow-ups for an applied edit. Faux for now — taps
      // fall through to the fallback agent reply.
      setPromptsOverride(["Undo", "Make another edit", "I'm done"]);
      void playSequence([userMsg, ...confirmation]);
      return;
    }

    const userMsg: ChatMessage = { role: "user", text: trimmed };
    const {
      messages,
      awaitingFor: nextAwaiting,
      nextPrompts,
    } = getAgentResponse(trimmed, context);
    setAwaitingFor(nextAwaiting);
    if (nextPrompts !== null) setPromptsOverride(nextPrompts);
    void playSequence([userMsg, ...messages]);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {/* Stage-related keyframes — defined once at the surface root */}
      <style>{`
        @keyframes mileschat-typing {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-2px); }
        }
        @keyframes mileschat-fadein {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
      >
        {/* The greeting (and context card, when applicable) is queued
            into `display` by the mount effect so it plays through the
            same stages as every other agent turn. */}
        {display.map((d) => {
          if (d.role === "user") return <UserBubble key={d.id} text={d.text} />;
          if (d.role === "agent") return <StreamingAgentBubble key={d.id} message={d} />;
          if (d.role === "agent-card") {
            if (d.status === "pending") return <TypingIndicator key={d.id} />;
            return (
              <FadeIn key={d.id}>
                <AgentCardView card={d.card} onAction={handleActionSelect} />
              </FadeIn>
            );
          }
          return null;
        })}

        {/* Pending proactive cards (cold-context only) are still queued
            outside the display sequence — they're standing offers, not
            chat history, and surface one at a time on user resolution. */}
        {pending && (
          <AgentCardView card={pending.card} onAction={handleActionSelect} />
        )}

        {showPrompts && (
          <SuggestedPrompts
            prompts={promptsOverride ?? config.prompts}
            onSelect={handleSend}
          />
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 bg-white px-5 pb-4 pt-2">
        <div className="relative mx-auto flex max-w-lg items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend(input);
            }}
            placeholder={
              isBusy
                ? "Miles is responding…"
                : awaitingFor
                ? `Enter new ${awaitingLabel(awaitingFor)}…`
                : "Message Miles..."
            }
            disabled={isBusy}
            className="h-11 w-full rounded-full border border-neutral-200 bg-white pl-4 pr-12 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-shadow focus:border-neutral-300 focus:ring-2 focus:ring-green-500/20 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isBusy}
            className="absolute right-1.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-white transition-colors hover:bg-green-700 disabled:opacity-40"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <FadeIn>
      <div className="flex justify-start">
        <div
          className="rounded-2xl bg-neutral-100 px-4 py-3"
          aria-label="Miles is thinking"
          role="status"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="size-1.5 rounded-full bg-neutral-400 motion-safe:[animation:mileschat-typing_1.2s_-0.32s_infinite_ease-in-out]"
            />
            <span
              className="size-1.5 rounded-full bg-neutral-400 motion-safe:[animation:mileschat-typing_1.2s_-0.16s_infinite_ease-in-out]"
            />
            <span
              className="size-1.5 rounded-full bg-neutral-400 motion-safe:[animation:mileschat-typing_1.2s_0s_infinite_ease-in-out]"
            />
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

function StreamingAgentBubble({
  message,
}: {
  message: Extract<DisplayMessage, { role: "agent" }>;
}) {
  if (message.status === "pending") return <TypingIndicator />;

  // Preserve original whitespace in revealed text — split keeps separators.
  const tokens = message.text.split(/(\s+)/);
  const target =
    message.status === "done" ? Number.POSITIVE_INFINITY : message.revealedWords;
  let wordCount = 0;
  const out: string[] = [];
  for (const tok of tokens) {
    const isWord = /\S/.test(tok);
    if (isWord) {
      if (wordCount < target) {
        out.push(tok);
        wordCount++;
      } else {
        break;
      }
    } else if (out.length > 0 && wordCount < target) {
      out.push(tok);
    }
  }
  const visibleText = out.join("");
  const showCaret = message.status === "streaming";

  return (
    <FadeIn>
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl bg-neutral-100 px-4 py-3">
          <p className="text-sm leading-relaxed text-neutral-800">
            {visibleText}
            {showCaret && (
              <span
                aria-hidden
                className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-neutral-500 align-middle"
              />
            )}
          </p>
          {message.status === "done" && message.subtext && (
            <p className="mt-1 text-xs text-neutral-500">{message.subtext}</p>
          )}
        </div>
      </div>
    </FadeIn>
  );
}

function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <div className="motion-safe:[animation:mileschat-fadein_240ms_ease-out_both]">
      {children}
    </div>
  );
}
