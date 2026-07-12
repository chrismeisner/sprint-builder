import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import crypto from "crypto";

// GET /api/print/printers — admin: list printers with agent + last-seen so the
// dashboard can distinguish "agent offline" from "printer state". Polled ~8s.
export async function GET() {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT p.*, a.name AS agent_name, a.last_seen_at AS agent_last_seen_at
         FROM printers p JOIN print_agents a ON a.id = p.agent_id
         ORDER BY p.created_at`
    );
    return NextResponse.json({ printers: rows });
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error listing printers:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/print/printers — admin: register a printer under an agent.
// Body: { agentId, cupsName, label }
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    const body = await request.json().catch(() => ({}));
    const { agentId, cupsName, label } = body || {};
    if (!agentId || !cupsName || !label) {
      return NextResponse.json(
        { error: "agentId, cupsName and label are required." },
        { status: 400 }
      );
    }

    const pool = getPool();
    const agent = await pool.query(`SELECT id FROM print_agents WHERE id = $1`, [agentId]);
    if (agent.rowCount === 0) {
      return NextResponse.json({ error: "agent not found." }, { status: 404 });
    }

    const id = `prn_${crypto.randomUUID()}`;
    const { rows } = await pool.query(
      `INSERT INTO printers (id, agent_id, cups_name, label) VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, agentId, cupsName, label]
    );
    return NextResponse.json({ printer: rows[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error creating printer:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
