"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const steps = [
  "Connecting to device…",
  "Verifying serial number…",
  "Linking to your account…",
  "Almost there…",
];

export default function LinkingDevicePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1200);

    const navigateTimeout = setTimeout(() => {
      router.push("/getting-online");
    }, 5000);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(navigateTimeout);
    };
  }, [router]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8">
        {/* Animated device icon */}
        <div className="flex size-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
          <svg
            className="size-10 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
          </svg>
        </div>

        {/* Heading */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100">
            Linking your device&hellip;
          </h1>
          <p className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
            This may take up to a minute
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex w-full flex-col gap-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <div
              className="h-full rounded-full bg-blue-600 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out dark:bg-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
            {steps[currentStep]}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`size-2 rounded-full motion-safe:transition-colors motion-safe:duration-300 ${
                i <= currentStep
                  ? "bg-blue-600 dark:bg-blue-500"
                  : "bg-neutral-200 dark:bg-neutral-700"
              }`}
            />
          ))}
        </div>

        {/* Reassurance */}
        <p className="text-center text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
          Please keep this screen open while we connect.
        </p>
      </div>
    </main>
  );
}
