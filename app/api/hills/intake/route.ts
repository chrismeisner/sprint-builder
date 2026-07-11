import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createHillFromIntake } from "@/lib/hillIntake";

// POST /api/hills/intake — the public scoping front door. Potential clients
// (no account) and existing clients both submit here; it creates a proposal
// hill in the scope phase with suggested draft items for the studio to review.
// Intentionally unauthenticated, but input is capped/sanitized in the engine.
export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Attribute to the account if the submitter happens to be signed in.
    const user = await getCurrentUser().catch(() => null);

    const email = typeof body.email === "string" ? body.email.trim().slice(0, 320) : null;
    if (!email && !user) {
      return NextResponse.json({ error: "An email is required so we can follow up" }, { status: 400 });
    }

    const result = await createHillFromIntake({
      title: typeof body.title === "string" ? body.title : "",
      type: typeof body.type === "string" ? body.type : undefined,
      spanGranularity: typeof body.span_granularity === "string" ? body.span_granularity : null,
      summary: typeof body.summary === "string" ? body.summary : null,
      submitterEmail: email ?? user?.email ?? null,
      createdBy: user?.accountId ?? null,
      deliverables: Array.isArray(body.deliverables) ? (body.deliverables as string[]) : [],
      tasks: Array.isArray(body.tasks) ? (body.tasks as string[]) : [],
      origin: "intake",
    });

    return NextResponse.json(
      { ok: true, hillId: result.hillId, suggested: { deliverables: result.deliverableCount, tasks: result.taskCount } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in hill intake:", error);
    const msg = error instanceof Error && error.message === "Title is required" ? error.message : "Failed to submit";
    return NextResponse.json({ error: msg }, { status: msg === "Title is required" ? 400 : 500 });
  }
}
