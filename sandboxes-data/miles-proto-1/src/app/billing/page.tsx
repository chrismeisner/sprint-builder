"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Phase = "checking" | "found" | "not-found";

export default function BillingPage() {
  const [phase, setPhase] = useState<Phase>("checking");

  /* Simulate a brief lookup, then let the user pick a path */
  useEffect(() => {
    const timer = setTimeout(() => {
      /* Default to "found" — swap to "not-found" to test the other path */
      setPhase("found");
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (phase === "checking") return <CheckingScreen />;
  if (phase === "found") return <PaymentFoundScreen onSwitchPath={() => setPhase("not-found")} />;
  return <AddPaymentScreen onSwitchPath={() => setPhase("found")} />;
}

/* ─── Phase 0: Checking ─── */
function CheckingScreen() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="flex flex-col items-center gap-6">
        {/* Spinner */}
        <div className="size-10 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400" />
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-lg font-medium leading-snug text-neutral-900 dark:text-neutral-100">
            Checking your purchase&hellip;
          </h1>
          <p className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
            This only takes a moment.
          </p>
        </div>
      </div>
    </main>
  );
}

/* ─── Path A: Payment Found ─── */
function PaymentFoundScreen({ onSwitchPath }: { onSwitchPath: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/permissions"
            className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
          >
            &larr; Back
          </Link>
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Payment on file
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            We found a payment method from your order. You&rsquo;re all set.
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
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Visa ending in 4242
              </span>
              <span className="text-xs font-normal leading-none text-neutral-500 dark:text-neutral-500">
                Expires 09/28
              </span>
            </div>
          </div>
        </div>

        {/* Trial info */}
        <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <svg className="size-5 shrink-0 text-green-700 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p className="text-sm font-normal leading-normal text-green-700 dark:text-green-400">
            Your 21-day trial starts when the Miles device is activated.
            You won&rsquo;t be charged until then.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/primary-driver"
          className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
        >
          Continue
        </Link>

        {/* Path toggle for testing */}
        <button
          type="button"
          onClick={onSwitchPath}
          className="text-xs font-normal leading-normal text-neutral-400 underline underline-offset-2 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400"
        >
          Test: simulate &ldquo;no payment on file&rdquo;
        </button>
      </div>
    </main>
  );
}

/* ─── Path B: Add Payment ─── */
function AddPaymentScreen({ onSwitchPath }: { onSwitchPath: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/permissions"
            className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
          >
            &larr; Back
          </Link>
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Add payment method
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Start your 21-day free trial. Cancel anytime — no charge until the
            trial ends.
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
              placeholder="1234 5678 9012 3456"
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
                placeholder="MM / YY"
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
                placeholder="123"
                className="h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-none text-neutral-900 placeholder:text-neutral-400 motion-safe:transition-colors motion-safe:duration-150 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Trial reassurance */}
        <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <svg className="size-5 shrink-0 text-blue-700 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-normal text-blue-700 dark:text-blue-400">
              21-day trial starts when Miles is activated
            </p>
            <p className="text-xs font-normal leading-normal text-blue-600 dark:text-blue-300">
              Cancel anytime before the trial ends and you won&rsquo;t be charged.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link
            href="/primary-driver"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            Add payment &amp; continue
          </Link>

          {/* Skip / do later */}
          <Link
            href="/primary-driver"
            className="flex h-12 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-neutral-300 dark:focus-visible:ring-offset-neutral-900"
          >
            Do this later
          </Link>
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
  );
}
