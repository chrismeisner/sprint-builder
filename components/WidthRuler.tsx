"use client";

import { useEffect, useState, type RefObject } from "react";

type WidthRulerProps = {
  targetRef: RefObject<HTMLElement>;
  label?: string;
  className?: string;
};

const formatWidth = (width: number | null) => {
  if (width === null) {
    return "Measuring…";
  }
  const rounded = Math.round(width);
  const rem = (rounded / 16).toFixed(2);
  return `${rounded}px · ${rem}rem`;
};

export default function WidthRuler({ targetRef, label = "Current width", className }: WidthRulerProps) {
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const node = targetRef.current;
    if (!node) {
      setMeasuredWidth(null);
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setMeasuredWidth(Math.round(entry.contentRect.width));
      }
    });

    observer.observe(node);
    setMeasuredWidth(Math.round(node.getBoundingClientRect().width));

    return () => {
      observer.disconnect();
    };
  }, [targetRef]);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide ${className ?? ""}`}>
      <span className="text-black/60 dark:text-white/60">{label}</span>
      <span className="inline-flex items-center rounded-full border border-black/10 dark:border-white/15 bg-white/80 px-3 py-1 text-black dark:bg-black/60 dark:text-white">
        {formatWidth(measuredWidth)}
      </span>
    </div>
  );
}


