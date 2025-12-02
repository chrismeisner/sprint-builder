"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import {
  applyWireframeClass,
  applyWireframeLabels,
  persistWireframePreference,
  persistWireframeLabelsPreference,
  readWireframeLabelsPreference,
  readWireframePreference,
} from "@/lib/wireframe-mode";

export type NavItem = {
  href: string;
  label: string;
  external?: boolean;
};

type Props = {
  nav: NavItem[];
  children: ReactNode;
};

const STORAGE_KEY = "adminSidebarOpen";

export default function AdminNavShellClient({ nav, children }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isWireframeEnabled, setIsWireframeEnabled] = useState(false);
  const [showDivLabels, setShowDivLabels] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsSidebarOpen(stored === "true");
    }
    const initialWireframe = readWireframePreference(false);
    const initialLabels = readWireframeLabelsPreference(false);
    setIsWireframeEnabled(initialWireframe);
    setShowDivLabels(initialLabels);
    applyWireframeClass(initialWireframe);
    applyWireframeLabels(initialWireframe && initialLabels);

    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, String(isSidebarOpen));
  }, [hasHydrated, isSidebarOpen]);

  useEffect(() => {
    if (!hasHydrated) return;
    persistWireframePreference(isWireframeEnabled);
  }, [hasHydrated, isWireframeEnabled]);

  useEffect(() => {
    if (!hasHydrated) return;
    persistWireframeLabelsPreference(showDivLabels);
  }, [hasHydrated, showDivLabels]);

  useEffect(() => {
    if (!hasHydrated) return;
    applyWireframeClass(isWireframeEnabled);
    applyWireframeLabels(isWireframeEnabled && showDivLabels);
  }, [hasHydrated, isWireframeEnabled, showDivLabels]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const toggleWireframeMode = () => {
    setIsWireframeEnabled((prev) => !prev);
  };

  const toggleDivLabels = () => {
    setShowDivLabels((prev) => !prev);
  };

  return (
    <div className="w-full bg-background text-foreground">
      <div className="relative flex w-full md:flex-row min-h-[calc(100vh-4rem)]">
        <aside
          id="admin-sidebar"
          aria-hidden={!isSidebarOpen}
          className={`hidden md:flex h-full shrink-0 bg-surface-card transition-all duration-300 overflow-hidden md:overflow-y-auto ${
            isSidebarOpen ? "w-64 border-r border-stroke-muted" : "w-0 border-r-0"
          }`}
        >
        <div
            className={`flex h-full w-64 flex-col min-h-0 transition-opacity duration-200 ${
            isSidebarOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-stroke-muted">
            <div className="text-sm font-semibold tracking-wide uppercase opacity-70">
              Admin
            </div>
            {isSidebarOpen ? (
              <button
                type="button"
                onClick={toggleSidebar}
                aria-controls="admin-sidebar"
                aria-expanded={isSidebarOpen}
                className="hidden md:inline-flex items-center rounded-full border border-stroke-muted bg-surface-subtle px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-brand-muted hover:bg-surface-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
              >
                Hide
              </button>
            ) : null}
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-md px-3 py-2 text-sm hover:bg-surface-strong transition"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="block rounded-md px-3 py-2 text-sm hover:bg-surface-strong transition"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="px-4 py-3 border-t border-stroke-muted space-y-4 text-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="font-semibold uppercase tracking-wide opacity-70">
                  Wireframe mode
                </div>
                <p className="text-[11px] opacity-60 normal-case">
                  Adds dashed outlines to every div for quick layout debugging.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isWireframeEnabled}
                aria-label="Toggle wireframe mode"
                onClick={toggleWireframeMode}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isWireframeEnabled
                    ? "bg-red-500 border-red-500 focus-visible:ring-red-500"
                    : "bg-surface-subtle border-stroke-muted focus-visible:ring-brand-primary"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                    isWireframeEnabled ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {isWireframeEnabled ? (
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold uppercase tracking-wide opacity-70">
                    Show div names
                  </div>
                  <p className="text-[11px] opacity-60 normal-case">
                    Displays a red badge with each div&apos;s identifier.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showDivLabels}
                  aria-label="Toggle div labels"
                  onClick={toggleDivLabels}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    showDivLabels
                      ? "bg-red-500 border-red-500 focus-visible:ring-red-500"
                      : "bg-surface-subtle border-stroke-muted focus-visible:ring-brand-primary"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      showDivLabels ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ) : null}

            <div className="uppercase tracking-wide opacity-60">sprint builder</div>
          </div>
        </div>
      </aside>

      <div className="flex-1 h-full flex flex-col overflow-hidden min-h-0">
        {/* Desktop sidebar toggle (collapsed state) */}
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-controls="admin-sidebar"
            aria-expanded={isSidebarOpen}
            aria-label="Show admin menu"
            title="Show admin menu"
            className="hidden md:inline-flex fixed z-40 top-24 h-9 w-9 items-center justify-center rounded-full border border-stroke-muted bg-surface-card text-base font-semibold text-brand-muted shadow-sm backdrop-blur transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
            style={{ left: "1rem" }}
          >
            <span aria-hidden="true" className="leading-none text-lg">
              &gt;
            </span>
          </button>
        )}

        {/* Mobile top nav */}
        <div className="md:hidden sticky top-0 z-10 border-b border-stroke-muted bg-surface-card backdrop-blur">
          <div className="px-4 py-2 flex gap-2 overflow-x-auto">
            {nav.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center rounded-md border border-stroke-muted px-3 py-1.5 text-xs hover:bg-surface-strong transition"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex shrink-0 items-center rounded-md border border-stroke-muted px-3 py-1.5 text-xs hover:bg-surface-strong transition"
                >
                  {item.label}
                </Link>
              )
            )}
          </div>
        </div>
        <main className="flex-1 overflow-auto min-h-0">{children}</main>
      </div>
    </div>
  </div>
  );
}


