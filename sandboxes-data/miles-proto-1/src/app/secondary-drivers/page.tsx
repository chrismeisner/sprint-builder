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

export default function SecondaryDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteMethod, setInviteMethod] = useState<"text" | "email">("text");
  const [inviteValue, setInviteValue] = useState("");

  function addDriver() {
    if (!inviteName.trim()) return;
    setDrivers((prev) => [
      ...prev,
      { id: nextId++, name: inviteName.trim(), method: inviteMethod, value: inviteValue.trim() },
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
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/primary-driver"
            className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
          >
            &larr; Back
          </Link>
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Add another driver?
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Invite family members or coworkers who share this vehicle.
            They&rsquo;ll get their own trip history.
          </p>
        </div>

        {/* Driver list */}
        {drivers.length > 0 && (
          <div className="flex flex-col gap-3">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
              >
                {/* Avatar */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-300">
                    {driver.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                    {driver.name}
                  </span>
                  <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                    Invited via {driver.method}
                  </span>
                </div>

                {/* Remove */}
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
        )}

        {/* Add driver form */}
        {showForm ? (
          <div className="flex flex-col gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="invite-name"
                className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
              >
                Name
              </label>
              <input
                id="invite-name"
                type="text"
                placeholder="Alex"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-none text-neutral-900 placeholder:text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400"
              />
            </div>

            {/* Method toggle */}
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

            {/* Contact field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="invite-contact"
                className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
              >
                {inviteMethod === "text" ? "Phone number" : "Email address"}
              </label>
              <input
                id="invite-contact"
                type={inviteMethod === "text" ? "tel" : "email"}
                autoComplete={inviteMethod === "text" ? "tel" : "email"}
                placeholder={inviteMethod === "text" ? "(555) 123-4567" : "alex@example.com"}
                value={inviteValue}
                onChange={(e) => setInviteValue(e.target.value)}
                className="h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-none text-neutral-900 placeholder:text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400"
              />
            </div>

            {/* Form actions */}
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

            {/* Reassurance */}
            <p className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Acceptance not required to start using Miles.
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

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link
            href="/install"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            Continue
          </Link>

          {drivers.length === 0 && (
            <Link
              href="/install"
              className="flex h-12 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-neutral-300 dark:focus-visible:ring-offset-neutral-900"
            >
              Skip for now
            </Link>
          )}
        </div>

        {/* Reassurance */}
        <p className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
          You can always add or remove drivers later in settings.
        </p>
      </div>
    </main>
  );
}
