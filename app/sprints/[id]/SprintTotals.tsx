"use client";

import { useState, useEffect } from "react";

type Props = {
  initialPoints: number;
  initialHours: number;
  initialPrice: number;
  isEditable: boolean;
};

export default function SprintTotals({
  initialPoints,
  initialHours,
  initialPrice,
  isEditable,
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

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-4">
      <h2 className="text-lg font-semibold mb-3">
        Sprint Totals{isEditable && " (Live)"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <div className="opacity-70 mb-1">Total Points</div>
          <div className="text-2xl font-bold">{totals.points ?? 0}</div>
        </div>
        <div>
          <div className="opacity-70 mb-1">Total Hours</div>
          <div className="text-2xl font-bold">
            {(typeof totals.hours === "number" ? totals.hours : 0).toFixed(1)}h
          </div>
        </div>
        <div>
          <div className="opacity-70 mb-1">Total Price</div>
          <div className="text-2xl font-bold">
            ${(totals.price ?? 0).toLocaleString()}
          </div>
        </div>
      </div>
      {isEditable && (
        <div className="mt-3 pt-3 border-t border-green-300 dark:border-green-700">
          <p className="text-xs opacity-70">
            💡 Totals update automatically when you add or remove deliverables
          </p>
        </div>
      )}
    </div>
  );
}

