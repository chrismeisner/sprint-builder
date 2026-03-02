"use client";

import { useEffect, useState } from "react";
import { ADMIN_SIDEBAR_STORAGE_KEY } from "../AdminNavShellClient";

type Props = {
  className?: string;
};

export default function AdminMenuButton({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      setIsOpen(stored === "true");
    }

    const handleState = (event: Event) => {
      const custom = event as CustomEvent<{ open?: boolean }>;
      if (custom.detail && typeof custom.detail.open === "boolean") {
        setIsOpen(custom.detail.open);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_SIDEBAR_STORAGE_KEY) {
        setIsOpen(event.newValue === "true");
      }
    };

    window.addEventListener("admin-sidebar-state", handleState as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("admin-sidebar-state", handleState as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleToggle = () => {
    window.dispatchEvent(new CustomEvent("admin-sidebar-toggle"));
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isOpen ? "Close admin menu" : "Open admin menu"}
      className={`hidden md:inline-flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors duration-150 ease-out hover:bg-surface-strong hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary ${className ?? ""}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        className="transition-transform duration-200"
      >
        {isOpen ? (
          <>
            <line x1="4" y1="4" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="4" x2="4" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <line x1="3" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="3" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
      </svg>
    </button>
  );
}
