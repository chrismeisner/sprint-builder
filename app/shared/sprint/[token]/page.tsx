import { ensureSchema, getPool } from "@/lib/db";
import { hoursFromPoints, priceFromPoints } from "@/lib/pricing";
import { notFound } from "next/navigation";
import SharedSprintView from "./SharedSprintView";

export const dynamic = "force-dynamic";

type Props = {
  params: { token: string };
};

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default async function SharedSprintPage({ params }: Props) {
  await ensureSchema();
  const pool = getPool();
  const { token } = params;

  if (!token) notFound();

  // Look up sprint by share_token
  const sprintRes = await pool.query(
    `SELECT 
       sd.id, sd.title, sd.status, sd.start_date, sd.due_date, sd.weeks,
       sd.total_estimate_points, sd.total_fixed_hours, sd.total_fixed_price,
       sd.deliverable_count, sd.draft, sd.created_at, sd.updated_at,
       sd.package_name_snapshot, sd.package_description_snapshot,
       p.name as project_name
     FROM sprint_drafts sd
     LEFT JOIN projects p ON sd.project_id = p.id
     WHERE sd.share_token = $1`,
    [token]
  );

  if (sprintRes.rowCount === 0) notFound();

  const sprint = sprintRes.rows[0] as Record<string, unknown>;

  // Fetch deliverables
  const delRes = await pool.query(
    `SELECT 
       sd.deliverable_name,
       sd.deliverable_description,
       sd.deliverable_category,
       sd.deliverable_scope,
       sd.base_points,
       sd.custom_estimate_points,
       sd.complexity_score,
       sd.quantity,
       sd.notes,
       sd.custom_scope,
       d.points,
       d.name,
       d.description,
       d.category,
       d.scope
     FROM sprint_deliverables sd
     LEFT JOIN deliverables d ON sd.deliverable_id = d.id
     WHERE sd.sprint_draft_id = $1
     ORDER BY sd.created_at`,
    [sprint.id]
  );

  const deliverables = delRes.rows.map((row) => {
    const base = asNumber(row.base_points ?? row.points ?? 0, 0);
    const adjusted = asNumber(row.custom_estimate_points ?? base, base);
    const multiplier = base ? Math.round((adjusted / base) * 100) / 100 : 1;
    const hours = hoursFromPoints(adjusted);

    return {
      name: (row.deliverable_name as string | null) ?? (row.name as string | null) ?? "",
      description: (row.deliverable_description as string | null) ?? (row.description as string | null) ?? null,
      category: (row.deliverable_category as string | null) ?? (row.category as string | null) ?? null,
      scope: (row.custom_scope as string | null) ?? (row.deliverable_scope as string | null) ?? (row.scope as string | null) ?? null,
      basePoints: base,
      adjustedPoints: adjusted,
      multiplier,
      hours,
      note: (row.notes as string | null) ?? null,
      quantity: asNumber(row.quantity, 1),
    };
  });

  const totalPoints = deliverables.reduce((sum, d) => sum + d.adjustedPoints * d.quantity, 0);
  const totalHours = hoursFromPoints(totalPoints);
  const totalPrice = priceFromPoints(totalPoints);

  const draft =
    sprint.draft && typeof sprint.draft === "object" ? (sprint.draft as Record<string, unknown>) : {};

  function formatDateISO(val: unknown): string | null {
    if (!val) return null;
    const d = new Date(val as string);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }

  const sprintData = {
    title: (sprint.title as string) ?? "Untitled Sprint",
    projectName: (sprint.project_name as string | null) ?? null,
    startDate: formatDateISO(sprint.start_date),
    dueDate: formatDateISO(sprint.due_date),
    weeks: asNumber(sprint.weeks, 2),
    totalPoints,
    totalHours,
    totalPrice,
    approach: typeof draft.approach === "string" ? draft.approach : null,
    week1Overview:
      draft.week1 &&
      typeof draft.week1 === "object" &&
      typeof (draft.week1 as Record<string, unknown>).overview === "string"
        ? ((draft.week1 as Record<string, unknown>).overview as string)
        : null,
    week2Overview:
      draft.week2 &&
      typeof draft.week2 === "object" &&
      typeof (draft.week2 as Record<string, unknown>).overview === "string"
        ? ((draft.week2 as Record<string, unknown>).overview as string)
        : null,
  };

  return <SharedSprintView sprint={sprintData} deliverables={deliverables} />;
}
