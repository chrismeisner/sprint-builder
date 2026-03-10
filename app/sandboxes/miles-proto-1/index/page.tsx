"use client";

import { useState, useMemo } from "react";
import { BASE } from "@/app/sandboxes/miles-proto-1/_lib/nav";

interface PageEntry {
  href: string;
  label: string;
  note?: string;
}

interface Section {
  title: string;
  pages: PageEntry[];
}

const sections: Section[] = [
  {
    title: "Auth & Onboarding",
    pages: [
      { href: "/", label: "Welcome", note: "Landing / sign-up" },
      { href: "/signup", label: "Sign up" },
      { href: "/signup-name", label: "Sign up — name" },
    ],
  },
  {
    title: "Setup & Installation",
    pages: [
      { href: "/install?state=empty", label: "Install checklist", note: "empty" },
      { href: "/install?state=partial", label: "Install checklist", note: "partial" },
      { href: "/install?state=filled", label: "Install checklist", note: "filled" },
      { href: "/scan-device", label: "Scan device" },
      { href: "/billing", label: "Billing / start trial" },
      { href: "/permissions", label: "Permissions" },
      { href: "/find-port", label: "Find OBD-II port" },
      { href: "/help-port", label: "Help — find port" },
      { href: "/help-port/vin", label: "Help — enter VIN" },
      { href: "/help-port/vin/result", label: "Help — VIN result" },
      { href: "/help-port/vehicle", label: "Help — select vehicle" },
      { href: "/help-port/vehicle/result", label: "Help — vehicle result" },
      { href: "/plug-in-device", label: "Plug in device" },
      { href: "/pair-device", label: "Pair device" },
      { href: "/linking-device", label: "Linking device" },
      { href: "/getting-online", label: "Getting online" },
      { href: "/device-detected", label: "Device detected" },
      { href: "/whos-driving", label: "Who's driving" },
      { href: "/setup-progress", label: "Setup progress" },
    ],
  },
  {
    title: "Dashboard",
    pages: [
      { href: "/dashboard?state=empty", label: "Dashboard", note: "empty / no device" },
      { href: "/dashboard?state=no-trips", label: "Dashboard", note: "no trips yet" },
      { href: "/dashboard?state=filled", label: "Dashboard", note: "filled" },
      { href: "/ready-to-drive", label: "Ready to drive" },
    ],
  },
  {
    title: "Trips",
    pages: [
      { href: "/trips", label: "Trips list" },
      { href: "/trip-receipt", label: "Trip receipt" },
      { href: "/trip-detail", label: "Trip detail" },
      { href: "/trip-complete", label: "Trip complete" },
      { href: "/trip-indicator", label: "Trip indicator" },
      { href: "/trip-finalizing", label: "Trip finalizing" },
      { href: "/first-trip-ready", label: "First trip — ready" },
      { href: "/first-trip-summary", label: "First trip — summary" },
      { href: "/post-drive-prompts", label: "Post-drive prompts" },
    ],
  },
  {
    title: "Live Trip",
    pages: [
      { href: "/live-trip", label: "Live trip" },
      { href: "/live-trip-event", label: "Live trip — event" },
      { href: "/live-trip-degraded", label: "Live trip — degraded signal" },
    ],
  },
  {
    title: "Drivers & Household",
    pages: [
      { href: "/household", label: "Household" },
      { href: "/add-drivers", label: "Add drivers" },
      { href: "/primary-driver", label: "Primary driver" },
      { href: "/secondary-drivers", label: "Secondary drivers" },
      { href: "/driver-reassignment", label: "Driver reassignment" },
      { href: "/teen-independence", label: "Teen independence" },
      { href: "/confirm-address", label: "Confirm address" },
    ],
  },
  {
    title: "Insights & Data",
    pages: [
      { href: "/insights", label: "Insights" },
      { href: "/weekly-recap", label: "Weekly recap" },
      { href: "/next-trip-headsup", label: "Next trip heads-up" },
      { href: "/locations", label: "Locations" },
    ],
  },
  {
    title: "Settings & Account",
    pages: [
      { href: "/profile", label: "Profile" },
      { href: "/device-health", label: "Device health" },
      { href: "/notifications", label: "Notifications" },
      { href: "/privacy", label: "Privacy & controls" },
    ],
  },
];

const totalPages = sections.reduce((sum, s) => sum + s.pages.length, 0);

function CopyIcon() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

export default function IndexPage() {
  const [query, setQuery] = useState("");
  const [copiedHref, setCopiedHref] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        pages: s.pages.filter(
          (p) =>
            p.label.toLowerCase().includes(q) ||
            p.href.toLowerCase().includes(q) ||
            (p.note?.toLowerCase().includes(q) ?? false) ||
            s.title.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.pages.length > 0);
  }, [query]);

  const filteredTotal = filtered.reduce((sum, s) => sum + s.pages.length, 0);

  function copyLink(href: string) {
    const url = window.location.origin + BASE + href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedHref(href);
      setTimeout(() => setCopiedHref(null), 1500);
    });
  }

  let rowIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 overflow-auto bg-white"
      style={{ fontFamily: "var(--font-miles-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
          {/* Back link */}
          <a
            href="/dashboard/sandboxes"
            className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Sandboxes
          </a>

          <div className="h-4 w-px shrink-0 bg-neutral-200" />

          {/* Title */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <h1 className="truncate text-sm font-semibold text-neutral-900">
                Miles Proto 1
              </h1>
              <span className="shrink-0 text-xs text-neutral-400">
                {query
                  ? `${filteredTotal} of ${totalPages} screens`
                  : `${totalPages} screens · ${sections.length} sections`}
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-56 shrink-0">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400"
              fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="search"
              placeholder="Filter screens…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 w-full rounded-md border border-neutral-200 bg-neutral-50 pl-8 pr-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-shadow focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Open prototype */}
          <a
            href={BASE}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Open prototype
            <ExternalLinkIcon />
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto max-w-5xl px-6 py-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <p className="text-sm font-medium text-neutral-500">No screens match &ldquo;{query}&rdquo;</p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="w-10 pb-2 pr-4 text-left text-xs font-medium text-neutral-400">#</th>
                <th className="pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Screen</th>
                <th className="pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Path</th>
                <th className="pb-2 pr-4 text-left text-xs font-medium text-neutral-400">State</th>
                <th className="w-16 pb-2 text-right text-xs font-medium text-neutral-400">Open</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((section) => (
                <>
                  {/* Section header row */}
                  <tr key={`section-${section.title}`} className="border-b border-neutral-100">
                    <td colSpan={5} className="bg-neutral-50 px-0 py-2 pt-5 first:pt-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                        {section.title}
                      </span>
                    </td>
                  </tr>

                  {section.pages.map((page) => {
                    rowIndex += 1;
                    const idx = rowIndex;
                    const fullUrl = BASE + page.href;
                    const isCopied = copiedHref === page.href;

                    // Split path and query string for display
                    const [pathPart, queryPart] = page.href.split("?");

                    return (
                      <tr
                        key={`${page.href}-${idx}`}
                        className="group border-b border-neutral-100 transition-colors hover:bg-neutral-50"
                      >
                        {/* Row number */}
                        <td className="py-2.5 pr-4 text-right text-xs tabular-nums text-neutral-300 group-hover:text-neutral-400">
                          {idx}
                        </td>

                        {/* Screen name */}
                        <td className="py-2.5 pr-4">
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-neutral-800 transition-colors hover:text-blue-600"
                          >
                            {page.label}
                          </a>
                        </td>

                        {/* Path */}
                        <td className="py-2.5 pr-4">
                          <span className="font-mono text-xs text-neutral-400">
                            {pathPart}
                            {queryPart && (
                              <span className="text-neutral-300">?{queryPart}</span>
                            )}
                          </span>
                        </td>

                        {/* State badge */}
                        <td className="py-2.5 pr-4">
                          {page.note && (
                            <span className="inline-flex items-center rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium leading-none text-neutral-500">
                              {page.note}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => copyLink(page.href)}
                              title="Copy link"
                              className={`flex size-7 items-center justify-center rounded transition-colors ${
                                isCopied
                                  ? "bg-green-50 text-green-600"
                                  : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                              }`}
                            >
                              {isCopied ? (
                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                              ) : (
                                <CopyIcon />
                              )}
                            </button>
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open screen"
                              className="flex size-7 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                            >
                              <ExternalLinkIcon />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
