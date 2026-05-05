"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Minimal iOS-style bottom sheet (half-sheet). Slide-up from bottom with
 * a dimmed backdrop, drag handle (visual only — no drag dismiss), and an
 * inline nav bar inside the sheet (Cancel · Title · Confirm).
 *
 * iOS analogue: UISheetPresentationController with `.medium()` detent,
 * or SwiftUI `.sheet { ... }.presentationDetents([.medium])`.
 *
 * Reusable: pass children for the form/content, plus a confirm label +
 * onConfirm to render the trailing action.
 */
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
  children: ReactNode;
}

export function BottomSheet({
  open,
  onClose,
  title,
  confirmLabel,
  onConfirm,
  confirmDisabled,
  children,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-end"
    >
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/40"
      />
      <div className="relative z-10 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl">
        <div className="flex justify-center pt-2 pb-1">
          <span className="h-1 w-9 rounded-full bg-neutral-300" aria-hidden />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pb-3">
          <button
            type="button"
            onClick={onClose}
            className="justify-self-start text-base text-semantic-info active:opacity-60"
          >
            Cancel
          </button>
          <span className="text-base font-semibold text-neutral-900">{title}</span>
          {confirmLabel && onConfirm ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirmDisabled}
              className="justify-self-end text-base font-semibold text-semantic-info active:opacity-60 disabled:opacity-30"
            >
              {confirmLabel}
            </button>
          ) : (
            <span aria-hidden />
          )}
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-6 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
