"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { useState } from "react";
import { StickyFooter } from "@/app/sandboxes/miles-proto-1/_components/sticky-footer";

type Phase = "found" | "not-found";

export default function BillingPage() {
  const [phase, setPhase] = useState<Phase>("found");

  if (phase === "found") return <PaymentFoundScreen onSwitchPath={() => setPhase("not-found")} />;
  return <AddPaymentScreen onSwitchPath={() => setPhase("found")} />;
}

/* ─── Path A: Payment Found ─── */
function PaymentFoundScreen({ onSwitchPath }: { onSwitchPath: () => void }) {
  const [authorized, setAuthorized] = useState(false);

  return (
    <>
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Start your free trial
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Try Miles free for 21 days. You won&rsquo;t be charged until your trial ends.
          </p>
        </div>

        {/* Card on file */}
        <div className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-neutral-200 dark:bg-neutral-700">
              <svg className="size-5 text-neutral-600 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
              </svg>
            </div>
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  Visa ending in 4242
                </span>
                <span className="text-xs font-normal leading-none text-neutral-500 dark:text-neutral-500">
                  Expires 09/28
                </span>
              </div>
              <button
                type="button"
                onClick={onSwitchPath}
                className="shrink-0 text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        {/* Trial info */}
        <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <svg className="size-5 shrink-0 text-green-700 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-normal text-green-700 dark:text-green-400">
              21-day trial starts when Miles is activated
            </p>
            <p className="text-xs font-normal leading-normal text-green-600 dark:text-green-300">
              Cancel anytime before the trial ends and you won&rsquo;t be charged.
            </p>
          </div>
        </div>

        {/* Authorization checkbox */}
        <div className="flex items-start gap-3">
          <input
            id="authorize-found"
            type="checkbox"
            checked={authorized}
            onChange={(e) => setAuthorized(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600"
          />
          <label
            htmlFor="authorize-found"
            className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400"
          >
            I authorize Miles to charge Visa ending in 4242 for my subscription after the trial ends.
          </label>
        </div>

      </div>
    </main>

    <StickyFooter>
      <Link
        href="/dashboard?state=empty&welcome=1"
        className={`flex h-12 w-full items-center justify-center rounded-md px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
          authorized
            ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            : "bg-blue-300 cursor-not-allowed pointer-events-none dark:bg-blue-800"
        }`}
        aria-disabled={!authorized}
        tabIndex={authorized ? undefined : -1}
        >
        Start free trial
      </Link>
    </StickyFooter>
    </>
  );
}

/* ─── Path B: Add Payment ─── */
function AddPaymentScreen({ onSwitchPath }: { onSwitchPath: () => void }) {
  const [authorized, setAuthorized] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  function handleCardNumber(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
  }

  function handleExpiry(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      setExpiry(`${digits.slice(0, 2)} / ${digits.slice(2)}`);
    } else if (digits.length === 2 && expiry.length < 4) {
      setExpiry(`${digits} / `);
    } else {
      setExpiry(digits);
    }
  }

  function handleCvc(raw: string) {
    setCvc(raw.replace(/\D/g, "").slice(0, 3));
  }

  return (
    <>
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Start your free trial
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Try Miles free for 21 days. You won&rsquo;t be charged until your trial ends.
          </p>
        </div>

        {/* Mock card form */}
        <div className="flex flex-col gap-4">
          {/* Card number */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="card-number"
              className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
            >
              Card number
            </label>
            <input
              id="card-number"
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => handleCardNumber(e.target.value)}
              className="h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-none text-neutral-900 placeholder:text-neutral-400 motion-safe:transition-colors motion-safe:duration-150 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400"
            />
          </div>

          {/* Expiry + CVC row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="card-expiry"
                className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
              >
                Expiry
              </label>
              <input
                id="card-expiry"
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM / YY"
                value={expiry}
                onChange={(e) => handleExpiry(e.target.value)}
                className="h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-none text-neutral-900 placeholder:text-neutral-400 motion-safe:transition-colors motion-safe:duration-150 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="card-cvc"
                className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
              >
                CVC
              </label>
              <input
                id="card-cvc"
                type="text"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                value={cvc}
                onChange={(e) => handleCvc(e.target.value)}
                className="h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-none text-neutral-900 placeholder:text-neutral-400 motion-safe:transition-colors motion-safe:duration-150 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Trial reassurance */}
        <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <svg className="size-5 shrink-0 text-green-700 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-normal text-green-700 dark:text-green-400">
              21-day trial starts when Miles is activated
            </p>
            <p className="text-xs font-normal leading-normal text-green-600 dark:text-green-300">
              Cancel anytime before the trial ends and you won&rsquo;t be charged.
            </p>
          </div>
        </div>

        {/* Authorization checkbox */}
        <div className="flex items-start gap-3">
          <input
            id="authorize-add"
            type="checkbox"
            checked={authorized}
            onChange={(e) => setAuthorized(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600"
          />
          <label
            htmlFor="authorize-add"
            className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400"
          >
            I authorize Miles to charge this card for my subscription after the trial ends.
          </label>
        </div>

        {/* Path toggle for testing */}
        <button
          type="button"
          onClick={onSwitchPath}
          className="text-xs font-normal leading-normal text-neutral-400 underline underline-offset-2 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400"
        >
          Test: simulate &ldquo;payment on file&rdquo;
        </button>
      </div>
    </main>

    <StickyFooter>
      <Link
        href="/dashboard?state=empty&welcome=1"
        className={`flex h-12 w-full items-center justify-center rounded-md px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
          authorized
            ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            : "bg-blue-300 cursor-not-allowed pointer-events-none dark:bg-blue-800"
        }`}
        aria-disabled={!authorized}
        tabIndex={authorized ? undefined : -1}
      >
        Start free trial
      </Link>
      <Link
        href="/dashboard?state=empty&welcome=1"
        className="flex h-10 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
      >
        Do this later
      </Link>
    </StickyFooter>
    </>
  );
}
