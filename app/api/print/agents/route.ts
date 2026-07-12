import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { mintAgentToken } from "@/lib/printAuth";
import crypto from "crypto";

// GET /api/print/agents — admin: list agents with last-seen + printer count.
export async function GET() {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT a.id, a.name, a.last_seen_at, a.agent_version, a.created_at,
              COUNT(p.id)::int AS printer_count
         FROM print_agents a
         LEFT JOIN printers p ON p.agent_id = a.id
         GROUP BY a.id
         ORDER BY a.created_at`
    );
    return NextResponse.json({ agents: rows });
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error listing print agents:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/print/agents — admin: register a new agent. Returns the plaintext
// token ONCE (the caller must download the bundle / copy it now; only the hash
// is stored). Body: { name }
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    const body = await request.json().catch(() => ({}));
    const name = (body?.name ?? "").toString().trim();
    if (!name) {
      return NextResponse.json({ error: "name is required." }, { status: 400 });
    }

    const { token, hash } = mintAgentToken();
    const id = `pagt_${crypto.randomUUID()}`;
    const { rows } = await getPool().query(
      `INSERT INTO print_agents (id, name, key_hash) VALUES ($1, $2, $3)
       RETURNING id, name, created_at`,
      [id, name, hash]
    );
    // token returned once; never stored or logged.
    return NextResponse.json({ agent: rows[0], token }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error creating print agent:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
