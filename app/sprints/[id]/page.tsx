import { ensureSchema, getPool } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

export default async function SprintDetailPage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();
  
  // Get current user if logged in
  const currentUser = await getCurrentUser();
  
  // Fetch sprint with document info including account_id and email
  const result = await pool.query(
    `SELECT sd.id, sd.document_id, sd.ai_response_id, sd.draft, sd.status, sd.title,
            sd.deliverable_count, sd.total_estimate_points, sd.total_fixed_hours, sd.total_fixed_price, 
            sd.created_at, sd.updated_at,
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
  };
  
  // Check if current user owns this sprint
  const isOwner = currentUser && row.account_id === currentUser.accountId;

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
  type BacklogItem = {
    id?: string;
    title?: string;
    description?: string;
    estimatePoints?: number;
    owner?: string;
    acceptanceCriteria?: string[];
  };
  type TimelineItem = {
    day?: string | number;
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
    backlog?: BacklogItem[];
    timeline?: TimelineItem[];
    assumptions?: string[];
    risks?: string[];
    notes?: string[];
  };

  const plan: DraftPlan = (() => {
    if (!isObject(row.draft)) return {};
    const d = row.draft as Record<string, unknown>;
    const deliverablesRaw = Array.isArray(d.deliverables) ? (d.deliverables as unknown[]) : [];
    const backlogRaw = Array.isArray(d.backlog) ? (d.backlog as unknown[]) : [];
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
      backlog: backlogRaw
        .map((it): BacklogItem => {
          if (!isObject(it)) return {};
          const o = it as Record<string, unknown>;
          const estimate =
            typeof o.estimatePoints === "number"
              ? o.estimatePoints
              : typeof o.estimatePoints === "string" && !isNaN(Number(o.estimatePoints))
              ? Number(o.estimatePoints)
              : undefined;
          return {
            id: typeof o.id === "string" ? o.id : undefined,
            title: typeof o.title === "string" ? o.title : undefined,
            description: typeof o.description === "string" ? o.description : undefined,
            estimatePoints: estimate,
            owner: typeof o.owner === "string" ? o.owner : undefined,
            acceptanceCriteria: asStringArray(o.acceptanceCriteria),
          };
        })
        .filter((x) => isObject(x)),
      timeline: timelineRaw
        .map((it): TimelineItem => {
          if (!isObject(it)) return {};
          const o = it as Record<string, unknown>;
          return {
            day: typeof o.day === "number" || typeof o.day === "string" ? (o.day as number | string) : undefined,
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

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-6 font-[family-name:var(--font-geist-sans)]">
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
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-4">
          <h2 className="text-lg font-semibold mb-3">Sprint Totals (Fixed Pricing)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="opacity-70 text-xs mb-1">Total Points</div>
              <div className="text-2xl font-bold">{row.total_estimate_points ?? 0}</div>
            </div>
            <div>
              <div className="opacity-70 text-xs mb-1">Fixed Hours</div>
              <div className="text-2xl font-bold">{row.total_fixed_hours ?? 0}h</div>
            </div>
            <div>
              <div className="opacity-70 text-xs mb-1">Fixed Price</div>
              <div className="text-2xl font-bold">
                ${(row.total_fixed_price ?? 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sprint Approach */}
      {plan.approach && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950 p-4">
          <h2 className="text-lg font-semibold mb-3">Sprint Approach</h2>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{plan.approach}</p>
        </div>
      )}

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
        {plan.deliverables && plan.deliverables.length > 0 && (
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
            <h2 className="text-lg font-semibold mb-3">Deliverables</h2>
            <ul className="space-y-3 text-sm">
              {plan.deliverables.map((d, i) => (
                <li key={d.deliverableId || d.name || i} className="border border-black/10 dark:border-white/15 rounded-md p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-medium">
                      {d.name || <span className="opacity-50">Unnamed deliverable</span>}
                    </div>
                    {d.deliverableId && (
                      <div className="text-[11px] font-mono opacity-60">
                        id: {d.deliverableId}
                      </div>
                    )}
                  </div>
                  {d.reason && (
                    <p className="text-xs opacity-80 whitespace-pre-wrap">
                      {d.reason}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
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

        {plan.backlog && plan.backlog.length > 0 && (
          <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
            <div className="bg-black/5 dark:bg-white/5 px-4 py-3">
              <h2 className="text-lg font-semibold">Backlog</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left bg-black/5 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-2 font-semibold">ID</th>
                    <th className="px-4 py-2 font-semibold">Title</th>
                    <th className="px-4 py-2 font-semibold">Description</th>
                    <th className="px-4 py-2 font-semibold">Estimate</th>
                    <th className="px-4 py-2 font-semibold">Owner</th>
                    <th className="px-4 py-2 font-semibold">Acceptance Criteria</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.backlog.map((b, i) => (
                    <tr key={`${b.id || i}`} className="border-t border-black/10 dark:border-white/10 align-top">
                      <td className="px-4 py-2 font-mono">{b.id || <span className="opacity-50">—</span>}</td>
                      <td className="px-4 py-2">{b.title || <span className="opacity-50">—</span>}</td>
                      <td className="px-4 py-2 whitespace-pre-wrap">{b.description || <span className="opacity-50">—</span>}</td>
                      <td className="px-4 py-2">{typeof b.estimatePoints === "number" ? b.estimatePoints : <span className="opacity-50">—</span>}</td>
                      <td className="px-4 py-2">{b.owner || <span className="opacity-50">—</span>}</td>
                      <td className="px-4 py-2">
                        {b.acceptanceCriteria && b.acceptanceCriteria.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {b.acceptanceCriteria.map((ac, j) => (
                              <li key={`${ac}-${j}`}>{ac}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="opacity-50">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {plan.timeline && plan.timeline.length > 0 && (
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
            <h2 className="text-lg font-semibold mb-3">Timeline</h2>
            <ol className="space-y-3">
              {plan.timeline.map((t, i) => (
                <li key={`${t.day || i}`} className="rounded border border-black/10 dark:border-white/15 p-3">
                  <div className="text-sm">
                    <div className="font-medium">
                      Day {typeof t.day === "number" ? t.day : t.day || i + 1}
                      {t.focus ? <span className="opacity-70"> — {t.focus}</span> : null}
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


