"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { getTypographyClassName, type TypographyScaleId } from "@/lib/design-system/typography-classnames";

type TypographyProps<T extends ElementType> = {
  as?: T;
  scale?: TypographyScaleId;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const DEFAULT_SCALE: TypographyScaleId = "body-md";

export default function Typography<T extends ElementType = "p">({
  as,
  scale = DEFAULT_SCALE,
  children,
  className,
  ...restProps
}: TypographyProps<T>) {
  const Component = as ?? ("p" as ElementType);
  const typographyClasses = getTypographyClassName(scale);
  const mergedClassName = [typographyClasses, className].filter(Boolean).join(" ");

  return (
    <Component className={mergedClassName} {...restProps}>
      {children}
    </Component>
  );
}


