import type { ReactNode } from "react";
import { typography } from "./typography";

export type HowItWorksStep = {
  title: string;
  description: string;
  icon?: ReactNode;
  meta?: string;
};

export type HowItWorksStepsProps = {
  steps: HowItWorksStep[];
  /**
   * `1` enforces a fully stacked layout, anything else resolves to the 1-or-3 column preset.
   */
  columns?: 1 | 2 | 3;
  className?: string;
};

const THREE_COLUMN_BREAKPOINT_CLASSES = "grid-cols-1 lg:grid-cols-3";

export default function HowItWorksSteps({ steps, columns = 3, className }: HowItWorksStepsProps) {
  const columnClasses = columns === 1 ? "grid-cols-1" : THREE_COLUMN_BREAKPOINT_CLASSES;

  return (
    <div className={`grid gap-6 ${columnClasses} ${className ?? ""}`}>
      {steps.map((step, index) => (
        <article
          key={`${step.title}-${index}`}
          className="rounded-xl border border-black/10 dark:border-white/15 bg-white shadow-lg dark:bg-white/5 px-6 py-8 sm:px-8 sm:py-10 text-black/80 dark:text-white/80 transition hover:border-black/30 dark:hover:border-white/30"
        >
          {step.icon && (
            <div className="mb-6 flex items-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-black/10 bg-black/5 text-2xl font-emoji dark:border-white/20 dark:bg-white/5">
                {step.icon}
              </div>
            </div>
          )}
          <h3 className={typography.stepTitle}>{step.title}</h3>
          <p className={`mt-4 ${typography.stepDescription}`}>{step.description}</p>
          {step.meta && (
            <p className="mt-4 text-xs sm:text-sm font-medium text-black/60 dark:text-white/70">
              {step.meta}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

