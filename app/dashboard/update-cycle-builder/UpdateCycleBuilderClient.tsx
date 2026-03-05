"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UPDATE_CYCLE_WEEKLY_RATE } from "@/lib/pricing";

type Sprint = {
  id: string;
  title: string | null;
  status: string | null;
  total_fixed_price: number | null;
  created_at: string;
};

type Project = {
  id: string;
  name: string;
};

type Props = {
  projects: Project[];
  sprintsByProject: Record<string, Sprint[]>;
};

function toLocalISO(date: Date): string {
  const tzOffset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - tzOffset * 60_000);
  return adjusted.toISOString().slice(0, 10);
}

function getUpcomingMondays(count = 6): string[] {
  const today = new Date();
  const day = today.getDay();
  const daysUntilNextMonday = ((8 - day) % 7) || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilNextMonday);

  const mondays: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(nextMonday);
    d.setDate(nextMonday.getDate() + i * 7);
    mondays.push(toLocalISO(d));
  }
  return mondays;
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  complete: "Complete",
};

export default function UpdateCycleBuilderClient({ projects, sprintsByProject }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProjectId = searchParams.get("projectId");

  const [projectId, setProjectId] = useState(
    preselectedProjectId && projects.some((p) => p.id === preselectedProjectId)
      ? preselectedProjectId
      : projects[0]?.id ?? ""
  );
  const [parentSprintId, setParentSprintId] = useState("");
  const [weeks, setWeeks] = useState(1);
  const [title, setTitle] = useState("");
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customPriceInput, setCustomPriceInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upcomingMondays = useMemo(() => getUpcomingMondays(6), []);
  const [startDate, setStartDate] = useState(() => upcomingMondays[0] || toLocalISO(new Date()));

  const availableSprints = useMemo(() => {
    return sprintsByProject[projectId] ?? [];
  }, [projectId, sprintsByProject]);

  const selectedParentSprint = useMemo(() => {
    return availableSprints.find((s) => s.id === parentSprintId) ?? null;
  }, [availableSprints, parentSprintId]);

  const standardPrice = UPDATE_CYCLE_WEEKLY_RATE * weeks;
  const parsedCustomPrice = useCustomPrice ? parseFloat(customPriceInput.replace(/,/g, "")) : NaN;
  const customPriceValid = useCustomPrice && Number.isFinite(parsedCustomPrice) && parsedCustomPrice > 0;
  const totalPrice = customPriceValid ? parsedCustomPrice : standardPrice;

  const autoTitle = useMemo(() => {
    if (selectedParentSprint?.title) {
      return `Update Cycle — ${selectedParentSprint.title}`;
    }
    return "Update Cycle";
  }, [selectedParentSprint]);

  const effectiveTitle = title.trim() || autoTitle;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/update-cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: effectiveTitle,
          projectId,
          parentSprintId,
          startDate,
          weeks,
          ...(customPriceValid ? { priceOverride: parsedCustomPrice } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      router.push(`/sprints/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const inputClasses =
    "h-10 px-3 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400";
  const labelClasses =
    "text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100";

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link
          href={projectId ? `/projects/${projectId}` : "/projects"}
          className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-150"
        >
          &larr; Back to project
        </Link>
        <h1 className="text-2xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100 mt-3">
          New Update Cycle
        </h1>
        <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400 mt-1">
          Iterate on existing work from a previous sprint. One structured feedback loop per week.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Project */}
        <div className="flex flex-col gap-2">
          <label htmlFor="uc-project" className={labelClasses}>
            Project
          </label>
          <select
            id="uc-project"
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setParentSprintId("");
            }}
            className={inputClasses}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Previous Sprint */}
        <div className="flex flex-col gap-2">
          <label htmlFor="uc-parent" className={labelClasses}>
            Previous Sprint
          </label>
          {availableSprints.length === 0 ? (
            <p className="text-sm font-normal leading-normal text-neutral-500">
              No sprints found for this project. Create a Foundation Sprint first.
            </p>
          ) : (
            <select
              id="uc-parent"
              value={parentSprintId}
              onChange={(e) => setParentSprintId(e.target.value)}
              className={inputClasses}
              required
            >
              <option value="">Select a sprint&hellip;</option>
              {availableSprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title || "Untitled sprint"} — {STATUS_LABELS[s.status ?? "draft"] ?? s.status}
                  {s.total_fixed_price != null ? ` ($${Number(s.total_fixed_price).toLocaleString()})` : ""}
                </option>
              ))}
            </select>
          )}
          {selectedParentSprint && (
            <p className="text-xs font-normal leading-normal text-neutral-500">
              Iterating on: <strong>{selectedParentSprint.title || "Untitled"}</strong>
              {" "}({STATUS_LABELS[selectedParentSprint.status ?? "draft"] ?? selectedParentSprint.status})
            </p>
          )}
        </div>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <label htmlFor="uc-title" className={labelClasses}>
            Title
          </label>
          <input
            id="uc-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={autoTitle}
            className={inputClasses}
          />
          <p className="text-xs font-normal leading-normal text-neutral-500">
            Leave blank to auto-generate from the parent sprint.
          </p>
        </div>

        {/* Start Date */}
        <div className="flex flex-col gap-2">
          <label htmlFor="uc-start" className={labelClasses}>
            Start Date
          </label>
          <select
            id="uc-start"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClasses}
          >
            {upcomingMondays.map((d) => (
              <option key={d} value={d}>
                {formatDate(d)}
              </option>
            ))}
          </select>
        </div>

        {/* Weeks */}
        <div className="flex flex-col gap-2">
          <label htmlFor="uc-weeks" className={labelClasses}>
            Duration (weeks)
          </label>
          <select
            id="uc-weeks"
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className={inputClasses}
          >
            {[1, 2, 3, 4].map((w) => (
              <option key={w} value={w}>
                {w} week{w > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Price Summary */}
        <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-4 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
              Total Price
            </span>
            <span className="text-2xl font-semibold leading-snug tabular-nums text-neutral-900 dark:text-neutral-100">
              ${totalPrice.toLocaleString()}
            </span>
          </div>
          {!useCustomPrice && (
            <p className="text-xs font-normal leading-normal text-neutral-500">
              ${UPDATE_CYCLE_WEEKLY_RATE.toLocaleString()}/week &times; {weeks} week{weeks > 1 ? "s" : ""}
            </p>
          )}
          {useCustomPrice && customPriceValid && (
            <p className="text-xs font-normal leading-normal text-neutral-500">
              Custom price override &mdash; standard would be ${standardPrice.toLocaleString()}
            </p>
          )}

          {/* Custom price toggle */}
          <div className="pt-1 border-t border-neutral-200 dark:border-neutral-700 flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useCustomPrice}
                onChange={(e) => {
                  setUseCustomPrice(e.target.checked);
                  if (!e.target.checked) setCustomPriceInput("");
                }}
                className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 accent-neutral-900 dark:accent-neutral-100"
              />
              <span className="text-sm font-medium leading-none text-neutral-700 dark:text-neutral-300">
                Set custom price override
              </span>
            </label>
            {useCustomPrice && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={customPriceInput}
                  onChange={(e) => setCustomPriceInput(e.target.value)}
                  placeholder={String(standardPrice)}
                  className="h-9 px-3 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 tabular-nums"
                />
                {useCustomPrice && !customPriceValid && customPriceInput !== "" && (
                  <span className="text-xs text-red-500">Enter a valid amount</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3">
            <p className="text-sm font-normal leading-normal text-red-700 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !parentSprintId || !projectId}
            className="h-10 px-4 text-sm rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium hover:opacity-90 transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Creating…" : "Create Update Cycle"}
          </button>
          <Link
            href={projectId ? `/projects/${projectId}` : "/projects"}
            className="h-10 px-4 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
