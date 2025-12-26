"use client";

import type { ComponentPropsWithoutRef } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type BadgeVariant = "solid" | "outline" | "subtle" | "metric";

type BadgeProps = {
  variant?: BadgeVariant;
  className?: string;
} & ComponentPropsWithoutRef<"span">;

const TYPOGRAPHY_BODY = getTypographyClassName("body-sm");
const BASE_CLASSES = "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  solid: "bg-brand-primary text-brand-inverse",
  outline: "border border-stroke-strong text-text-primary",
  subtle: "border border-stroke-muted bg-surface-subtle text-text-secondary",
  metric: "border border-stroke-muted bg-surface-strong text-text-secondary",
};

export default function Badge({ variant = "solid", className, children, ...restProps }: BadgeProps) {
  const mergedClassName = [BASE_CLASSES, TYPOGRAPHY_BODY, VARIANT_CLASSES[variant], className].filter(Boolean).join(" ");

  return (
    <span className={mergedClassName} {...restProps}>
      {children}
    </span>
  );
}


