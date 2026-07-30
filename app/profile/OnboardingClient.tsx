"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AGREEMENT_PLACEHOLDER_URL,
  DEPOSIT_PLACEHOLDER_URL,
  DISCOVERY_CALL_URL,
  ONBOARDING_TASK_CONTENT,
  ONBOARDING_TASK_SEQUENCE,
  OnboardingStatus,
  OnboardingTaskKey,
} from "@/lib/constants/onboarding";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type OnboardingTask = {
  accountId: string;
  taskKey: OnboardingTaskKey;
  status: OnboardingStatus;
  metadata: Record<string, unknown> | null;
  completedAt: string | null;
  updatedAt: string;
  createdAt: string;
};

type ProfileData = {
  onboardingTasks: OnboardingTask[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export default function OnboardingClient() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskKey, setUpdatingTaskKey] = useState<OnboardingTaskKey | null>(null);
  const [kickoffDate, setKickoffDate] = useState("");
  const [kickoffError, setKickoffError] = useState<string | null>(null);
  const [kickoffSubmitting, setKickoffSubmitting] = useState(false);

  const pageTitleClass = getTypographyClassName("h2");
  const helperTextClass = `${getTypographyClassName("body-sm")} opacity-70`;
  const bodyClass = getTypographyClassName("body-md");
  const subtleActionClasses =
    `${getTypographyClassName("body-sm")} font-medium underline-offset-2 hover:underline disabled:opacity-40`;
  const primaryCtaClasses =
    `${getTypographyClassName("button-md")} px-4 py-2 rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition`;
  const outlineCtaClasses =
    `${getTypographyClassName("button-md")} px-4 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition`;

  const onboardingStatusStyles: Record<OnboardingStatus, string> = {
    pending: "bg-black/10 dark:bg-white/10 text-black dark:text-white",
    in_progress: "bg-blue-600/10 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300",
    submitted: "bg-amber-500/15 dark:bg-amber-400/20 text-amber-700 dark:text-amber-200",
    completed: "bg-green-600/10 dark:bg-green-400/10 text-green-700 dark:text-green-300",
  };

  const onboardingTaskMap = useMemo(() => {
    const map: Partial<Record<OnboardingTaskKey, OnboardingTask>> = {};
    data?.onboardingTasks?.forEach((task) => {
      map[task.taskKey] = task;
    });
    return map;
  }, [data?.onboardingTasks]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch profile");
      }

      const profileData = (await res.json()) as ProfileData;
      setData(profileData);

      const kickoffTask = profileData.onboardingTasks?.find(
        (task) => task.taskKey === "kickoff_request"
      );
      if (kickoffTask && isRecord(kickoffTask.metadata)) {
        const meta = kickoffTask.metadata as {
          requestedKickoffDateLabel?: string;
          requestedKickoffDate?: string;
        };
        setKickoffDate(
          meta.requestedKickoffDateLabel ||
            (meta.requestedKickoffDate
              ? meta.requestedKickoffDate.slice(0, 10)
              : "")
        );
      } else {
        setKickoffDate("");
      }
      setKickoffError(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const getOnboardingStatusBadge = (status: OnboardingStatus) => (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${onboardingStatusStyles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );

  const handleOnboardingTaskUpdate = async (
    taskKey: OnboardingTaskKey,
    status: OnboardingStatus,
    metadata?: Record<string, unknown> | null
  ) => {
    try {
      setUpdatingTaskKey(taskKey);
      const payload: Record<string, unknown> = { taskKey, status };
      if (metadata !== undefined) {
        payload.metadata = metadata;
      }
      const res = await fetch("/api/profile/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update onboarding task");
      }

      await fetchProfile();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to update onboarding task"
      );
    } finally {
      setUpdatingTaskKey(null);
    }
  };

  const handleManualTaskComplete = (taskKey: OnboardingTaskKey) =>
    handleOnboardingTaskUpdate(taskKey, "completed");

  const handleManualTaskReset = (taskKey: OnboardingTaskKey) => {
    if (taskKey === "kickoff_request") {
      handleOnboardingTaskUpdate(taskKey, "pending", null);
    } else {
      handleOnboardingTaskUpdate(taskKey, "pending");
    }
  };

  const handleKickoffRequest = async () => {
    if (!kickoffDate) {
      setKickoffError("Select a Monday to request your kickoff");
      return;
    }

    const parsedDate = new Date(kickoffDate);
    if (Number.isNaN(parsedDate.valueOf())) {
      setKickoffError("Please choose a valid date");
      return;
    }

    if (parsedDate.getUTCDay() !== 1) {
      setKickoffError("Kickoff requests must start on a Monday");
      return;
    }

    setKickoffError(null);
    try {
      setKickoffSubmitting(true);
      await handleOnboardingTaskUpdate("kickoff_request", "submitted", {
        kickoffDate,
      });
    } finally {
      setKickoffSubmitting(false);
    }
  };

  const formatDisplayDate = (value?: string | null) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.valueOf())) {
      return value;
    }
    return parsed.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderOnboardingActions = (
    taskKey: OnboardingTaskKey,
    task: OnboardingTask | undefined,
    isBusy: boolean
  ) => {
    const status = task?.status ?? "pending";
    const metadata =
      task && isRecord(task.metadata) ? task.metadata : null;

    switch (taskKey) {
      case "intake_form":
        if (status === "completed") {
          return (
            <p className={helperTextClass}>
              {task?.completedAt
                ? `Completed ${formatDisplayDate(task.completedAt)}`
                : "Completed"}
            </p>
          );
        }
        return (
          <Link href="/intake" className={primaryCtaClasses}>
            Open intake form
          </Link>
        );
      case "discovery_call":
        return (
          <>
            <a
              href={DISCOVERY_CALL_URL}
              target="_blank"
              rel="noreferrer"
              className={outlineCtaClasses}
            >
              Book on Calendly
            </a>
            {status === "completed" ? (
              <button
                onClick={() => handleManualTaskReset(taskKey)}
                className={subtleActionClasses}
                disabled={isBusy}
              >
                Mark incomplete
              </button>
            ) : (
              <button
                onClick={() => handleManualTaskComplete(taskKey)}
                className={primaryCtaClasses}
                disabled={isBusy}
              >
                Mark as complete
              </button>
            )}
          </>
        );
      case "kickoff_request": {
        const requestedLabel =
          (metadata as { requestedKickoffDateLabel?: string })?.requestedKickoffDateLabel ||
          (metadata as { requestedKickoffDate?: string })?.requestedKickoffDate;
        const requestedAt = (metadata as { requestedAt?: string })?.requestedAt;

        return (
          <>
            <input
              type="date"
              value={kickoffDate}
              onChange={(event) => {
                setKickoffDate(event.target.value);
                setKickoffError(null);
              }}
              className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              disabled={isBusy}
            />
            <button
              onClick={handleKickoffRequest}
              className={primaryCtaClasses}
              disabled={isBusy || !kickoffDate}
            >
              {status === "submitted" ? "Update request" : "Request kickoff"}
            </button>
            {kickoffError && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {kickoffError}
              </p>
            )}
            {requestedLabel && (
              <p className={helperTextClass}>
                Requested: {formatDisplayDate(requestedLabel)}
                {requestedAt
                  ? ` • Submitted ${formatDisplayDate(requestedAt)}`
                  : ""}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {status !== "completed" && (
                <button
                  onClick={() => handleManualTaskComplete(taskKey)}
                  className={outlineCtaClasses}
                  disabled={isBusy}
                >
                  Mark as complete
                </button>
              )}
              {status !== "pending" && (
                <button
                  onClick={() => handleManualTaskReset(taskKey)}
                  className={subtleActionClasses}
                  disabled={isBusy}
                >
                  Reset step
                </button>
              )}
            </div>
          </>
        );
      }
      case "agreement":
        return (
          <>
            <a
              href={AGREEMENT_PLACEHOLDER_URL}
              target="_blank"
              rel="noreferrer"
              className={outlineCtaClasses}
            >
              Review agreement
            </a>
            {status === "completed" ? (
              <button
                onClick={() => handleManualTaskReset(taskKey)}
                className={subtleActionClasses}
                disabled={isBusy}
              >
                Mark incomplete
              </button>
            ) : (
              <button
                onClick={() => handleManualTaskComplete(taskKey)}
                className={primaryCtaClasses}
                disabled={isBusy}
              >
                Mark as complete
              </button>
            )}
          </>
        );
      case "deposit":
        return (
          <>
            <a
              href={DEPOSIT_PLACEHOLDER_URL}
              target="_blank"
              rel="noreferrer"
              className={outlineCtaClasses}
            >
              Open payment link
            </a>
            {status === "completed" ? (
              <button
                onClick={() => handleManualTaskReset(taskKey)}
                className={subtleActionClasses}
                disabled={isBusy}
              >
                Mark incomplete
              </button>
            ) : (
              <button
                onClick={() => handleManualTaskComplete(taskKey)}
                className={primaryCtaClasses}
                disabled={isBusy}
              >
                Mark as complete
              </button>
            )}
          </>
        );
      case "kickoff_workshop":
        return status === "completed" ? (
          <button
            onClick={() => handleManualTaskReset(taskKey)}
            className={subtleActionClasses}
            disabled={isBusy}
          >
            Mark incomplete
          </button>
        ) : (
          <button
            onClick={() => handleManualTaskComplete(taskKey)}
            className={primaryCtaClasses}
            disabled={isBusy}
          >
            Mark as complete
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className={helperTextClass}>Loading onboarding...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-600/10 dark:bg-red-400/10 border border-red-600/20 dark:border-red-400/20 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300 font-semibold">Error</p>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container min-h-screen max-w-5xl space-y-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className={`${pageTitleClass} text-text-primary`}>Foundation Onboarding</h1>
          <p className={helperTextClass}>
            Complete these steps to get your sprint scheduled.
          </p>
        </div>
        <Link
          href="/profile"
          className={`${getTypographyClassName("button-md")} px-4 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
        >
          Back to profile
        </Link>
      </div>

      <div className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
        <div className="divide-y divide-black/10 dark:divide-white/15">
          {ONBOARDING_TASK_SEQUENCE.map((taskKey) => {
            const config = ONBOARDING_TASK_CONTENT[taskKey];
            const task = onboardingTaskMap[taskKey];
            const status = task?.status ?? "pending";
            const isBusy =
              updatingTaskKey === taskKey ||
              (taskKey === "kickoff_request" && kickoffSubmitting);

            return (
              <div
                key={taskKey}
                className="px-6 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`${bodyClass} font-medium`}>{config.title}</p>
                    {config.optional && (
                      <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className={`${helperTextClass} mt-1`}>{config.description}</p>
                  {config.helperText && (
                    <p className={`${helperTextClass} mt-1`}>{config.helperText}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-[240px]">
                  {getOnboardingStatusBadge(status)}
                  {renderOnboardingActions(taskKey, task, isBusy)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
