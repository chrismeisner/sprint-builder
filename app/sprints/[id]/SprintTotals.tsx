"use client";

import { useState, useEffect } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "@/app/components/typography";

type Props = {
  initialPoints: number;
  initialHours: number;
  initialPrice: number;
  isEditable: boolean;
  showPointsAndHours?: boolean;
  variant?: "card" | "inline";
  hideHeading?: boolean;
  hideHelper?: boolean;
  className?: string;
  title?: string;
};

export default function SprintTotals({
  initialPoints,
  initialHours,
  initialPrice,
  isEditable,
  showPointsAndHours = true,
  variant = "card",
  hideHeading = false,
  hideHelper = false,
  className = "",
  title = "Sprint Totals",
}: Props) {
  const [totals, setTotals] = useState({
    points: initialPoints,
    hours: initialHours,
    price: initialPrice,
  });

  // Expose update function globally for DeliverablesEditor to call
  useEffect(() => {
    if (isEditable) {
      interface WindowWithTotals extends Window {
        __updateSprintTotals?: (totals: { hours: number; price: number; points: number }) => void;
      }
      (window as WindowWithTotals).__updateSprintTotals = setTotals;
    }
    return () => {
      if (isEditable) {
        interface WindowWithTotals extends Window {
          __updateSprintTotals?: (totals: { hours: number; price: number; points: number }) => void;
        }
        delete (window as WindowWithTotals).__updateSprintTotals;
      }
    };
  }, [isEditable]);

  // Update when props change (after page refresh)
  useEffect(() => {
    setTotals({
      points: initialPoints,
      hours: initialHours,
      price: initialPrice,
    });
  }, [initialPoints, initialHours, initialPrice]);

  const content = (
    <>
      {!hideHeading && (
        <h2 className={`${typography.headingCard} mb-3`}>
          {title}
          {isEditable && " (Live)"}
        </h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {showPointsAndHours && (
          <>
            <div>
              <div className={`${getTypographyClassName("subtitle-sm")} text-text-muted mb-1`}>Total Points</div>
              <div className={`${getTypographyClassName("h3")} text-text-primary`}>{totals.points ?? 0}</div>
            </div>
            <div>
              <div className={`${getTypographyClassName("subtitle-sm")} text-text-muted mb-1`}>Total Hours</div>
              <div className={`${getTypographyClassName("h3")} text-text-primary`}>
                {(typeof totals.hours === "number" ? totals.hours : 0).toFixed(1)}h
              </div>
            </div>
          </>
        )}
        <div>
          <div className={`${getTypographyClassName("subtitle-sm")} text-text-muted mb-1`}>Total Price</div>
          <div className={`${getTypographyClassName("h3")} text-text-primary`}>
            ${(totals.price ?? 0).toLocaleString()}
          </div>
        </div>
      </div>
      {isEditable && !hideHelper && (
        <div className="mt-3 pt-3 border-t border-green-300 dark:border-green-700">
          <p className={`${getTypographyClassName("subtitle-sm")} text-text-muted`}>
            💡 Totals update automatically when you add or remove deliverables
          </p>
        </div>
      )}
    </>
  );

  if (variant === "inline") {
    return <div className={`${getTypographyClassName("body-sm")} text-text-secondary ${className}`}>{content}</div>;
  }

  return (
    <div
      className={`rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-4 ${getTypographyClassName("body-sm")} text-text-secondary ${className}`}
    >
      {content}
    </div>
  );
}

