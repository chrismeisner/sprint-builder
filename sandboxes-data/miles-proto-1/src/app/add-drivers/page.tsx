"use client";

import Link from "next/link";
import { useState } from "react";

interface Driver {
  id: number;
  name: string;
  method: "text" | "email";
  value: string;
}

let nextId = 1;

export default function AddDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
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
    setShowForm(false);
  }

  function removeDriver(id: number) {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Back */}
        <Link
          href="/driver-reassignment"
          className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <svg
            className="size-4"
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Add other drivers
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            When multiple people share a vehicle, adding drivers helps Miles
            attribute trips to the right person.
          </p>
        </div>

        {/* Why it matters */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
              <svg
                className="size-5 text-blue-600 dark:text-blue-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Better trip attribution
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                Each driver gets their own trip history and insights, so
                everyone&rsquo;s data stays accurate.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
              <svg
                className="size-5 text-green-600 dark:text-green-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Easy reassignment
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                After each trip you can quickly confirm or switch who was behind
                the wheel.
              </span>
            </div>
          </div>
        </div>

        {/* Current drivers */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            Drivers
          </span>

          {/* Primary (always shown) */}
          <div className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-300">
                C
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Chris
              </span>
              <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                Primary driver
              </span>
            </div>
          </div>

          {/* Added drivers */}
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-300">
                  {driver.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  {driver.name}
                </span>
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  Invited via {driver.method}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeDriver(driver.id)}
                className="flex size-8 items-center justify-center rounded-md motion-safe:transition-colors motion-safe:duration-150 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-700"
                aria-label={`Remove ${driver.name}`}
              >
                <svg
                  className="size-4 text-neutral-500 dark:text-neutral-400"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Add form */}
        {showForm ? (
          <div className="flex flex-col gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="driver-name"
                className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
              >
                Name
              </label>
              <input
                id="driver-name"
                type="text"
                placeholder="Alex"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-none text-neutral-900 placeholder:text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Invite via
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInviteMethod("text");
                    setInviteValue("");
                  }}
                  className={`h-10 flex-1 rounded-md px-4 text-sm font-medium leading-none motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    inviteMethod === "text"
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                  }`}
                >
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInviteMethod("email");
                    setInviteValue("");
                  }}
                  className={`h-10 flex-1 rounded-md px-4 text-sm font-medium leading-none motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    inviteMethod === "email"
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                  }`}
                >
                  Email
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="driver-contact"
                className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
              >
                {inviteMethod === "text" ? "Phone number" : "Email address"}
              </label>
              <input
                id="driver-contact"
                type={inviteMethod === "text" ? "tel" : "email"}
                autoComplete={inviteMethod === "text" ? "tel" : "email"}
                placeholder={
                  inviteMethod === "text"
                    ? "(555) 123-4567"
                    : "alex@example.com"
                }
                value={inviteValue}
                onChange={(e) => setInviteValue(e.target.value)}
                className="h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-none text-neutral-900 placeholder:text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-10 flex-1 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium leading-none text-neutral-900 motion-safe:transition-colors motion-safe:duration-150 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addDriver}
                className="flex h-10 flex-1 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-150 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Send invite
              </button>
            </div>

            <p className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              They&rsquo;ll receive an invite to join your vehicle on Miles.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-6 text-base font-medium leading-none text-neutral-900 motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            <svg
              className="size-5 text-blue-600 dark:text-blue-400"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add a driver
          </button>
        )}

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link
            href="/next-trip-headsup"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            Continue
          </Link>
          <Link
            href="/next-trip-headsup"
            className="flex h-12 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-neutral-300 dark:focus-visible:ring-offset-neutral-900"
          >
            Skip for now
          </Link>
        </div>

        <p className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
          You can always add or remove drivers later in settings.
        </p>
      </div>
    </main>
  );
}
