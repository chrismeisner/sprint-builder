"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import type { ActionOption, ChatMessage } from "@/app/sandboxes/miles-proto-3/_lib/agent-types";
import { CONTEXTS, PENDING_ITEMS, getAgentResponse } from "@/app/sandboxes/miles-proto-3/_lib/agent-data";
import {
  AgentBubble,
  AgentCardView,
  SuggestedPrompts,
  UserBubble,
} from "@/app/sandboxes/miles-proto-3/_components/agent-card";

/* ------------------------------------------------------------------ */
/*  Agent page                                                         */
/* ------------------------------------------------------------------ */

function AgentContent() {
  const searchParams = useSearchParams();
  const contextKey = searchParams.get("context") || "home";
  const config = CONTEXTS[contextKey] ?? CONTEXTS.home;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingIndex, setPendingIndex] = useState(0);
  const [promptsUsed, setPromptsUsed] = useState(false);
  const [cardResolved, setCardResolved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isHomeCtx = contextKey === "home";
  const isColdCtx = contextKey === "cold";
  const isDefaultCtx = isColdCtx || isHomeCtx;

  // Pending proactive cards only in "cold" context, not the clean "home" welcome
  const pending =
    isColdCtx && pendingIndex < PENDING_ITEMS.length
      ? PENDING_ITEMS[pendingIndex]
      : null;

  const hasActions = config.card?.actions && config.card.actions.length > 0;
  const showContextCard =
    !isDefaultCtx && config.card && (!hasActions || !cardResolved);

  const noPendingCards = !isColdCtx || pendingIndex >= PENDING_ITEMS.length;
  const showPrompts =
    !promptsUsed &&
    messages.length === 0 &&
    !pending &&
    !(!isDefaultCtx && hasActions && !cardResolved) &&
    (noPendingCards || !isDefaultCtx);

  useEffect(() => {
    setMessages([]);
    setPendingIndex(0);
    setPromptsUsed(false);
    setCardResolved(false);
  }, [contextKey]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleActionSelect(action: ActionOption) {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: action.label },
      {
        role: "agent",
        text: action.response.text,
        subtext: action.response.subtext,
      },
      ...(action.response.card
        ? [{ role: "agent-card" as const, card: action.response.card }]
        : []),
    ]);
    if (isDefaultCtx) {
      setPendingIndex((i) => i + 1);
    } else {
      setCardResolved(true);
    }
    // Async follow-up messages (e.g. trip completion arriving after a delay)
    if (action.response.followUpMessages?.length) {
      const delay = action.response.followUpDelay ?? 1500;
      const msgs = action.response.followUpMessages;
      setTimeout(() => {
        setMessages((prev) => [...prev, ...msgs]);
      }, delay);
    }
  }

  function handleSend(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: "user", text };
    const responses = getAgentResponse(text, contextKey);
    setMessages((prev) => [...prev, userMsg, ...responses]);
    setInput("");
    setPromptsUsed(true);
  }

  return (
    <main className="flex flex-1 min-h-0 flex-col bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-neutral-100 px-5 pb-4 pt-14">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
            <svg
              className="size-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
              />
            </svg>
          </div>
          <div className="flex flex-1 flex-col">
            <h1 className="text-lg font-semibold text-neutral-900">Miles</h1>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        <AgentBubble text={config.greeting} />

        {/* Info-only card (no actions) — shown before any interaction */}
        {showContextCard && !hasActions && messages.length === 0 && (
          <AgentCardView card={config.card!} />
        )}

        {/* Chat history */}
        {messages.map((msg, i) => {
          if (msg.role === "user") return <UserBubble key={i} text={msg.text} />;
          if (msg.role === "agent")
            return (
              <AgentBubble key={i} text={msg.text} subtext={msg.subtext} />
            );
          if (msg.role === "agent-card")
            return <AgentCardView key={i} card={msg.card} onAction={handleActionSelect} />;
          return null;
        })}

        {/* Action card for non-cold contexts */}
        {showContextCard && hasActions && (
          <AgentCardView
            card={config.card!}
            onAction={handleActionSelect}
          />
        )}

        {/* Pending action card for cold context */}
        {pending && (
          <AgentCardView
            card={pending.card}
            onAction={handleActionSelect}
          />
        )}

        {/* Suggested prompts */}
        {showPrompts && (
          <SuggestedPrompts prompts={config.prompts} onSelect={handleSend} />
        )}
        {messages.length > 0 && (
          <SuggestedPrompts prompts={config.prompts} onSelect={handleSend} />
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-neutral-100 bg-white px-5 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            placeholder="Ask Miles anything..."
            className="h-10 flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-shadow focus:border-neutral-300 focus:ring-2 focus:ring-green-500/20"
          />
          <button
            type="button"
            onClick={() => handleSend(input)}
            disabled={!input.trim()}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white transition-colors hover:bg-green-700 disabled:opacity-40"
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
    </main>
  );
}

export default function MilesAgentPage() {
  return (
    <Suspense>
      <AgentContent />
    </Suspense>
  );
}
