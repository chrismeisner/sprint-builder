import { ensureSchema, getPool } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DeliverablesEditor from "./DeliverablesEditor";
import SprintTotals from "./SprintTotals";
import WorkshopSection from "./WorkshopSection";
import AdminStatusChanger from "./AdminStatusChanger";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

export default async function SprintDetailPage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();
  
  // Get current user if logged in
  const currentUser = await getCurrentUser();
  
  // Fetch sprint with document info including account_id, email, and workshop data
  const result = await pool.query(
    `SELECT sd.id, sd.document_id, sd.ai_response_id, sd.draft, sd.status, sd.title,
            sd.deliverable_count, sd.total_estimate_points, sd.total_fixed_hours, sd.total_fixed_price, 
            sd.created_at, sd.updated_at,
            sd.workshop_agenda, sd.workshop_generated_at, sd.workshop_ai_response_id,
            d.email, d.account_id
     FROM sprint_drafts sd
     JOIN documents d ON sd.document_id = d.id
     WHERE sd.id = $1`,
    [params.id]
  );
  if (result.rowCount === 0) {
    notFound();
  }
  const row = result.rows[0] as {
    id: string;
    document_id: string;
    ai_response_id: string | null;
    draft: unknown;
    status: string | null;
    title: string | null;
    deliverable_count: number | null;
    total_estimate_points: number | null;
    total_fixed_hours: number | null;
    total_fixed_price: number | null;
    created_at: string | Date;
    updated_at: string | Date | null;
    email: string | null;
    account_id: string | null;
    workshop_agenda: unknown;
    workshop_generated_at: string | Date | null;
    workshop_ai_response_id: string | null;
  };
  
  // Check if current user owns this sprint
  const isOwner = currentUser && row.account_id === currentUser.accountId;

  // Fetch deliverables from junction table with complexity scores and custom scope
  const deliverablesResult = await pool.query(
    `SELECT 
      spd.deliverable_id,
      spd.complexity_score,
      spd.custom_hours,
      spd.custom_price,
      spd.custom_estimate_points,
      spd.custom_scope,
      d.name,
      d.category,
      d.fixed_hours,
      d.fixed_price,
      d.default_estimate_points,
      d.deliverable_type
     FROM sprint_deliverables spd
     JOIN deliverables d ON spd.deliverable_id = d.id
     WHERE spd.sprint_draft_id = $1
     ORDER BY spd.created_at`,
    [params.id]
  );

  const sprintDeliverables = deliverablesResult.rows.map((row) => ({
    deliverableId: row.deliverable_id as string,
    name: row.name as string,
    category: row.category as string | null,
    deliverableType: row.deliverable_type as string | null,
    complexityScore: row.complexity_score != null ? Number(row.complexity_score) : 1.0,
    customHours: row.custom_hours != null ? Number(row.custom_hours) : null,
    customPrice: row.custom_price != null ? Number(row.custom_price) : null,
    customPoints: row.custom_estimate_points != null ? Number(row.custom_estimate_points) : null,
    customScope: row.custom_scope as string | null,
    baseHours: row.fixed_hours != null ? Number(row.fixed_hours) : null,
    basePrice: row.fixed_price != null ? Number(row.fixed_price) : null,
    basePoints: row.default_estimate_points != null ? Number(row.default_estimate_points) : null,
  }));

  function isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.map((v) => (typeof v === "string" ? v : String(v))).filter((v) => v.trim().length > 0);
  }
  type PlanDeliverable = {
    deliverableId?: string;
    name?: string;
    reason?: string;
  };
  type TimelineItem = {
    day?: string | number;
    dayOfWeek?: string;
    focus?: string;
    items?: string[];
  };
  type WeekPlan = {
    overview?: string;
    goals?: string[];
    deliverables?: string[];
    milestones?: string[];
  };
  type DraftPlan = {
    sprintTitle?: string;
    goals?: string[];
    deliverables?: PlanDeliverable[];
    week1?: WeekPlan;
    week2?: WeekPlan;
    approach?: string;
    timeline?: TimelineItem[];
    assumptions?: string[];
    risks?: string[];
    notes?: string[];
  };

  const plan: DraftPlan = (() => {
    if (!isObject(row.draft)) return {};
    const d = row.draft as Record<string, unknown>;
    const deliverablesRaw = Array.isArray(d.deliverables) ? (d.deliverables as unknown[]) : [];
    const timelineRaw = Array.isArray(d.timeline) ? (d.timeline as unknown[]) : [];
    
    // Parse week1
    const week1 = isObject(d.week1) ? (d.week1 as Record<string, unknown>) : null;
    const week1Plan: WeekPlan | undefined = week1 ? {
      overview: typeof week1.overview === "string" ? week1.overview : undefined,
      goals: asStringArray(week1.goals),
      deliverables: asStringArray(week1.deliverables),
      milestones: asStringArray(week1.milestones),
    } : undefined;
    
    // Parse week2
    const week2 = isObject(d.week2) ? (d.week2 as Record<string, unknown>) : null;
    const week2Plan: WeekPlan | undefined = week2 ? {
      overview: typeof week2.overview === "string" ? week2.overview : undefined,
      goals: asStringArray(week2.goals),
      deliverables: asStringArray(week2.deliverables),
      milestones: asStringArray(week2.milestones),
    } : undefined;
    
    return {
      sprintTitle: typeof d.sprintTitle === "string" ? d.sprintTitle : undefined,
      goals: asStringArray(d.goals),
      approach: typeof d.approach === "string" ? d.approach : undefined,
      week1: week1Plan,
      week2: week2Plan,
      deliverables: deliverablesRaw
        .map((it): PlanDeliverable => {
          if (!isObject(it)) return {};
          const o = it as Record<string, unknown>;
          return {
            deliverableId: typeof o.deliverableId === "string" ? o.deliverableId : undefined,
            name: typeof o.name === "string" ? o.name : undefined,
            reason: typeof o.reason === "string" ? o.reason : undefined,
          };
        })
        .filter((d) => isObject(d)),
      timeline: timelineRaw
        .map((it): TimelineItem => {
          if (!isObject(it)) return {};
          const o = it as Record<string, unknown>;
          return {
            day: typeof o.day === "number" || typeof o.day === "string" ? (o.day as number | string) : undefined,
            dayOfWeek: typeof o.dayOfWeek === "string" ? o.dayOfWeek : undefined,
            focus: typeof o.focus === "string" ? o.focus : undefined,
            items: asStringArray(o.items),
          };
        })
        .filter((x) => isObject(x)),
      assumptions: asStringArray(d.assumptions),
      risks: asStringArray(d.risks),
      notes: asStringArray(d.notes),
    };
  })();

  const isAdmin = currentUser?.isAdmin === true;

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-6 font-[family-name:var(--font-geist-sans)]">
      {/* Admin Mode Banner */}
      {isAdmin && (
        <div className="sticky top-0 z-50 -mx-6 -mt-6 mb-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-sm">Admin Mode</span>
              </div>
              <span className="text-xs opacity-90 hidden sm:inline">
                Viewing as administrator • Extended permissions active
              </span>
            </div>
            <AdminStatusChanger sprintId={row.id} currentStatus={row.status || "draft"} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {row.title || plan.sprintTitle?.trim() || "Sprint draft"}
          </h1>
          {isOwner && (
            <div className="mt-2 inline-flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Your sprint</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/documents/${row.document_id}`}
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
          >
            Back to document
          </Link>
          <Link
            href="/documents"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
          >
            Documents
          </Link>
        </div>
      </div>

      {row.status === "draft" && isOwner && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 text-sm">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Draft Mode - Sprint is Editable
              </div>
              <p className="text-blue-800 dark:text-blue-200 opacity-90">
                You can add or remove deliverables below. The totals will update automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sprint Setup Checklist */}
      {row.status === "draft" && isOwner && (
        <div className="rounded-lg border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <h2 className="text-xl font-bold">Sprint Setup Checklist</h2>
            </div>
            <p className="text-sm opacity-80">
              Complete these 5 steps to activate your sprint. Most clients complete this in under 10 minutes.
            </p>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="rounded-lg bg-white dark:bg-black/40 p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-400 dark:border-gray-600 mt-0.5"></div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-base">1. Review Draft Sprint Deliverables</h3>
                    <p className="text-sm opacity-80">
                      Check that the scope, prices, and timeline match your needs. You can edit deliverables below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-lg bg-white dark:bg-black/40 p-4 border border-gray-200 dark:border-gray-700 opacity-60">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-700 mt-0.5"></div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-base">2. Confirm Deliverables with Studio</h3>
                    <p className="text-sm opacity-80">
                      Approve the draft sprint or request an optional 15-min discovery call.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-lg bg-white dark:bg-black/40 p-4 border border-gray-200 dark:border-gray-700 opacity-60">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-700 mt-0.5"></div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-base">3. Choose Your Kickoff Monday</h3>
                    <p className="text-sm opacity-80">
                      Select your preferred start date from the studio&apos;s available Mondays.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="rounded-lg bg-white dark:bg-black/40 p-4 border border-gray-200 dark:border-gray-700 opacity-60">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-700 mt-0.5"></div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-base">4. Sign Sprint Agreement</h3>
                    <p className="text-sm opacity-80">
                      Agreement auto-generated with your deliverables, pricing, and schedule.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="rounded-lg bg-white dark:bg-black/40 p-4 border border-gray-200 dark:border-gray-700 opacity-60">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-700 mt-0.5"></div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-base">5. Pay 50% Deposit</h3>
                    <p className="text-sm opacity-80">
                      Secure your sprint slot (Stripe link provided automatically).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-green-200 dark:border-green-800 text-center">
              <p className="text-sm font-medium">
                🎉 Once these 5 steps are complete → Your Sprint Is Locked In
              </p>
              <p className="text-xs opacity-70 mt-1">
                Kickoff starts on your scheduled Monday.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-2 text-sm">
        <div>
          <span className="font-mono opacity-70">id:</span> {row.id}
        </div>
        <div>
          <span className="font-mono opacity-70">status:</span>{" "}
          <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 text-xs">
            {row.status || "draft"}
          </span>
        </div>
        {row.email && (
          <div>
            <span className="font-mono opacity-70">email:</span> {row.email}
          </div>
        )}
        {row.deliverable_count != null && row.deliverable_count > 0 && (
          <div>
            <span className="font-mono opacity-70">deliverables:</span> {row.deliverable_count}
          </div>
        )}
        <div>
          <span className="font-mono opacity-70">document:</span> {row.document_id}
        </div>
        <div>
          <span className="font-mono opacity-70">ai response:</span>{" "}
          {row.ai_response_id ?? <span className="opacity-50">—</span>}
        </div>
        <div>
          <span className="font-mono opacity-70">created:</span>{" "}
          {new Date(row.created_at).toLocaleString()}
        </div>
        {row.updated_at && (
          <div>
            <span className="font-mono opacity-70">updated:</span>{" "}
            {new Date(row.updated_at).toLocaleString()}
          </div>
        )}
      </div>

      {(row.total_estimate_points != null || row.total_fixed_hours != null || row.total_fixed_price != null) && (
        <SprintTotals
          initialPoints={Number(row.total_estimate_points ?? 0)}
          initialHours={Number(row.total_fixed_hours ?? 0)}
          initialPrice={Number(row.total_fixed_price ?? 0)}
          isEditable={row.status === "draft" && Boolean(isOwner)}
        />
      )}

      {/* Sprint Approach */}
      {plan.approach && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950 p-4">
          <h2 className="text-lg font-semibold mb-3">Sprint Approach</h2>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{plan.approach}</p>
        </div>
      )}

      {/* Workshop Section */}
      <WorkshopSection
        sprintId={row.id}
        sprintStatus={row.status || "draft"}
        workshopAgenda={row.workshop_agenda as Record<string, unknown> | null}
        workshopGeneratedAt={row.workshop_generated_at ? new Date(row.workshop_generated_at).toISOString() : null}
        isAdmin={currentUser?.isAdmin === true}
      />

      {/* Week 1 & Week 2 Breakdown */}
      {(plan.week1 || plan.week2) && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Week 1 */}
          {plan.week1 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 p-4">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                  1
                </span>
                Week 1
              </h2>
              
              {plan.week1.overview && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold uppercase opacity-70 mb-2">Overview</h3>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{plan.week1.overview}</p>
                </div>
              )}
              
              {plan.week1.goals && plan.week1.goals.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold uppercase opacity-70 mb-2">Goals</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {plan.week1.goals.map((g, i) => (
                      <li key={`w1-goal-${i}`}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {plan.week1.deliverables && plan.week1.deliverables.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold uppercase opacity-70 mb-2">Deliverables</h3>
                  <ul className="space-y-1 text-sm">
                    {plan.week1.deliverables.map((d, i) => (
                      <li key={`w1-del-${i}`} className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {plan.week1.milestones && plan.week1.milestones.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase opacity-70 mb-2">Milestones</h3>
                  <ul className="space-y-1 text-sm">
                    {plan.week1.milestones.map((m, i) => (
                      <li key={`w1-ms-${i}`} className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">🎯</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* Week 2 */}
          {plan.week2 && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 p-4">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold">
                  2
                </span>
                Week 2
              </h2>
              
              {plan.week2.overview && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold uppercase opacity-70 mb-2">Overview</h3>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{plan.week2.overview}</p>
                </div>
              )}
              
              {plan.week2.goals && plan.week2.goals.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold uppercase opacity-70 mb-2">Goals</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {plan.week2.goals.map((g, i) => (
                      <li key={`w2-goal-${i}`}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {plan.week2.deliverables && plan.week2.deliverables.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold uppercase opacity-70 mb-2">Deliverables</h3>
                  <ul className="space-y-1 text-sm">
                    {plan.week2.deliverables.map((d, i) => (
                      <li key={`w2-del-${i}`} className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {plan.week2.milestones && plan.week2.milestones.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase opacity-70 mb-2">Milestones</h3>
                  <ul className="space-y-1 text-sm">
                    {plan.week2.milestones.map((m, i) => (
                      <li key={`w2-ms-${i}`} className="flex items-start gap-2">
                        <span className="text-orange-600 dark:text-orange-400 mt-0.5">🎯</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <section className="space-y-6">
        {/* Show editable deliverables if draft and owned by user */}
        {row.status === "draft" && isOwner ? (
          <DeliverablesEditor
            sprintId={row.id}
            currentDeliverables={sprintDeliverables}
            totalHours={row.total_fixed_hours || 0}
            totalPrice={row.total_fixed_price || 0}
            totalPoints={row.total_estimate_points || 0}
          />
        ) : (
          /* Show read-only deliverables if not editable */
          plan.deliverables && plan.deliverables.length > 0 && (
            <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
              <h2 className="text-lg font-semibold mb-3">Deliverables</h2>
              <ul className="space-y-3 text-sm">
                {plan.deliverables.map((d, i) => {
                  const isWorkshop = d.name?.toLowerCase().includes('workshop');
                  return (
                    <li 
                      key={d.deliverableId || d.name || i} 
                      className={`border rounded-md p-3 ${
                        isWorkshop 
                          ? 'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/30' 
                          : 'border-black/10 dark:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          {isWorkshop && (
                            <span className="inline-flex items-center rounded-full bg-purple-600 text-white px-2 py-0.5 text-[10px] font-semibold">
                              📋 WORKSHOP
                            </span>
                          )}
                          <div className="font-medium">
                            {d.name || <span className="opacity-50">Unnamed deliverable</span>}
                          </div>
                        </div>
                        {d.deliverableId && (
                          <div className="text-[11px] font-mono opacity-60">
                            id: {d.deliverableId}
                          </div>
                        )}
                      </div>
                      {isWorkshop && (
                        <p className="text-xs text-purple-700 dark:text-purple-300 mb-2 font-medium">
                          📅 Monday 9:00 AM - Sprint kickoff and alignment session
                        </p>
                      )}
                      {d.reason && (
                        <p className="text-xs opacity-80 whitespace-pre-wrap">
                          {d.reason}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )
        )}

        {plan.goals && plan.goals.length > 0 && (
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
            <h2 className="text-lg font-semibold mb-3">Goals</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {plan.goals.map((g, i) => (
                <li key={`${g}-${i}`}>{g}</li>
              ))}
            </ul>
          </div>
        )}

        {plan.timeline && plan.timeline.length > 0 && (
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
            <h2 className="text-lg font-semibold mb-3">Timeline</h2>
            <ol className="space-y-3">
              {plan.timeline.map((t, i) => (
                <li key={`${t.day || i}`} className="rounded border border-black/10 dark:border-white/15 p-3">
                  <div className="text-sm">
                    <div className="font-medium flex items-baseline gap-2">
                      <span>Day {typeof t.day === "number" ? t.day : t.day || i + 1}</span>
                      {t.dayOfWeek && (
                        <span className="text-xs font-normal opacity-60">({t.dayOfWeek})</span>
                      )}
                      {t.focus && <span className="opacity-70">— {t.focus}</span>}
                    </div>
                    {t.items && t.items.length > 0 ? (
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {t.items.map((it, j) => (
                          <li key={`${it}-${j}`}>{it}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {plan.assumptions && plan.assumptions.length > 0 && (
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
            <h2 className="text-lg font-semibold mb-2">Assumptions</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {plan.assumptions.map((a, i) => (
                <li key={`${a}-${i}`}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {plan.risks && plan.risks.length > 0 && (
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
            <h2 className="text-lg font-semibold mb-2">Risks</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {plan.risks.map((r, i) => (
                <li key={`${r}-${i}`}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {plan.notes && plan.notes.length > 0 && (
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
            <h2 className="text-lg font-semibold mb-2">Notes</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {plan.notes.map((n, i) => (
                <li key={`${n}-${i}`}>{n}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Draft JSON</h2>
        <pre className="text-xs overflow-x-auto bg-black/5 dark:bg-white/5 rounded p-3">
{JSON.stringify(row.draft, null, 2)}
        </pre>
      </section>
    </main>
  );
}


