"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  SMOKE_TEST_COMPLEXITY_TIERS,
  SMOKE_TEST_DAY_THEMES,
  SMOKE_TEST_DEFAULT_COMPLEXITY,
  SMOKE_TEST_DEFAULT_HOURLY_RATE,
  SMOKE_TEST_TIMELINE_WORKING_DAYS,
  calculateSmokeTestHours,
  calculateSmokeTestPrice,
  inferSmokeTestTier,
  smokeTestHoursPerDayFromComplexity,
} from "@/lib/pricing";

type Sprint = {
  id: string;
  title: string | null;
  type: string | null;
  status: string | null;
  created_at: string;
};

type Project = {
  id: string;
  name: string;
};

type DayPlan = { theme: string; notes: string };

type InitialDraft = {
  id: string;
  projectId: string;
  status: string;
  buildingFromSprintIds: string[];
  noPriorSprint: boolean;
  currentState: string;
  whatsNext: string;
  whyNow: string;
  goodLooksLike: string;
  howWeKnow: string;
  browserPrototypeScope: string;
  figmaFileScope: string;
  implementationMembers: string[];
  existingAssets: string;
  complexityScore: number;
  hourlyRate: number;
  proposedStartDate: string;
  notes: string;
  dayPlans: DayPlan[];
  updatedAt: string;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function defaultDayPlans(): DayPlan[] {
  return Array.from({ length: SMOKE_TEST_TIMELINE_WORKING_DAYS }, (_, i) => ({
    theme: SMOKE_TEST_DAY_THEMES[i] ?? "",
    notes: "",
  }));
}

function formatDayDate(startDateIso: string, dayIndex: number): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateIso)) return null;
  const [y, m, d] = startDateIso.split("-").map((n) => Number(n));
  if (!y || !m || !d) return null;
  const base = new Date(y, m - 1, d);
  if (Number.isNaN(base.getTime())) return null;
  // Day 0 -> Mon week 1, Day 5 -> Mon week 2 (skip 2 weekend days)
  const offset = dayIndex < 5 ? dayIndex : dayIndex + 2;
  base.setDate(base.getDate() + offset);
  return base.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

type Props = {
  projects: Project[];
  sprintsByProject: Record<string, Sprint[]>;
  projectMembersByProject: Record<string, { email: string; displayName: string | null }[]>;
  initialDraft?: InitialDraft | null;
};

const SPRINT_TYPE_LABELS: Record<string, string> = {
  sprint: "Sprint",
  update_cycle: "Update Cycle",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  complete: "Complete",
};

const inputClasses =
  "h-10 px-3 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400";
const textareaClasses =
  "px-3 py-2 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y";
const labelClasses =
  "text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100";
const helpTextClasses =
  "text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-400";
const sectionHeaderClasses =
  "text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100";
const sectionSubClasses =
  "text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400 mt-1";

const MIN_COMPLEXITY = 1;
const MAX_COMPLEXITY = 5;
const MIN_HOURLY_RATE = 1;
const MAX_HOURLY_RATE = 5000;

function formatCurrency(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toDateOnlyLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function upcomingMondays(count: number): Array<{ value: string; label: string }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstMonday = new Date(today);
  const day = today.getDay();
  const daysUntilMonday = (1 - day + 7) % 7;
  firstMonday.setDate(today.getDate() + daysUntilMonday);

  return Array.from({ length: count }, (_, idx) => {
    const d = new Date(firstMonday);
    d.setDate(firstMonday.getDate() + idx * 7);
    return {
      value: toDateOnlyLocal(d),
      label: d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  });
}

export default function SmokeTestSprintBuilderClient({
  projects,
  sprintsByProject,
  projectMembersByProject,
  initialDraft,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProjectId = searchParams.get("projectId");

  const [draftId, setDraftId] = useState<string | null>(initialDraft?.id ?? null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    initialDraft?.updatedAt ?? null
  );

  const [projectId, setProjectId] = useState(
    initialDraft?.projectId ??
      (preselectedProjectId && projects.some((p) => p.id === preselectedProjectId)
        ? preselectedProjectId
        : projects[0]?.id ?? "")
  );

  const [buildingFromIds, setBuildingFromIds] = useState<string[]>(
    initialDraft?.buildingFromSprintIds ?? []
  );
  const [currentState, setCurrentState] = useState(initialDraft?.currentState ?? "");

  const [whatsNext, setWhatsNext] = useState(initialDraft?.whatsNext ?? "");
  const [whyNow, setWhyNow] = useState(initialDraft?.whyNow ?? "");
  const [goodLooksLike, setGoodLooksLike] = useState(initialDraft?.goodLooksLike ?? "");
  const [howWeKnow, setHowWeKnow] = useState(initialDraft?.howWeKnow ?? "");

  const [browserPrototypeScope, setBrowserPrototypeScope] = useState(
    initialDraft?.browserPrototypeScope ?? ""
  );
  const [figmaFileScope, setFigmaFileScope] = useState(initialDraft?.figmaFileScope ?? "");
  const [implementationMembers, setImplementationMembers] = useState<string[]>(
    initialDraft?.implementationMembers ?? []
  );
  const [existingAssets, setExistingAssets] = useState(initialDraft?.existingAssets ?? "");

  const [complexityScore, setComplexityScore] = useState<number>(
    initialDraft?.complexityScore ?? SMOKE_TEST_DEFAULT_COMPLEXITY
  );
  const [hourlyRate, setHourlyRate] = useState<number>(
    initialDraft?.hourlyRate ?? SMOKE_TEST_DEFAULT_HOURLY_RATE
  );
  const [proposedStartDate, setProposedStartDate] = useState(
    initialDraft?.proposedStartDate ?? ""
  );

  const [notes, setNotes] = useState(initialDraft?.notes ?? "");
  const [dayPlans, setDayPlans] = useState<DayPlan[]>(() => {
    const incoming = initialDraft?.dayPlans;
    if (incoming && incoming.length === SMOKE_TEST_TIMELINE_WORKING_DAYS) {
      return incoming.map((p, i) => ({
        theme: p.theme || SMOKE_TEST_DAY_THEMES[i] || "",
        notes: p.notes ?? "",
      }));
    }
    return defaultDayPlans();
  });

  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSprints = useMemo(
    () => sprintsByProject[projectId] ?? [],
    [projectId, sprintsByProject]
  );

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projectId, projects]
  );

  const selectedBuildingFromSprints = useMemo(
    () => availableSprints.filter((s) => buildingFromIds.includes(s.id)),
    [availableSprints, buildingFromIds]
  );
  const availableProjectMembers = useMemo(
    () => projectMembersByProject[projectId] ?? [],
    [projectId, projectMembersByProject]
  );
  const selectedImplementationMembers = useMemo(
    () => availableProjectMembers.filter((m) => implementationMembers.includes(m.email)),
    [availableProjectMembers, implementationMembers]
  );
  const upcomingStartDateOptions = useMemo(() => upcomingMondays(12), []);

  const normalizedComplexity = Math.round(
    clampNumber(complexityScore, MIN_COMPLEXITY, MAX_COMPLEXITY)
  );
  const normalizedHourlyRate = clampNumber(hourlyRate, MIN_HOURLY_RATE, MAX_HOURLY_RATE);
  const mappedHoursPerDay = smokeTestHoursPerDayFromComplexity(normalizedComplexity);
  const impliedHours = calculateSmokeTestHours(normalizedComplexity);
  const totalPrice = calculateSmokeTestPrice(normalizedComplexity, normalizedHourlyRate);
  const tier = inferSmokeTestTier(normalizedComplexity);
  const dailyIntensity = impliedHours / SMOKE_TEST_TIMELINE_WORKING_DAYS;

  function toggleBuildingFromId(id: string) {
    setBuildingFromIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleImplementationMember(email: string) {
    setImplementationMembers((prev) =>
      prev.includes(email) ? prev.filter((x) => x !== email) : [...prev, email]
    );
  }

  function buildPayload(confirm: boolean) {
    return {
      projectId,
      buildingFromSprintIds: buildingFromIds,
      currentState: currentState.trim() || undefined,
      whatsNext: whatsNext.trim() || undefined,
      whyNow: whyNow.trim() || undefined,
      goodLooksLike: goodLooksLike.trim() || undefined,
      howWeKnow: howWeKnow.trim() || undefined,
      browserPrototypeScope: browserPrototypeScope.trim() || undefined,
      figmaFileScope: figmaFileScope.trim() || undefined,
      implementationMembers:
        implementationMembers.length > 0 ? implementationMembers : undefined,
      existingAssets: existingAssets.trim() || undefined,
      complexityTier: tier,
      complexityScore: normalizedComplexity,
      hourlyRate: normalizedHourlyRate,
      proposedStartDate: proposedStartDate || undefined,
      notes: notes.trim() || undefined,
      dayPlans: dayPlans.map((p) => ({
        theme: p.theme.trim(),
        notes: p.notes.trim(),
      })),
      confirm,
    };
  }

  function updateDayPlan(index: number, patch: Partial<DayPlan>) {
    setDayPlans((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );
  }

  async function persist(
    confirm: boolean
  ): Promise<{ id: string; status: string } | null> {
    const payload = buildPayload(confirm);
    const url = draftId
      ? `/api/smoke-test-sprints/${draftId}`
      : "/api/smoke-test-sprints";
    const method = draftId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed (${res.status})`);
    }

    const data = (await res.json()) as { id: string; status: string };
    return data;
  }

  async function handleSaveDraft() {
    if (!projectId || saving || savingDraft) return;
    setError(null);
    setSavingDraft(true);
    try {
      const result = await persist(false);
      if (result) {
        if (!draftId) {
          setDraftId(result.id);
          const params = new URLSearchParams(searchParams.toString());
          params.set("draftId", result.id);
          router.replace(`/dashboard/smoke-test-sprint-builder?${params.toString()}`);
        }
        setLastSavedAt(new Date().toISOString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || savingDraft) return;
    setError(null);
    setSaving(true);

    try {
      await persist(true);
      router.push(`/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const canSubmit = Boolean(projectId) && !saving && !savingDraft;
  const canSaveDraft = Boolean(projectId) && !saving && !savingDraft;
  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) return null;
    try {
      const d = new Date(lastSavedAt);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  }, [lastSavedAt]);

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <Link
          href={projectId ? `/projects/${projectId}` : "/dashboard"}
          className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-150"
        >
          &larr; Back to project
        </Link>
        <h1 className="text-3xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100 mt-3">
          Smoke Test Sprint Builder
        </h1>
        <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400 mt-1">
          Single source — used during or before your Jam Session.
        </p>
        {draftId && (
          <p className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-400 mt-2">
            Editing draft
            {lastSavedLabel ? ` · last saved ${lastSavedLabel}` : ""}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-12">
        {/* Project Context */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className={sectionHeaderClasses}>Project Context</h2>
            <p className={sectionSubClasses}>
              Auto-populated for existing clients. Filled manually for new clients during the Jam Session.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="sts-project" className={labelClasses}>
              Project name
            </label>
            <select
              id="sts-project"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setBuildingFromIds([]);
                setImplementationMembers([]);
              }}
              className={inputClasses}
              required
              disabled={Boolean(draftId)}
            >
              {projects.length === 0 && <option value="">No projects found</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {draftId && (
              <p className={helpTextClasses}>
                Project is locked while editing a saved draft.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className={labelClasses}>Which sprint are we building from?</span>
            <p className={helpTextClasses}>Select all that apply.</p>
            <div className="mt-2 rounded-md border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-200 dark:divide-neutral-700">
              {availableSprints.length === 0 ? (
                <p className="px-3 py-3 text-sm text-neutral-500">
                  No prior sprints found for this project.
                </p>
              ) : (
                availableSprints.map((sprint) => {
                  const checked = buildingFromIds.includes(sprint.id);
                  const typeLabel = sprint.type
                    ? SPRINT_TYPE_LABELS[sprint.type] ?? sprint.type
                    : "Sprint";
                  const statusLabel = sprint.status
                    ? STATUS_LABELS[sprint.status] ?? sprint.status
                    : "";
                  return (
                    <label
                      key={sprint.id}
                      className="flex items-start gap-3 px-3 py-2 cursor-pointer select-none hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleBuildingFromId(sprint.id)}
                        className="mt-1 h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 accent-neutral-900 dark:accent-neutral-100"
                      />
                      <span className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {sprint.title || "Untitled sprint"}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {typeLabel}
                          {statusLabel ? ` · ${statusLabel}` : ""}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="sts-current-state" className={labelClasses}>
              Where are we now
            </label>
            <p className={helpTextClasses}>
              What exists today. What&apos;s working. What isn&apos;t. What the team wants to move on next.
            </p>
            <textarea
              id="sts-current-state"
              value={currentState}
              onChange={(e) => setCurrentState(e.target.value)}
              rows={4}
              placeholder="3–4 sentences max"
              className={textareaClasses}
            />
          </div>
        </section>

        {/* What We're Building */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className={sectionHeaderClasses}>What We&apos;re Building</h2>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="sts-whats-next" className={labelClasses}>
              What&apos;s the next thing
            </label>
            <p className={helpTextClasses}>
              Describe what needs to exist that doesn&apos;t exist yet. A new feature, an improved flow,
              an additional screen, a refined interaction, a deck, a presentation — whatever it is.
            </p>
            <textarea
              id="sts-whats-next"
              value={whatsNext}
              onChange={(e) => setWhatsNext(e.target.value)}
              rows={3}
              placeholder="2–3 sentences"
              className={textareaClasses}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="sts-why-now" className={labelClasses}>
              Why this, why now
            </label>
            <p className={helpTextClasses}>
              What&apos;s driving this. User feedback, a gap in the product, an upcoming milestone,
              something the team has been wanting to address.
            </p>
            <textarea
              id="sts-why-now"
              value={whyNow}
              onChange={(e) => setWhyNow(e.target.value)}
              rows={2}
              placeholder="1–2 sentences"
              className={textareaClasses}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="sts-good" className={labelClasses}>
              What does good look like
            </label>
            <p className={helpTextClasses}>
              When this sprint is done, what does the team point to and say — yes, that&apos;s right.
              Be as specific as possible. Not &ldquo;it feels better&rdquo; — what specifically will be true
              that isn&apos;t true today.
            </p>
            <textarea
              id="sts-good"
              value={goodLooksLike}
              onChange={(e) => setGoodLooksLike(e.target.value)}
              rows={3}
              className={textareaClasses}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="sts-how-know" className={labelClasses}>
              How will we know it worked
            </label>
            <p className={helpTextClasses}>
              After the sprint delivers, what&apos;s the real world signal that confirms the work landed.
              A user test result, a metric, a team decision, a stakeholder sign-off — whatever makes it
              real and confirmable.
            </p>
            <textarea
              id="sts-how-know"
              value={howWeKnow}
              onChange={(e) => setHowWeKnow(e.target.value)}
              rows={3}
              className={textareaClasses}
            />
          </div>
        </section>

        {/* What We're Delivering */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className={sectionHeaderClasses}>What We&apos;re Delivering</h2>
            <p className={sectionSubClasses}>
              Both artifacts are delivered in every sprint. Describe what each needs to contain for this sprint specifically.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="sts-prototype" className={labelClasses}>
              Browser prototype
            </label>
            <p className={helpTextClasses}>
              What the prototype needs to demonstrate. Which flows, screens, or interactions need to be clickable and testable.
              What a reviewer should be able to do inside it.
            </p>
            <textarea
              id="sts-prototype"
              value={browserPrototypeScope}
              onChange={(e) => setBrowserPrototypeScope(e.target.value)}
              rows={3}
              placeholder="2–3 sentences"
              className={textareaClasses}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="sts-figma" className={labelClasses}>
              Figma file
            </label>
            <p className={helpTextClasses}>
              What the Figma file needs to contain. UI screens, components, tokens, slides, brand elements — whatever this
              sprint calls for. Specific enough that both parties agree on what done looks like.
            </p>
            <textarea
              id="sts-figma"
              value={figmaFileScope}
              onChange={(e) => setFigmaFileScope(e.target.value)}
              rows={3}
              placeholder="2–3 sentences"
              className={textareaClasses}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className={labelClasses}>Who is implementing after delivery</span>
            <p className={helpTextClasses}>
              The studio delivers the two core artifacts. Implementation is the client&apos;s responsibility.
              Select everyone on this project who is expected to implement.
            </p>
            <div className="flex flex-col gap-1 mt-1">
              {availableProjectMembers.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  No attached project members found.
                </p>
              ) : (
                availableProjectMembers.map((member) => {
                  const checked = implementationMembers.includes(member.email);
                  return (
                    <label
                      key={member.email}
                      className="flex items-start gap-2 cursor-pointer select-none py-1"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleImplementationMember(member.email)}
                        className="mt-0.5 h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 accent-neutral-900 dark:accent-neutral-100"
                      />
                      <span className="text-sm text-neutral-800 dark:text-neutral-200">
                        {member.displayName || member.email}
                        {member.displayName ? (
                          <span className="ml-1 text-neutral-500 dark:text-neutral-400">
                            ({member.email})
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="sts-assets" className={labelClasses}>
              Existing assets or context to bring in
            </label>
            <p className={helpTextClasses}>
              Figma links, live URLs, prior sprint deliverables, GitHub repos, references, anything relevant.
            </p>
            <textarea
              id="sts-assets"
              value={existingAssets}
              onChange={(e) => setExistingAssets(e.target.value)}
              rows={3}
              placeholder="Links or notes"
              className={textareaClasses}
            />
          </div>
        </section>

        {/* Effort & Pricing */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className={sectionHeaderClasses}>Complexity</h2>
            <p className={sectionSubClasses}>
              Estimate = mapped hours/day from complexity × 10 working days × hourly rate.
              The price updates in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="sts-complexity" className={labelClasses}>
                Complexity
              </label>
              <select
                id="sts-complexity"
                value={String(normalizedComplexity)}
                onChange={(e) => setComplexityScore(Number(e.target.value))}
                className={inputClasses}
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <p className={helpTextClasses}>
                Default complexity 3 (maps to 4 hours/day).
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="sts-rate" className={labelClasses}>
                Hourly rate ($)
              </label>
              <input
                id="sts-rate"
                type="number"
                min={1}
                step={5}
                value={hourlyRate}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) {
                    setHourlyRate(clampNumber(n, MIN_HOURLY_RATE, MAX_HOURLY_RATE));
                  }
                }}
                className={`${inputClasses} tabular-nums`}
              />
              <p className={helpTextClasses}>Default ${SMOKE_TEST_DEFAULT_HOURLY_RATE}/hr.</p>
            </div>
          </div>

          <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-4 flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Estimated price
              </span>
              <span className="text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <p className={helpTextClasses}>
              Formula: {normalizedHourlyRate.toLocaleString()} × {mappedHoursPerDay} hrs/day × {SMOKE_TEST_TIMELINE_WORKING_DAYS} days
              {" "}= {impliedHours.toLocaleString()} studio hours across 2 weeks (
              {dailyIntensity.toFixed(1)} hrs/day).
            </p>
          </div>
        </section>

        {/* Timeline */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className={sectionHeaderClasses}>Timeline</h2>
            <p className={sectionSubClasses}>
              Every Smoke Test Sprint runs the same 2-week uphill / downhill arc.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="sts-start-date" className={labelClasses}>
              Proposed start date
            </label>
            <p className={helpTextClasses}>
              Optional. Use this to indicate your preferred kickoff date.
            </p>
            <select
              id="sts-start-date"
              value={proposedStartDate}
              onChange={(e) => setProposedStartDate(e.target.value)}
              className={inputClasses}
            >
              <option value="">Select a Monday</option>
              {upcomingStartDateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 flex flex-col gap-3 text-sm text-neutral-700 dark:text-neutral-300">
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">Week 1 — Uphill</div>
              <div className="opacity-80">
                Kickoff Monday. Exploration and direction through the week. Direction locked Friday.
              </div>
            </div>
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">Week 2 — Downhill</div>
              <div className="opacity-80">
                Build begins Monday. Mid-week check Wednesday. Delivery Friday.
              </div>
            </div>
            <div className="opacity-80 text-xs">
              Four live moments — Kickoff, Ingredient Review, Direction Check, Delivery. Everything else async via your client dashboard.
            </div>
          </div>
        </section>

        {/* Day-by-day plan */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className={sectionHeaderClasses}>Day-by-day plan</h2>
            <p className={sectionSubClasses}>
              One row per working day. Themes are pre-filled but editable. Notes are optional —
              fill in only the days where you want to capture intent.
            </p>
          </div>

          {[0, 1].map((weekIdx) => {
            const isUphill = weekIdx === 0;
            const weekHeader = isUphill
              ? "⛰️ Week 1 — Uphill"
              : "🏁 Week 2 — Downhill";
            const startIdx = weekIdx * 5;
            return (
              <div key={weekIdx} className="flex flex-col gap-3">
                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {weekHeader}
                </div>
                <div className="rounded-md border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-200 dark:divide-neutral-700">
                  {Array.from({ length: 5 }, (_, i) => {
                    const dayIdx = startIdx + i;
                    const dayNumber = dayIdx + 1;
                    const weekdayLabel = DAY_LABELS[i];
                    const dateLabel = formatDayDate(proposedStartDate, dayIdx);
                    const plan = dayPlans[dayIdx] ?? { theme: "", notes: "" };
                    return (
                      <div
                        key={dayIdx}
                        className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:gap-4 sm:items-start"
                      >
                        <div className="sm:w-32 shrink-0">
                          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            Day {dayNumber} · {weekdayLabel}
                          </div>
                          {dateLabel && (
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">
                              {dateLabel}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <input
                            type="text"
                            value={plan.theme}
                            onChange={(e) =>
                              updateDayPlan(dayIdx, { theme: e.target.value })
                            }
                            placeholder="Theme"
                            maxLength={60}
                            className={`${inputClasses} h-9`}
                            aria-label={`Day ${dayNumber} theme`}
                          />
                          <textarea
                            value={plan.notes}
                            onChange={(e) =>
                              updateDayPlan(dayIdx, { notes: e.target.value })
                            }
                            rows={2}
                            placeholder="What we'll get done this day (optional)"
                            className={textareaClasses}
                            aria-label={`Day ${dayNumber} notes`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {/* Scope Output */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className={sectionHeaderClasses}>Scope Output</h2>
            <p className={sectionSubClasses}>
              Generated from the inputs above. Confirmed by both parties before work begins.
            </p>
          </div>
          <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-4">
            <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="font-medium text-neutral-500">Sprint type</dt>
              <dd className="text-neutral-900 dark:text-neutral-100">Smoke Test Sprint</dd>

              <dt className="font-medium text-neutral-500">Project</dt>
              <dd className="text-neutral-900 dark:text-neutral-100">
                {selectedProject?.name || <span className="opacity-60">Select a project</span>}
              </dd>

              <dt className="font-medium text-neutral-500">Building from</dt>
              <dd className="text-neutral-900 dark:text-neutral-100">
                {selectedBuildingFromSprints.length > 0 ? (
                  selectedBuildingFromSprints
                    .map((s) => s.title || "Untitled sprint")
                    .join(", ")
                ) : (
                  <span className="opacity-60">— none selected —</span>
                )}
              </dd>

              <dt className="font-medium text-neutral-500">Browser prototype</dt>
              <dd className="text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
                {browserPrototypeScope.trim() || <span className="opacity-60">—</span>}
              </dd>

              <dt className="font-medium text-neutral-500">Figma file</dt>
              <dd className="text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
                {figmaFileScope.trim() || <span className="opacity-60">—</span>}
              </dd>

              <dt className="font-medium text-neutral-500">Implementing after delivery</dt>
              <dd className="text-neutral-900 dark:text-neutral-100">
                {selectedImplementationMembers.length > 0
                  ? selectedImplementationMembers
                      .map((member) => member.displayName || member.email)
                      .join(", ")
                  : <span className="opacity-60">—</span>}
              </dd>

              <dt className="font-medium text-neutral-500">Complexity</dt>
              <dd className="text-neutral-900 dark:text-neutral-100">
                {tier === "custom"
                  ? `${normalizedComplexity} (${mappedHoursPerDay} hrs/day)`
                  : `${SMOKE_TEST_COMPLEXITY_TIERS[tier].label} (${normalizedComplexity} · ${mappedHoursPerDay} hrs/day)`}
              </dd>

              <dt className="font-medium text-neutral-500">Timeline</dt>
              <dd className="text-neutral-900 dark:text-neutral-100">2 weeks</dd>

              <dt className="font-medium text-neutral-500">Proposed start date</dt>
              <dd className="text-neutral-900 dark:text-neutral-100">
                {proposedStartDate || <span className="opacity-60">—</span>}
              </dd>

              <dt className="font-medium text-neutral-500">Cadence</dt>
              <dd className="text-neutral-900 dark:text-neutral-100">Week 1 Uphill / Week 2 Downhill</dd>

              <dt className="font-medium text-neutral-500">Implied studio hours</dt>
              <dd className="text-neutral-900 dark:text-neutral-100 tabular-nums">
                {impliedHours.toLocaleString()} hrs
              </dd>

              <dt className="font-medium text-neutral-500">Daily intensity</dt>
              <dd className="text-neutral-900 dark:text-neutral-100 tabular-nums">
                {dailyIntensity.toFixed(1)} hrs/day
              </dd>

              <dt className="font-medium text-neutral-500">Estimated price</dt>
              <dd className="text-neutral-900 dark:text-neutral-100 tabular-nums">
                {formatCurrency(totalPrice)}
              </dd>
            </dl>
            <p className={`${helpTextClasses} mt-3`}>
              This estimate is calculated directly from complexity, mapped hours/day, and hourly rate inputs.
            </p>
          </div>
        </section>

        {/* Notes */}
        <section className="flex flex-col gap-2">
          <div>
            <h2 className={sectionHeaderClasses}>Notes</h2>
            <p className={sectionSubClasses}>
              Open questions, constraints, dependencies, implementation specifics, anything else worth capturing before the sprint begins.
            </p>
          </div>
          <textarea
            id="sts-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className={textareaClasses}
          />
        </section>

        {/* Next Step */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className={sectionHeaderClasses}>Next Step</h2>
            <p className={sectionSubClasses}>
              Once scope is confirmed Chris will send a brief sprint agreement and first invoice.
              Kickoff is scheduled for the Monday following agreement.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-11 px-5 text-sm rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium hover:opacity-90 transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Confirm scope and schedule kickoff →"}
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={!canSaveDraft}
              className="h-11 px-4 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {savingDraft ? "Saving…" : draftId ? "Save draft" : "Save as draft"}
            </button>
            <Link
              href={projectId ? `/projects/${projectId}` : "/dashboard"}
              className="h-11 px-4 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150"
            >
              Cancel
            </Link>
            {lastSavedLabel && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Last saved {lastSavedLabel}
              </span>
            )}
          </div>
        </section>
      </form>
    </main>
  );
}
