import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import crypto from "crypto";

// POST /api/admin/hills/[id]/items — add a container or task to a hill.
// Body: { kind: "idea" | "deliverable" | "task", name, ideaId?, deliverableId? }
// A task may attach to an idea OR a deliverable, or float directly on the hill.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const hillId = params.id;
    const body = await request.json();
    const kind = body.kind;
    const name = (body.name ?? "").toString().trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const pool = getPool();
    const hill = await pool.query(`SELECT id FROM hills WHERE id = $1`, [hillId]);
    if (hill.rowCount === 0) return NextResponse.json({ error: "Hill not found" }, { status: 404 });

    const id = crypto.randomUUID();

    if (kind === "idea") {
      const r = await pool.query(
        `INSERT INTO hill_ideas (id, hill_id, title, status) VALUES ($1, $2, $3, 'active') RETURNING *`,
        [id, hillId, name]
      );
      return NextResponse.json({ idea: r.rows[0] }, { status: 201 });
    }

    if (kind === "deliverable") {
      const r = await pool.query(
        `INSERT INTO hill_deliverables (id, hill_id, name, source, origin)
         VALUES ($1, $2, $3, 'manual', 'manual') RETURNING *`,
        [id, hillId, name]
      );
      return NextResponse.json({ deliverable: r.rows[0] }, { status: 201 });
    }

    if (kind === "task") {
      const ideaId = body.ideaId || null;
      const deliverableId = body.deliverableId || null;
      if (ideaId && deliverableId) {
        return NextResponse.json(
          { error: "A task cannot belong to both an idea and a deliverable" },
          { status: 400 }
        );
      }
      const r = await pool.query(
        `INSERT INTO hill_tasks (id, hill_id, idea_id, deliverable_id, name, origin)
         VALUES ($1, $2, $3, $4, $5, 'manual') RETURNING *`,
        [id, hillId, ideaId, deliverableId, name]
      );
      return NextResponse.json({ task: r.rows[0] }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
  } catch (error) {
    console.error("Error creating hill item:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
