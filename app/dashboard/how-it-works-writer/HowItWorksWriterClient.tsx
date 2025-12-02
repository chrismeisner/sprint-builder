"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  EMPHASIS_OPTIONS,
  FORMAT_OPTIONS,
  HOW_IT_WORKS_MAX_STEPS,
  HOW_IT_WORKS_MIN_STEPS,
  HowItWorksOption,
  HowItWorksPlan,
  PERSONALITY_OPTIONS,
  STRATEGY_OPTIONS,
} from "@/lib/how-it-works-writer";

type PromptPreview = {
  mission: string;
  productExplanation: string;
  steps: number;
  strategy: { label: string; guidance: string } | null;
  personality: { label: string; guidance: string } | null;
  emphasis: { label: string; guidance: string } | null;
  format: { label: string; guidance: string } | null;
};

type GenerationMeta = {
  model?: string;
  requestId?: string;
  stepsRequested: number;
  stepsReturned: number;
  truncatedSteps?: boolean;
};

function findOption(options: HowItWorksOption[], value: string) {
  return options.find((option) => option.value === value) ?? options[0];
}

export default function HowItWorksWriterClient() {
  const [productStory, setProductStory] = useState("");
  const [stepCount, setStepCount] = useState(3);
  const [strategy, setStrategy] = useState(STRATEGY_OPTIONS[0].value);
  const [personality, setPersonality] = useState(PERSONALITY_OPTIONS[0].value);
  const [emphasis, setEmphasis] = useState(EMPHASIS_OPTIONS[0].value);
  const [format, setFormat] = useState(FORMAT_OPTIONS[0].value);
  const [statusMessage, setStatusMessage] = useState("Waiting for input.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [plan, setPlan] = useState<HowItWorksPlan | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [generationMeta, setGenerationMeta] = useState<GenerationMeta | null>(null);

  const selectedStrategy = findOption(STRATEGY_OPTIONS, strategy);
  const selectedPersonality = findOption(PERSONALITY_OPTIONS, personality);
  const selectedEmphasis = findOption(EMPHASIS_OPTIONS, emphasis);
  const selectedFormat = findOption(FORMAT_OPTIONS, format);

  const promptPreview = useMemo<PromptPreview>(
    () => ({
      mission: "Spin up a How It Works module with world-class clarity.",
      productExplanation: productStory.trim() || "(pending description)",
      steps: stepCount,
      strategy: selectedStrategy
        ? { label: selectedStrategy.label, guidance: selectedStrategy.guidance }
        : null,
      personality: selectedPersonality
        ? { label: selectedPersonality.label, guidance: selectedPersonality.guidance }
        : null,
      emphasis: selectedEmphasis
        ? { label: selectedEmphasis.label, guidance: selectedEmphasis.guidance }
        : null,
      format: selectedFormat ? { label: selectedFormat.label, guidance: selectedFormat.guidance } : null,
    }),
    [productStory, stepCount, selectedStrategy, selectedPersonality, selectedEmphasis, selectedFormat]
  );

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedStory = productStory.trim();
    if (!trimmedStory) {
      setStatusMessage("Add a product explanation before generating a draft.");
      setPlan(null);
      setApiError("Product explanation is required.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Sending brief to GPT…");
    setApiError(null);
    setPlan(null);
    setGenerationMeta(null);

    try {
      const response = await fetch("/api/admin/how-it-works-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productExplanation: trimmedStory,
          steps: stepCount,
          strategy,
          personality,
          emphasis,
          format,
        }),
      });

      const payload = (await response.json()) as {
        plan?: HowItWorksPlan;
        meta?: GenerationMeta;
        error?: string;
      };

      if (!response.ok || !payload.plan) {
        const message = payload.error || "Unable to generate copy.";
        setApiError(message);
        setStatusMessage("Generation failed. Try again.");
        return;
      }

      setPlan(payload.plan);
      setGenerationMeta(payload.meta ?? null);

      const matchingSteps =
        payload.meta && payload.meta.stepsReturned === payload.meta.stepsRequested
          ? "Draft ready."
          : `Draft ready (${payload.meta?.stepsReturned ?? "?"}/${payload.meta?.stepsRequested ?? "?"} steps).`;

      setStatusMessage(matchingSteps);
    } catch (error) {
      setApiError((error as Error).message);
      setStatusMessage("Generation failed. Check console for details.");
    } finally {
      setIsSubmitting(false);
      setLastRun(new Date());
    }
  }

  function handleReset() {
    setProductStory("");
    setStepCount(3);
    setStrategy(STRATEGY_OPTIONS[0].value);
    setPersonality(PERSONALITY_OPTIONS[0].value);
    setEmphasis(EMPHASIS_OPTIONS[0].value);
    setFormat(FORMAT_OPTIONS[0].value);
    setPlan(null);
    setApiError(null);
    setGenerationMeta(null);
    setStatusMessage("Cleared. Ready for another run.");
    setLastRun(null);
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">Internal tool</p>
        <h1 className="text-3xl font-semibold">How It Works Writer</h1>
        <p className="text-sm text-black/70 dark:text-white/60 max-w-3xl">
          Feed in any product or service description, pick a strategy that fits the brief, then ship fully
          formatted “how it works” copy powered by our OpenAI connection.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr,minmax(320px,1fr)]">
        <form onSubmit={handleGenerate} className="space-y-6">
          <section className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 shadow-sm space-y-4">
            <div>
              <label htmlFor="product-story" className="text-sm font-medium">
                Product explanation
              </label>
              <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                Any offering works—SaaS, services, hardware. Describe the audience, trigger, and promise.
              </p>
            </div>
            <textarea
              id="product-story"
              value={productStory}
              onChange={(event) => setProductStory(event.target.value)}
              rows={8}
              className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/40 dark:focus:ring-white/40"
              placeholder="Example: We help product teams launch AI features..."
            />
          </section>

          <section className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 shadow-sm grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="step-count" className="text-sm font-medium">
                Number of steps
              </label>
              <input
                id="step-count"
                type="number"
                min={HOW_IT_WORKS_MIN_STEPS}
                max={HOW_IT_WORKS_MAX_STEPS}
                value={stepCount}
                onChange={(event) => {
                  const parsed = Number(event.target.value);
                  if (Number.isNaN(parsed)) {
                    setStepCount(3);
                    return;
                  }
                  const normalized = Math.min(HOW_IT_WORKS_MAX_STEPS, Math.max(HOW_IT_WORKS_MIN_STEPS, parsed));
                  setStepCount(normalized);
                }}
                className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/40 dark:focus:ring-white/40"
              />
              <p className="text-xs text-black/60 dark:text-white/60">
                We enforce {HOW_IT_WORKS_MIN_STEPS}–{HOW_IT_WORKS_MAX_STEPS} steps for readability.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Strategy</label>
              <select
                value={strategy}
                onChange={(event) => setStrategy(event.target.value)}
                className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/40 dark:focus:ring-white/40"
              >
                {STRATEGY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-black/60 dark:text-white/60">{selectedStrategy.description}</p>
            </div>
          </section>

          <section className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 shadow-sm grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Personality</label>
              <select
                value={personality}
                onChange={(event) => setPersonality(event.target.value)}
                className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/40 dark:focus:ring-white/40"
              >
                {PERSONALITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-black/60 dark:text-white/60">{selectedPersonality.description}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Emphasis</label>
              <select
                value={emphasis}
                onChange={(event) => setEmphasis(event.target.value)}
                className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/40 dark:focus:ring-white/40"
              >
                {EMPHASIS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-black/60 dark:text-white/60">{selectedEmphasis.description}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <select
                value={format}
                onChange={(event) => setFormat(event.target.value)}
                className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/40 dark:focus:ring-white/40"
              >
                {FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-black/60 dark:text-white/60">{selectedFormat.description}</p>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? "Generating…" : "Generate with GPT"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center rounded-lg border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Reset form
            </button>
            <p className="text-xs text-black/60 dark:text-white/60">
              Powered by OpenAI (gpt-4o mini by default). Results stay internal.
            </p>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Status</h2>
                <p className="text-xs text-black/60 dark:text-white/60">{statusMessage}</p>
              </div>
              {lastRun && (
                <span className="text-[11px] text-black/50 dark:text-white/50">
                  Last run {lastRun.toLocaleTimeString()}
                </span>
              )}
            </div>
            {generationMeta && (
              <dl className="text-[11px] text-black/60 dark:text-white/60 grid grid-cols-2 gap-y-1">
                {generationMeta.model && (
                  <>
                    <dt className="uppercase tracking-widest">Model</dt>
                    <dd className="text-right">{generationMeta.model}</dd>
                  </>
                )}
                {generationMeta.requestId && (
                  <>
                    <dt className="uppercase tracking-widest">Request</dt>
                    <dd className="text-right truncate">{generationMeta.requestId}</dd>
                  </>
                )}
                <dt className="uppercase tracking-widest">Steps</dt>
                <dd className="text-right">
                  {generationMeta.stepsReturned}/{generationMeta.stepsRequested}
                </dd>
              </dl>
            )}
            {apiError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                {apiError}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Prompt payload preview</h2>
              <span className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40">Live</span>
            </div>
            <pre className="text-xs whitespace-pre-wrap rounded-lg bg-black/[0.04] dark:bg-white/[0.05] p-4 font-mono">
              {JSON.stringify(promptPreview, null, 2)}
            </pre>
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">AI Draft</h2>
                <p className="text-[11px] text-black/60 dark:text-white/60">
                  Structurally-ready copy for the 1-pager module.
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40">
                {plan ? "Generated" : "Awaiting run"}
              </span>
            </div>

            {generationMeta && generationMeta.stepsReturned !== generationMeta.stepsRequested && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Model returned {generationMeta.stepsReturned} of {generationMeta.stepsRequested} requested steps.
              </p>
            )}

            {plan ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[11px] tracking-[0.2em] uppercase text-black/50 dark:text-white/40">
                    Headline
                  </p>
                  <p className="text-lg font-semibold">{plan.headline}</p>
                  <p className="text-sm text-black/70 dark:text-white/70">{plan.intro}</p>
                </div>

                <ol className="space-y-3">
                  {plan.steps.map((step, index) => (
                    <li
                      key={`${step.title}-${index}`}
                      className="rounded-lg border border-black/5 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.03] p-4 space-y-2"
                    >
                      <div className="text-sm font-semibold">
                        {index + 1}. {step.title}
                      </div>
                      <p className="text-sm text-black/70 dark:text-white/70">{step.description}</p>
                      {step.proofPoint && (
                        <p className="text-xs text-black/60 dark:text-white/60">
                          Proof: <span className="font-medium">{step.proofPoint}</span>
                        </p>
                      )}
                      {step.successSignal && (
                        <p className="text-xs text-black/60 dark:text-white/60">
                          Success signal: <span className="font-medium">{step.successSignal}</span>
                        </p>
                      )}
                    </li>
                  ))}
                </ol>

                {plan.callToAction && (
                  <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 text-sm">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-black/40 dark:text-white/50">
                      CTA
                    </p>
                    <p className="text-sm text-black/80 dark:text-white/80">{plan.callToAction}</p>
                  </div>
                )}

                {(plan.toneNotes || plan.formatNotes || plan.outro) && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {plan.toneNotes && (
                      <div className="rounded-lg bg-black/[0.03] dark:bg-white/[0.05] p-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-black/40 dark:text-white/50">
                          Tone notes
                        </p>
                        <p className="text-xs text-black/70 dark:text-white/70">{plan.toneNotes}</p>
                      </div>
                    )}
                    {plan.formatNotes && (
                      <div className="rounded-lg bg-black/[0.03] dark:bg-white/[0.05] p-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-black/40 dark:text-white/50">
                          Format notes
                        </p>
                        <p className="text-xs text-black/70 dark:text-white/70">{plan.formatNotes}</p>
                      </div>
                    )}
                    {plan.outro && (
                      <div className="rounded-lg bg-black/[0.03] dark:bg-white/[0.05] p-3 md:col-span-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-black/40 dark:text-white/50">
                          Outro
                        </p>
                        <p className="text-xs text-black/70 dark:text-white/70">{plan.outro}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-black/60 dark:text-white/60">
                Configure the brief and run the generator to see a finished “How It Works” block.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
