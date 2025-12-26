"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";

type FadeInSectionProps<T extends ElementType = "section"> = {
  as?: T;
  children: ReactNode;
  /**
   * Run the animation only the first time the element enters the viewport.
   */
  once?: boolean;
  /**
   * IntersectionObserver threshold. Lower = triggers sooner.
   */
  threshold?: number;
  /**
   * Optional delay in milliseconds for staggering.
   */
  delayMs?: number;
  /**
   * Immediately trigger the fade on mount (useful for above-the-fold sections).
   */
  triggerOnMount?: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export default function FadeInSection<T extends ElementType = "section">({
  as,
  children,
  once = true,
  threshold = 0.15,
  delayMs,
  triggerOnMount = false,
  className,
  ...rest
}: FadeInSectionProps<T>) {
  const { style, ...restProps } = rest;
  const Component = (as ?? "section") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setIsVisible(true);
      return undefined;
    }

    let frameId: number | undefined;
    if (triggerOnMount) {
      frameId = requestAnimationFrame(() => setIsVisible(true));
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      { threshold },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [once, threshold, triggerOnMount]);

  const baseClasses = "opacity-0 transition-opacity duration-[1400ms] ease-out motion-reduce:transition-none";
  const visibleClasses = "opacity-100";
  const mergedStyle =
    delayMs || style
      ? {
          ...(delayMs ? { transitionDelay: `${delayMs}ms` } : undefined),
          ...style,
        }
      : undefined;

  return (
    <Component
      ref={ref}
      className={[baseClasses, isVisible && visibleClasses, className].filter(Boolean).join(" ")}
      style={mergedStyle}
      {...restProps}
    >
      {children}
    </Component>
  );
}

