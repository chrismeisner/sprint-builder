import { redirect } from "next/navigation";
import { ensureSchema, getPool } from "@/lib/db";

// A refinement cycle is a Hill now. Resolve the owning hill (reused PK or
// type_data.linked_id) and redirect into its Hills detail page.
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  await ensureSchema();
  const pool = getPool();
  const r = await pool.query(
    `SELECT id FROM hills
      WHERE type = 'refinement_cycle' AND (id = $1 OR type_data->>'linked_id' = $1)
      LIMIT 1`,
    [params.id]
  );
  redirect(r.rowCount ? `/dashboard/hills/${r.rows[0].id}` : "/dashboard/hills?type=refinement_cycle");
}
