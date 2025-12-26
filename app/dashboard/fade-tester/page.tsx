"use client";

import { useState } from "react";
import FadeInSection from "@/app/components/FadeInSection";
import Typography from "@/components/ui/Typography";

const DEFAULTS = {
  threshold: 0.15,
  delayMs: 0,
  durationMs: 1400,
  once: false,
  triggerOnMount: false,
};

const FADE_TARGETS = ["Fade target A", "Fade target B", "Fade target C"];

export default function FadeTesterPage() {
  const [threshold, setThreshold] = useState(DEFAULTS.threshold);
  const [delayMs, setDelayMs] = useState(DEFAULTS.delayMs);
  const [durationMs, setDurationMs] = useState(DEFAULTS.durationMs);
  const [once, setOnce] = useState(DEFAULTS.once);
  const [triggerOnMount, setTriggerOnMount] = useState(DEFAULTS.triggerOnMount);
  const [iteration, setIteration] = useState(0);
  const [showTarget, setShowTarget] = useState(true);
  const [ease, setEase] = useState("ease-out");
  const [copyLabel, setCopyLabel] = useState("Copy");

  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
  const clampMin0 = (value: number) => Math.max(0, value);

  const rerun = () => {
    setShowTarget(true);
    setIteration((count) => count + 1);
  };

  const reset = () => {
    setThreshold(DEFAULTS.threshold);
    setDelayMs(DEFAULTS.delayMs);
    setDurationMs(DEFAULTS.durationMs);
    setOnce(DEFAULTS.once);
    setTriggerOnMount(DEFAULTS.triggerOnMount);
    setShowTarget(false);
  };

  const copySettings = async () => {
    const settings = {
      once,
      threshold,
      delayMs,
      triggerOnMount,
      transitionDurationMs: durationMs,
      easeClass: ease,
      notes: "Apply transitionDuration via inline style or CSS variable.",
    };

    const text = [
      "FadeInSection settings:",
      JSON.stringify(settings, null, 2),
      "",
      "Example:",
      `<FadeInSection`,
      `  once={${once}}`,
      `  threshold={${threshold}}`,
      `  delayMs={${delayMs}}`,
      `  triggerOnMount={${triggerOnMount}}`,
      `  className="${ease} /* plus other classes */"`,
      `  style={{ transitionDuration: "${durationMs}ms" }}`,
      `/>`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel("Copied");
      setTimeout(() => setCopyLabel("Copy"), 1500);
    } catch (error) {
      console.error("Failed to copy settings", error);
      setCopyLabel("Copy failed");
      setTimeout(() => setCopyLabel("Copy"), 2000);
    }
  };

  return (
    <main className="container py-10 space-y-10">
      <header className="space-y-2">
        <Typography as="h1" scale="h2" className="text-text-primary">
          Fade Tester
        </Typography>
        <Typography as="p" scale="body-md" className="text-text-secondary max-w-3xl">
          Uses the same <code>FadeInSection</code> component as the landing page. Adjust props, scroll the preview, and
          lock in fade timing before shipping changes.
        </Typography>
      </header>

      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <section className="rounded-xl border border-stroke-muted bg-surface-card p-5 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <Typography as="h2" scale="h3">
              Controls
            </Typography>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={rerun}
                className="rounded-md border border-stroke-muted px-3 py-1.5 text-sm font-medium hover:bg-surface-strong transition"
              >
                Run
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-stroke-muted px-3 py-1.5 text-sm font-medium hover:bg-surface-strong transition"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={copySettings}
                className="rounded-md border border-stroke-muted px-3 py-1.5 text-sm font-medium hover:bg-surface-strong transition"
              >
                {copyLabel}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <Typography as="span" scale="body-sm" className="font-medium">
                  Intersection threshold
                </Typography>
                <Typography as="span" scale="body-sm" className="text-text-secondary">
                  {threshold.toFixed(2)}
                </Typography>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={threshold}
                onChange={(event) => setThreshold(clamp01(Number(event.target.value) || 0))}
                className="w-full accent-brand-primary"
              />
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={threshold}
                onChange={(event) => setThreshold(clamp01(Number(event.target.value) || 0))}
                className="w-full rounded-md border border-stroke-muted bg-surface-subtle px-3 py-2 text-sm"
              />
              <Typography as="p" scale="subtitle-sm" className="text-text-secondary">
                Lower values trigger sooner. Set to 0 to fire as soon as the block touches the viewport.
              </Typography>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <Typography as="span" scale="body-sm" className="font-medium">
                  Delay (ms)
                </Typography>
                <Typography as="span" scale="body-sm" className="text-text-secondary">
                  {delayMs} ms
                </Typography>
              </label>
              <input
                type="number"
                min={0}
                step={50}
                value={delayMs}
                onChange={(event) => setDelayMs(clampMin0(Number(event.target.value) || 0))}
                className="w-full rounded-md border border-stroke-muted bg-surface-subtle px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <Typography as="span" scale="body-sm" className="font-medium">
                  Duration (ms)
                </Typography>
                <Typography as="span" scale="body-sm" className="text-text-secondary">
                  {durationMs} ms
                </Typography>
              </label>
              <input
                type="number"
                min={0}
                step={100}
                value={durationMs}
                onChange={(event) => setDurationMs(clampMin0(Number(event.target.value) || 0))}
                className="w-full rounded-md border border-stroke-muted bg-surface-subtle px-3 py-2 text-sm"
              />
              <Typography as="p" scale="subtitle-sm" className="text-text-secondary">
                Inline style overrides the default 1400ms duration baked into <code>FadeInSection</code>.
              </Typography>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <Typography as="span" scale="body-sm" className="font-medium">
                  Ease
                </Typography>
                <Typography as="span" scale="body-sm" className="text-text-secondary">
                  {ease.replace("ease-", "")}
                </Typography>
              </label>
              <select
                value={ease}
                onChange={(event) => setEase(event.target.value)}
                className="w-full rounded-md border border-stroke-muted bg-surface-subtle px-3 py-2 text-sm"
              >
                <option value="ease-out">ease-out (default)</option>
                <option value="ease-in">ease-in</option>
                <option value="ease-in-out">ease-in-out</option>
                <option value="ease-linear">linear</option>
                <option value="ease-[cubic-bezier(0.22,0.61,0.36,1)]">cubic-bezier(0.22,0.61,0.36,1)</option>
                <option value="ease-[cubic-bezier(0.4,0,0.2,1)]">cubic-bezier(0.4,0,0.2,1)</option>
              </select>
              <Typography as="p" scale="subtitle-sm" className="text-text-secondary">
                Applied as a Tailwind ease class on the fade target.
              </Typography>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Typography as="p" scale="body-sm" className="font-medium">
                  Trigger on mount
                </Typography>
                <Typography as="p" scale="subtitle-sm" className="text-text-secondary">
                  Fire immediately without waiting for intersection.
                </Typography>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={triggerOnMount}
                onClick={() => setTriggerOnMount((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all ${
                  triggerOnMount ? "bg-brand-primary border-brand-primary" : "bg-surface-subtle border-stroke-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                    triggerOnMount ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Typography as="p" scale="body-sm" className="font-medium">
                  Run only once
                </Typography>
                <Typography as="p" scale="subtitle-sm" className="text-text-secondary">
                  With this off, scroll the block out of view and back to see fade-out then fade-in.
                </Typography>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={once}
                onClick={() => setOnce((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all ${
                  once ? "bg-brand-primary border-brand-primary" : "bg-surface-subtle border-stroke-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                    once ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-stroke-muted bg-surface-card p-5 space-y-4 shadow-sm">
          <div className="space-y-1">
            <Typography as="h2" scale="h3">
              Preview
            </Typography>
            <Typography as="p" scale="body-sm" className="text-text-secondary">
              Trigger the fade by scrolling the page normally. With "Run only once" off, scroll past the block and back
              into view to observe fade-out and fade-in.
            </Typography>
          </div>

          <div className="rounded-lg border border-dashed border-stroke-muted bg-surface-subtle p-4 space-y-20">
            <div className="h-10" />
            {FADE_TARGETS.map((label, index) => (
              <FadeInSection
                key={`${iteration}-${index}`}
                once={once}
                threshold={threshold}
                delayMs={delayMs}
                triggerOnMount={triggerOnMount}
                className={`grid place-items-center rounded-xl border border-brand-primary/30 bg-white text-text-primary px-8 py-16 text-center shadow-sm ${ease}`}
                style={{ transitionDuration: `${durationMs}ms`, display: showTarget ? undefined : "none" }}
              >
                <div className="space-y-2">
                  <Typography as="p" scale="h3" className="text-text-primary">
                    {label}
                  </Typography>
                  <Typography as="p" scale="body-md" className="text-text-secondary">
                    Duration {durationMs}ms · Delay {delayMs}ms · Threshold {threshold.toFixed(2)}
                  </Typography>
                  <Typography as="p" scale="subtitle-sm" className="text-text-secondary">
                    Scroll to trigger. Use controls to tweak the feel.
                  </Typography>
                </div>
              </FadeInSection>
            ))}
            <div className="h-64" />
          </div>
        </section>
      </div>

    </main>
  );
}
