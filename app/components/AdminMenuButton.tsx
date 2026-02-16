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
      aria-label={isOpen ? "Hide admin menu" : "Show admin menu"}
      className={`hidden md:inline-flex h-8 items-center rounded-full border border-stroke-muted bg-surface-subtle px-3 text-xs font-medium uppercase tracking-wide text-brand-muted transition-colors duration-150 ease-out hover:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary ${className ?? ""}`}
    >
      {isOpen ? "Hide" : "Menu"}
    </button>
  );
}
