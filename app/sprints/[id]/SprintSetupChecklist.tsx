"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "@/app/components/typography";

type Props = {
  className?: string;
};

export default function SprintSetupChecklist({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const t = {
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    label: `${getTypographyClassName("subtitle-sm")} text-text-muted`,
    heading: `${typography.headingCard}`,
    chip: `${getTypographyClassName("subtitle-sm")} uppercase tracking-wide`,
    button: getTypographyClassName("button-sm"),
  };

  const steps = [
    {
      title: "1. Review Draft Sprint Deliverables",
      detail: "Check that the scope, prices, and timeline match your needs. You can edit deliverables below.",
      emphasis: true,
    },
    {
      title: "2. Confirm Deliverables with Studio",
      detail: "Approve the draft sprint or request an optional 15-min discovery call.",
    },
    {
      title: "3. Choose Your Kickoff Monday",
      detail: "Select your preferred start date from the studio's available Mondays.",
    },
    {
      title: "4. Sign Sprint Agreement",
      detail: "Agreement auto-generated with your deliverables, pricing, and schedule.",
    },
    {
      title: "5. Pay 50% Deposit",
      detail: "Secure your sprint slot (Stripe link provided automatically).",
    },
  ];

  return (
    <div
      className={`rounded-lg border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-6 ${t.bodySm} ${className || ""}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div className="space-y-1">
            <h2 className={t.heading}>Sprint Setup Checklist</h2>
            <p className={t.bodySm}>
              Complete these 5 steps to activate your sprint. Most clients complete this in under 10 minutes.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className={`inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition ${t.button}`}
        >
          <span>{isOpen ? "Collapse" : "Expand"}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3 mt-5">
          {steps.map((step) => (
            <div
              key={step.title}
              className={`rounded-lg p-4 border ${
                step.emphasis
                  ? "border-green-200 dark:border-green-800 bg-white dark:bg-black/40"
                  : "border-gray-200 dark:border-gray-700 bg-white/40 dark:bg-black/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 mt-0.5"></div>
                <div className="flex-1 space-y-1">
                  <h3 className={getTypographyClassName("subtitle-md")}>{step.title}</h3>
                  <p className={t.bodySm}>{step.detail}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-green-200 dark:border-green-800 text-center space-y-1">
            <p className={getTypographyClassName("subtitle-sm")}>
              🎉 Once these 5 steps are complete → Your Sprint Is Locked In
            </p>
            <p className={`${t.bodySm} mt-1`}>Kickoff starts on your scheduled Monday.</p>
          </div>
        </div>
      )}
    </div>
  );
}

