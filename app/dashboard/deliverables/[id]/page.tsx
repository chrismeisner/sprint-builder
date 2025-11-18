import { ensureSchema, getPool } from "@/lib/db";
import { notFound } from "next/navigation";
import DeliverableDetailClient from "./DeliverableDetailClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

export default async function DeliverableDetailPage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, name, description, category, default_estimate_points, active, created_at, updated_at
     FROM deliverables
     WHERE id = $1`,
    [params.id]
  );
  if (res.rowCount === 0) {
    notFound();
  }
  type Row = {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    default_estimate_points: number | null;
    active: boolean;
    created_at: string | Date;
    updated_at: string | Date;
  };
  const row = res.rows[0] as Row;

  return <DeliverableDetailClient row={row} />;
}


