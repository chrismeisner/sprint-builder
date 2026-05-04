"use client";

import Link from "@/app/sandboxes/miles-proto-4/_components/link";
import { AskMilesBadge } from "@/app/sandboxes/miles-proto-4/_components/ask-miles-badge";

const menuSections = [
  {
    label: "Account",
    items: [
      {
        label: "Personal information",
        description: "Name, email, and phone number",
        href: "/personal-information",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        ),
      },
      {
        label: "Vehicles",
        description: "2019 Civic Sport · 1 vehicle connected",
        href: "/profile",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        ),
      },
      {
        label: "Billing & subscription",
        description: "Trial active · 14 days remaining",
        href: "/billing",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
          />
        ),
      },
    ],
  },
  {
    label: "Miles AI",
    items: [
      {
        label: "Chat history",
        description: "Your past conversations with Miles",
        href: "/profile",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
          />
        ),
      },
    ],
  },
  {
    label: "Preferences",
    items: [
      {
        label: "Notifications",
        description: "Cadence, recaps, and quiet hours",
        href: "/notifications",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        ),
      },
      {
        label: "Privacy & controls",
        description: "What\u2019s tracked and who can see it",
        href: "/privacy",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
          />
        ),
      },
      {
        label: "Household & drivers",
        description: "Manage drivers and invitations",
        href: "/household",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
          />
        ),
      },
    ],
  },
  {
    label: "Support",
    items: [
      {
        label: "Setup progress",
        description: "5 of 8 steps complete",
        href: "/setup-progress",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
          />
        ),
      },
      {
        label: "Device health",
        description: "Civic Sport · Online",
        href: "/device-health",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        ),
      },
      {
        label: "Help & FAQ",
        description: "Common questions and contact info",
        href: "/profile",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
          />
        ),
      },
    ],
  },
];

export default function ProfilePage() {
  return (
    <main className="flex min-h-dvh flex-col px-6 pb-16 pt-6">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Page header — same pattern as /trips and /personal-information:
            page title left, AskMilesBadge pill right, on the same plane. */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Account
          </h1>
          <AskMilesBadge
            context="profile"
            ariaLabel="Ask Miles about your account"
          />
        </div>

        {/* Profile hero — centered avatar + name. The user's name moves
            to h2 since "Account" is now the page-level h1. */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <span className="text-2xl font-semibold leading-none text-blue-600 dark:text-blue-400">
              CM
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
              Chris Meisner
            </h2>
            <span className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              chris@example.com
            </span>
          </div>
        </div>

        {/* Menu sections */}
        {menuSections.map((section) => (
          <div key={section.label} className="flex flex-col gap-3">
            <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
              {section.label}
            </span>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-4 rounded-md p-3 motion-safe:transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-800"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <svg
                      className="size-5 text-neutral-600 dark:text-neutral-400"
                      aria-hidden="true"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      {item.icon}
                    </svg>
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                      {item.label}
                    </span>
                    <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                      {item.description}
                    </span>
                  </div>
                  <svg
                    className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Sign out */}
        <div className="flex flex-col gap-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-red-600 motion-safe:transition-colors motion-safe:duration-150 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-red-400 dark:hover:bg-red-950 dark:focus-visible:ring-offset-neutral-900"
          >
            Sign out
          </button>
          <span className="text-center text-xs font-normal leading-normal text-neutral-400 dark:text-neutral-600">
            Miles v1.0.0
          </span>
        </div>
      </div>
    </main>
  );
}
