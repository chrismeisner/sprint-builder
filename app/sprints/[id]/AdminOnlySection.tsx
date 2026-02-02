"use client";

import { ReactNode } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Props = {
  children: ReactNode;
  label?: string;
  className?: string;
};

export default function AdminOnlySection({ children, label = "Admin Only", className = "" }: Props) {
  return (
    <div className={`relative ${className}`}>
      {/* Admin indicator badge */}
      <div className="absolute -top-3 left-3 z-10 pointer-events-none">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/90 dark:bg-amber-400/90 text-white dark:text-black shadow-sm ${getTypographyClassName("mono-sm")} uppercase tracking-wide`}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          {label}
        </span>
      </div>
      {/* Content wrapper with visual distinction */}
      <div className="pt-2 rounded-lg border-2 border-dashed border-amber-400/50 dark:border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/20">
        {children}
      </div>
    </div>
  );
}
