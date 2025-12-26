import type { ReactNode } from "react";
import { typography } from "./typography";

type GettingStartedStepProps = {
  number: string | number;
  title: ReactNode;
  body: ReactNode;
  className?: string;
  variant?: "card" | "flat";
};

const CARD_BASE =
  "flex h-full flex-col rounded-2xl border p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:shadow-none";
const BASE_STACK_CLASS = "grid gap-6";

export function getGettingStartedStackClassName(stepCount: number, baseClassName = BASE_STACK_CLASS): string {
  if (stepCount <= 1) {
    return baseClassName;
  }

  if (stepCount === 2) {
    return `${baseClassName} md:grid-cols-2`;
  }

  if (stepCount === 3) {
    return `${baseClassName} md:grid-cols-3`;
  }

  if (stepCount === 4) {
    return `${baseClassName} md:grid-cols-4`;
  }

  return `${baseClassName} md:grid-cols-2 xl:grid-cols-3`;
}

export default function GettingStartedStep({
  number,
  title,
  body,
  className,
  variant = "card",
}: GettingStartedStepProps) {
  if (variant === "flat") {
    return (
      <div className={`border-t border-stroke-muted pt-6 first:border-t-0 first:pt-0 ${className ?? ""}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-stroke-muted text-base font-semibold text-text-primary">
            {number}
          </div>
          <div className="space-y-1">
            <h3 className={typography.headingCard}>{title}</h3>
            <div className={typography.bodyBase}>{body}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className={`${CARD_BASE} border-stroke-muted bg-surface-card ${className ?? ""}`}>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-brand-inverse">
            <span className={`${typography.bodySm} font-semibold tracking-[0.15em] text-brand-inverse`}>{number}</span>
          </div>
          <h3 className={typography.headingCard}>{title}</h3>
        </div>
        <div className={`${typography.bodyBase} text-sm sm:text-base`}>{body}</div>
      </div>
    </article>
  );
}

