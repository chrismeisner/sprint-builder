import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAgent } from "@/lib/printAuth";

// POST /api/print/agents/heartbeat — agent: liveness + reported printer health.
// Body: { printers?: [{ cupsName, status }], agentVersion? }
// requireAgent() already stamps last_seen_at; here we fold in printer statuses.
export async function POST(request: NextRequest) {
  try {
    await ensureSchema();
    const agent = await requireAgent(request);
    const body = await request.json().catch(() => ({}));
    const pool = getPool();

    if (typeof body?.agentVersion === "string") {
      await pool
        .query(`UPDATE print_agents SET agent_version = $2 WHERE id = $1`, [
          agent.id,
          body.agentVersion,
        ])
        .catch(() => {});
    }

    const reported = Array.isArray(body?.printers) ? body.printers : [];
    for (const entry of reported) {
      if (!entry || typeof entry.cupsName !== "string") continue;
      await pool
        .query(
          `UPDATE printers SET status = $3, status_at = now()
             WHERE agent_id = $1 AND cups_name = $2`,
          [agent.id, entry.cupsName, typeof entry.status === "string" ? entry.status : "unknown"]
        )
        .catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes("authentication")) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Error handling agent heartbeat:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
