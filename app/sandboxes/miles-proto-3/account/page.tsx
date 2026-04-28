"use client";

import Link from "@/app/sandboxes/miles-proto-3/_components/link";

interface SectionItem {
  label: string;
  sub: string;
  href: string;
}

const SECTIONS: { title: string; items: SectionItem[] }[] = [
  {
    title: "Profile & Users",
    items: [
      { label: "Your profile", sub: "Chris Meisner · chris@miles.com", href: "/profile" },
      { label: "Household members", sub: "2 members · all equal access", href: "/household" },
    ],
  },
  {
    title: "Vehicles",
    items: [
      { label: "2019 Honda Civic Sport", sub: "IO6 connected · Online", href: "/device-health" },
      { label: "2021 Toyota RAV4 XLE", sub: "IO6 connected · Online", href: "/device-health" },
    ],
  },
  {
    title: "Emergency",
    items: [
      { label: "Emergency contacts", sub: "1 contact set", href: "/profile" },
      { label: "Medical info", sub: "Not yet provided", href: "/profile" },
    ],
  },
  {
    title: "Documents & Records",
    items: [
      { label: "Insurance", sub: "Uploaded · Expires Jun 2026", href: "/profile" },
      { label: "Registration", sub: "Expires Apr 2026", href: "/profile" },
      { label: "Service history", sub: "3 records", href: "/profile" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "Notifications", sub: "Trip alerts, speed, geofence", href: "/notifications" },
      { label: "Privacy & controls", sub: "Location sharing, data", href: "/privacy" },
    ],
  },
  {
    title: "Device",
    items: [
      { label: "Miles IO6", sub: "Firmware v2.4.1 · Last sync 2m ago", href: "/device-health" },
    ],
  },
];

export default function AccountPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-neutral-50 pb-24">
      {/* Header */}
      <div className="px-5 pb-2 pt-14">
        <h1 className="text-2xl font-semibold text-neutral-900">Account</h1>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-6 px-5 pt-2">
        {SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              {section.title}
            </span>
            <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
              {section.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium leading-none text-neutral-900">
                      {item.label}
                    </span>
                    <span className="text-xs leading-none text-neutral-500">
                      {item.sub}
                    </span>
                  </div>
                  <svg className="size-4 shrink-0 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
