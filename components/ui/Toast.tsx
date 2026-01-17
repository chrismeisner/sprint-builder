"use client";

import { useEffect } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

export interface ToastProps {
  message: string;
  variant?: "success" | "info" | "warning" | "error";
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  variant = "info",
  duration = 5000,
  onClose,
}: ToastProps) {
  const bodySmClass = getTypographyClassName("body-sm");

  useEffect(() => {
    if (duration === 0) return;
    
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variantStyles = {
    success: "bg-green-600/10 dark:bg-green-400/10 border-green-600/20 dark:border-green-400/20 text-green-700 dark:text-green-300",
    info: "bg-blue-600/10 dark:bg-blue-400/10 border-blue-600/20 dark:border-blue-400/20 text-blue-700 dark:text-blue-300",
    warning: "bg-amber-600/10 dark:bg-amber-400/10 border-amber-600/20 dark:border-amber-400/20 text-amber-700 dark:text-amber-300",
    error: "bg-red-600/10 dark:bg-red-400/10 border-red-600/20 dark:border-red-400/20 text-red-700 dark:text-red-300",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`max-w-md animate-slide-in-right shadow-lg rounded-md border px-4 py-3 flex items-start gap-3 ${variantStyles[variant]}`}
    >
      <p className={`${bodySmClass} flex-1`}>{message}</p>
      <button
        onClick={onClose}
        className={`${bodySmClass} opacity-70 hover:opacity-100 transition flex-shrink-0`}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}
