"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "destructiveOutline" | "link";
type ButtonSize = "sm" | "md" | "lg";

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded-md font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/60 dark:focus-visible:ring-white/60 disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-black text-white border border-black hover:opacity-90 dark:bg-white dark:text-black dark:border-white uppercase tracking-wide",
  secondary:
    "border border-black/15 text-black bg-transparent hover:bg-black/5 dark:border-white/25 dark:text-white dark:hover:bg-white/10 uppercase tracking-wide",
  ghost: "bg-transparent text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10 uppercase tracking-wide",
  destructive: "bg-red-600 text-white border border-red-600 hover:bg-red-700 uppercase tracking-wide",
  destructiveOutline: "border border-red-600 text-red-600 bg-transparent hover:bg-red-50 dark:hover:bg-red-950 uppercase tracking-wide",
  link: "bg-transparent underline text-black hover:opacity-80 dark:text-white normal-case tracking-normal",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[11px]",
  md: "h-10 px-4 text-xs",
  lg: "h-12 px-6 text-sm",
};

type ButtonProps<T extends ElementType> = {
  as?: T;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export default function Button<T extends ElementType = "button">({
  as,
  variant = "primary",
  size = "md",
  className,
  children,
  ...restProps
}: ButtonProps<T>) {
  const Component = as ?? ("button" as ElementType);
  const mergedClassName = [BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className].filter(Boolean).join(" ");

  return (
    <Component className={mergedClassName} {...restProps}>
      {children}
    </Component>
  );
}


