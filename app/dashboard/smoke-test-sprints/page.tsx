import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ensureSchema, getPool } from "@/lib/db";
import SmokeTestSprintsClient from "./SmokeTestSprintsClient";

export const dynamic = "force-dynamic";

export type SmokeTestSprintRow = {
  id: string;
  status: string;
  projectId: string;
  projectName: string | null;
  whatsNext: string | null;
  complexityScore: number | null;
  hourlyRate: number | null;
  totalPrice: number | null;
  impliedHours: number | null;
  proposedStartDate: string | null;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
};

export default async function SmokeTestSprintsAdminPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    redirect("/");
  }

  await ensureSchema();
  const pool = getPool();

  const result = await pool.query(`
    SELECT
      sts.id,
      sts.status,
      sts.project_id,
      sts.project_name_snapshot,
      p.name AS project_name,
      sts.whats_next,
      sts.complexity_score,
      sts.hourly_rate,
      sts.total_price,
      sts.implied_hours,
      sts.proposed_start_date,
      sts.created_at,
      sts.updated_at,
      COALESCE(att.cnt, 0)::int AS attachment_count
    FROM smoke_test_sprints sts
    LEFT JOIN projects p ON p.id = sts.project_id
    LEFT JOIN (
      SELECT smoke_test_sprint_id, COUNT(*)::int AS cnt
      FROM smoke_test_sprint_links
      GROUP BY smoke_test_sprint_id
    ) att ON att.smoke_test_sprint_id = sts.id
    ORDER BY sts.updated_at DESC
  `);

  const rows: SmokeTestSprintRow[] = result.rows.map((row) => ({
    id: row.id as string,
    status: (row.status as string) || "draft",
    projectId: row.project_id as string,
    projectName:
      (row.project_name as string | null) ??
      (row.project_name_snapshot as string | null) ??
      null,
    whatsNext: (row.whats_next as string | null) ?? null,
    complexityScore: row.complexity_score != null ? Number(row.complexity_score) : null,
    hourlyRate: row.hourly_rate != null ? Number(row.hourly_rate) : null,
    totalPrice: row.total_price != null ? Number(row.total_price) : null,
    impliedHours: row.implied_hours != null ? Number(row.implied_hours) : null,
    proposedStartDate:
      row.proposed_start_date instanceof Date
        ? row.proposed_start_date.toISOString().slice(0, 10)
        : ((row.proposed_start_date as string | null) ?? null),
    attachmentCount: Number(row.attachment_count ?? 0),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : (row.created_at as string),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : (row.updated_at as string),
  }));

  return (
    <main className="min-h-screen max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Smoke Test Sprints</h1>
        <p className="text-sm opacity-70">
          All smoke test sprint scoping records across projects.
        </p>
      </div>

      <SmokeTestSprintsClient rows={rows} />
    </main>
  );
}
