"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  packageSlug: string;
  packageName: string;
  isLoggedIn: boolean;
};

export default function PurchaseButton({ packageSlug, packageName, isLoggedIn }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    if (!isLoggedIn) {
      // Redirect to login page with return URL
      router.push(`/login?redirect=/packages/${packageSlug}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sprint-packages/${packageSlug}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create sprint");
      }

      // Redirect to the newly created sprint
      router.push(`/sprints/${data.sprintDraftId}`);
    } catch (err) {
      console.error("Purchase error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handlePurchase}
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black px-8 py-4 text-lg font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating your sprint...
          </>
        ) : (
          <>
            {isLoggedIn ? `Get Started with ${packageName}` : "Sign in to Get Started"} →
          </>
        )}
      </button>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {!isLoggedIn && (
        <p className="text-xs opacity-60 text-center">
          You&apos;ll be asked to sign in to create your sprint
        </p>
      )}
    </div>
  );
}

