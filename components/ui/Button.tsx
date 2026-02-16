"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "destructiveOutline" | "link" | "accent";
type ButtonSize = "sm" | "md" | "lg";

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded-md font-semibold transition whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-brand-primary text-brand-inverse border border-brand-primary hover:opacity-90",
  secondary: "border border-stroke-muted text-text-primary bg-surface-subtle hover:bg-surface-strong",
  ghost: "bg-transparent text-text-primary hover:bg-surface-subtle",
  destructive: "bg-semantic-danger text-brand-inverse border border-semantic-danger hover:opacity-90",
  destructiveOutline: "border border-semantic-danger text-semantic-danger bg-transparent hover:bg-semantic-danger/10",
  link: "bg-transparent underline text-text-primary hover:text-text-secondary",
  accent: "bg-brand-accent text-brand-inverse border border-brand-accent hover:opacity-90",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: `h-8 px-3`,
  md: `h-10 px-4`,
  lg: `h-12 px-6`,
};

const TYPE_CLASSES: Record<ButtonSize, string> = {
  sm: getTypographyClassName("button-sm"),
  md: getTypographyClassName("button-md"),
  lg: getTypographyClassName("button-md"),
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
  const mergedClassName = [BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], TYPE_CLASSES[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={mergedClassName} {...restProps}>
      {children}
    </Component>
  );
}


