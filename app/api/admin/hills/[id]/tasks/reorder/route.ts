import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/hills/[id]/tasks/reorder — persist a new order for a set of
// sibling tasks. Body: { order: string[] } (task ids in the desired order).
// sort_order is set to each id's index; the detail query orders by sort_order.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const body = await request.json();
    const order: unknown = body.order;
    if (!Array.isArray(order) || order.some((x) => typeof x !== "string")) {
      return NextResponse.json({ error: "order must be an array of task ids" }, { status: 400 });
    }

    const pool = getPool();
    await pool.query(
      `UPDATE hill_tasks t
          SET sort_order = o.idx, updated_at = now()
         FROM (
           SELECT id, (ordinality - 1)::int AS idx
             FROM unnest($2::text[]) WITH ORDINALITY AS x(id, ordinality)
         ) o
        WHERE t.id = o.id AND t.hill_id = $1`,
      [params.id, order]
    );
    return NextResponse.json({ ok: true, count: order.length });
  } catch (error) {
    console.error("Error reordering tasks:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
