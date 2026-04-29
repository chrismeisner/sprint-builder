import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ensureSchema, getPool } from "@/lib/db";
import RefinementCyclesQueueClient from "./RefinementCyclesQueueClient";
import type { RefinementCycleStatus } from "@/lib/refinementCycle";

export const dynamic = "force-dynamic";

export type RefinementCycleQueueRow = {
  id: string;
  title: string | null;
  status: RefinementCycleStatus;
  projectId: string;
  projectName: string | null;
  projectEmoji: string | null;
  submitterEmail: string | null;
  hasScreenRecording: boolean;
  screenCount: number;
  totalPrice: number;
  submittedAt: string;
  acceptedAt: string | null;
  declinedAt: string | null;
  deliveryDate: string | null;
  depositPaidAt: string | null;
  deliveredAt: string | null;
  expiredAt: string | null;
};

export default async function RefinementCyclesAdminPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    redirect("/");
  }

  await ensureSchema();
  const pool = getPool();

  const result = await pool.query(`
    SELECT
      rc.id,
      rc.title,
      rc.status,
      rc.project_id,
      p.name AS project_name,
      p.emoji AS project_emoji,
      rc.submitter_email,
      rc.screen_recording_url,
      rc.total_price,
      rc.submitted_at,
      rc.accepted_at,
      rc.declined_at,
      rc.delivery_date,
      rc.deposit_paid_at,
      rc.delivered_at,
      rc.expired_at,
      COALESCE(s.cnt, 0)::int AS screen_count
    FROM refinement_cycles rc
    LEFT JOIN projects p ON p.id = rc.project_id
    LEFT JOIN (
      SELECT refinement_cycle_id, COUNT(*)::int AS cnt
      FROM refinement_cycle_screens
      GROUP BY refinement_cycle_id
    ) s ON s.refinement_cycle_id = rc.id
    ORDER BY
      CASE rc.status
        WHEN 'submitted' THEN 0
        WHEN 'accepted' THEN 1
        WHEN 'awaiting_deposit' THEN 2
        WHEN 'in_progress' THEN 3
        WHEN 'delivered' THEN 4
        WHEN 'declined' THEN 5
        WHEN 'expired' THEN 6
        ELSE 7
      END,
      rc.submitted_at DESC
  `);

  const rows: RefinementCycleQueueRow[] = result.rows.map((row) => ({
    id: row.id as string,
    title: (row.title as string | null) ?? null,
    status: row.status as RefinementCycleStatus,
    projectId: row.project_id as string,
    projectName: (row.project_name as string | null) ?? null,
    projectEmoji: (row.project_emoji as string | null) ?? null,
    submitterEmail: (row.submitter_email as string | null) ?? null,
    hasScreenRecording: Boolean(row.screen_recording_url),
    screenCount: Number(row.screen_count ?? 0),
    totalPrice: row.total_price != null ? Number(row.total_price) : 1200,
    submittedAt:
      row.submitted_at instanceof Date
        ? row.submitted_at.toISOString()
        : (row.submitted_at as string),
    acceptedAt: row.accepted_at
      ? row.accepted_at instanceof Date
        ? row.accepted_at.toISOString()
        : (row.accepted_at as string)
      : null,
    declinedAt: row.declined_at
      ? row.declined_at instanceof Date
        ? row.declined_at.toISOString()
        : (row.declined_at as string)
      : null,
    deliveryDate:
      row.delivery_date instanceof Date
        ? row.delivery_date.toISOString().slice(0, 10)
        : ((row.delivery_date as string | null) ?? null),
    depositPaidAt: row.deposit_paid_at
      ? row.deposit_paid_at instanceof Date
        ? row.deposit_paid_at.toISOString()
        : (row.deposit_paid_at as string)
      : null,
    deliveredAt: row.delivered_at
      ? row.delivered_at instanceof Date
        ? row.delivered_at.toISOString()
        : (row.delivered_at as string)
      : null,
    expiredAt: row.expired_at
      ? row.expired_at instanceof Date
        ? row.expired_at.toISOString()
        : (row.expired_at as string)
      : null,
  }));

  return (
    <main className="min-h-screen max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Refinement Cycles</h1>
        <p className="opacity-70">
          Productized $1,200 design refinement cycles. New submissions appear at
          the top — review and accept or decline.
        </p>
      </div>

      <RefinementCyclesQueueClient rows={rows} />
    </main>
  );
}
