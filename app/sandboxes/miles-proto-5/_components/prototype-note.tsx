"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Stock-iOS alert-style overlay used to explain interactions that exist on
 * iOS but can't be faithfully reproduced in the web prototype (native
 * pickers, camera capture, photo library, share sheet, etc).
 *
 * Visual: dimmed backdrop + centered card with an eyebrow ("Prototype
 * note"), title, body copy, and a single "Got it" button — i.e. the same
 * shape as a UIAlertController with one action. Esc and backdrop both
 * dismiss.
 *
 * iOS mapping: this overlay is purely a web-prototype affordance. The
 * SwiftUI rebuild won't ship it; the underlying interactions will be
 * native (Picker, PHPickerViewController, UIImagePickerController, etc).
 */
interface PrototypeNoteProps {
  open: boolean;
  onClose: () => void;
  title: string;
  body: ReactNode;
}

export function PrototypeNote({ open, onClose, title, body }: PrototypeNoteProps) {
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
      aria-labelledby="prototype-note-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
    >
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/40"
      />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex flex-col items-center gap-2 px-8 py-6 text-center">
          <h3
            id="prototype-note-title"
            className="text-base font-semibold text-neutral-900"
          >
            {title}
          </h3>
          <div className="text-sm leading-relaxed text-neutral-600">{body}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="block w-full border-t border-neutral-200 py-3 text-base font-medium text-blue-600 active:bg-neutral-50"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
