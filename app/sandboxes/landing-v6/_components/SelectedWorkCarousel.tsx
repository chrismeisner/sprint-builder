"use client";

import { useMemo, useState, type TouchEvent } from "react";

type CarouselSlide = {
  id: string;
  title: string;
  caption: string;
};

type SelectedWorkCarouselProps = {
  slides: CarouselSlide[];
};

export default function SelectedWorkCarousel({ slides }: SelectedWorkCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const lastIndex = slides.length - 1;
  const atStart = activeIndex === 0;
  const atEnd = activeIndex === lastIndex;
  const activeSlide = slides[activeIndex];
  const trackTransform = useMemo(() => ({ transform: `translateX(-${activeIndex * 100}%)` }), [activeIndex]);

  function goTo(index: number) {
    setActiveIndex(Math.max(0, Math.min(index, lastIndex)));
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX === null) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = touchStartX - touchEndX;
    const SWIPE_THRESHOLD = 40;

    if (delta > SWIPE_THRESHOLD) goTo(activeIndex + 1);
    if (delta < -SWIPE_THRESHOLD) goTo(activeIndex - 1);
    setTouchStartX(null);
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="flex transition-transform duration-300 ease-out" style={trackTransform}>
          {slides.map((slide) => (
            <div key={slide.id} className="w-full min-w-full shrink-0 basis-full">
              <div className="flex h-80 items-center justify-center rounded-md bg-neutral-200 dark:bg-neutral-800">
                <p className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-400 text-center px-4">
                  {slide.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => goTo(index)}
              className={`size-2 rounded-full transition-colors duration-150 ${
                index === activeIndex ? "bg-text-primary" : "bg-stroke-muted hover:bg-stroke-strong"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => goTo(activeIndex - 1)}
            disabled={atStart}
            className="size-9 rounded-md border border-stroke-muted bg-background text-text-primary transition-colors duration-150 enabled:hover:bg-surface-strong disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => goTo(activeIndex + 1)}
            disabled={atEnd}
            className="size-9 rounded-md border border-stroke-muted bg-background text-text-primary transition-colors duration-150 enabled:hover:bg-surface-strong disabled:opacity-40 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
      </div>

      <p className="text-xs font-normal leading-normal text-text-muted">{activeSlide.caption}</p>
    </div>
  );
}
