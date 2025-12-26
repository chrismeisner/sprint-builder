"use client";

import type { ReactNode } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

export type FAQItem = {
  question: string;
  answer: ReactNode;
};

type FAQSectionProps = {
  eyebrow?: string;
  heading?: string;
  description?: string;
  items: FAQItem[];
  className?: string;
};

const eyebrowClasses = cx(getTypographyClassName("subtitle-sm"), "uppercase tracking-[0.35em] text-text-muted");
const headingClasses = cx(getTypographyClassName("h2"), "text-balance text-text-primary");
const descriptionClasses = cx(getTypographyClassName("subtitle-lg"), "text-balance text-text-secondary");
const questionClasses = cx(getTypographyClassName("h3"), "text-lg text-text-primary");
const answerClasses = cx(getTypographyClassName("body-md"), "mt-4 text-text-secondary");

export default function FAQSection({ eyebrow, heading, description, items, className }: FAQSectionProps) {
  const showHeader = Boolean(eyebrow || heading || description);

  return (
    <section className={cx("py-16", className)}>
      <div className="container">
        <div className="mx-auto max-w-4xl space-y-10">
          {showHeader && (
            <div className="space-y-3 text-center">
              {eyebrow && <p className={eyebrowClasses}>{eyebrow}</p>}
              {heading && <h2 className={headingClasses}>{heading}</h2>}
              {description && <p className={descriptionClasses}>{description}</p>}
            </div>
          )}

          <div className="space-y-4">
            {items.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-stroke-muted bg-surface-card px-6 py-5 text-left shadow-sm transition"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className={questionClasses}>{item.question}</span>
                  <span className="text-2xl text-text-muted transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <div className={answerClasses}>{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
