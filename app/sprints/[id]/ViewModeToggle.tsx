"use client";

import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Props = {
  isAdminView: boolean;
  onToggle: () => void;
};

export default function ViewModeToggle({ isAdminView, onToggle }: Props) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-0.5">
      <button
        onClick={!isAdminView ? onToggle : undefined}
        disabled={isAdminView}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
          isAdminView
            ? "bg-amber-500 text-white dark:bg-amber-500 dark:text-white shadow-sm cursor-default"
            : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
        } ${getTypographyClassName("button-sm")}`}
      >
        Admin
      </button>
      <button
        onClick={isAdminView ? onToggle : undefined}
        disabled={!isAdminView}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
          !isAdminView
            ? "bg-blue-500 text-white dark:bg-blue-500 dark:text-white shadow-sm cursor-default"
            : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
        } ${getTypographyClassName("button-sm")}`}
      >
        Client
      </button>
    </div>
  );
}
