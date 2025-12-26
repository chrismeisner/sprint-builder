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
  "rounded-md border border-dashed border-stroke-muted bg-surface-subtle px-3 py-3 flex flex-col gap-1 justify-center";

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
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted">Grid sample</div>
          <h1 className="text-3xl font-bold text-text-primary">Grid Builder Preview</h1>
          <p className="text-sm text-text-secondary">
            Generated from the Grid Builder. Use this isolated preview to screenshot or iterate on the configuration.
          </p>
        </header>

        <div className="rounded-lg border border-stroke-muted bg-surface-card p-4 space-y-3 text-xs text-text-primary">
          <div className="font-semibold uppercase tracking-wide text-text-secondary">Configuration</div>
          <div className="flex flex-wrap gap-3">
            {detailItems.map((item) => (
              <code key={`${item.label}-${item.value}`} className="rounded bg-surface-subtle px-2 py-1 text-[11px] font-semibold text-text-primary">
                {item.label}: {item.value}
              </code>
            ))}
          </div>
        </div>

        <WidthRuler targetRef={previewRef} label="Current width" className="text-text-muted" />
        <div ref={previewRef} className="rounded-lg border border-stroke-muted bg-surface-card p-0 overflow-hidden">
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


