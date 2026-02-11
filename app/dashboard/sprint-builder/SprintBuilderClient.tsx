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
  isAuthenticated?: boolean;
  loginRedirectPath?: string;
};

export default function SprintBuilderClient({
  deliverables,
  projects,
  isAuthenticated = true,
  loginRedirectPath = "/dashboard/sprint-builder",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProjectId = searchParams.get("projectId");
  const sprintIdFromQuery = searchParams.get("sprintId");

  const loginHref = useMemo(
    () => `/login?redirect=${encodeURIComponent(loginRedirectPath)}`,
    [loginRedirectPath]
  );

  // Form state
  const [title, setTitle] = useState("");
  const defaultProjectId = useMemo(() => {
    if (!isAuthenticated) return "";
    if (preselectedProjectId && projects.some((p) => p.id === preselectedProjectId)) {
      return preselectedProjectId;
    }
    return projects[0]?.id ? projects[0].id : "new";
  }, [isAuthenticated, preselectedProjectId, projects]);
  const [projectId, setProjectId] = useState(defaultProjectId);
  useEffect(() => {
    setProjectId(defaultProjectId);
  }, [defaultProjectId]);
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
  
  // Debug logging
  console.log('[RENDER DEBUG] Current startDate state:', startDate);
  console.log('[RENDER DEBUG] startDate type:', typeof startDate);
  
  const [approach, setApproach] = useState("");

  // Dynamic week notes: keyed by "week1", "week2", etc.
  type WeekCheckpoints = { kickoff: string; midweek: string; endOfWeek: string };
  const [weekNotes, setWeekNotes] = useState<Record<string, WeekCheckpoints>>({});

  function updateWeekNote(weekKey: string, field: keyof WeekCheckpoints, value: string) {
    setWeekNotes((prev) => ({
      ...prev,
      [weekKey]: {
        ...(prev[weekKey] || { kickoff: "", midweek: "", endOfWeek: "" }),
        [field]: value,
      },
    }));
  }
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedShareToken, setSavedShareToken] = useState<string | null>(null);
  const [savedSprintId, setSavedSprintId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingDeliverableId, setEditingDeliverableId] = useState<string | null>(null);
  const [editingMultiplier, setEditingMultiplier] = useState<number>(1);
  const [editingNote, setEditingNote] = useState<string>("");
  const [infoDeliverable, setInfoDeliverable] = useState<Deliverable | null>(null);
  useEffect(() => {
    if (isAuthenticated && preselectedProjectId && projects.some((p) => p.id === preselectedProjectId)) {
      setProjectId(preselectedProjectId);
    }
  }, [isAuthenticated, preselectedProjectId, projects]);
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
  const canQuickCreate = isAuthenticated && Boolean(title.trim() && projectId);
  const primaryCtaLabel = isEditing ? "Update sprint" : "Create sprint";
  const primaryCtaBusy = isEditing ? "Updating..." : "Creating...";
  // showSprintDetailsSection removed — replaced by Sprint Outline section

  // Prefill from existing sprint
  useEffect(() => {
    async function loadSprint(existingId: string) {
      try {
        setLoadingExisting(true);
        setError(null);
        console.log('[CLIENT DEBUG] Fetching sprint:', existingId);
        const res = await fetch(`/api/sprint-drafts/${existingId}`);
        const data = await res.json().catch(() => ({}));
        console.log('[CLIENT DEBUG] Full API response:', JSON.stringify(data, null, 2));
        
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

        console.log('[CLIENT DEBUG] Parsed sprint object:', sprint);
        console.log('[CLIENT DEBUG] sprint.startDate value:', sprint.startDate);
        console.log('[CLIENT DEBUG] sprint.startDate type:', typeof sprint.startDate);
        console.log('[CLIENT DEBUG] Checking if startDate exists:', !!sprint.startDate);

        const delivs = Array.isArray(data.deliverables) ? data.deliverables : [];
        setIsEditing(true);
        setTitle((sprint.title ?? "").toString());
        if (sprint.projectId) {
          setProjectId(sprint.projectId);
        }
        if (sprint.startDate) {
          console.log('[CLIENT DEBUG] Setting startDate to:', String(sprint.startDate));
          setStartDate(String(sprint.startDate));
          console.log('[CLIENT DEBUG] startDate state should now be:', String(sprint.startDate));
        } else {
          console.log('[CLIENT DEBUG] startDate is falsy, not setting');
        }
        if (Number.isFinite(Number(sprint.weeks))) {
          setWeeks(Number(sprint.weeks));
        }

        // Custom content from draft
        if (sprint.draft && typeof sprint.draft === "object" && !Array.isArray(sprint.draft)) {
          const d = sprint.draft as Record<string, unknown>;
          if (typeof d.approach === "string") setApproach(d.approach);

          // Load week notes dynamically (week1, week2, week3, ...)
          const loadedNotes: Record<string, WeekCheckpoints> = {};
          for (let i = 1; i <= 52; i++) {
            const key = `week${i}`;
            if (d[key] && typeof d[key] === "object") {
              const w = d[key] as Record<string, unknown>;
              loadedNotes[key] = {
                kickoff: typeof w.kickoff === "string" ? w.kickoff : "",
                midweek: typeof w.midweek === "string" ? w.midweek : "",
                endOfWeek: typeof w.endOfWeek === "string" ? w.endOfWeek : "",
              };
            }
          }
          setWeekNotes(loadedNotes);
        }

        // Map deliverables to builder state
        setSelectedDeliverables(
          delivs.map((d: { deliverableId: unknown; multiplier?: unknown; note?: unknown }) => ({
            deliverableId: String(d.deliverableId),
            multiplier: Number.isFinite(Number(d.multiplier)) ? Number(d.multiplier) : 1,
            note: typeof d.note === "string" ? d.note : "",
          }))
        );

        // Load existing share token if available
        try {
          const shareRes = await fetch(`/api/sprint-drafts/${existingId}/share`);
          const shareData = await shareRes.json().catch(() => ({}));
          if (shareRes.ok && shareData.shareToken) {
            setSavedShareToken(shareData.shareToken);
            setSavedSprintId(existingId);
          }
        } catch {
          // Non-critical
        }
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

    if (!isAuthenticated) {
      setError("Please sign in to create a sprint");
      router.push(loginHref);
      return;
    }

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

      // Include week notes for each week
      const weeksToSave = Number.isFinite(weeks) && weeks > 0 ? Math.round(weeks) : 2;
      for (let i = 1; i <= weeksToSave; i++) {
        const key = `week${i}`;
        const notes = weekNotes[key];
        if (notes && (notes.kickoff.trim() || notes.midweek.trim() || notes.endOfWeek.trim())) {
          customContent[key] = {
            kickoff: notes.kickoff.trim(),
            midweek: notes.midweek.trim(),
            endOfWeek: notes.endOfWeek.trim(),
          };
        }
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

      // Redirect to sprint detail page and force a fresh fetch (avoid stale router cache)
      const sprintDetailPath = `/sprints/${data.sprintDraftId || sprintIdFromQuery}`;
      router.push(sprintDetailPath);
      router.refresh();
    } catch (e) {
      setError((e as Error).message || "Failed to create sprint");
      setSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    if (!isAuthenticated) {
      setError("Please sign in to save a draft");
      router.push(loginHref);
      return;
    }

    if (selectedDeliverables.length === 0) {
      setError("Please select at least one deliverable");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a sprint title");
      return;
    }

    if (!projectId) {
      setError("Please select a project");
      return;
    }

    setSavingDraft(true);
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

      const customContent: Record<string, unknown> = {
        source: "manual",
        sprintTitle: title,
      };
      if (approach.trim()) customContent.approach = approach.trim();

      // Include week notes for each week
      const weeksToSaveDraft = Number.isFinite(weeks) && weeks > 0 ? Math.round(weeks) : 2;
      for (let i = 1; i <= weeksToSaveDraft; i++) {
        const key = `week${i}`;
        const notes = weekNotes[key];
        if (notes && (notes.kickoff.trim() || notes.midweek.trim() || notes.endOfWeek.trim())) {
          customContent[key] = {
            kickoff: notes.kickoff.trim(),
            midweek: notes.midweek.trim(),
            endOfWeek: notes.endOfWeek.trim(),
          };
        }
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

      const existingId = savedSprintId || sprintIdFromQuery;
      const endpoint = existingId ? `/api/sprint-drafts/${existingId}` : "/api/sprint-drafts";
      const method = existingId ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save draft");
      }

      // For new drafts, we get the shareToken in the response
      if (data.shareToken) {
        setSavedShareToken(data.shareToken);
      }
      if (data.sprintDraftId) {
        setSavedSprintId(data.sprintDraftId);
        setIsEditing(true);
      }

      // If this was a PATCH (update) and we don't have a shareToken yet, fetch it
      if (existingId && !data.shareToken && !savedShareToken) {
        try {
          const tokenRes = await fetch(`/api/sprint-drafts/${existingId}/share`);
          const tokenData = await tokenRes.json().catch(() => ({}));
          if (tokenRes.ok && tokenData.shareToken) {
            setSavedShareToken(tokenData.shareToken);
          }
        } catch {
          // Non-critical: share token fetch failed
        }
      }
    } catch (e) {
      setError((e as Error).message || "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  }

  function getShareUrl(token: string): string {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/shared/sprint/${token}`;
    }
    return `/shared/sprint/${token}`;
  }

  async function handleCopyShareLink() {
    if (!savedShareToken) return;
    const url = getShareUrl(savedShareToken);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback: select and copy from a temporary input
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }

  const { totalComplexity, totalPrice, totalHours } = calculateTotals();
  const hoursPerDay = totalDays > 0 ? Number(totalHours || 0) / totalDays : 0;
  const totalPriceCents = Math.max(0, Math.round(Number(totalPrice || 0) * 100));
  const canBudget = selectedDeliverables.length > 0 && totalPriceCents > 0;
  // Pass cents explicitly so the deferred comp page can render dollars accurately
  const budgetHref = canBudget
    ? `/deferred-compensation?amountCents=${totalPriceCents}&sprintId=${sprintIdFromQuery ?? ""}`
    : "#";

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
    for (let i = 1; i <= normalizedWeeks; i++) {
      const key = `week${i}`;
      const notes = weekNotes[key] || { kickoff: "", midweek: "", endOfWeek: "" };
      lines.push(`Week ${i} Kickoff,${escapeCsv(notes.kickoff)}`);
      lines.push(`Week ${i} Mid-Week,${escapeCsv(notes.midweek)}`);
      lines.push(`Week ${i} End of Week,${escapeCsv(notes.endOfWeek)}`);
    }
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
    <div className="container max-w-7xl py-6 text-foreground">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className={pageTitleClass}>Sprint Builder</h1>
          <p className={pageSubtitleClass}>Manually create a sprint with selected deliverables</p>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {canQuickCreate && (
                <button
                  type="submit"
                  form="sprint-form"
                  disabled={submitting || loadingExisting}
                  className={`${bodySmClass} inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 hover:bg-black/80 dark:hover:bg-white/80 disabled:opacity-60 transition-colors duration-150`}
                >
                  {submitting ? primaryCtaBusy : primaryCtaLabel}
                </button>
              )}
              <Link
                href="/dashboard"
                className={`${bodySmClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-150`}
              >
                Back to dashboard
              </Link>
            </>
          ) : null}
        </div>
      </div>

      {error && (
        <div className={`${sectionHelperClass} rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 text-red-700 dark:text-red-300 mb-6`}>
          {error}
        </div>
      )}

      {/* Main layout */}
      <form onSubmit={handleSubmit} id="sprint-form" className="space-y-6">
          {/* Basic Info — always visible; project selection only for authenticated users */}
          <section className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black p-4 space-y-4">
            <h2 className={sectionHeadingClass}>Sprint Details</h2>
          
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              {isAuthenticated && (
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
                    className={`${bodySmClass} w-full rounded-md border border-black/15 dark:border-white/15 px-2 py-1.5 bg-white dark:bg-neutral-900 text-black dark:text-white`}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    <option value="new">+ New project</option>
                  </select>
                </div>
              )}
              {isAuthenticated && projectId === "new" && (
                <div className="space-y-1">
                  <label className={`${labelClass} block mb-1`} htmlFor="new-project-name">
                    New project name
                  </label>
                  <input
                    id="new-project-name"
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className={`${bodySmClass} w-full rounded-md border border-black/15 dark:border-white/15 px-2 py-1.5 bg-white dark:bg-neutral-900 text-black dark:text-white`}
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
                  className={`${bodySmClass} w-full rounded-md border border-black/15 dark:border-white/15 px-2 py-1.5 bg-white dark:bg-neutral-900 text-black dark:text-white`}
                  placeholder="e.g. Q1 2024 MVP Development"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <label className={`${labelClass} block mb-1`} htmlFor="start-date">
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`${bodySmClass} w-full rounded-md border border-black/15 dark:border-white/15 px-2 py-1.5 bg-white dark:bg-neutral-900 text-black dark:text-white`}
                />
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
                  className={`${bodySmClass} w-full rounded-md border border-black/15 dark:border-white/15 px-2 py-1.5 bg-white dark:bg-neutral-900 text-black dark:text-white`}
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
                  className={`${bodySmClass} w-full rounded-md border border-black/15 dark:border-white/15 px-2 py-1.5 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white`}
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
            <section className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black p-4 space-y-4">
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
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => (isSelected ? removeDeliverable(d.id) : addDeliverable(d.id))}
                              className={
                                isSelected
                                  ? `${bodySmClass} group w-full rounded border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-2 text-left cursor-pointer`
                                  : `${bodySmClass} group w-full rounded border border-black/10 dark:border-white/15 p-2 text-left hover:border-black/20 dark:hover:border-white/25 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150 cursor-pointer`
                              }
                              aria-pressed={isSelected}
                              aria-label={`Deliverable ${d.name}`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className={`${bodyClass} font-semibold`}>{d.name}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInfoDeliverable(d);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setInfoDeliverable(d);
                                      }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 inline-flex items-center justify-center rounded-full border border-black/15 dark:border-white/20 size-8 min-w-[44px] min-h-[44px] text-xs hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/25 dark:hover:border-white/30"
                                    aria-label={`View details for ${d.name}`}
                                  >
                                    i
                                  </span>
                                  <div className={`${sectionHelperClass} font-semibold whitespace-nowrap`}>
                                    {selectedItem && selectedItem.multiplier !== 1
                                      ? `${complexity} • ${selectedItem.multiplier}x`
                                      : complexity}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </section>

            {/* Selected Deliverables */}
            <section className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black p-4 space-y-4">
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
                              className="inline-flex items-center justify-center rounded-full border border-black/15 dark:border-white/20 size-8 min-w-[44px] min-h-[44px] text-xs hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/25 dark:hover:border-white/30"
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
                              className={`${bodySmClass} text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300`}
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
              <section className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black p-4 space-y-4">
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
                    <div className={`${totalValueClass} tabular-nums`}>
                      ${totalPrice.toLocaleString()}
                    </div>
                  </div>

                  {showExtras && (
                    <>
                      <div>
                        <div className={`${metricLabelClass} mb-1`}>Estimated Hours per Day</div>
                        <div className={`${metricValueClass} tabular-nums`}>
                          {Number(hoursPerDay || 0).toFixed(1)}
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <div className={`${metricLabelClass} mb-1`}>Working Days</div>
                    <div className={`${metricValueClass} tabular-nums`}>{totalDays.toLocaleString()}</div>
                  </div>

                </div>
              </section>

              <section className="space-y-2">
                {isAuthenticated ? (
                  <>
                    <button
                      type="submit"
                      disabled={submitting || selectedDeliverables.length === 0 || loadingExisting}
                      className={`${bodySmClass} w-full inline-flex items-center justify-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-3 disabled:opacity-60 hover:bg-black/80 dark:hover:bg-white/80 transition-colors duration-150`}
                    >
                      {submitting ? primaryCtaBusy : primaryCtaLabel}
                    </button>

                    {/* Save Draft (saves without navigating away) */}
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={savingDraft || submitting || selectedDeliverables.length === 0 || !title.trim() || loadingExisting}
                      className={`${bodySmClass} w-full inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-60 transition-colors duration-150`}
                    >
                      {savingDraft ? "Saving..." : savedShareToken ? "Update draft" : "Save draft"}
                    </button>
                    
                    <Link
                      href="/dashboard"
                      className={`${bodySmClass} w-full inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-150`}
                    >
                      Cancel
                    </Link>
                    <Link
                      prefetch={false}
                      href={budgetHref}
                      aria-disabled={!canBudget}
                      tabIndex={canBudget ? 0 : -1}
                      onClick={(e) => {
                        if (!canBudget) {
                          e.preventDefault();
                        }
                      }}
                      className={`${bodySmClass} w-full inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-150 ${
                        canBudget ? "" : "opacity-60 cursor-not-allowed"
                      }`}
                    >
                      Budget this sprint
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      prefetch={false}
                      href={budgetHref}
                      aria-disabled={!canBudget}
                      tabIndex={canBudget ? 0 : -1}
                      onClick={(e) => {
                        if (!canBudget) {
                          e.preventDefault();
                        }
                      }}
                      className={`${bodySmClass} w-full inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-150 ${
                        canBudget ? "" : "opacity-60 cursor-not-allowed"
                      }`}
                    >
                      Budget this sprint
                    </Link>
                  </>
                )}
              </section>

              {/* Share Draft section — appears after saving */}
              {savedShareToken && isAuthenticated && (
                <section className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-4 space-y-3">
                  <h3 className={`${sectionHeadingClass}`}>Share this draft</h3>
                  <p className={`${sectionHelperClass}`}>
                    Send this link to your client so they can review the sprint proposal.
                  </p>
                  <div className="flex items-stretch gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getShareUrl(savedShareToken)}
                      className={`${bodySmClass} flex-1 rounded-md border border-black/15 dark:border-white/15 px-2 py-1.5 bg-white dark:bg-neutral-900 text-black dark:text-white truncate`}
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      type="button"
                      onClick={handleCopyShareLink}
                      className={`${bodySmClass} inline-flex items-center rounded-md px-3 py-1.5 transition-colors duration-150 ${
                        copiedLink
                          ? "bg-green-600 text-white"
                          : "bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80"
                      }`}
                    >
                      {copiedLink ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <a
                    href={getShareUrl(savedShareToken)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${bodySmClass} underline text-blue-600 dark:text-blue-400`}
                  >
                    Preview shared page
                  </a>
                </section>
              )}

              {selectedDeliverables.length === 0 && (
                <p className={`${sectionHelperClass} text-center`}>
                  Select deliverables to see calculated totals
                </p>
              )}
            </div>
          </div>

          {/* Sprint Outline — dynamic per-week checkpoints */}
          {weeks > 0 && (
            <section className="rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black p-4 space-y-4">
              <div>
                <h2 className={sectionHeadingClass}>Sprint Outline</h2>
                <p className={sectionHelperClass}>
                  Define checkpoints for each week of the sprint
                </p>
              </div>
              <div className={`grid gap-4 ${weeks >= 2 ? "sm:grid-cols-2" : ""}`}>
                {Array.from({ length: weeks }, (_, i) => {
                  const weekNum = i + 1;
                  const weekKey = `week${weekNum}`;
                  const notes = weekNotes[weekKey] || {
                    kickoff: "",
                    midweek: "",
                    endOfWeek: "",
                  };
                  return (
                    <div
                      key={weekKey}
                      className="rounded-md border border-black/10 dark:border-white/10 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-neutral-800">
                        <h3 className={`${bodyClass} font-semibold`}>
                          Week {weekNum}
                        </h3>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <label
                            className={`${labelClass} flex items-center gap-1.5 mb-1`}
                            htmlFor={`${weekKey}-kickoff`}
                          >
                            <span aria-hidden="true">🚀</span> Kickoff
                          </label>
                          <textarea
                            id={`${weekKey}-kickoff`}
                            value={notes.kickoff}
                            onChange={(e) =>
                              updateWeekNote(weekKey, "kickoff", e.target.value)
                            }
                            rows={2}
                            className={`${bodySmClass} w-full rounded-md border border-black/15 dark:border-white/15 px-2 py-1.5 bg-white dark:bg-neutral-900 text-black dark:text-white resize-y`}
                            placeholder="Goals, alignment, key decisions…"
                          />
                        </div>
                        <div>
                          <label
                            className={`${labelClass} flex items-center gap-1.5 mb-1`}
                            htmlFor={`${weekKey}-midweek`}
                          >
                            <span aria-hidden="true">🔄</span> Mid-Week
                          </label>
                          <textarea
                            id={`${weekKey}-midweek`}
                            value={notes.midweek}
                            onChange={(e) =>
                              updateWeekNote(weekKey, "midweek", e.target.value)
                            }
                            rows={2}
                            className={`${bodySmClass} w-full rounded-md border border-black/15 dark:border-white/15 px-2 py-1.5 bg-white dark:bg-neutral-900 text-black dark:text-white resize-y`}
                            placeholder="Check-in, review, progress…"
                          />
                        </div>
                        <div>
                          <label
                            className={`${labelClass} flex items-center gap-1.5 mb-1`}
                            htmlFor={`${weekKey}-endofweek`}
                          >
                            <span aria-hidden="true">🏁</span> End of Week
                          </label>
                          <textarea
                            id={`${weekKey}-endofweek`}
                            value={notes.endOfWeek}
                            onChange={(e) =>
                              updateWeekNote(
                                weekKey,
                                "endOfWeek",
                                e.target.value
                              )
                            }
                            rows={2}
                            className={`${bodySmClass} w-full rounded-md border border-black/15 dark:border-white/15 px-2 py-1.5 bg-white dark:bg-neutral-900 text-black dark:text-white resize-y`}
                            placeholder="Deliverables, wrap-up, handoff…"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </form>

      {/* Export */}
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={exportCsv}
          className={`${bodySmClass} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-150`}
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
            className="w-full max-w-md rounded-md bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-6 shadow-lg space-y-4"
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
                className={`${bodySmClass} w-full rounded-md border border-black/15 dark:border-white/15 px-2 py-2 bg-white dark:bg-neutral-900 text-black dark:text-white`}
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
                className={`${bodySmClass} w-full rounded-md border border-black/15 dark:border-white/15 px-2 py-2 min-h-[80px] bg-white dark:bg-neutral-900 text-black dark:text-white`}
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
                className={`${bodySmClass} inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2`}
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
            className="w-full max-w-md rounded-md bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-6 shadow-lg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className={sectionHeadingClass}>{infoDeliverable.name}</h3>
                {infoDeliverable.category && <p className={sectionHelperClass}>{infoDeliverable.category}</p>}
              </div>
              <button
                type="button"
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

