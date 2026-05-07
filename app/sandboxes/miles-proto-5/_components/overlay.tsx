"use client";

import { ReactNode, useEffect } from "react";

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Tailwind z-index class. Default "z-40" (modal level). Use "z-20" to sit behind the nav. */
  z?: string;
}

export function Overlay({ open, onClose, children, z = "z-40" }: OverlayProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 ${z} ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop — fades in/out */}
      <div
        className={`absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 motion-safe:transition-opacity motion-safe:duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      {children}
    </div>
  );
}
