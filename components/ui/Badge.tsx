"use client";

import type { ComponentPropsWithoutRef } from "react";

type BadgeVariant = "solid" | "outline" | "subtle" | "metric";

type BadgeProps = {
  variant?: BadgeVariant;
  className?: string;
} & ComponentPropsWithoutRef<"span">;

const BASE_CLASSES =
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  solid: "bg-black text-white dark:bg-white dark:text-black",
  outline: "border border-black/20 text-black dark:border-white/40 dark:text-white",
  subtle: "border border-black/15 bg-white/80 text-black/80 dark:border-white/25 dark:bg-black/40 dark:text-white/80",
  metric: "border border-black/10 bg-black/5 text-black/80 dark:border-white/20 dark:bg-white/10 dark:text-white",
};

export default function Badge({ variant = "solid", className, children, ...restProps }: BadgeProps) {
  const mergedClassName = [BASE_CLASSES, VARIANT_CLASSES[variant], className].filter(Boolean).join(" ");

  return (
    <span className={mergedClassName} {...restProps}>
      {children}
    </span>
  );
}


