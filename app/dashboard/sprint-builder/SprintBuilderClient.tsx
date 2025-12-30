"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { priceFromPoints, hoursFromPoints } from "@/lib/pricing";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Deliverable = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  scope: string | null;
  points: number | null;
};

type Project = {
  id: string;
  name: string;
};

type Props = {
  deliverables: Deliverable[];
  projects: Project[];
};

export default function SprintBuilderClient({ deliverables, projects }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProjectId = searchParams.get("projectId");
  const sprintIdFromQuery = searchParams.get("sprintId");
  
  // Form state
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(() => {
    if (preselectedProjectId && projects.some((p) => p.id === preselectedProjectId)) {
      return preselectedProjectId;
    }
    return projects[0]?.id ? projects[0].id : "new";
  });
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  function toLocalISO(date: Date): string {
    const tzOffset = date.getTimezoneOffset();
    const adjusted = new Date(date.getTime() - tzOffset * 60_000);
    return adjusted.toISOString().slice(0, 10);
  }

  function parseLocalDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const dt = new Date(`${dateStr}T00:00:00`);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  function formatNumber(value: number | null): string {
    if (value == null || !Number.isFinite(value)) return "—";
    return Number(value).toFixed(1).replace(/\.0$/, "");
  }

  const [selectedDeliverables, setSelectedDeliverables] = useState<
    { deliverableId: string; multiplier: number; note: string }[]
  >([]);
  function getUpcomingMondays(count = 6): string[] {
    const today = new Date();
    const day = today.getDay(); // 0 = Sun, 1 = Mon
    const daysUntilNextMonday = ((8 - day) % 7) || 7; // always future Monday
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);

    // Previous Monday (always the one before this week, even if today is Monday)
    const currentWeekMonday = new Date(today);
    currentWeekMonday.setDate(today.getDate() - ((day + 6) % 7));
    const previousMonday = new Date(currentWeekMonday);
    previousMonday.setDate(currentWeekMonday.getDate() - 7);

    const mondays: string[] = [toLocalISO(previousMonday)];
    for (let i = 0; i < count; i++) {
      const d = new Date(nextMonday);
      d.setDate(nextMonday.getDate() + i * 7);
      mondays.push(toLocalISO(d));
    }
    return mondays;
  }

  const upcomingMondays = getUpcomingMondays(6);
  const [startDate, setStartDate] = useState(() => upcomingMondays[0] || toLocalISO(new Date()));
  const [weeks, setWeeks] = useState<number>(2);
  const [approach, setApproach] = useState("");
  const [week1Overview, setWeek1Overview] = useState("");
  const [week2Overview, setWeek2Overview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingDeliverableId, setEditingDeliverableId] = useState<string | null>(null);
  const [editingMultiplier, setEditingMultiplier] = useState<number>(1);
  const [editingNote, setEditingNote] = useState<string>("");
  const [infoDeliverable, setInfoDeliverable] = useState<Deliverable | null>(null);
  useEffect(() => {
    if (preselectedProjectId && projects.some((p) => p.id === preselectedProjectId)) {
      setProjectId(preselectedProjectId);
    }
  }, [preselectedProjectId, projects]);
  const categoryNames = useMemo(
    () => Array.from(new Set(deliverables.map((d) => d.category || "Uncategorized"))),
    [deliverables]
  );
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    () => new Set(categoryNames)
  );

  const pageTitleClass = `${getTypographyClassName("h2")} text-text-primary`;
  const pageSubtitleClass = `${getTypographyClassName("subtitle-sm")} text-text-secondary`;
  const sectionHeadingClass = `${getTypographyClassName("h3")} text-text-primary`;
  const sectionHelperClass = `${getTypographyClassName("subtitle-sm")} text-text-secondary`;
  const labelClass = `${getTypographyClassName("body-sm")} text-text-secondary`;
  const bodyClass = `${getTypographyClassName("body-md")} text-text-primary`;
  const bodySmClass = `${getTypographyClassName("body-sm")} text-text-primary`;
  const badgeClass = `${getTypographyClassName("subtitle-sm")} text-text-secondary`;
  const metricLabelClass = `${getTypographyClassName("subtitle-sm")} text-text-secondary`;
  const metricValueClass = `${getTypographyClassName("h3")} text-text-primary`;
  const totalValueClass = `${getTypographyClassName("h2")} text-text-primary`;
  const canQuickCreate = Boolean(title.trim() && projectId);
  const primaryCtaLabel = isEditing ? "Update sprint" : "Create sprint";
  const primaryCtaBusy = isEditing ? "Updating..." : "Creating...";

  // Prefill from existing sprint
  useEffect(() => {
    async function loadSprint(existingId: string) {
      try {
        setLoadingExisting(true);
        setError(null);
        const res = await fetch(`/api/sprint-drafts/${existingId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load sprint");
        }

        const sprint = data.sprint as {
          title?: string | null;
          projectId?: string | null;
          startDate?: string | null;
          weeks?: number | null;
          draft?: unknown;
        };

        const delivs = Array.isArray(data.deliverables) ? data.deliverables : [];
        setIsEditing(true);
        setTitle((sprint.title ?? "").toString());
        if (sprint.projectId) {
          setProjectId(sprint.projectId);
        }
        if (sprint.startDate) {
          setStartDate(sprint.startDate);
        }
        if (Number.isFinite(Number(sprint.weeks))) {
          setWeeks(Number(sprint.weeks));
        }

        // Custom content from draft
        if (sprint.draft && typeof sprint.draft === "object" && !Array.isArray(sprint.draft)) {
          const d = sprint.draft as Record<string, unknown>;
          if (typeof d.approach === "string") setApproach(d.approach);
          if (d.week1 && typeof d.week1 === "object") {
            const w1 = d.week1 as Record<string, unknown>;
            if (typeof w1.overview === "string") setWeek1Overview(w1.overview);
          }
          if (d.week2 && typeof d.week2 === "object") {
            const w2 = d.week2 as Record<string, unknown>;
            if (typeof w2.overview === "string") setWeek2Overview(w2.overview);
          }
        }

        // Map deliverables to builder state
        setSelectedDeliverables(
          delivs.map((d: { deliverableId: unknown; multiplier?: unknown; note?: unknown }) => ({
            deliverableId: String(d.deliverableId),
            multiplier: Number.isFinite(Number(d.multiplier)) ? Number(d.multiplier) : 1,
            note: typeof d.note === "string" ? d.note : "",
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sprint");
      } finally {
        setLoadingExisting(false);
      }
    }

    if (sprintIdFromQuery) {
      loadSprint(sprintIdFromQuery);
    } else {
      setIsEditing(false);
    }
  }, [sprintIdFromQuery]);

  function addDeliverable(deliverableId: string) {
    if (selectedDeliverables.some((d) => d.deliverableId === deliverableId)) return; // Already added
    setSelectedDeliverables([...selectedDeliverables, { deliverableId, multiplier: 1, note: "" }]);
  }

  function removeDeliverable(deliverableId: string) {
    setSelectedDeliverables(selectedDeliverables.filter((d) => d.deliverableId !== deliverableId));
    if (editingDeliverableId === deliverableId) {
      setEditingDeliverableId(null);
      setEditingMultiplier(1);
      setEditingNote("");
    }
  }

  function calculateTotals() {
    let totalComplexity = 0;

    selectedDeliverables.forEach(({ deliverableId, multiplier }) => {
      const d = deliverables.find((del) => del.id === deliverableId);
      if (d) {
        const pts = Number(d.points ?? 0);
        if (Number.isFinite(pts)) {
          const mult = Number.isFinite(multiplier) ? multiplier : 1;
          totalComplexity += pts * mult;
        }
      }
    });

    const totalPrice = priceFromPoints(totalComplexity);
    const totalHours = hoursFromPoints(totalComplexity);
    return { totalComplexity, totalPrice, totalHours };
  }

  function calculateEndDate(start: string, wks: number): string | null {
    const startDt = parseLocalDate(start);
    if (!startDt) return null;
    const weeksToUse = Number.isFinite(wks) && wks > 0 ? Math.round(wks) : 2;
    // Align to Friday of the Nth week: offset = (weeks - 1) * 7 + 4 (Mon->Fri)
    const days = (weeksToUse - 1) * 7 + 4;
    const end = new Date(startDt);
    end.setDate(end.getDate() + days);
    return toLocalISO(end);
  }

  const endDate = calculateEndDate(startDate, weeks);
  const normalizedWeeks = Number.isFinite(weeks) && weeks > 0 ? Math.round(weeks) : 0;
  const totalDays = normalizedWeeks * 5; // 5 working days per week
  const projectName = projects.find((p) => p.id === projectId)?.name || "";
  const [showExtras, setShowExtras] = useState(false);
  const editingDeliverable = editingDeliverableId
    ? deliverables.find((d) => d.id === editingDeliverableId) || null
    : null;
  const editingBasePoints =
    editingDeliverable?.points != null && Number.isFinite(Number(editingDeliverable.points))
      ? Number(editingDeliverable.points)
      : null;
  const editingAdjustedPoints =
    editingBasePoints != null && Number.isFinite(editingMultiplier)
      ? editingBasePoints * editingMultiplier
      : null;
  const editingAdjustedHours =
    editingAdjustedPoints != null && Number.isFinite(editingAdjustedPoints)
      ? hoursFromPoints(editingAdjustedPoints)
      : null;

  function formatFriendly(dateStr: string | null): string | null {
    if (!dateStr) return null;
    const dt = parseLocalDate(dateStr);
    if (!dt) return null;
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }).format(dt);
  }

  const endFriendly = formatFriendly(endDate);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (selectedDeliverables.length === 0) {
      setError("Please select at least one deliverable");
      return;
    }

    if (!projectId) {
      setError("Please select a project");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let finalProjectId = projectId;

      // Create project on the fly if "new" selected
      if (projectId === "new") {
        if (!newProjectName.trim()) {
          throw new Error("Project name is required to create a new project");
        }
        setCreatingProject(true);
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newProjectName.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.project?.id) {
          throw new Error(data?.error || "Failed to create project");
        }
        finalProjectId = data.project.id as string;
        setProjectId(finalProjectId);
        setCreatingProject(false);
      }

      // Build custom content for draft
      const customContent: Record<string, unknown> = {
        source: "manual",
        sprintTitle: title,
      };
      
      if (approach.trim()) {
        customContent.approach = approach.trim();
      }
      
      if (week1Overview.trim()) {
        customContent.week1 = { overview: week1Overview.trim() };
      }
      
      if (week2Overview.trim()) {
        customContent.week2 = { overview: week2Overview.trim() };
      }
      
      const body = {
        title,
        sprintPackageId: null,
        deliverables: selectedDeliverables.map((item) => ({
          deliverableId: item.deliverableId,
          complexityMultiplier: item.multiplier,
          note: item.note?.trim() ? item.note.trim() : null,
        })),
        startDate: startDate?.trim() || null,
        weeks: Number.isFinite(weeks) && weeks > 0 ? Math.round(weeks) : 2,
        dueDate: endDate,
        projectId: finalProjectId,
        customContent,
        status: "draft",
      };

      const endpoint = sprintIdFromQuery ? `/api/sprint-drafts/${sprintIdFromQuery}` : "/api/sprint-drafts";
      const method = sprintIdFromQuery ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create sprint");
      }

      // Redirect to sprint detail page
      router.push(`/sprints/${data.sprintDraftId || sprintIdFromQuery}`);
    } catch (e) {
      setError((e as Error).message || "Failed to create sprint");
      setSubmitting(false);
    }
  }

  const { totalComplexity, totalPrice, totalHours } = calculateTotals();
  const hoursPerDay = totalDays > 0 ? Number(totalHours || 0) / totalDays : 0;

  function escapeCsv(val: unknown) {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function exportCsv() {
    const lines: string[] = [];
    lines.push("Field,Value");
    lines.push(`Title,${escapeCsv(title)}`);
    lines.push(`Project,${escapeCsv(projectName || projectId)}`);
    lines.push(`Weeks,${normalizedWeeks}`);
    lines.push(`Working Days,${totalDays}`);
    lines.push(`Start Date,${escapeCsv(startDate)}`);
    lines.push(`End Date,${escapeCsv(endDate)}`);
    lines.push(`Approach,${escapeCsv(approach)}`);
    lines.push(`Week 1 Overview,${escapeCsv(week1Overview)}`);
    lines.push(`Week 2 Overview,${escapeCsv(week2Overview)}`);
    lines.push(`Total Complexity,${Number(totalComplexity || 0).toFixed(2)}`);
    lines.push(`Total Hours,${Number(totalHours || 0).toFixed(2)}`);
    lines.push(`Total Price,${totalPrice}`);
    lines.push("");
    lines.push("Type,Name,Category,Points,Multiplier,Adjusted Points,Hours,Note");

    selectedDeliverables.forEach((item) => {
      const d = deliverables.find((del) => del.id === item.deliverableId);
      if (!d) return;
      const basePoints = Number(d.points ?? 0);
      const multiplier = Number.isFinite(item.multiplier) ? item.multiplier : 1;
      const adjustedPoints = basePoints * multiplier;
      const adjustedHours = hoursFromPoints(adjustedPoints);
      lines.push(
        [
          "Deliverable",
          escapeCsv(d.name),
          escapeCsv(d.category || ""),
          Number.isFinite(basePoints) ? basePoints.toFixed(2) : "",
          Number.isFinite(multiplier) ? multiplier.toFixed(2) : "",
          Number.isFinite(adjustedPoints) ? adjustedPoints.toFixed(2) : "",
          Number.isFinite(adjustedHours) ? adjustedHours.toFixed(2) : "",
          escapeCsv(item.note || ""),
        ].join(",")
      );
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sprint-builder-export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Group deliverables by category
  const deliverablesByCategory = deliverables.reduce((acc, d) => {
    const cat = d.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(d);
    return acc;
  }, {} as Record<string, Deliverable[]>);

  // Sort each category by points ascending (nulls last)
  Object.keys(deliverablesByCategory).forEach((cat) => {
    deliverablesByCategory[cat] = deliverablesByCategory[cat].sort((a, b) => {
      const aPts = a.points;
      const bPts = b.points;
      if (aPts == null && bPts == null) return 0;
      if (aPts == null) return 1;
      if (bPts == null) return -1;
      return Number(aPts) - Number(bPts);
    });
  });

  return (
    <div className="container max-w-screen-2xl py-6 text-foreground">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className={pageTitleClass}>Sprint Builder</h1>
          <p className={pageSubtitleClass}>Manually create a sprint with selected deliverables</p>
        </div>
        <div className="flex items-center gap-2">
          {canQuickCreate && (
            <button
              type="submit"
              form="sprint-form"
              disabled={submitting || loadingExisting}
              className={`${bodySmClass} inline-flex items-center rounded-md bg-black text-white px-3 py-1.5 hover:bg-black/80 disabled:opacity-60 transition`}
            >
              {submitting ? primaryCtaBusy : primaryCtaLabel}
            </button>
          )}
          <Link
            href="/dashboard"
            className={`${bodySmClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition`}
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className={`${sectionHelperClass} rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700 mb-6`}>
          {error}
        </div>
      )}

      {/* Main layout */}
      <form onSubmit={handleSubmit} id="sprint-form" className="space-y-6">
          {/* Basic Info */}
          <section className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-4 space-y-4">
            <h2 className={sectionHeadingClass}>Sprint Details</h2>
          
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <div>
                <label className={`${labelClass} block mb-1`} htmlFor="project">
                  Project
                </label>
                <select
                  id="project"
                  required
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setError(null);
                  }}
                  className={`${bodySmClass} w-full rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="new">+ New project</option>
                </select>
              </div>
              {projectId === "new" && (
                <div className="space-y-1">
                  <label className={`${labelClass} block mb-1`} htmlFor="new-project-name">
                    New project name
                  </label>
                  <input
                    id="new-project-name"
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className={`${bodySmClass} w-full rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
                    placeholder="e.g. Apollo launch"
                    disabled={creatingProject || submitting}
                  />
                </div>
              )}
              <div>
                <label className={`${labelClass} block mb-1`} htmlFor="title">
                  Sprint Title *
                </label>
                <input
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`${bodySmClass} w-full rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
                  placeholder="e.g. Q1 2024 MVP Development"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <label className={`${labelClass} block mb-1`} htmlFor="start-date">
                  Start Date
                </label>
                <select
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`${bodySmClass} w-full rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
                >
                  {upcomingMondays.map((d) => (
                    <option key={d} value={d}>
                      {formatFriendly(d) || d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`${labelClass} block mb-1`} htmlFor="weeks">
                  Weeks
                </label>
                <input
                  id="weeks"
                  type="number"
                  min={1}
                  max={52}
                  value={weeks}
                  onChange={(e) => setWeeks(Number(e.target.value) || 2)}
                  className={`${bodySmClass} w-full rounded-md border border-black/15 px-2 py-1.5 bg-white text-black`}
                />
              </div>

              <div>
                <label className={`${labelClass} block mb-1`} htmlFor="end-date">
                  End Date (auto)
                </label>
                <input
                  id="end-date"
                  readOnly
                  value={endFriendly || ""}
                  className={`${bodySmClass} w-full rounded-md border border-black/15 px-2 py-1.5 bg-gray-100 text-black`}
                />
              </div>
            </div>

            {/* Spacer column for desktop alignment */}
            <div className="hidden lg:block" aria-hidden="true" />
          </div>
          </section>

          {/* Deliverables layout and totals */}
          <div className="grid gap-6 lg:grid-cols-3 items-start">
            {/* Available Deliverables */}
            <section className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-4 space-y-4">
              <h2 className={sectionHeadingClass}>Add Deliverables</h2>
              <div className="space-y-2">
                <p className={sectionHelperClass}>Show categories</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(deliverablesByCategory).map((cat) => {
                    const isChecked = visibleCategories.has(cat);
                    return (
                      <label
                        key={cat}
                        className={`${bodySmClass} inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-2 py-1 cursor-pointer`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={isChecked}
                          onChange={(e) => {
                            setVisibleCategories((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) {
                                next.add(cat);
                              } else {
                                next.delete(cat);
                              }
                              return next;
                            });
                          }}
                        />
                        {cat}
                      </label>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-4">
                {Object.entries(deliverablesByCategory).map(([category, items]) =>
                  visibleCategories.has(category) ? (
                    <div key={category}>
                      <h3 className={`${badgeClass} mb-2`}>{category}</h3>
                      <div className="grid gap-2">
                        {items.map((d) => {
                          const selectedItem = selectedDeliverables.find((sd) => sd.deliverableId === d.id);
                          const isSelected = Boolean(selectedItem);
                          const complexity =
                            d.points != null
                              ? `${Number(d.points).toFixed(1).replace(/\\.0$/, "")} pts`
                              : "—";
                          return (
                            <div
                              key={d.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => (isSelected ? removeDeliverable(d.id) : addDeliverable(d.id))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                if (isSelected) {
                                  removeDeliverable(d.id);
                                } else {
                                  addDeliverable(d.id);
                                }
                                }
                              }}
                              className={
                                isSelected
                                  ? `${bodySmClass} group rounded border border-green-200 bg-green-50 dark:bg-green-950 p-2 text-left cursor-pointer`
                                  : `${bodySmClass} group rounded border border-black/10 dark:border-white/15 p-2 text-left hover:border-black/20 dark:hover:border-white/25 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer`
                              }
                              aria-pressed={isSelected}
                              aria-label={`Deliverable ${d.name}`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className={`${bodyClass} font-semibold`}>{d.name}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInfoDeliverable(d);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition inline-flex items-center justify-center rounded-full border border-black/15 dark:border-white/20 w-6 h-6 text-xs hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/25 dark:hover:border-white/30"
                                    aria-label={`View details for ${d.name}`}
                                  >
                                    i
                                  </button>
                                  <div className={`${sectionHelperClass} font-semibold whitespace-nowrap`}>
                                    {selectedItem && selectedItem.multiplier !== 1
                                      ? `${complexity} • ${selectedItem.multiplier}x`
                                      : complexity}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </section>

            {/* Selected Deliverables */}
            <section className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-4 space-y-4">
              <h2 className={sectionHeadingClass}>Selected Deliverables</h2>
              
              {selectedDeliverables.length === 0 ? (
                <p className={sectionHelperClass}>No deliverables selected yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDeliverables.map((item) => {
                    const d = deliverables.find((del) => del.id === item.deliverableId);
                    if (!d) return null;
                    
                    const adjustedPoints =
                      d.points != null && Number.isFinite(Number(d.points))
                        ? Number(d.points) * (Number.isFinite(item.multiplier) ? item.multiplier : 1)
                        : null;

                    return (
                      <div
                        key={item.deliverableId}
                        className="rounded border border-black/10 dark:border-white/15 p-3 flex items-start justify-between gap-3"
                      >
                        <div className="flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/dashboard/deliverables/${d.id}`}
                              className={`${bodyClass} font-semibold hover:underline`}
                            >
                              {d.name}
                            </Link>
                            <button
                              type="button"
                              onClick={() => setInfoDeliverable(d)}
                              className="inline-flex items-center justify-center rounded-full border border-black/15 dark:border-white/20 w-6 h-6 text-xs hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/25 dark:hover:border-white/30"
                              aria-label={`View details for ${d.name}`}
                            >
                              i
                            </button>
                            {d.category && (
                              <span className={`${badgeClass} inline-flex items-center rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5`}>
                                {d.category}
                              </span>
                            )}
                            {item.multiplier !== 1 && (
                              <span className={`${badgeClass} inline-flex items-center rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5`}>
                                {item.multiplier}x
                              </span>
                            )}
                          </div>
                          {item.note && (
                            <div className={`${sectionHelperClass} whitespace-pre-line`}>{item.note}</div>
                          )}
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDeliverableId(item.deliverableId);
                                setEditingMultiplier(item.multiplier);
                                setEditingNote(item.note || "");
                              }}
                              className={`${bodySmClass} underline`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeDeliverable(item.deliverableId)}
                              className={`${bodySmClass} text-red-600 hover:text-red-800`}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className={`${bodySmClass} font-semibold whitespace-nowrap text-right`}>
                          {adjustedPoints != null
                            ? `${Number(adjustedPoints).toFixed(1).replace(/\.0$/, "")} pts`
                            : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Sprint Totals + actions */}
            <div className="space-y-4 lg:sticky top-16">
              <section className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-4 space-y-4">
                <h2 className={sectionHeadingClass}>Sprint Totals</h2>

                <label className={`${bodySmClass} inline-flex items-center gap-2`}>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={showExtras}
                    onChange={(e) => setShowExtras(e.target.checked)}
                  />
                  Show extras
                </label>
                
                <div className="space-y-3">
                  <div>
                    <div className={`${metricLabelClass} mb-1`}>Total Price</div>
                    <div className={totalValueClass}>
                      ${totalPrice.toLocaleString()}
                    </div>
                  </div>

                  {showExtras && (
                    <>
                      <div>
                        <div className={`${metricLabelClass} mb-1`}>Estimated Hours per Day</div>
                        <div className={metricValueClass}>
                          {Number(hoursPerDay || 0).toFixed(1)}
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <div className={`${metricLabelClass} mb-1`}>Working Days</div>
                    <div className={metricValueClass}>{totalDays.toLocaleString()}</div>
                  </div>

                </div>
              </section>

              <section className="space-y-2">
                <button
                  type="submit"
                  disabled={submitting || selectedDeliverables.length === 0 || loadingExisting}
                  className={`${bodySmClass} w-full inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-3 disabled:opacity-60 hover:bg-black/80 transition`}
                >
                  {submitting ? primaryCtaBusy : primaryCtaLabel}
                </button>
                
                <Link
                  href="/dashboard"
                  className={`${bodySmClass} w-full inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition`}
                >
                  Cancel
                </Link>
              </section>

              {selectedDeliverables.length === 0 && (
                <p className={`${sectionHelperClass} text-center`}>
                  Select deliverables to see calculated totals
                </p>
              )}
            </div>
          </div>

          {/* Custom Content (moved to bottom) */}
          <section className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-4 space-y-4">
            <h2 className={sectionHeadingClass}>Sprint Details (Optional)</h2>
            <p className={sectionHelperClass}>Add custom context and planning notes for this sprint</p>
            
            <div>
              <label className={`${labelClass} block mb-1`} htmlFor="approach">
                Sprint Approach
              </label>
              <textarea
                id="approach"
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                className={`${bodySmClass} w-full rounded-md border border-black/15 px-2 py-1.5 min-h-[80px] bg-white text-black`}
                placeholder="Explain the overall approach and methodology for this sprint..."
              />
            </div>

            <div>
              <label className={`${labelClass} block mb-1`} htmlFor="week1">
                Week 1 Overview
              </label>
              <textarea
                id="week1"
                value={week1Overview}
                onChange={(e) => setWeek1Overview(e.target.value)}
                className={`${bodySmClass} w-full rounded-md border border-black/15 px-2 py-1.5 min-h-[80px] bg-white text-black`}
                placeholder="Describe Week 1's focus, activities, and expected outcomes..."
              />
            </div>

            <div>
              <label className={`${labelClass} block mb-1`} htmlFor="week2">
                Week 2 Overview
              </label>
              <textarea
                id="week2"
                value={week2Overview}
                onChange={(e) => setWeek2Overview(e.target.value)}
                className={`${bodySmClass} w-full rounded-md border border-black/15 px-2 py-1.5 min-h-[80px] bg-white text-black`}
                placeholder="Describe Week 2's focus, completion activities, and final deliverables..."
              />
            </div>
          </section>
        </form>

      {/* Export */}
      <div className="mt-8">
        <button
          type="button"
          onClick={exportCsv}
          className={`${bodySmClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition`}
        >
          Export CSV
        </button>
      </div>

      {editingDeliverableId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => {
            setEditingDeliverableId(null);
            setEditingMultiplier(1);
            setEditingNote("");
          }}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 p-6 shadow-lg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={sectionHeadingClass}>Edit complexity</h3>
            <p className={sectionHelperClass}>Apply a multiplier to adjust this deliverable&apos;s complexity and totals.</p>
            <div>
              <label className={`${labelClass} block mb-2`} htmlFor="complexity-multiplier">
                Multiplier
              </label>
              <select
                id="complexity-multiplier"
                value={editingMultiplier}
                onChange={(e) => setEditingMultiplier(Number(e.target.value))}
                className={`${bodySmClass} w-full rounded-md border border-black/15 px-2 py-2 bg-white text-black`}
              >
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((val) => (
                  <option key={val} value={val}>
                    {val}x
                  </option>
                ))}
              </select>
            </div>
            {editingDeliverable && (
              <div className="rounded-md border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 px-3 py-2">
                <p className={`${labelClass} flex items-center justify-between`}>
                  <span>New Complexity</span>
                  <span className={`${bodyClass} font-semibold`}>
                    {formatNumber(editingAdjustedPoints)} ({formatNumber(editingAdjustedHours)} hrs)
                  </span>
                </p>
              </div>
            )}
            <div>
              <label className={`${labelClass} block mb-2`} htmlFor="complexity-note">
                Reason / notes (optional)
              </label>
              <textarea
                id="complexity-note"
                value={editingNote}
                onChange={(e) => setEditingNote(e.target.value)}
                className={`${bodySmClass} w-full rounded-md border border-black/15 px-2 py-2 min-h-[80px] bg-white text-black`}
                placeholder="Why adjust this complexity?"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingDeliverableId(null);
                  setEditingMultiplier(1);
                  setEditingNote("");
                }}
                className={`${bodySmClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDeliverables((prev) =>
                    prev.map((d) =>
                      d.deliverableId === editingDeliverableId
                        ? { ...d, multiplier: editingMultiplier || 1, note: editingNote }
                        : d
                    )
                  );
                  setEditingDeliverableId(null);
                  setEditingMultiplier(1);
                  setEditingNote("");
                }}
                className={`${bodySmClass} inline-flex items-center rounded-md bg-black text-white px-4 py-2`}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {infoDeliverable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setInfoDeliverable(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 p-6 shadow-lg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className={sectionHeadingClass}>{infoDeliverable.name}</h3>
                {infoDeliverable.category && <p className={sectionHelperClass}>{infoDeliverable.category}</p>}
              </div>
              <button
                onClick={() => setInfoDeliverable(null)}
                className={`${bodySmClass} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10`}
              >
                Close
              </button>
            </div>
            <div className="space-y-2">
              <div className={sectionHelperClass}>
                Points:{" "}
                {infoDeliverable.points != null
                  ? Number(infoDeliverable.points).toFixed(1).replace(/\.0$/, "")
                  : "—"}
              </div>
              {infoDeliverable.description && <p className={bodySmClass}>{infoDeliverable.description}</p>}
              {infoDeliverable.scope && (
                <div>
                  <p className={`${sectionHelperClass} mb-1`}>Scope</p>
                  <p className={bodySmClass}>{infoDeliverable.scope}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

