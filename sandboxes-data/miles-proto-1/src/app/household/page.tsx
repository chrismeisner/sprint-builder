"use client";

import Link from "next/link";
import { useState } from "react";

interface Driver {
  id: number;
  name: string;
  role: "owner" | "driver" | "teen";
  status: "active" | "invited";
  method?: "text" | "email";
}

const initialDrivers: Driver[] = [
  { id: 1, name: "Chris", role: "owner", status: "active" },
];

let nextId = 2;

const roleLabels: Record<string, string> = {
  owner: "Account owner",
  driver: "Driver",
  teen: "Teen driver",
};

export default function HouseholdPage() {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [showForm, setShowForm] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"driver" | "teen">("driver");
  const [inviteMethod, setInviteMethod] = useState<"text" | "email">("text");
  const [inviteValue, setInviteValue] = useState("");

  function addDriver() {
    if (!inviteName.trim()) return;
    setDrivers((prev) => [
      ...prev,
      {
        id: nextId++,
        name: inviteName.trim(),
        role: inviteRole,
        status: "invited",
        method: inviteMethod,
      },
    ]);
    setInviteName("");
    setInviteValue("");
    setInviteRole("driver");
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
          href="/dashboard"
          className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Home
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Household &amp; Drivers
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Manage who drives this vehicle. Each driver gets their own trip
            history and attribution.
          </p>
        </div>

        {/* Driver list */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            Drivers
          </span>

          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="flex items-center gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-300">
                  {driver.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                    {driver.name}
                  </span>
                  {driver.status === "invited" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium leading-none text-amber-700 dark:bg-amber-900 dark:text-amber-400">
                      Invited
                    </span>
                  )}
                </div>
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  {roleLabels[driver.role]}
                  {driver.method ? ` · via ${driver.method}` : ""}
                </span>
              </div>
              {driver.role !== "owner" && (
                <button
                  type="button"
                  onClick={() => removeDriver(driver.id)}
                  className="flex size-8 items-center justify-center rounded-md motion-safe:transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-700"
                  aria-label={`Remove ${driver.name}`}
                >
                  <svg className="size-4 text-neutral-500 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Invite form */}
        {showForm ? (
          <div className="flex flex-col gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
              Invite a driver
            </span>

            {/* Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="hh-name" className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Name
              </label>
              <input
                id="hh-name"
                type="text"
                placeholder="Alex"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-none text-neutral-900 placeholder:text-neutral-500 motion-safe:transition-colors focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400"
              />
            </div>

            {/* Role */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Role
              </span>
              <div className="flex gap-2">
                {(["driver", "teen"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setInviteRole(role)}
                    className={`h-10 flex-1 rounded-md px-4 text-sm font-medium leading-none motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      inviteRole === role
                        ? "bg-blue-600 text-white dark:bg-blue-500"
                        : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {role === "driver" ? "Driver" : "Teen driver"}
                  </button>
                ))}
              </div>
              {inviteRole === "teen" && (
                <p className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  Teen drivers can view their own trips. You control visibility
                  settings from Privacy &amp; Controls.
                </p>
              )}
            </div>

            {/* Invite method */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Invite via
              </span>
              <div className="flex gap-2">
                {(["text", "email"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setInviteMethod(method);
                      setInviteValue("");
                    }}
                    className={`h-10 flex-1 rounded-md px-4 text-sm font-medium leading-none capitalize motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      inviteMethod === method
                        ? "bg-blue-600 text-white dark:bg-blue-500"
                        : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-2">
              <label htmlFor="hh-contact" className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                {inviteMethod === "text" ? "Phone number" : "Email address"}
              </label>
              <input
                id="hh-contact"
                type={inviteMethod === "text" ? "tel" : "email"}
                autoComplete={inviteMethod === "text" ? "tel" : "email"}
                placeholder={inviteMethod === "text" ? "(555) 123-4567" : "alex@example.com"}
                value={inviteValue}
                onChange={(e) => setInviteValue(e.target.value)}
                className="h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-none text-neutral-900 placeholder:text-neutral-500 motion-safe:transition-colors focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-10 flex-1 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium leading-none text-neutral-900 motion-safe:transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addDriver}
                className="flex h-10 flex-1 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium leading-none text-white motion-safe:transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Send invite
              </button>
            </div>

            <p className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              They&rsquo;ll receive an invite to join your vehicle on Miles.
              Acceptance is not required for tracking to work.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-6 text-base font-medium leading-none text-neutral-900 motion-safe:transition-colors motion-safe:duration-200 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            <svg className="size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Invite a driver
          </button>
        )}

        {/* Visibility note */}
        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <svg className="size-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
              Privacy by default
            </span>
            <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
              Drivers only see their own trips unless you change visibility
              in&nbsp;
              <Link href="/privacy" className="underline underline-offset-2">
                Privacy &amp; Controls
              </Link>
              .
            </span>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
        >
          Done
        </Link>
      </div>
    </main>
  );
}
