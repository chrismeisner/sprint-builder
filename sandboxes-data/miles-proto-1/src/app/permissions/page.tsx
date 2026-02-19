"use client";

import Link from "next/link";
import { useState } from "react";

type Step = "primer" | "bluetooth" | "notifications" | "done";
type PermissionState = "pending" | "allowed" | "denied";

export default function PermissionsPage() {
  const [step, setStep] = useState<Step>("primer");
  const [bluetooth, setBluetooth] = useState<PermissionState>("pending");
  const [notifications, setNotifications] = useState<PermissionState>("pending");

  function startPrompts() {
    setStep("bluetooth");
  }

  function handleBluetooth(allowed: boolean) {
    setBluetooth(allowed ? "allowed" : "denied");
    setStep("notifications");
  }

  function handleNotifications(allowed: boolean) {
    setNotifications(allowed ? "allowed" : "denied");
    setStep("done");
  }

  const showBluetoothModal = step === "bluetooth";
  const showNotificationsModal = step === "notifications";
  const promptsStarted = step !== "primer";

  return (
    <>
      <main className="flex min-h-dvh flex-col px-6 py-16">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <Link
              href="/signup"
              className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
            >
              &larr; Back
            </Link>
            <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
              A couple of permissions
            </h1>
            <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
              Miles needs access to a few things so your trips are tracked
              automatically.
            </p>
          </div>

          {/* Permission cards */}
          <div className="flex flex-col gap-4">
            {/* Bluetooth */}
            <div className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950">
                  <svg className="size-6 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                    Bluetooth
                  </span>
                  {promptsStarted ? (
                    <StatusLabel state={bluetooth} />
                  ) : (
                    <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                      Helps us detect and pair your Miles device.
                    </p>
                  )}
                </div>
                {bluetooth === "allowed" && <CheckIcon />}
              </div>

              {bluetooth === "denied" && (
                <DeniedWarning
                  message="Bluetooth is required to connect your Miles device."
                  onFix={() => setBluetooth("allowed")}
                />
              )}
            </div>

            {/* Notifications */}
            <div className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950">
                  <svg className="size-6 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                    Notifications
                  </span>
                  {promptsStarted ? (
                    <StatusLabel state={notifications} />
                  ) : (
                    <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                      So you can get your first trip summary. You control alerts later.
                    </p>
                  )}
                </div>
                {notifications === "allowed" && <CheckIcon />}
              </div>

              {notifications === "denied" && (
                <DeniedWarning
                  message="Without notifications you won't see trip summaries."
                  onFix={() => setNotifications("allowed")}
                />
              )}
            </div>
          </div>

          {/* Reassurance */}
          <p className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
            You can change these anytime in your phone&rsquo;s settings.
          </p>

          {/* CTA */}
          {step === "primer" && (
            <button
              type="button"
              onClick={startPrompts}
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Continue
            </button>
          )}

          {step === "done" && (
            <Link
              href="/billing"
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Continue
            </Link>
          )}
        </div>
      </main>

      {/* ── Bluetooth OS prompt modal ── */}
      {showBluetoothModal && (
        <OsPromptModal
          title={'\u201cMiles\u201d Would Like to Use Bluetooth'}
          description="Bluetooth is used to detect and communicate with your Miles device while driving."
          onAllow={() => handleBluetooth(true)}
          onDeny={() => handleBluetooth(false)}
        />
      )}

      {/* ── Notifications OS prompt modal ── */}
      {showNotificationsModal && (
        <OsPromptModal
          title={'\u201cMiles\u201d Would Like to Send You Notifications'}
          description="Notifications may include alerts, sounds, and icon badges. These can be configured in Settings."
          onAllow={() => handleNotifications(true)}
          onDeny={() => handleNotifications(false)}
        />
      )}
    </>
  );
}

/* ── Simulated OS prompt ── */
function OsPromptModal({
  title,
  description,
  onAllow,
  onDeny,
}: {
  title: string;
  description: string;
  onAllow: () => void;
  onDeny: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-900/50 px-6 dark:bg-neutral-950/70">
      <div className="w-full max-w-xs rounded-md bg-white p-6 shadow-xl dark:bg-neutral-900">
        <div className="flex flex-col gap-4 text-center">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-medium leading-snug text-neutral-900 dark:text-neutral-100">
              {title}
            </h2>
            <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
              {description}
            </p>
          </div>

          <div className="flex flex-col">
            <div className="h-px bg-neutral-200 dark:bg-neutral-700" />
            <button
              type="button"
              onClick={onDeny}
              className="h-12 text-base font-normal leading-none text-blue-600 motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:bg-neutral-800"
            >
              Don&rsquo;t Allow
            </button>
            <div className="h-px bg-neutral-200 dark:bg-neutral-700" />
            <button
              type="button"
              onClick={onAllow}
              className="h-12 text-base font-medium leading-none text-blue-600 motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:bg-neutral-800"
            >
              Allow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Status label ── */
function StatusLabel({ state }: { state: PermissionState }) {
  if (state === "pending") {
    return (
      <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
        Waiting&hellip;
      </span>
    );
  }
  if (state === "allowed") {
    return (
      <span className="text-xs font-normal leading-normal text-green-700 dark:text-green-400">
        Allowed
      </span>
    );
  }
  return (
    <span className="text-xs font-normal leading-normal text-red-700 dark:text-red-400">
      Denied
    </span>
  );
}

/* ── Check icon ── */
function CheckIcon() {
  return (
    <svg
      className="size-5 shrink-0 text-green-600 dark:text-green-400"
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

/* ── Denied warning with fix CTA ── */
function DeniedWarning({
  message,
  onFix,
}: {
  message: string;
  onFix: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
      <svg
        className="size-5 shrink-0 text-amber-700 dark:text-amber-400"
        aria-hidden="true"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-sm font-normal leading-normal text-amber-700 dark:text-amber-400">
          {message}
        </p>
        <button
          type="button"
          onClick={onFix}
          className="h-8 self-start rounded px-3 text-sm font-medium leading-none text-amber-700 motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-400 dark:hover:bg-amber-900"
        >
          Fix in Settings
        </button>
      </div>
    </div>
  );
}
