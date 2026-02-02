"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Props = {
  sprintId: string;
  onAgreementGenerated?: (agreement: string) => void;
};

export default function GenerateAgreementButton({ sprintId, onAgreementGenerated }: Props) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);

      const res = await fetch(`/api/sprint-drafts/${sprintId}/generate-agreement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate agreement");
      }

      const data = await res.json();
      
      if (data.agreement && onAgreementGenerated) {
        onAgreementGenerated(data.agreement);
      }
    } catch (err) {
      console.error("Error generating agreement:", err);
      setError(err instanceof Error ? err.message : "Failed to generate agreement");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={generating}
        className={`${getTypographyClassName("button-sm")} inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition`}
      >
        {generating ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" cy="12" r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none" 
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
              />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Agreement
          </>
        )}
      </button>
      
      {error && (
        <p className={`${getTypographyClassName("body-sm")} text-red-600 dark:text-red-400`}>
          {error}
        </p>
      )}
    </div>
  );
}
