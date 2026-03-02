"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import {
  applyWireframeClass,
  applyWireframeLabels,
  applyTypographyLabels,
  persistWireframePreference,
  persistWireframeLabelsPreference,
  persistTypographyLabelsPreference,
  readWireframeLabelsPreference,
  readWireframePreference,
  readTypographyLabelsPreference,
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

export const ADMIN_SIDEBAR_STORAGE_KEY = "adminSidebarOpen";

export default function AdminNavShellClient({ nav, children }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isWireframeEnabled, setIsWireframeEnabled] = useState(false);
  const [showDivLabels, setShowDivLabels] = useState(false);
  const [showTypographyLabels, setShowTypographyLabels] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      setIsSidebarOpen(stored === "true");
    }
    const initialWireframe = readWireframePreference(false);
    const initialLabels = readWireframeLabelsPreference(false);
    const initialTypography = readTypographyLabelsPreference(false);
    setIsWireframeEnabled(initialWireframe);
    setShowDivLabels(initialLabels);
    setShowTypographyLabels(initialTypography);
    applyWireframeClass(initialWireframe);
    applyWireframeLabels(initialWireframe && initialLabels);
    applyTypographyLabels(initialWireframe && initialTypography);

    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    window.localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, String(isSidebarOpen));
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
    persistTypographyLabelsPreference(showTypographyLabels);
  }, [hasHydrated, showTypographyLabels]);

  useEffect(() => {
    if (!hasHydrated) return;
    applyWireframeClass(isWireframeEnabled);
    applyWireframeLabels(isWireframeEnabled && showDivLabels);
    applyTypographyLabels(isWireframeEnabled && showTypographyLabels);
  }, [hasHydrated, isWireframeEnabled, showDivLabels, showTypographyLabels]);

  useEffect(() => {
    if (!hasHydrated) return;
    window.dispatchEvent(
      new CustomEvent("admin-sidebar-state", {
        detail: { open: isSidebarOpen },
      }),
    );
  }, [hasHydrated, isSidebarOpen]);

  useEffect(() => {
    const handleToggle = () => {
      setIsSidebarOpen((prev) => !prev);
    };

    window.addEventListener("admin-sidebar-toggle", handleToggle);
    return () => window.removeEventListener("admin-sidebar-toggle", handleToggle);
  }, []);

  const toggleWireframeMode = () => {
    setIsWireframeEnabled((prev) => !prev);
  };

  const toggleDivLabels = () => {
    setShowDivLabels((prev) => !prev);
  };

  const toggleTypographyLabels = () => {
    setShowTypographyLabels((prev) => !prev);
  };

  const ToggleSwitch = ({
    checked,
    onToggle,
    label,
    danger = false,
  }: {
    checked: boolean;
    onToggle: () => void;
    label: string;
    danger?: boolean;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        checked
          ? danger
            ? "bg-red-500 border-red-500 focus-visible:ring-red-500"
            : "bg-brand-primary border-brand-primary focus-visible:ring-brand-primary"
          : "bg-surface-subtle border-stroke-muted focus-visible:ring-brand-primary"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );

  return (
    <div className="w-full bg-background text-foreground">
      <div className="relative flex w-full md:flex-row min-h-[calc(100vh-3rem)]">
        <aside
          id="admin-sidebar"
          aria-hidden={!isSidebarOpen}
          className={`hidden md:flex md:sticky md:top-12 md:h-[calc(100vh-3rem)] shrink-0 bg-surface-card transition-all duration-200 overflow-hidden ${
            isSidebarOpen ? "w-56 border-r border-stroke-muted" : "w-0 border-r-0"
          }`}
        >
          <div
            className={`flex h-full w-56 flex-col min-h-0 transition-opacity duration-150 ${
              isSidebarOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            <nav className="flex-1 overflow-y-auto py-2 px-1.5">
              <ul>
                {nav.map((item) => (
                  <li key={item.href}>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-md px-2.5 py-1.5 text-[13px] leading-tight text-text-secondary hover:bg-surface-strong hover:text-text-primary transition-colors"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="block rounded-md px-2.5 py-1.5 text-[13px] leading-tight text-text-secondary hover:bg-surface-strong hover:text-text-primary transition-colors"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <div className="px-3 py-2.5 border-t border-stroke-muted space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-text-secondary">Wireframe</span>
                <ToggleSwitch
                  checked={isWireframeEnabled}
                  onToggle={toggleWireframeMode}
                  label="Toggle wireframe mode"
                  danger
                />
              </div>

              {isWireframeEnabled && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-text-secondary">Div labels</span>
                    <ToggleSwitch
                      checked={showDivLabels}
                      onToggle={toggleDivLabels}
                      label="Toggle div labels"
                      danger
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-text-secondary">Font labels</span>
                    <ToggleSwitch
                      checked={showTypographyLabels}
                      onToggle={toggleTypographyLabels}
                      label="Toggle typography labels"
                      danger
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>

        <div className="flex-1 h-full flex flex-col overflow-hidden min-h-0">
          {/* Mobile top nav */}
          <div className="md:hidden sticky top-0 z-10 border-b border-stroke-muted bg-surface-card backdrop-blur">
            <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto">
              {nav.map((item) =>
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center rounded-md border border-stroke-muted px-2.5 py-1 text-xs hover:bg-surface-strong transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex shrink-0 items-center rounded-md border border-stroke-muted px-2.5 py-1 text-xs hover:bg-surface-strong transition-colors"
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


