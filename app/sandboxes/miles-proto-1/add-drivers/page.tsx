"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { SetupProgress } from "@/app/sandboxes/miles-proto-1/_components/setup-progress";
import { StickyFooter } from "@/app/sandboxes/miles-proto-1/_components/sticky-footer";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Driver {
  id: number;
  name: string;
  method: "text" | "email";
  value: string;
}

let nextId = 1;

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function AddDriversContent() {
  const searchParams = useSearchParams();
  const fromSetup = searchParams.get("from") === "setup";
  const doneHref = fromSetup ? "/device-detected" : "/next-trip-headsup";

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [inviteName, setInviteName] = useState("");
  const [inviteMethod, setInviteMethod] = useState<"text" | "email">("text");
  const [inviteValue, setInviteValue] = useState("");

  function addDriver() {
    if (!inviteName.trim()) return;
    setDrivers((prev) => [
      ...prev,
      {
        id: nextId++,
        name: inviteName.trim(),
        method: inviteMethod,
        value: inviteValue.trim(),
      },
    ]);
    setInviteName("");
    setInviteValue("");
  }

  function removeDriver(id: number) {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
  }

  if (fromSetup) {
    return (
      <>
        <main className="flex min-h-dvh flex-col px-6 pb-8 pt-16">
          <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

            <SetupProgress current={7} backHref="/whos-driving" />

            <div className="flex flex-col gap-3">
              <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
                Add other drivers
              </h1>
              <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
                Who else drives this vehicle? Invite them so Miles can attribute trips to the right person.
              </p>
            </div>

            {/* Added drivers */}
            {drivers.length > 0 && (
              <div className="flex flex-col gap-2">
                {drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <svg className="size-4 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                        {driver.name}
                      </span>
                      <span className="text-xs font-normal leading-normal text-green-600 dark:text-green-400">
                        Invite ready via {driver.method}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDriver(driver.id)}
                      className="flex size-8 items-center justify-center rounded-md motion-safe:transition-colors motion-safe:duration-150 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-green-900"
                      aria-label={`Remove ${driver.name}`}
                    >
                      <svg className="size-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Inline invite form */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="driver-name" className="text-sm font-medium leading-none text-neutral-700 dark:text-neutral-300">
                  Name
                </label>
                <input
                  id="driver-name"
                  type="text"
                  placeholder="e.g. Alex, Sarah…"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm font-normal leading-normal text-neutral-900 outline-none placeholder:text-neutral-400 motion-safe:transition-shadow motion-safe:duration-200 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-blue-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium leading-none text-neutral-700 dark:text-neutral-300">
                  Invite via
                </span>
                <div className="flex gap-2">
                  {(["text", "email"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setInviteMethod(m); setInviteValue(""); }}
                      className={`h-9 flex-1 rounded-md px-3 text-sm font-medium leading-none motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        inviteMethod === m
                          ? "bg-blue-600 text-white dark:bg-blue-500"
                          : "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {m === "text" ? "Text" : "Email"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="driver-contact" className="text-sm font-medium leading-none text-neutral-700 dark:text-neutral-300">
                  {inviteMethod === "text" ? "Phone number" : "Email address"}
                </label>
                <input
                  id="driver-contact"
                  type={inviteMethod === "text" ? "tel" : "email"}
                  autoComplete={inviteMethod === "text" ? "tel" : "email"}
                  placeholder={inviteMethod === "text" ? "(555) 123-4567" : "alex@example.com"}
                  value={inviteMethod === "text" ? formatPhone(inviteValue) : inviteValue}
                  onChange={(e) => setInviteValue(inviteMethod === "text" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value)}
                  className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm font-normal leading-normal text-neutral-900 outline-none placeholder:text-neutral-400 motion-safe:transition-shadow motion-safe:duration-200 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-blue-400"
                />
              </div>

              {inviteName.trim() && (
                <button
                  type="button"
                  onClick={addDriver}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium leading-none text-neutral-700 motion-safe:transition-colors motion-safe:duration-150 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  <svg className="size-4 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add another driver
                </button>
              )}

              <p className="text-xs font-normal leading-normal text-neutral-400 dark:text-neutral-500">
                They&rsquo;ll receive an invite to join your vehicle on Miles. You can always add or remove drivers later in settings.
              </p>
            </div>

            {/* Benefits — contextual, at the bottom */}
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-3 rounded-md bg-neutral-50 p-3 dark:bg-neutral-800/50">
                <svg className="size-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
                <span className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-400">
                  Each driver gets their own trip history and insights, so everyone&rsquo;s data stays accurate.
                </span>
              </div>
              <div className="flex items-start gap-3 rounded-md bg-neutral-50 p-3 dark:bg-neutral-800/50">
                <svg className="size-5 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                <span className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-400">
                  After each trip you can quickly confirm or switch who was driving.
                </span>
              </div>
            </div>

          </div>
        </main>

        <StickyFooter>
          <div className="flex flex-col gap-3">
            <Link
              href={doneHref}
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Continue
            </Link>
            <Link
              href={doneHref}
              className="flex h-10 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-700 focus-visible:outline-none dark:text-neutral-400 dark:hover:text-neutral-300"
            >
              Skip for now
            </Link>
          </div>
        </StickyFooter>
      </>
    );
  }

  // --- Non-setup flow (consistent with setup flow) ---
  return (
    <>
      <main className="flex min-h-dvh flex-col px-6 pb-8 pt-16">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

          <Link
            href="/driver-reassignment"
            className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back
          </Link>

          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
              Add other drivers
            </h1>
            <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
              Who else drives this vehicle? Invite them so Miles can attribute trips to the right person.
            </p>
          </div>

          {/* Added drivers */}
          {drivers.length > 0 && (
            <div className="flex flex-col gap-2">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <svg className="size-4 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                      {driver.name}
                    </span>
                    <span className="text-xs font-normal leading-normal text-green-600 dark:text-green-400">
                      Invite ready via {driver.method}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDriver(driver.id)}
                    className="flex size-8 items-center justify-center rounded-md motion-safe:transition-colors motion-safe:duration-150 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-green-900"
                    aria-label={`Remove ${driver.name}`}
                  >
                    <svg className="size-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Inline invite form */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="driver-name" className="text-sm font-medium leading-none text-neutral-700 dark:text-neutral-300">
                Name
              </label>
              <input
                id="driver-name"
                type="text"
                placeholder="e.g. Alex, Sarah…"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm font-normal leading-normal text-neutral-900 outline-none placeholder:text-neutral-400 motion-safe:transition-shadow motion-safe:duration-200 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-blue-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium leading-none text-neutral-700 dark:text-neutral-300">
                Invite via
              </span>
              <div className="flex gap-2">
                {(["text", "email"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setInviteMethod(m); setInviteValue(""); }}
                    className={`h-9 flex-1 rounded-md px-3 text-sm font-medium leading-none motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      inviteMethod === m
                        ? "bg-blue-600 text-white dark:bg-blue-500"
                        : "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {m === "text" ? "Text" : "Email"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="driver-contact" className="text-sm font-medium leading-none text-neutral-700 dark:text-neutral-300">
                {inviteMethod === "text" ? "Phone number" : "Email address"}
              </label>
              <input
                id="driver-contact"
                type={inviteMethod === "text" ? "tel" : "email"}
                autoComplete={inviteMethod === "text" ? "tel" : "email"}
                placeholder={inviteMethod === "text" ? "(555) 123-4567" : "alex@example.com"}
                value={inviteMethod === "text" ? formatPhone(inviteValue) : inviteValue}
                onChange={(e) => setInviteValue(inviteMethod === "text" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value)}
                className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm font-normal leading-normal text-neutral-900 outline-none placeholder:text-neutral-400 motion-safe:transition-shadow motion-safe:duration-200 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-blue-400"
              />
            </div>

            {inviteName.trim() && (
              <button
                type="button"
                onClick={addDriver}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium leading-none text-neutral-700 motion-safe:transition-colors motion-safe:duration-150 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                <svg className="size-4 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add another driver
              </button>
            )}

            <p className="text-xs font-normal leading-normal text-neutral-400 dark:text-neutral-500">
              They&rsquo;ll receive an invite to join your vehicle on Miles. You can always add or remove drivers later in settings.
            </p>
          </div>

          {/* Benefits */}
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3 rounded-md bg-neutral-50 p-3 dark:bg-neutral-800/50">
              <svg className="size-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              <span className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-400">
                Each driver gets their own trip history and insights, so everyone&rsquo;s data stays accurate.
              </span>
            </div>
            <div className="flex items-start gap-3 rounded-md bg-neutral-50 p-3 dark:bg-neutral-800/50">
              <svg className="size-5 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <span className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-400">
                After each trip you can quickly confirm or switch who was driving.
              </span>
            </div>
          </div>

        </div>
      </main>

      <StickyFooter>
        <div className="flex flex-col gap-3">
          <Link
            href={doneHref}
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            Continue
          </Link>
          <Link
            href={doneHref}
            className="flex h-10 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-700 focus-visible:outline-none dark:text-neutral-400 dark:hover:text-neutral-300"
          >
            Skip for now
          </Link>
        </div>
      </StickyFooter>
    </>
  );
}

export default function AddDriversPage() {
  return (
    <Suspense>
      <AddDriversContent />
    </Suspense>
  );
}
