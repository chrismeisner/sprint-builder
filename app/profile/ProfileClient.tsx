"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UserUploadsClient from "../dashboard/UserUploadsClient";
import {
  AGREEMENT_PLACEHOLDER_URL,
  DEPOSIT_PLACEHOLDER_URL,
  DISCOVERY_CALL_URL,
  ONBOARDING_TASK_CONTENT,
  ONBOARDING_TASK_SEQUENCE,
  OnboardingStatus,
  OnboardingTaskKey,
} from "@/lib/constants/onboarding";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
};

type Document = {
  id: string;
  filename: string | null;
  email: string | null;
  created_at: string;
};

type Sprint = {
  id: string;
  title: string | null;
  status: string;
  deliverable_count: number;
  total_fixed_price: number | null;
  total_fixed_hours: number | null;
  created_at: string;
  updated_at: string | null;
  document_id: string;
  document_filename: string | null;
};

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
  profile: Profile;
  documents: Document[];
  sprints: Sprint[];
  stats: {
    totalDocuments: number;
    totalSprints: number;
  };
  onboardingTasks: OnboardingTask[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export default function ProfileClient() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [updatingTaskKey, setUpdatingTaskKey] = useState<OnboardingTaskKey | null>(null);
  const [kickoffDate, setKickoffDate] = useState("");
  const [kickoffError, setKickoffError] = useState<string | null>(null);
  const [kickoffSubmitting, setKickoffSubmitting] = useState(false);
  const router = useRouter();
  const logoutButtonClasses =
    "px-4 py-2 border border-red-600/20 dark:border-red-400/20 text-red-700 dark:text-red-300 rounded-md hover:bg-red-600/10 dark:hover:bg-red-400/10 disabled:opacity-50 disabled:cursor-not-allowed transition";
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
      
      const profileData: ProfileData = await res.json();
      setData(profileData);
      setNameValue(profileData.profile.name || "");
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

  const handleSaveName = async () => {
    if (!data) return;

    try {
      setSaving(true);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue || null }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      await fetchProfile();
      setEditingName(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-black/10 dark:bg-white/10 text-black dark:text-white",
      in_progress: "bg-blue-600/10 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300",
      completed: "bg-green-600/10 dark:bg-green-400/10 text-green-700 dark:text-green-300",
      cancelled: "bg-red-600/10 dark:bg-red-400/10 text-red-700 dark:text-red-300",
    };

    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status] || styles.draft}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  const onboardingStatusStyles: Record<OnboardingStatus, string> = {
    pending: "bg-black/10 dark:bg-white/10 text-black dark:text-white",
    in_progress: "bg-blue-600/10 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300",
    submitted: "bg-amber-500/15 dark:bg-amber-400/20 text-amber-700 dark:text-amber-200",
    completed: "bg-green-600/10 dark:bg-green-400/10 text-green-700 dark:text-green-300",
  };
  const primaryCtaClasses =
    "px-4 py-2 rounded-md bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition";
  const outlineCtaClasses =
    "px-4 py-2 rounded-md border border-black/10 dark:border-white/15 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition";
  const subtleActionClasses =
    "text-sm font-medium underline-offset-2 hover:underline disabled:opacity-40";

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
            <p className="text-xs opacity-70">
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
              <p className="text-xs opacity-70">
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
        <p className="opacity-70">Loading profile...</p>
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
    <div className="container min-h-screen max-w-6xl space-y-8 py-6">
      {/* Profile Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="opacity-70">Manage your account and view your sprints</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`${logoutButtonClasses} w-full lg:w-auto`}
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>

      {/* Profile Information Card */}
      <div className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/15 p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">Email</label>
            <div>{data.profile.email}</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">Name</label>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-black/10 dark:border-white/15 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                  placeholder="Enter your name"
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:opacity-90 disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNameValue(data.profile.name || "");
                  }}
                  disabled={saving}
                  className="px-4 py-2 border border-black/10 dark:border-white/15 rounded-md hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>
                  {data.profile.name || <span className="opacity-50 italic">Not set</span>}
                </span>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-sm hover:underline opacity-80"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">Account Type</label>
            <div>
              {data.profile.isAdmin ? (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-600/10 dark:bg-green-400/10 text-green-700 dark:text-green-300">
                  Admin
                </span>
              ) : (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-black/10 dark:bg-white/10">
                  User
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">Member Since</label>
            <div>
              {new Date(data.profile.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-black/10 dark:border-white/15 mt-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={logoutButtonClasses}
          >
            {isLoggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </div>

      {/* Onboarding Checklist */}
      <div className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/15">
          <h2 className="text-xl font-semibold">Foundation Onboarding</h2>
          <p className="text-sm opacity-70 mt-1">
            Every account starts with a Foundation Sprint. Knock out this checklist so we can schedule your kickoff.
          </p>
        </div>
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
                    <p className="font-medium">{config.title}</p>
                    {config.optional && (
                      <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="text-sm opacity-70 mt-1">{config.description}</p>
                  {config.helperText && (
                    <p className="text-xs opacity-60 mt-1">{config.helperText}</p>
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/15 p-6">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{data.stats.totalDocuments}</div>
          <div className="opacity-70 mt-1">Intake Forms</div>
        </div>
        <div className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/15 p-6">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{data.stats.totalSprints}</div>
          <div className="opacity-70 mt-1">Sprint Drafts</div>
        </div>
      </div>

      {/* Personal uploads */}
      <UserUploadsClient />

      {/* My Intake Forms */}
      <div className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/15">
          <h2 className="text-xl font-semibold">My Intake Forms</h2>
        </div>
        {data.documents.length === 0 ? (
          <div className="p-6 text-center opacity-70">
            No intake forms yet. Submit a form to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/15">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-black divide-y divide-black/10 dark:divide-white/15">
                {data.documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {doc.filename || <span className="opacity-50 italic">Untitled</span>}
                      </div>
                      <div className="text-xs opacity-60 font-mono">{doc.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm opacity-70">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My Sprint Drafts */}
      <div className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/15">
          <h2 className="text-xl font-semibold">My Sprint Drafts</h2>
        </div>
        {data.sprints.length === 0 ? (
          <div className="p-6 text-center opacity-70">
            No sprint drafts yet. Create a sprint from your intake forms.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/15">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                    Deliverables
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-black divide-y divide-black/10 dark:divide-white/15">
                {data.sprints.map((sprint) => (
                  <tr key={sprint.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">
                        {sprint.title || <span className="opacity-50 italic">Untitled Sprint</span>}
                      </div>
                      <div className="text-xs opacity-60">
                        From: {sprint.document_filename || "Form submission"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(sprint.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm opacity-70">
                      {sprint.deliverable_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {sprint.total_fixed_price
                        ? `$${sprint.total_fixed_price.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm opacity-70">
                      {new Date(sprint.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/sprints/${sprint.id}`}
                        className="hover:underline"
                      >
                        View Sprint
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
