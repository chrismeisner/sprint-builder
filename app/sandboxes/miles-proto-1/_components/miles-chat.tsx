"use client";

import { Overlay } from "@/app/sandboxes/miles-proto-1/_components/overlay";
import { useCallback, useEffect, useRef, useState } from "react";

interface MilesChatProps {
  open: boolean;
  onClose: () => void;
}

type Message = { role: "assistant" | "user"; text: string };
type Exchange = { user: string; assistant: string };

const GREETING =
  "Hey Chris! I\u2019m Miles, your driving assistant. I can help you understand your trips, vehicle health, and driving patterns. What can I help with?";

const CONVERSATIONS: { label: string; exchanges: Exchange[] }[] = [
  {
    label: "How was my driving this week?",
    exchanges: [
      {
        user: "How was my driving this week?",
        assistant:
          "You drove 38.6 miles across 4 trips this week. Tuesday was your busiest day with 2 trips. That\u2019s about 12% less than last week \u2014 mostly from fewer errands on weekdays.",
      },
      {
        user: "Any tips to improve?",
        assistant:
          "Your commute is really consistent \u2014 14 minutes on average. One thing: you had a couple of hard braking events on Thursday. Leaving a little more following distance at highway speed could smooth that out. Overall though, nice work.",
      },
      {
        user: "What\u2019s my best trip this week?",
        assistant:
          "Wednesday morning \u2014 Home to Work, 7.1 miles, zero hard braking, smooth acceleration throughout. That\u2019s your cleanest drive of the week.",
      },
      {
        user: "Am I driving more or less than average?",
        assistant:
          "A bit less. Over the past month you average about 45 miles per week. This week\u2019s 38.6 is on the lighter side \u2014 probably the weekend where you barely drove at all.",
      },
    ],
  },
  {
    label: "How\u2019s my car doing?",
    exchanges: [
      {
        user: "How\u2019s my car doing?",
        assistant:
          "Your Civic is in good shape. Two things to keep in mind:\n\n\u2022 Fuel is around 34% \u2014 you\u2019ve got a couple days before you\u2019ll want to fill up.\n\u2022 Based on your mileage, you\u2019re about 400 miles from your next recommended oil change.",
      },
      {
        user: "Where should I get gas?",
        assistant:
          "There\u2019s a Shell station 0.4 miles from your usual route home \u2014 that\u2019s the closest to your commute. There\u2019s also a Costco about 2 miles out if you want to save a bit per gallon.",
      },
      {
        user: "Any other maintenance coming up?",
        assistant:
          "Nothing urgent. Your tire rotation is due around 25,000 miles \u2014 you\u2019re at 21,504 now, so maybe 2\u20133 months out at your current pace. I\u2019ll remind you when it\u2019s close.",
      },
      {
        user: "Has the check engine light ever come on?",
        assistant:
          "No check engine codes detected since Miles was installed. Your engine is reading clean across the board. That\u2019s a good sign for a car with 21k miles.",
      },
    ],
  },
  {
    label: "Tell me about my last trip",
    exchanges: [
      {
        user: "Tell me about my last trip",
        assistant:
          "Your last trip was today at 8:14 AM \u2014 Home to Work. 7.2 miles, 14 minutes. No hard braking or rapid acceleration. Smooth ride.",
      },
      {
        user: "How does that compare to usual?",
        assistant:
          "Pretty typical. Your Home \u2192 Work trips average 7.1 miles and 14 minutes over the past two weeks. Today was right in line \u2014 no surprises.",
      },
      {
        user: "What route did I take?",
        assistant:
          "You took Main St to the highway, then exited on Elm. Same route as most days. Miles logged the full path \u2014 you can see it on the trip detail screen.",
      },
      {
        user: "Did I drive well?",
        assistant:
          "Yep \u2014 smooth from start to finish. No hard braking, no rapid acceleration, consistent speed on the highway. It\u2019s one of your better commutes this week.",
      },
    ],
  },
];

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-md bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block size-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500"
            style={{
              animation: "miles-typing 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function MilesChat({ open, onClose }: MilesChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [convoIndex, setConvoIndex] = useState<number | null>(null);
  const [exchangePos, setExchangePos] = useState(0);
  const [typing, setTyping] = useState(false);
  const [settledCount, setSettledCount] = useState(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    setMessages([]);
    setConvoIndex(null);
    setExchangePos(0);
    setTyping(false);
    setSettledCount(0);
    if (typingTimer.current) clearTimeout(typingTimer.current);
  }, []);

  useEffect(() => {
    if (open) {
      reset();
      setMessages([{ role: "assistant", text: GREETING }]);
    } else {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      const t = setTimeout(reset, 300);
      return () => clearTimeout(t);
    }
  }, [open, reset]);

  useEffect(() => {
    if (messages.length > settledCount) {
      const t = setTimeout(() => setSettledCount(messages.length), 50);
      return () => clearTimeout(t);
    }
  }, [messages.length, settledCount]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, typing]);

  function queueAssistantReply(text: string, nextPos: number) {
    setTyping(true);
    typingTimer.current = setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { role: "assistant", text }]);
      setExchangePos(nextPos);
    }, 1400);
  }

  function pickConversation(index: number) {
    const exchange = CONVERSATIONS[index].exchanges[0];
    setConvoIndex(index);
    setMessages((prev) => [...prev, { role: "user", text: exchange.user }]);
    setTimeout(() => queueAssistantReply(exchange.assistant, 1), 300);
  }

  function sendNextMessage() {
    if (convoIndex === null || typing) return;
    const convo = CONVERSATIONS[convoIndex];
    if (exchangePos >= convo.exchanges.length) return;
    const exchange = convo.exchanges[exchangePos];
    setMessages((prev) => [...prev, { role: "user", text: exchange.user }]);
    setTimeout(() => queueAssistantReply(exchange.assistant, exchangePos + 1), 300);
  }

  const showChips = convoIndex === null && messages.length > 0;
  const convo = convoIndex !== null ? CONVERSATIONS[convoIndex] : null;
  const hasMore = convo !== null && exchangePos < convo.exchanges.length;
  const nextUserText = hasMore ? convo!.exchanges[exchangePos].user : null;
  const conversationDone = convo !== null && !hasMore && !typing;

  return (
    <>
      {/* Typing dots animation */}
      <style>{`
        @keyframes miles-typing {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>

      <Overlay open={open} onClose={onClose} z="z-20">
        <div
          className={`fixed bottom-0 left-1/2 flex w-full -translate-x-1/2 flex-col rounded-t-md border-t border-neutral-200 bg-white shadow-xl motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out dark:border-neutral-700 dark:bg-neutral-900 ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
          style={{
            maxWidth: "var(--frame-width, 100%)",
            height: "calc(85dvh)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-green-600">
                <svg className="size-4 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
              </div>
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Miles
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-md text-neutral-400 motion-safe:transition-colors motion-safe:duration-150 hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Close Miles assistant"
            >
              <svg className="size-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4"
          >
            <div className="flex flex-col gap-4">
              {messages.map((msg, i) => {
                const isEntering = i >= settledCount;
                return (
                  <div
                    key={i}
                    className={`flex motion-safe:transition-opacity motion-safe:duration-300 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    } ${isEntering ? "opacity-0" : "opacity-100"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-md px-3 py-2 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white dark:bg-blue-500"
                          : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                      }`}
                    >
                      <p className="whitespace-pre-line text-sm font-normal leading-normal">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              })}

              {typing && <TypingIndicator />}
            </div>

            {/* Suggestion chips — shown after greeting */}
            {showChips && (
              <div className={`mt-4 flex flex-col gap-2 motion-safe:transition-opacity motion-safe:duration-300 ${settledCount > 0 ? "opacity-100" : "opacity-0"}`}>
                {CONVERSATIONS.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickConversation(i)}
                    className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-left text-sm font-medium leading-normal text-blue-700 motion-safe:transition-colors motion-safe:duration-150 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-neutral-200 px-4 pb-20 pt-3 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <div className="flex h-10 flex-1 items-center rounded-md border border-neutral-300 bg-neutral-50 px-3 dark:border-neutral-600 dark:bg-neutral-800">
                <span className="truncate text-sm font-normal leading-normal text-neutral-400 dark:text-neutral-500">
                  {typing
                    ? "Miles is typing\u2026"
                    : nextUserText ?? "Ask Miles anything\u2026"}
                </span>
              </div>
              <button
                type="button"
                onClick={sendNextMessage}
                disabled={!hasMore || typing}
                className={`flex size-10 shrink-0 items-center justify-center rounded-md text-white motion-safe:transition-opacity motion-safe:duration-150 ${
                  hasMore && !typing
                    ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    : "bg-blue-600 opacity-40 dark:bg-blue-500"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                aria-label="Send message"
              >
                <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Overlay>
    </>
  );
}
