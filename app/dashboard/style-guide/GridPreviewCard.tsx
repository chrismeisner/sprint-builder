"use client";

import { useEffect, useRef, useState } from "react";

type GridPreviewCardProps = {
  index: number;
  className: string;
  metaLabel: string;
};

export default function GridPreviewCard({ index, className, metaLabel }: GridPreviewCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState<number | null>(null);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) {
      setCardWidth(null);
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setCardWidth(Math.round(entry.contentRect.width));
      }
    });

    observer.observe(node);
    setCardWidth(Math.round(node.getBoundingClientRect().width));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={cardRef} className={className}>
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
        <span>Card {index + 1}</span>
        <span>{cardWidth === null ? "Measuring…" : `${cardWidth}px`}</span>
      </div>
      <span className="text-xs opacity-70">{metaLabel}</span>
    </div>
  );
}


