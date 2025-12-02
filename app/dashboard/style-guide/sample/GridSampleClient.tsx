"use client";

import { useMemo, useRef } from "react";
import WidthRuler from "@/components/WidthRuler";
import GridPreviewCard from "../GridPreviewCard";

type GridSampleClientProps = {
  cardCount: number;
  mode: "auto" | "manual";
  gapClass: string;
  paddingClass: string;
  widthClass: string;
  autoTemplateClass: string;
  autoLabel: string;
  manualSpanClass: string;
  manualLabel: string;
};

const GRID_PREVIEW_BLOCK_BASE_CLASS =
  "rounded-md border border-dashed border-black/15 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-3 flex flex-col gap-1 justify-center";

const clampCardCount = (value: number) => Math.min(Math.max(value, 1), 12);

export default function GridSampleClient({
  cardCount,
  mode,
  gapClass,
  paddingClass,
  widthClass,
  autoTemplateClass,
  autoLabel,
  manualSpanClass,
  manualLabel,
}: GridSampleClientProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const cards = useMemo(() => Array.from({ length: clampCardCount(cardCount) }, (_, index) => index), [cardCount]);
  const gridClass =
    mode === "auto" ? `grid grid-cols-1 ${gapClass} ${autoTemplateClass}` : `grid grid-cols-1 md:grid-cols-12 ${gapClass}`;
  const cardClass = mode === "auto" ? GRID_PREVIEW_BLOCK_BASE_CLASS : `${GRID_PREVIEW_BLOCK_BASE_CLASS} ${manualSpanClass}`;
  const metaLabel = mode === "auto" ? autoLabel : manualLabel;

  const detailItems = [
    { label: "Mode", value: mode === "auto" ? "Auto-fit" : "Manual spans" },
    { label: "Cards", value: clampCardCount(cardCount).toString() },
    { label: "Gap", value: gapClass },
    { label: "Padding", value: paddingClass },
    { label: "Width", value: widthClass },
    mode === "auto" ? { label: "Min width", value: autoTemplateClass } : { label: "Card span", value: manualSpanClass },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-black/50 dark:text-white/50">Grid sample</div>
          <h1 className="text-3xl font-bold">Grid Builder Preview</h1>
          <p className="text-sm text-black/70 dark:text-white/70">
            Generated from the Grid Builder. Use this isolated preview to screenshot or iterate on the configuration.
          </p>
        </header>

        <div className="rounded-lg border border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/40 p-4 space-y-3 text-xs">
          <div className="font-semibold uppercase tracking-wide text-black/70 dark:text-white/70">Configuration</div>
          <div className="flex flex-wrap gap-3">
            {detailItems.map((item) => (
              <code key={`${item.label}-${item.value}`} className="rounded bg-black/5 dark:bg-white/10 px-2 py-1 text-[11px] font-semibold">
                {item.label}: {item.value}
              </code>
            ))}
          </div>
        </div>

        <WidthRuler targetRef={previewRef} label="Current width" className="text-black/60 dark:text-white/60" />
        <div ref={previewRef} className="rounded-lg border border-black/10 dark:border-white/15 bg-white/70 dark:bg-black/40 p-0 overflow-hidden">
          <div className={widthClass}>
            <div className={`${paddingClass} py-6`}>
              <div className={gridClass}>
                {cards.map((cardIndex) => (
                  <GridPreviewCard key={`sample-card-${cardIndex}`} index={cardIndex} className={cardClass} metaLabel={metaLabel} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


