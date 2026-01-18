"use client";

import { useEffect, useRef } from "react";
import Typography from "./Typography";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    const clickedInDialog =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!clickedInDialog) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const confirmButtonClass =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 shadow-sm"
      : "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 shadow-sm";

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="backdrop:bg-black/60 backdrop:backdrop-blur-sm bg-white dark:bg-neutral-900 rounded-lg shadow-2xl border border-black/10 dark:border-white/10 p-0 max-w-md w-full mx-4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fixed"
      style={{ margin: 0 }}
    >
      <div className="p-6 space-y-4">
        <Typography as="h2" scale="h3" className="text-black dark:text-white">
          {title}
        </Typography>

        <Typography as="p" scale="body-md" className="text-black/70 dark:text-white/70">
          {message}
        </Typography>

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className={`${getTypographyClassName("button-sm")} px-4 py-2 rounded-md border border-black/15 dark:border-white/20 bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`${getTypographyClassName("button-sm")} px-4 py-2 rounded-md transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </dialog>
  );
}
